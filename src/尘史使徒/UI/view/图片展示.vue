<template>
  <div class="animus-gallery-container">
    <!-- 顶部控制栏：模式切换 -->
    <header class="gallery-header">
      <div class="header-title">
        <span class="icon">🖼</span> 绯廊 <span class="subtitle">// VISUAL ARCHIVE</span>
      </div>
      <div class="mode-switcher">
        <button
          class="mode-btn"
          :class="{ active: currentMode === 'sfw' }"
          @click="switchMode('sfw')"
        >
          [ SFW_DATA ]
        </button>
        <button
          class="mode-btn"
          :class="{ active: currentMode === 'nsfw' }"
          @click="switchMode('nsfw')"
        >
          [ NSFW_DATA ]
        </button>
      </div>
    </header>

    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-screen">
      <div class="spinner"></div>
      <div class="loading-text">SYNCHRONIZING ARCHIVES...</div>
    </div>

    <!-- 主内容区 -->
    <div v-else class="gallery-layout">

      <!-- 左侧：角色列表 -->
      <aside class="char-sidebar">
        <div class="sidebar-header">SUBJECTS //</div>
        <div class="char-list">
          <div
            v-for="(char, index) in currentData"
            :key="char.name"
            class="char-item"
            :class="{ active: activeCharIndex === index }"
            @click="activeCharIndex = index"
          >
            <span class="char-marker">►</span>
            <span class="char-name">{{ char.name }}</span>
          </div>
          <div v-if="currentData.length === 0" class="empty-tip">NO DATA FOUND</div>
        </div>
      </aside>

      <!-- 右侧：动作与图片展示 -->
      <main class="content-area">
        <div v-if="activeChar" class="char-detail">
          <h2 class="detail-title">
            {{ activeChar.name }}
            <span class="action-count">/ {{ activeChar.actions.length }} RECORDS</span>
          </h2>
          <div class="detail-line"></div>

          <!-- 动作列表 -->
          <div class="action-grid">
            <div
              v-for="action in activeChar.actions"
              :key="action.name"
              class="action-card"
              :class="{ expanded: getActionState(activeChar.name, action.name).expanded }"
            >
              <!-- 动作标题栏 (点击展开/收起) -->
              <div class="action-header" @click="toggleAction(activeChar.name, action.name)">
                <span class="action-name">{{ action.name }}</span>
                <span class="toggle-icon">
                  {{ getActionState(activeChar.name, action.name).expanded ? '▼' : '▶' }}
                </span>
              </div>

              <!-- 展开后的图片区域 -->
              <div v-if="getActionState(activeChar.name, action.name).expanded" class="action-body">

                <!-- 图片容器 -->
                <div class="img-viewer">
                  <!-- 加载/错误提示 -->
                  <div v-if="imgLoading" class="img-status loading">
                    <div class="mini-spinner"></div>
                  </div>
                  <div v-if="imgError" class="img-status error">DATA CORRUPTED</div>

                  <!-- 图片本体 -->
                  <img
                    :src="getCurrentImageUrl(activeChar.name, action)"
                    @load="onImgLoad"
                    @error="onImgError"
                    @click="openLightbox(getCurrentImageUrl(activeChar.name, action))"
                    class="gallery-img"
                    alt="Archive Image"
                  />

                  <!-- 装饰角落 -->
                  <div class="corner top-left"></div>
                  <div class="corner top-right"></div>
                  <div class="corner bottom-left"></div>
                  <div class="corner bottom-right"></div>
                </div>

                <!-- 控制栏 -->
                <div class="img-controls">
                  <button
                    class="ctrl-btn"
                    :disabled="getCurrentIndex(activeChar.name, action.name) <= action.min"
                    @click="changePage(activeChar.name, action.name, -1)"
                  >
                    &lt; PREV
                  </button>

                  <span class="page-indicator">
                    {{ getCurrentIndex(activeChar.name, action.name) }} / {{ action.max }}
                  </span>

                  <button
                    class="ctrl-btn"
                    :disabled="getCurrentIndex(activeChar.name, action.name) >= action.max"
                    @click="changePage(activeChar.name, action.name, 1)"
                  >
                    NEXT &gt;
                  </button>

                  <button class="ctrl-btn download-btn" @click="downloadImage(activeChar.name, action)">
                    ⬇
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-selection">
          SELECT A SUBJECT TO VIEW ARCHIVES
        </div>
      </main>
    </div>

    <!-- 灯箱 (全屏查看) -->
    <transition name="fade">
      <div
        v-if="lightbox.show"
        class="lightbox-overlay"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- 关闭按钮 -->
        <button class="lightbox-close" @click="closeLightbox">✕ CLOSE VIEW</button>

        <!-- 图片容器 -->
        <div
          class="lightbox-container"
          @wheel.prevent="onWheel"
          @mousedown="onMouseDown"
          @touchstart="onTouchStart"
        >
          <img
            ref="lightboxImg"
            :src="lightbox.url"
            class="lightbox-image"
            draggable="false"
          />
        </div>

        <!-- 操作提示 -->
        <div class="lightbox-hint">
          SCROLL TO ZOOM // DRAG TO PAN
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
// =========================================================================
// 逻辑部分完全保持原样，仅确保 import 路径正确
// =========================================================================
import { ref, computed, onMounted, reactive } from 'vue';
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil';

