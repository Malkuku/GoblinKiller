<!-- views/QuestView.vue -->
<template>
  <div class="quest-view">
    <!-- 顶部标题栏 -->
    <header class="quest-header">
      <h1 class="page-title">道寻 <span class="subtitle">QUESTS & EVENTS</span></h1>
      <div class="header-line"></div>
    </header>

    <!-- 分类导航 (Tab) -->
    <nav class="quest-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: currentTab === tab.id }]"
        @click="currentTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-name">{{ tab.name }}</span>
        <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
      </button>
    </nav>

    <!-- 内容区域 -->
    <div class="quest-content">
      <transition name="fade-slide" mode="out-in">

        <!-- 1. 主线任务面板 (修改部分) -->
        <div v-if="currentTab === 'main'" class="panel-main" key="main">
          <div v-if="filteredMainQuests.length === 0" class="empty-state">
            暂无主线指引
          </div>

          <!-- 使用新组件 -->
          <MainQuestCard
            v-for="quest in filteredMainQuests"
            :key="quest.title"
            :title="quest.title"
            :data="quest"
          />
        </div>

        <!-- 2. 委托任务面板 -->
        <div v-else-if="currentTab === 'tasks'" key="tasks" class="panel-tasks">
          <div v-if="filteredTasks.length === 0" class="empty-state">
            暂无委托
          </div>
          <div class="task-grid">
            <div
              v-for="task in filteredTasks"
              :key="task.title"
              class="task-card"
            >
              <div class="task-header">
                <h3>{{ task.title }}</h3>
                <div class="decoration-line"></div>
              </div>
              <div class="task-body">
                <p class="desc">{{ task.描述 }}</p>

                <div class="task-meta">
                  <div class="meta-row">
                    <span class="icon">🎯</span>
                    <span class="label">目标:</span>
                    <span class="value">{{ task.目标 }}</span>
                  </div>
                  <div class="meta-row" v-if="task.阻碍">
                    <span class="icon">⚔</span>
                    <span class="label">阻碍:</span>
                    <span class="value">{{ task.阻碍 }}</span>
                  </div>
                  <div class="meta-row reward" v-if="task.期望奖励">
                    <span class="icon">💰</span>
                    <span class="label">报酬:</span>
                    <span class="value">{{ task.期望奖励 }}</span>
                  </div>
                </div>

                <!-- 成果展示 -->
                <div v-if="task.取得成果 && task.取得成果.length" class="achievements">
                  <div v-for="(ach, idx) in task.取得成果" :key="idx" class="ach-item">
                    ✓ {{ ach }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 世界事件面板 -->
        <div v-else-if="currentTab === 'events'" class="panel-events" key="events">
          <div v-if="filteredEvents.length === 0" class="empty-state">
            当前区域无特殊事件
          </div>
          <div class="event-list">
            <div
              v-for="evt in filteredEvents"
              :key="evt.title"
              class="event-row"
            >
              <div class="event-info">
                <h3>{{ evt.title }}</h3>
                <p>{{ evt.描述 }}</p>
                <div class="effect" v-if="evt.作用">
                  <span class="label">影响:</span> {{ evt.作用 }}
                </div>
              </div>

              <div class="event-progress">
                <div class="progress-text">
                  <span>SYNC STATUS</span>
                  <span>{{ Math.round((evt.进度 / evt.总进度) * 100) }}%</span>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill gold"
                    :style="{ width: (evt.进度 / evt.总进度 * 100) + '%' }"
                  ></div>
                </div>
                <div class="progress-detail">
                  {{ evt.进度 }} / {{ evt.总进度 }}
                </div>
              </div>
            </div>
          </div>
        </div>

      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuestStore } from '@/尘史使徒/UI/store/QuestStore';
import MainQuestCard from '@/尘史使徒/UI/components/task/MainQuestCard.vue';

const questStore = useQuestStore();
const currentTab = ref('main');

// 过滤掉 title 为 $template 的数据
const filteredMainQuests = computed(() =>
  questStore.mainQuests.filter(q => q.title !== '$template')
);
const filteredTasks = computed(() =>
  questStore.tasks.filter(t => t.title !== '$template')
);
const filteredEvents = computed(() =>
  questStore.events.filter(e => e.title !== '$template')
);

const tabs = computed(() => [
  { id: 'main', name: '主线誓约', icon: '⚖', count: filteredMainQuests.value.length },
  { id: 'tasks', name: '尘世委托', icon: '📜', count: filteredTasks.value.length },
  { id: 'events', name: '因果事件', icon: '⚡', count: filteredEvents.value.length },
]);
</script>

