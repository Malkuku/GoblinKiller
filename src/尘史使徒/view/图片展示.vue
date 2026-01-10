<template>
  <div class="gallery-container">
    <!-- 1. 顶部模式切换 (SFW / NSFW) -->
    <div class="gallery-tabs">
      <button
        class="tab-btn"
        :class="{ active: currentMode === 'sfw' }"
        @click="switchMode('sfw')"
      >
        皮囊 (SFW)
      </button>
      <button
        class="tab-btn danger"
        :class="{ active: currentMode === 'nsfw' }"
        @click="switchMode('nsfw')"
      >
        血肉 (NSFW)
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在读取世界书记录...</p>
    </div>

    <!-- 内容区域 -->
    <div v-else class="gallery-content">
      <div v-if="currentData.length === 0" class="empty-state">
        未找到相关的世界书条目 (需包含 [{{ currentMode }}_img] 标签)
      </div>

      <div v-else>
        <!-- 2. 角色分页导航 -->
        <div class="char-nav">
          <button
            class="nav-arrow"
            disabled
          >
            &lt;
          </button>

          <!-- 修改部分：自定义选择框 -->
          <div class="char-select-wrapper">
            <select v-model="activeCharIndex" class="char-select">
              <option
                v-for="(char, index) in currentData"
                :key="index"
                :value="index"
              >
                  {{ char.name }}
              </option>
            </select>
            <span class="select-arrow">▼</span>
          </div>

          <button
            class="nav-arrow"
            disabled
          >
             &gt;
          </button>
        </div>

        <!-- 3. 当前角色展示区域 -->
        <div :key="activeChar.name" class="character-block">
          <div class="actions-grid">
            <!-- 动作列表 -->
            <div
              v-for="action in activeChar.actions"
              :key="action.name"
              class="action-card"
              :class="{ 'is-expanded': getActionState(activeChar.name, action.name).expanded }"
            >
              <!-- 头部：点击展开/收起 -->
              <div class="action-header" @click="toggleAction(activeChar.name, action.name)">
                <span class="action-name">{{ action.name }}</span>
                <span class="action-meta">
                  <span class="count-badge">{{ action.max }} 枚</span>
                  <span class="arrow-icon">▼</span>
                </span>
              </div>

              <!-- 展开后的图片区域 -->
              <div v-if="getActionState(activeChar.name, action.name).expanded" class="image-viewer">

                <!-- 图片显示容器 (点击放大) -->
                <div
                  class="img-wrapper"
                  title="点击放大图片"
                  @click="openLightbox(getCurrentImageUrl(activeChar.name, action))"
                >
                  <div v-if="imgLoading" class="img-spinner"></div>
                  <img
                    :src="getCurrentImageUrl(activeChar.name, action)"
                    :alt="action.name"
                    @load="onImgLoad"
                    loading="lazy"
                    @error="onImgError"
                    v-show="!imgError"
                  />
                  <div v-if="imgError" class="img-error">
                    图片加载失败<br>
                    <small>{{ getCurrentImageUrl(activeChar.name, action) }}</small>
                  </div>
                  <!-- 放大提示图标 -->
                  <div class="zoom-hint">🔍</div>
                </div>

                <!-- 翻页控制栏 & 下载按钮 -->
                <div class="viewer-controls">
                  <button
                    class="ctrl-btn"
                    :disabled="getCurrentIndex(activeChar.name, action.name) <= 1"
                    @click="changePage(activeChar.name, action.name, -1)"
                  >
                    &lt;
                  </button>

                  <span class="page-indicator">
                    {{ getCurrentIndex(activeChar.name, action.name) }} / {{ action.max }}
                  </span>

                  <button
                    class="ctrl-btn"
                    :disabled="getCurrentIndex(activeChar.name, action.name) >= action.max"
                    @click="changePage(activeChar.name, action.name, 1)"
                  >
                    &gt;
                  </button>

                  <!-- 修改部分：下载按钮 -->
                  <div class="divider"></div>
                  <button
                    class="ctrl-btn download-btn"
                    title="下载当前图片"
                    @click="downloadImage(activeChar.name, action)"
                  >
                    ⬇
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 全屏图片灯箱 (Lightbox) -->
    <transition name="fade">
      <div v-if="lightbox.show" class="lightbox-overlay" @click="closeLightbox">
        <div class="lightbox-content">
          <img :src="lightbox.url" alt="Full size preview" />
          <button class="close-btn">×</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil';