// --- 状态定义 ---
const loading = ref(true);
const currentMode = ref('sfw');
const activeCharIndex = ref(0);

const parsedData = reactive({
  sfw: [],
  nsfw: []
});

const viewState = reactive({});
const imgLoading = ref(false);
const imgError = ref(false);
const lightbox = reactive({ show: false, url: '' });
const lightboxImg = ref(null); // 图片 DOM 引用

// --- 缩放逻辑状态 ---
const zoom = reactive({
  scale: 1,
  x: 0,
  y: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  // 触摸相关
  initialDistance: 0,
  initialScale: 1
});

// --- 计算属性 ---
const currentData = computed(() => parsedData[currentMode.value] || []);

const activeChar = computed(() => {
  if (currentData.value.length === 0) return null;
  return currentData.value[activeCharIndex.value];
});

// --- 核心逻辑：解析器 ---
const parseWorldBookContent = (text) => {
  const lines = text.split('\n');
  const result = [];
  let currentChar = null;
  const charRegex = /^\s*(\S+):/;
  const actionRegex = /^\s*-\s*(.+?)<\s*%=\s*_\.random\((\d+),\s*(\d+)\)\s*%>/;

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
      for (const bookName of sfwBooks) {
        const content = await WorldInfoUtil.getWorldBookContent([bookName]);
        parsedData.sfw.push(...parseWorldBookContent(content));
      }
    }
    if (nsfwBooks.length > 0) {
      for (const bookName of nsfwBooks) {
        const content = await WorldInfoUtil.getWorldBookContent([bookName]);
        parsedData.nsfw.push(...parseWorldBookContent(content));
      }
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
  activeCharIndex.value = 0;
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

const downloadImage = (charName, action) => {
  const url = getCurrentImageUrl(charName, action);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- 灯箱逻辑 (含缩放) ---

const updateTransform = () => {
  if (!lightboxImg.value) return;
  lightboxImg.value.style.transform = `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`;
};

const openLightbox = (url) => {
  // 重置缩放状态
  zoom.scale = 1;
  zoom.x = 0;
  zoom.y = 0;
  zoom.isDragging = false;

  lightbox.url = url;
  lightbox.show = true;

  // 确保 DOM 更新后重置 transform
  setTimeout(() => {
    if (lightboxImg.value) {
      lightboxImg.value.style.transform = 'translate(0px, 0px) scale(1)';
      lightboxImg.value.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }
  }, 0);
};

const closeLightbox = () => {
  lightbox.show = false;
  lightbox.url = '';
};

// 1. 鼠标滚轮
const onWheel = (e) => {
  const delta = -Math.sign(e.deltaY);
  const step = 0.15;
  const oldScale = zoom.scale;
  let newScale = oldScale + (delta * step * oldScale);

  if (newScale < 0.5) newScale = 0.5;
  if (newScale > 10) newScale = 10;

  zoom.scale = newScale;
  updateTransform();
};

// 2. 鼠标拖拽
const onMouseDown = (e) => {
  // 只有左键可以拖拽
  if (e.button !== 0) return;
  zoom.isDragging = true;
  zoom.startX = e.clientX;
  zoom.startY = e.clientY;
  zoom.lastX = zoom.x;
  zoom.lastY = zoom.y;
  if (lightboxImg.value) lightboxImg.value.style.transition = 'none'; // 拖拽时移除过渡
};

const onMouseMove = (e) => {
  if (!zoom.isDragging) return;
  const dx = e.clientX - zoom.startX;
  const dy = e.clientY - zoom.startY;
  zoom.x = zoom.lastX + dx;
  zoom.y = zoom.lastY + dy;
  updateTransform();
};

const onMouseUp = () => {
  zoom.isDragging = false;
  if (lightboxImg.value) lightboxImg.value.style.transition = 'transform 0.1s ease-out';
};

// 3. 触摸事件 (双指缩放 + 单指拖拽)
const onTouchStart = (e) => {
  if (e.touches.length === 1) {
    // 单指拖拽
    zoom.isDragging = true;
    zoom.startX = e.touches[0].clientX;
    zoom.startY = e.touches[0].clientY;
    zoom.lastX = zoom.x;
    zoom.lastY = zoom.y;
    if (lightboxImg.value) lightboxImg.value.style.transition = 'none';
  } else if (e.touches.length === 2) {
    // 双指缩放
    zoom.isDragging = false;
    zoom.initialDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    zoom.initialScale = zoom.scale;
  }
};

const onTouchMove = (e) => {
  if (e.touches.length === 1 && zoom.isDragging) {
    const dx = e.touches[0].clientX - zoom.startX;
    const dy = e.touches[0].clientY - zoom.startY;
    zoom.x = zoom.lastX + dx;
    zoom.y = zoom.lastY + dy;
    updateTransform();
  } else if (e.touches.length === 2) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    if (zoom.initialDistance > 0) {
      const diff = currentDistance / zoom.initialDistance;
      let newScale = zoom.initialScale * diff;
      if (newScale < 0.5) newScale = 0.5;
      if (newScale > 10) newScale = 10;
      zoom.scale = newScale;
      updateTransform();
    }
  }
};

const onTouchEnd = (e) => {
  zoom.isDragging = false;
  if (lightboxImg.value) lightboxImg.value.style.transition = 'transform 0.1s ease-out';
  if (e.touches.length < 2) {
    zoom.initialDistance = 0;
  }
};

// --- URL 构建 ---
const BASE_URL = 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main';
const getCurrentImageUrl = (charName, action) => {
  const index = getCurrentIndex(charName, action.name);
  return `${BASE_URL}/${charName}/${action.name}${index}.webp`;
};

const onImgLoad = () => { imgLoading.value = false; };
const onImgError = () => { imgLoading.value = false; imgError.value = true; };

onMounted(() => {
  loadGalleryData();
});
</script>

<style scoped>
/* 继承 Layout 变量 */
.animus-gallery-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  color: var(--c-text-main);
  font-family: var(--font-body);
}