<style scoped>
/* 继承 Layout.vue 的变量，并定义局部变量 */
.quest-view {
  --c-card-bg: rgba(20, 20, 20, 0.6);
  --c-card-border: rgba(164, 139, 87, 0.4);
  --c-accent-danger: #a83232;

  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 40px;
  overflow: hidden;
  font-family: var(--font-body);
  color: var(--c-text-main);
}

/* --- Header --- */
.quest-header {
  flex-shrink: 0;
  margin-bottom: 20px;
}

.page-title {
  font-family: var(--font-title);
  font-size: 2rem;
  color: var(--c-text-main);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--c-gold);
  margin-left: 10px;
  font-weight: 400;
}

.header-line {
  height: 1px;
  background: linear-gradient(90deg, var(--c-gold), transparent);
  margin-top: 10px;
  width: 100%;
}

/* --- Tabs --- */
.quest-tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 10px 20px;
  color: var(--c-text-dim);
  font-family: var(--font-title);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: var(--c-text-main);
  background: rgba(255,255,255,0.05);
}

.tab-btn.active {
  color: var(--c-gold);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--c-gold);
  box-shadow: 0 0 10px var(--c-gold);
}

.tab-count {
  font-size: 0.8rem;
  background: rgba(0,0,0,0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: sans-serif;
}

/* --- Content Area --- */
.quest-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  /* 自定义滚动条 */
  scrollbar-width: thin;
  scrollbar-color: var(--c-gold) transparent;
}

.quest-content::-webkit-scrollbar {
  width: 4px;
}
.quest-content::-webkit-scrollbar-thumb {
  background: var(--c-gold);
}

.empty-state {
  text-align: center;
  padding: 50px;
  color: var(--c-text-dim);
  font-style: italic;
  border: 1px dashed var(--c-border);
}

/* 主线任务样式已移至 MainQuestCard 组件 */

/* --- Task Grid --- */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.task-card {
  background: var(--c-card-bg);
  border: 1px solid var(--c-border);
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  border-color: var(--c-gold);
}

.task-header h3 {
  font-family: var(--font-title);
  color: var(--c-text-main);
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.decoration-line {
  height: 2px;
  width: 30px;
  background: var(--c-gold);
  margin-bottom: 15px;
}

.task-body .desc {
  font-size: 0.95rem;
  color: var(--c-text-dim);
  margin-bottom: 15px;
  flex-grow: 1;
}

.meta-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.meta-row .icon { margin-right: 8px; width: 15px; text-align: center; }
.meta-row .label { color: var(--c-text-dim); margin-right: 5px; }
.meta-row .value { color: var(--c-text-main); }
.meta-row.reward .value { color: var(--c-gold); }

.achievements {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255,255,255,0.1);
}

.ach-item {
  color: #8bc34a; /* Success Green */
  font-size: 0.85rem;
}

/* --- Event List --- */
.event-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,0,0,0.2);
  border: 1px solid transparent;
  border-bottom: 1px solid var(--c-border);
  padding: 20px;
  margin-bottom: 10px;
}

.event-row:hover {
  background: rgba(164, 139, 87, 0.05);
}

.event-info {
  flex: 1;
  padding-right: 40px;
}

.event-info h3 {
  font-family: var(--font-title);
  color: var(--c-gold);
  margin: 0 0 5px 0;
}

.event-info p {
  margin: 0 0 10px 0;
  color: var(--c-text-dim);
}

.event-progress {
  width: 250px;
  flex-shrink: 0;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  letter-spacing: 1px;
  margin-bottom: 5px;
  color: var(--c-text-dim);
}

.progress-track {
  height: 6px;
  background: rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--c-gold);
  box-shadow: 0 0 8px var(--c-gold);
  transition: width 0.5s ease;
}

.progress-fill.danger {
  background: var(--c-accent-danger);
  box-shadow: 0 0 8px var(--c-accent-danger);
}

.progress-detail {
  text-align: right;
  font-size: 0.8rem;
  margin-top: 4px;
  font-family: monospace;
}

/* --- Responsive --- */
@media (max-width: 768px) {
  .quest-view { padding: 15px; }
  .event-row { flex-direction: column; align-items: flex-start; }
  .event-progress { width: 100%; margin-top: 15px; }
  .task-grid { grid-template-columns: 1fr; }
}

/* --- Animation --- */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