// --- 状态定义 ---
const loading = ref(true);
const currentMode = ref('sfw'); // 'sfw' | 'nsfw'
const activeCharIndex = ref(0); // 当前选中的角色索引

const parsedData = reactive({
  sfw: [],
  nsfw: []
});

// 视图状态缓存
const viewState = reactive({});
// 图片加载状态
const imgLoading = ref(false);
const imgError = ref(false);
// 灯箱状态
const lightbox = reactive({ show: false, url: '' });

// --- 计算属性 ---
const currentData = computed(() => parsedData[currentMode.value] || []);

const activeChar = computed(() => {
  if (currentData.value.length === 0) return null;
  return currentData.value[activeCharIndex.value];
});

// --- 核心逻辑：解析器 (已更新适配 <%= %>) ---
const parseWorldBookContent = (text) => {
  const lines = text.split('\n');
  const result = [];
  let currentChar = null;

  const charRegex = /^\s*(\S+):/;
  // 适配 <%=_.random(1, 8)%>
  const actionRegex = /^\s*-\s*(.+?)<%=\s*_\.random\((\d+),\s*(\d+)\)\s*%>/;

  lines.forEach(line => {
    const charMatch = line.match(charRegex);
    if (charMatch) {
      currentChar = { name: charMatch[1], actions: [] };
      result.push(currentChar);
      return;
    }

    if (currentChar) {
      const actionMatch = line.match(actionRegex);
      if (actionMatch) {
        currentChar.actions.push({
          name: actionMatch[1].trim(),
          min: parseInt(actionMatch[2]),
          max: parseInt(actionMatch[3])
        });
      }
    }
  });
  return result;
};

// --- 数据加载 ---
const loadGalleryData = async () => {
  loading.value = true;
  try {
    const allNames = await WorldInfoUtil.getAllWorldBookNames();
    const sfwBooks = WorldInfoUtil.filterWorldBookNamesRegex(/<sfw_img>/i, allNames);
    const nsfwBooks = WorldInfoUtil.filterWorldBookNamesRegex(/<nsfw_img>/i, allNames);

    if (sfwBooks.length > 0) {
      const content = await WorldInfoUtil.getWorldBookContent(sfwBooks);
      parsedData.sfw = parseWorldBookContent(content);
    }
    if (nsfwBooks.length > 0) {
      const content = await WorldInfoUtil.getWorldBookContent(nsfwBooks);
      parsedData.nsfw = parseWorldBookContent(content);
    }
  } catch (e) {
    console.error("加载图鉴失败:", e);
  } finally {
    loading.value = false;
  }
};

// --- 交互逻辑 ---
const switchMode = (mode) => {
  currentMode.value = mode;
  activeCharIndex.value = 0; // 切换模式时重置到第一个角色
};

const getActionState = (charName, actionName) => {
  const key = `${charName}::${actionName}`;
  if (!viewState[key]) {
    viewState[key] = { expanded: false, index: 1 };
  }
  return viewState[key];
};

const toggleAction = (charName, actionName) => {
  const state = getActionState(charName, actionName);
  state.expanded = !state.expanded;
  if (state.expanded) {
    imgLoading.value = true;
    imgError.value = false;
  }
};

const getCurrentIndex = (charName, actionName) => {
  return getActionState(charName, actionName).index;
};

const changePage = (charName, actionName, delta) => {
  const state = getActionState(charName, actionName);
  state.index += delta;
  imgLoading.value = true;
  imgError.value = false;
};