/* 顶部 Header */
.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--c-border);
  margin-bottom: 20px;
  flex-shrink: 0;
}

.header-title {
  font-family: var(--font-title);
  font-size: 1.5rem;
  color: var(--c-text-main);
  display: flex;
  align-items: center;
  gap: 10px;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--c-gold);
  opacity: 0.7;
  letter-spacing: 2px;
}

.mode-switcher {
  display: flex;
  gap: 10px;
}

.mode-btn {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text-dim);
  font-family: var(--font-title);
  padding: 5px 15px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.mode-btn:hover {
  border-color: var(--c-gold);
  color: var(--c-gold);
  background: var(--c-hover-bg);
}

.mode-btn.active {
  background: var(--c-gold);
  color: #000;
  border-color: var(--c-gold);
  font-weight: bold;
}

/* 主布局 */
.gallery-layout {
  display: flex;
  flex: 1;
  min-height: 0; /* 防止溢出 */
  gap: 20px;
}

/* 左侧边栏 */
.char-sidebar {
  width: 200px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--c-border);
  padding-right: 10px;
}

.sidebar-header {
  font-family: var(--font-title);
  color: var(--c-gold);
  font-size: 0.8rem;
  margin-bottom: 10px;
  opacity: 0.8;
}

.char-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--c-gold) transparent;
}

.char-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(164, 139, 87, 0.1);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-title);
  font-size: 0.9rem;
  color: var(--c-text-dim);
}

.char-item:hover {
  background: var(--c-hover-bg);
  color: var(--c-text-main);
  padding-left: 15px;
}

