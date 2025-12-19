<template>
  <div class="characters-view-container">
    <!-- 1. 顶层选项卡 -->
    <div class="tabs">
      <button class="tab-button" :class="{ active: activeTab === 'main' }" @click="selectTab('main')">主要角色</button>
      <button class="tab-button" :class="{ active: activeTab === 'minor' }" @click="selectTab('minor')">
        次要角色
      </button>
    </div>

    <div v-if="activeList.length > 0" class="content-wrapper">
      <!-- 2. 分页导航 -->
      <nav class="pagination-nav">
        <ul>
          <li v-for="(char, index) in activeList" :key="char.name">
            <button class="char-button" :class="{ active: index === currentIndex }" @click="selectCharacter(index)">
              <!-- 核心逻辑：如果角色隐藏，则显示'未知' -->
              {{ getDisplayName(char) }}
            </button>
          </li>
        </ul>
      </nav>

      <!-- 3. 角色面板展示区 -->
      <div class="panel-display-area">
        <transition name="fade-main" mode="out-in">
          <div :key="currentCharacterData.name">
            <!-- A. 渲染主要角色面板 -->
            <CharacterPanel
              v-if="activeTab === 'main'"
              :character-name="currentCharacterData.name"
              :character-data="currentCharacterData.data"
              :is-omniscient="isOmniscient"
              :is-current-user="currentCharacterData.name === currentUserKey"
            />
            <!-- B. 渲染次要角色面板 (或未知提示) -->
            <template v-else-if="activeTab === 'minor'">
              <!-- B1. 如果角色隐藏，显示未知提示 -->
              <div v-if="currentCharacterData.data.隐藏" class="unknown-character-notice">
                <h2 class="unknown-title">身份不明</h2>
                <p>此人潜藏于阴影之中，目的不明。</p>
              </div>
              <!-- B2. 否则，正常显示次要角色面板 -->
              <MinorCharacterPanel
                v-else
                :character-name="currentCharacterData.name"
                :character-data="currentCharacterData.data"
              />
            </template>
          </div>
        </transition>
      </div>
    </div>

    <div v-else class="loading-state">该分类下暂无角色数据...</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStatStore } from '@/尘史使徒/store/StatStore';
import MinorCharacterPanel from '@/尘史使徒/components/MinorCharacterPanel.vue';
import CharacterPanel from '@/尘史使徒/components/CharacterPanel.vue';

const statStore = useStatStore();

// --- 状态管理 ---
const activeTab = ref('main'); // 'main' 或 'minor'
const mainCharCurrentIndex = ref(0);
const minorCharCurrentIndex = ref(0);

// --- 计算属性 ---
const isOmniscient = computed(() => statStore.stat_data?.全知视角 === true);
const currentUserKey = "user";

// 将角色对象转换为数组，并根据“已出场”状态进行过滤
const mainCharactersList = computed(() => {
  const mainChars = statStore.stat_data?.角色?.主要角色;
  const appearedChars = statStore.stat_data?.角色?.已出场角色;

  if (!mainChars) {
    return [];
  }

  return Object.entries(mainChars)
    .filter(([name]) => {
      // 如果是全知视角，则显示所有主要角色
      // 否则，只显示在“已出场角色”中为 true 的角色
      return isOmniscient.value || (appearedChars && appearedChars[name] === true);
    })
    .map(([name, data]) => ({ name, data }));
});

const minorCharactersList = computed(() =>
  statStore.stat_data?.角色?.次要角色
    ? Object.entries(statStore.stat_data.角色.次要角色)
      .filter(([name]) => name !== '$template') // 过滤掉 $template
      .map(([name, data]) => ({ name, data }))
    : []
);

// 根据当前激活的 tab 返回对应的角色列表
const activeList = computed(() => activeTab.value === 'main' ? mainCharactersList.value : minorCharactersList.value);

// 根据当前激活的 tab 返回对应的索引
const currentIndex = computed(() => activeTab.value === 'main' ? mainCharCurrentIndex.value : minorCharCurrentIndex.value);

// 获取当前需要展示的角色数据
const currentCharacterData = computed(() => activeList.value[currentIndex.value]);

const getDisplayName = (char) => {
  if(activeTab.value === 'minor' && char.data.隐藏){
    return '未知';
  }else if(activeTab.value === 'main' && char.name === 'user'){
    return substitudeMacros('{{user}}');
  }
  return char.name
};

// --- 方法 ---
function selectTab(tabName) {
  activeTab.value = tabName;
}

function selectCharacter(index) {
  if (activeTab.value === 'main') {
    mainCharCurrentIndex.value = index;
  } else {
    minorCharCurrentIndex.value = index;
  }
}

// --- 侦听器 ---
// 当过滤后的主角色列表变化时，检查当前索引是否越界，如果是则重置为0
// 这可以防止因列表项减少而导致访问不存在的索引而出错
watch(mainCharactersList, (newList) => {
  if (mainCharCurrentIndex.value >= newList.length) {
    mainCharCurrentIndex.value = 0;
  }
});
</script>

<style scoped>
.characters-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 选项卡样式 */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}
.tab-button {
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1.5rem;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translateY(1px);
}
.tab-button:hover {
  color: var(--text-primary);
}
.tab-button.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

/* 主要内容区布局 */
.content-wrapper {
  display: grid;
  grid-template-columns: 220px 1fr; /* 左侧分页导航，右侧内容 */
  gap: 1.5rem;
  flex-grow: 1;
  overflow: hidden;
}

/* 分页导航样式 */
.pagination-nav {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem 0;
  overflow-y: auto;
}
.pagination-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.char-button {
  width: 100%;
  background: none;
  border: none;
  border-left: 3px solid transparent;
  padding: 0.8rem 1.5rem;
  text-align: left;
  font-family: 'EB Garamond', serif;
  font-size: 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.char-button:hover {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
.char-button.active {
  background-color: var(--bg-primary);
  color: var(--accent-primary);
  border-left-color: var(--accent-danger);
  font-weight: bold;
}

/* 角色面板展示区 */
.panel-display-area {
  overflow-y: auto;
  padding-right: 10px; /* 防止滚动条紧贴内容 */
}

/* 未知角色提示 */
.unknown-character-notice {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 3rem;
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.unknown-title {
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}
.unknown-character-notice p {
  font-style: italic;
  color: var(--text-secondary);
  max-width: 40ch;
}

.loading-state {
  color: var(--text-secondary);
  font-style: italic;
  text-align: center;
  padding: 4rem 0;
}

/* 响应式适配 */
@media (max-width: 900px) {
  .content-wrapper {
    grid-template-columns: 1fr; /* 垂直布局 */
    grid-template-rows: auto 1fr;
  }
  .pagination-nav ul {
    display: flex;
    flex-wrap: wrap; /* 按钮换行 */
    gap: 0.5rem;
  }
  .char-button {
    width: auto;
    border-left: none;
    border-bottom: 2px solid transparent;
    border-radius: 4px;
  }
  .char-button.active {
    border-bottom-color: var(--accent-danger);
  }
  .panel-display-area {
    padding-right: 0;
  }
}

/* 切换动画 */
.fade-main-enter-active,
.fade-main-leave-active {
  transition: opacity 0.2s ease;
}
.fade-main-enter-from,
.fade-main-leave-to {
  opacity: 0;
}
</style>
