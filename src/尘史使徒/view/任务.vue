<template>
  <div class="tasks-view-container">
    <!-- 1. 顶层选项卡 -->
    <div class="tabs">
      <button class="tab-button" :class="{ active: activeTab === 'main' }" @click="selectTab('main')">
        主律
      </button>
      <button class="tab-button" :class="{ active: activeTab === 'side' }" @click="selectTab('side')">
        插曲
      </button>
    </div>

    <!-- 2. 内容展示区 -->
    <div class="content-wrapper">
      <!-- A. "支线" 内容区 (分页) -->
      <template v-if="activeTab === 'side'">
        <div v-if="sideQuestsList.length > 0" class="side-quest-layout">
          <!-- A1. 分页导航 -->
          <nav class="pagination-nav">
            <ul>
              <li v-for="(quest, index) in sideQuestsList" :key="quest.name">
                <button class="quest-button" :class="{ active: index === currentSideQuestIndex }" @click="selectSideQuest(index)">
                  {{ quest.name }}
                </button>
              </li>
            </ul>
          </nav>

          <!-- A2. 支线详情面板 -->
          <div class="panel-display-area">
            <transition name="fade-main" mode="out-in">
              <div v-if="currentSideQuest" :key="currentSideQuest.name" class="side-quest-panel">
                <h2 class="quest-title">{{ currentSideQuest.name }}</h2>

                <div class="quest-section">
                  <h3>描述</h3>
                  <p>{{ currentSideQuest.data.描述 }}</p>
                </div>

                <div class="quest-section">
                  <h3>目标</h3>
                  <p>{{ currentSideQuest.data.目标 }}</p>
                </div>

                <div class="quest-section progress-section">
                  <h3>进度</h3>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: sideQuestProgressPercentage + '%' }"></div>
                    <span class="progress-text">{{ currentSideQuest.data.进度 }} / {{ currentSideQuest.data.需要进度 }}</span>
                  </div>
                  <p class="progress-result"><strong>目前成果：</strong>{{ currentSideQuest.data.目前成果 }}</p>
                </div>

                <!-- [修改点 1] 使用 v-if 判断是否开启全知视角 -->
                <template v-if="isOmniscient">
                  <div class="enemy-info-grid">
                    <div class="quest-section">
                      <h3>大敌</h3>
                      <p>{{ currentSideQuest.data.大敌 }}</p>
                    </div>
                    <div class="quest-section">
                      <h3>敌人的目标</h3>
                      <p>{{ currentSideQuest.data.敌人的目标 }}</p>
                    </div>
                  </div>

                  <div class="quest-section">
                    <h3>敌人的行动</h3>
                    <p>{{ currentSideQuest.data.敌人的行动 }}</p>
                  </div>
                </template>

              </div>
            </transition>
          </div>
        </div>
        <div v-else class="loading-state">风平浪静，寂静宛如消逝的冬...</div>
      </template>

      <!-- B. "主线" 内容区 (固定布局) -->
      <template v-else-if="activeTab === 'main'">
        <div v-if="mainQuests" class="main-quest-layout">
          <!-- B1. 诱惑：存续 -->
          <div v-if="mainQuests['诱惑：存续']" class="main-quest-panel theme-survival">
            <div class="panel-glow"></div>
            <h2 class="quest-title">诱惑：存续</h2>
            <p class="quest-description">"{{ mainQuests['诱惑：存续'].描述 }}"</p>
          </div>

          <!-- B2. 诱惑：力量 -->
          <div v-if="mainQuests['诱惑：力量']" class="main-quest-panel theme-power">
            <h2 class="quest-title">诱惑：力量</h2>
            <p class="quest-description">"{{ mainQuests['诱惑：力量'].描述 }}"</p>
            <div class="soul-quality-section">
              <h3>已交融的魂质</h3>
              <div class="soul-quality-grid">
                <div v-for="(isAcquired, name) in mainQuests['诱惑：力量'].已交融的魂质" :key="name"
                     class="soul-quality-item" :class="{ acquired: isAcquired }">
                  <span class="icon">{{ isAcquired ? '✔' : '✖' }}</span>
                  <span class="name">{{ name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="loading-state">主线故事尚未开启...</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStatStore } from '@/尘史使徒/store/StatStore';


const statStore = useStatStore();

// --- 状态管理 ---
const activeTab = ref('main'); // 默认值，将在 onMounted 中被覆盖
const currentSideQuestIndex = ref(0);

// --- [修改点 2] 新增：获取全知视角状态 ---
const isOmniscient = computed(() => statStore.stat_data?.全知视角 === true);

// --- 计算属性 ---
const mainQuests = computed(() => statStore.stat_data?.主线);

const sideQuestsList = computed(() => {
  const quests = statStore.stat_data?.支线;
  if (!quests) return [];
  return Object.entries(quests)
    .filter(([name]) => name !== '$template') // 核心：过滤掉 $template
    .map(([name, data]) => ({ name, data }));
});

const currentSideQuest = computed(() => sideQuestsList.value[currentSideQuestIndex.value]);

const sideQuestProgressPercentage = computed(() => {
  if (!currentSideQuest.value) return 0;
  const { 进度, 需要进度 } = currentSideQuest.value.data;
  if (需要进度 <= 0) return 0;
  return (进度 / 需要进度) * 100;
});

// --- 生命周期钩子 ---
onMounted(() => {
  // 根据需求设置默认显示的选项卡
  if (sideQuestsList.value.length > 0) {
    activeTab.value = 'side';
  } else {
    activeTab.value = 'main';
  }
});

// --- 方法 ---
function selectTab(tabName) {
  activeTab.value = tabName;
}

function selectSideQuest(index) {
  currentSideQuestIndex.value = index;
}
</script>

<style scoped>
/* --- 基础布局与通用样式 --- */
.tasks-view-container { display: flex; flex-direction: column; height: 100%; }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); }
.tab-button { background: none; border: none; border-bottom: 3px solid transparent; padding: 0.75rem 1.5rem; font-family: 'Cinzel', serif; font-size: 1.1rem; color: var(--text-secondary); cursor: pointer; transition: all 0.3s ease; transform: translateY(1px); }
.tab-button:hover { color: var(--text-primary); }
.tab-button.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
.content-wrapper { flex-grow: 1; overflow-y: auto; padding-right: 10px; }
.loading-state { color: var(--text-secondary); font-style: italic; text-align: center; padding: 4rem 0; }
.quest-title { font-family: 'Cinzel', serif; font-size: 1.8rem; margin-bottom: 1rem; }