.char-item.active {
  color: var(--c-gold);
  border-left: 2px solid var(--c-gold);
  background: linear-gradient(90deg, var(--c-hover-bg), transparent);
}

.char-marker {
  font-size: 0.6rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.char-item.active .char-marker {
  opacity: 1;
}

/* 右侧内容区 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  scrollbar-width: thin;
  scrollbar-color: var(--c-gold) transparent;
}

.detail-title {
  font-family: var(--font-title);
  font-size: 1.4rem;
  color: var(--c-text-main);
  margin: 0;
}

.action-count {
  font-size: 0.8rem;
  color: var(--c-text-dim);
  margin-left: 10px;
}

.detail-line {
  height: 1px;
  background: linear-gradient(90deg, var(--c-gold), transparent);
  margin: 10px 0 20px 0;
  opacity: 0.5;
}

/* 动作卡片 */
.action-card {
  border: 1px solid var(--c-border);
  margin-bottom: 15px;
  background: rgba(0, 0, 0, 0.2);
  transition: border-color 0.3s;
}

.action-card:hover {
  border-color: rgba(164, 139, 87, 0.6);
}

.action-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: rgba(164, 139, 87, 0.05);
}

.action-name {
  font-family: var(--font-title);
  font-weight: bold;
  color: var(--c-text-main);
}

.toggle-icon {
  color: var(--c-gold);
  font-size: 0.8rem;
}

.action-body {
  padding: 15px;
  border-top: 1px solid var(--c-border);
  animation: slide-down 0.3s ease-out;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 图片查看器 */
.img-viewer {
  position: relative;
  width: 100%;
  min-height: 300px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 15px;
  overflow: hidden;
}

.gallery-img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  cursor: zoom-in;
  transition: transform 0.3s;
}

.gallery-img:hover {
  transform: scale(1.02);
}

/* 状态提示 */
.img-status {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--c-text-dim);
  font-family: var(--font-title);
  z-index: 2;
}

.img-status.error { color: var(--c-accent-danger, #a83232); }

/* 控制栏 */
.img-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.ctrl-btn {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-gold);
  padding: 5px 15px;
  font-family: var(--font-title);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
}

.ctrl-btn:hover:not(:disabled) {
  background: var(--c-gold);
  color: #000;
}

.ctrl-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: transparent;
}

.page-indicator {
  font-family: var(--font-title);
  color: var(--c-text-main);
  min-width: 60px;
  text-align: center;
}

/* 装饰角落 */
.corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--c-gold);
  border-style: solid;
  pointer-events: none;
}
.top-left { top: 0; left: 0; border-width: 2px 0 0 2px; }
.top-right { top: 0; right: 0; border-width: 2px 2px 0 0; }
.bottom-left { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
.bottom-right { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

/* 灯箱样式 */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(10, 12, 16, 0.98);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.lightbox-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: grab;
}

.lightbox-container:active {
  cursor: grabbing;
}

.lightbox-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  will-change: transform;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10001;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--c-gold);
  color: var(--c-gold);
  padding: 8px 16px;
  font-family: var(--font-title);
  cursor: pointer;
  transition: all 0.3s;
}

.lightbox-close:hover {
  background: var(--c-gold);
  color: #000;
}

.lightbox-hint {
  position: absolute;
  bottom: 20px;
  color: var(--c-text-dim);
  font-family: var(--font-title);
  font-size: 0.8rem;
  letter-spacing: 2px;
  pointer-events: none;
  opacity: 0.7;
}

/* 加载动画 */
.loading-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.spinner, .mini-spinner {
  border: 2px solid transparent;
  border-top-color: var(--c-gold);
  border-right-color: var(--c-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner { width: 50px; height: 50px; }
.mini-spinner { width: 30px; height: 30px; }

@keyframes spin { 100% { transform: rotate(360deg); } }

/* 移动端适配 */
@media (max-width: 768px) {
  .gallery-layout {
    flex-direction: column;
  }

  .char-sidebar {
    width: 100%;
    height: 150px; /* 固定高度 */
    border-right: none;
    border-bottom: 1px solid var(--c-border);
    padding-bottom: 10px;
    margin-bottom: 10px;
  }

  .gallery-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .mode-switcher {
    width: 100%;
  }

  .mode-btn {
    flex: 1;
    text-align: center;
  }

  .content-area {
    padding-right: 0;
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