// --- 修改后的下载逻辑 ---
const downloadImage = (charName, action) => {
  const url = getCurrentImageUrl(charName, action);
  // const index = getCurrentIndex(charName, action.name);
  // const filename = `${charName}_${action.name}_${index}.webp`;

  // 直接在新标签页打开图片，让用户右键保存
  // 或者浏览器会自动处理（取决于浏览器设置）
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank'; // 在新标签页打开
  // link.download = filename; // 注意：跨域资源下，download 属性通常会被浏览器忽略
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- 灯箱逻辑 ---
const openLightbox = (url) => {
  lightbox.url = url;
  lightbox.show = true;
};

const closeLightbox = () => {
  lightbox.show = false;
  lightbox.url = '';
};

// --- URL 构建 ---
const BASE_URL = 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main';
const getCurrentImageUrl = (charName, action) => {
  const index = getCurrentIndex(charName, action.name);
  return `${BASE_URL}/${charName}/${action.name}${index}.webp`;
};

// --- 图片事件 ---
const onImgLoad = () => { imgLoading.value = false; };
const onImgError = () => { imgLoading.value = false; imgError.value = true; };

onMounted(() => {
  loadGalleryData();
});
</script>

<style scoped>
.gallery-container {
  padding: 10px;
  max-width: 1000px;
  margin: 0 auto;
}

/* --- Tabs --- */
.gallery-tabs {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

.tab-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 8px 20px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.tab-btn.active {
  background-color: var(--bg-secondary);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.tab-btn.danger.active {
  color: var(--accent-danger);
  border-color: var(--accent-danger);
}

/* --- Character Navigation (Pagination) --- */
.char-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-secondary);
  padding: 10px 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 6px var(--shadow-color);
}

.nav-arrow {
  background: none;
  border: none;
  color: var(--accent-primary);
  font-family: 'Cinzel', serif;
  font-weight: bold;
  cursor: pointer;
  padding: 5px 15px;
  transition: opacity 0.3s;
}

.nav-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-arrow:hover:not(:disabled) {
  text-shadow: 0 0 5px var(--accent-primary);
}

/* 修改部分：选择框样式 */
.char-select-wrapper {
  position: relative;
  flex-grow: 1;
  max-width: 300px;
  margin: 0 15px;
}

.char-select {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 30px 8px 15px;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  text-align: center;
  transition: border-color 0.3s;
}

.char-select:hover, .char-select:focus {
  border-color: var(--accent-primary);
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

/* --- Actions Grid --- */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.action-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.action-card.is-expanded {
  grid-column: span 2;
  border-color: var(--accent-primary);
  box-shadow: 0 4px 15px var(--shadow-color);
}
@media (max-width: 768px) {
  .action-card.is-expanded { grid-column: span 1; }
}

/* --- Action Header --- */
.action-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: rgba(0,0,0,0.1);
}

.action-header:hover { background-color: rgba(255,255,255,0.05); }
.action-name { font-weight: bold; color: var(--text-primary); }

.action-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-badge {
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: var(--bg-primary);
  padding: 2px 6px;
  border-radius: 4px;
}

.arrow-icon { font-size: 0.8rem; transition: transform 0.3s; }
.is-expanded .arrow-icon { transform: rotate(180deg); }

/* --- Image Viewer --- */
.image-viewer {
  padding: 15px;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.img-wrapper {
  width: 100%;
  min-height: 300px;
  max-height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-bottom: 15px;
  cursor: zoom-in; /* 鼠标变成放大镜 */
}

.img-wrapper img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  animation: fadeImg 0.3s ease;
}

.zoom-hint {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 5px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.img-wrapper:hover .zoom-hint { opacity: 1; }

.img-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--text-secondary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: absolute;
}

.img-error { color: var(--accent-danger); text-align: center; padding: 20px; }

/* --- Controls --- */
.viewer-controls { display: flex; align-items: center; gap: 20px; }

.ctrl-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ctrl-btn:hover:not(:disabled) { background-color: var(--accent-primary); color: #fff; }
.ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-indicator { font-family: 'Cinzel', serif; font-size: 1.1rem; color: var(--text-secondary); }

/* 修改部分：下载按钮样式 */
.divider {
  width: 1px;
  height: 25px;
  background-color: var(--border-color);
  margin: 0 5px;
}

.download-btn {
  border-color: var(--text-secondary);
}
.download-btn:hover {
  background-color: var(--text-secondary); /* 稍微不同的悬停色 */
  color: var(--bg-primary);
}

/* --- Lightbox (Fullscreen Zoom) --- */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: zoom-out;
}

.lightbox-content {
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 95vh;
  object-fit: contain;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

.close-btn {
  position: absolute;
  top: -40px;
  right: -40px;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
}

/* --- Animations --- */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeImg { from { opacity: 0; } to { opacity: 1; } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.loading-state, .empty-state { text-align: center; padding: 50px; color: var(--text-secondary); }
</style>