/* --- 支线任务布局 --- */
.side-quest-layout { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; height: 100%; }
.pagination-nav { background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem 0; overflow-y: auto; }
.pagination-nav ul { list-style: none; padding: 0; margin: 0; }
.quest-button { width: 100%; background: none; border: none; border-left: 3px solid transparent; padding: 0.8rem 1.5rem; text-align: left; font-family: 'EB Garamond', serif; font-size: 1rem; color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
.quest-button:hover { background-color: var(--bg-primary); color: var(--text-primary); }
.quest-button.active { background-color: var(--bg-primary); color: var(--accent-primary); border-left-color: var(--accent-danger); font-weight: bold; }
.panel-display-area { overflow: hidden; }

/* --- 支线任务面板样式 --- */
.side-quest-panel { background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 2rem; }
.quest-section { margin-bottom: 1.5rem; }
.quest-section h3 { font-family: 'Cinzel', serif; font-size: 1.1rem; color: var(--accent-primary); margin-bottom: 0.5rem; }
.quest-section p { font-family: 'EB Garamond', serif; font-size: 1rem; line-height: 1.6; color: var(--text-primary); margin: 0; }
.enemy-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.progress-section .progress-bar { background-color: var(--bg-primary); border-radius: 4px; height: 24px; position: relative; overflow: hidden; margin-bottom: 0.5rem; }
.progress-section .progress-fill { background: var(--accent-primary); height: 100%; border-radius: 4px; transition: width 0.5s ease-out; }
.progress-section .progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.8rem; color: var(--text-primary); mix-blend-mode: difference; filter: invert(1) grayscale(1) contrast(100); }
.progress-section .progress-result { font-style: italic; }

