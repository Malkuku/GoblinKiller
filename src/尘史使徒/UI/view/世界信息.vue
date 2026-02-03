<template>
  <div class="world-view-container">
    <!-- 顶部标题与导航栏 -->
    <div class="view-header">
      <div class="title-section">
        <h1 class="view-title">视界</h1>
        <p class="view-description">所待之时，所处之地，所见之物，所闻之人</p>
      </div>

      <!-- 页面切换标签 -->
      <div class="view-tabs">
        <button
          class="tab-btn"
          :class="{ active: currentTab === 'status' }"
          @click="currentTab = 'status'"
        >
          概览
        </button>
        <button
          class="tab-btn"
          :class="{ active: currentTab === 'map' }"
          @click="currentTab = 'map'"
        >
          舆图
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <transition name="fade-slide" mode="out-in">

        <!-- 第一页：世界状态 -->
        <div v-if="currentTab === 'status'" key="status" class="status-panel">
          <div class="world-status-grid">
            <div class="status-item">
              <span class="label">当前日期</span>
              <span class="value">{{ date || '...' }}</span>
            </div>
            <div class="status-item">
              <span class="label">当前地点</span>
              <span class="value">{{ location || '...' }}</span>
            </div>
            <div class="status-item">
              <span class="label">当前时间</span>
              <span class="value">{{ time || '...' }}</span>
            </div>
            <div class="status-item">
              <span class="label">当前人物</span>
              <span class="value">{{ currentCharacter || '...' }}</span>
            </div>
            <div class="status-item">
              <span class="label">当前季节</span>
              <span class="value">{{ season || '...' }}</span>
            </div>
            <div class="status-item">
              <span class="label">当前天气</span>
              <span class="value">{{ weather || '...' }}</span>
            </div>
          </div>
        </div>

        <!-- 第二页：地图系统 -->
        <div v-else key="map" class="map-panel-wrapper">
          <MapSystem />
        </div>

      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
// 引入地图组件，请根据实际文件路径调整
import MapSystem from '@/尘史使徒/UI/components/MapSystem.vue';

const statStore = useStatStore();
const currentTab = ref('status');

// 第一页数据
const date = computed(() => statStore.stat_data?.世界?.日期);
const location = computed(() => statStore.stat_data?.世界?.地点);
const time = computed(() => statStore.stat_data?.世界?.时间);
const currentCharacter = computed(() => statStore.stat_data?.世界?.当前人物);
const season = computed(() => statStore.stat_data?.世界?.季节);
const weather = computed(() => statStore.stat_data?.世界?.天气);
</script>

<style scoped>
/* =====================
   全局容器与头部样式
   ===================== */
.world-view-container {
  max-width: 1200px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.view-title {
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.1em;
}

.view-description {
  font-size: 1rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

/* 标签页按钮 */
.view-tabs {
  display: flex;
  gap: 10px;
}

.tab-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  padding: 5px 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
  font-weight: bold;
}

/* =====================
   第一页：状态面板样式
   ===================== */
.status-panel {
  padding-top: 20px;
}

.world-status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 650px;
  margin: 0 auto;
}

.status-item {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.status-item:hover {
  transform: translateY(-5px);
  border-color: var(--accent-primary);
  box-shadow: 0 5px 15px var(--shadow-color);
}

.status-item .label {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.status-item .value {
  font-family: 'EB Garamond', serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* =====================
   第二页：地图面板容器
   ===================== */
.map-panel-wrapper {
  width: 100%;
  height: 650px; /* 控制地图组件的高度 */
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 15px var(--shadow-color);
}

/* =====================
   页面切换动画
   ===================== */
.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }

/* 响应式调整 */
@media (max-width: 768px) {
  .world-status-grid { grid-template-columns: 1fr; }
  .map-panel-wrapper { height: 450px; }
  .view-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>