/* [修改点 3] 新增：为锁定的敌人信息添加样式 */
.enemy-info-locked {
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  padding: 2rem;
  text-align: center;
  margin-top: 1.5rem;
}
.enemy-info-locked p {
  font-family: 'EB Garamond', serif;
  font-style: italic;
  color: var(--text-secondary);
  margin: 0;
}

/* --- 主线任务布局与样式 --- */
.main-quest-layout { display: flex; flex-direction: column; gap: 1.5rem; }
.main-quest-panel { border-radius: 6px; padding: 2rem 2.5rem; position: relative; overflow: hidden; border: 1px solid var(--border-color); }
.main-quest-panel .quest-title { color: var(--theme-color); }
.main-quest-panel .quest-description { font-family: 'EB Garamond', serif; font-size: 1.2rem; font-style: italic; line-height: 1.7; max-width: 65ch; }

/* 主线特效：存续 */
.theme-survival {
  --theme-color: #90EE90; /* 心准则的绿色 */
  background-color: #1a2a1a;
  border-color: #2a402a;
}
.theme-survival .panel-glow {
  position: absolute;
  top: 50%; left: 50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle, rgba(144, 238, 144, 0.15) 0%, transparent 40%);
  transform: translate(-50%, -50%);
  animation: pulse 4s infinite ease-in-out;
}
@keyframes pulse { 0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.9); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1); } }

/* [修改点 4] 主线特效：力量 (已更换) */
.theme-power {
  --theme-color: #DA70D6; /* 蛾准则的紫色 */
  background-color: #2a1a2a;
  border-color: #402a40;
}
.theme-power::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  border-radius: 6px;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(218, 112, 214, 0.2) 1px, transparent 2px),
    radial-gradient(circle at 80% 10%, rgba(218, 112, 214, 0.25) 1px, transparent 2px),
    radial-gradient(circle at 50% 70%, rgba(218, 112, 214, 0.15) 2px, transparent 3px),
    radial-gradient(circle at 10% 90%, rgba(218, 112, 214, 0.2) 1px, transparent 2px),
    radial-gradient(circle at 90% 60%, rgba(218, 112, 214, 0.22) 1px, transparent 2px);
  background-size: 100px 100px, 150px 150px, 120px 120px, 180px 180px, 90px 90px;
  animation: moth-dust-drift 20s linear infinite;
  opacity: 0.5; /* 默认可见度 */
  transition: opacity 0.5s;
}
.theme-power:hover::before {
  opacity: 0.8; /* 鼠标悬浮时更明显 */
}
@keyframes moth-dust-drift {
  from {
    transform: translateY(0px) rotate(0deg);
  }
  to {
    transform: translateY(-100px) rotate(10deg);
  }
}

.soul-quality-section { margin-top: 2rem; }
.soul-quality-section h3 { font-family: 'Cinzel', serif; font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 1rem; }
.soul-quality-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
.soul-quality-item {
  background: var(--bg-primary);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.6;
  transition: all 0.3s ease;
  border-left: 3px solid var(--text-secondary);
}
.soul-quality-item.acquired {
  color: var(--theme-color);
  opacity: 1;
  border-left-color: var(--theme-color);
  box-shadow: 0 0 8px rgba(218, 112, 214, 0.3);
}
.soul-quality-item .icon { font-weight: bold; }
.soul-quality-item .name { font-family: 'EB Garamond', serif; }

/* --- 响应式 --- */
@media (max-width: 900px) {
  .side-quest-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .pagination-nav ul { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .quest-button { width: auto; border-left: none; border-bottom: 2px solid transparent; border-radius: 4px; }
  .quest-button.active { border-bottom-color: var(--accent-danger); }
  .enemy-info-grid { grid-template-columns: 1fr; }
}

/* --- 动画 --- */
.fade-main-enter-active, .fade-main-leave-active { transition: opacity 0.3s ease; }
.fade-main-enter-from, .fade-main-leave-to { opacity: 0; }
</style>
