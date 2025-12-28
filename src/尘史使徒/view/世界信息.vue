<template>
  <div class="world-view-container">
    <h1 class="view-title">视界</h1>

    <p class="view-description">
      所待之时，所处之地，所见之物，所闻之人
    </p>

    <div class="world-status-grid">
      <div class="status-item">
        <span class="label">当前日期</span>
        <!-- 使用 `|| '未知'` 作为后备，防止数据加载前显示为空白 -->
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
</template>

<script setup>
import { computed } from 'vue';
import { useStatStore } from '@/尘史使徒/store/StatStore';
// 假设你的 store 文件位于 'src/stores/stat.js' 或 '.ts'


// 1. 实例化 Pinia store
const statStore = useStatStore();

// 2. 创建 computed 属性以响应式地从 store 获取世界信息
//    使用可选链 (?.) 确保在 stat_data 初始加载完成前不会报错
const date = computed(() => statStore.stat_data?.世界?.日期);
const location = computed(() => statStore.stat_data?.世界?.地点);
const time = computed(() => statStore.stat_data?.世界?.时间);
const currentCharacter = computed(() => statStore.stat_data?.世界?.当前人物);
const season = computed(() => statStore.stat_data?.世界?.季节);
const weather = computed(() => statStore.stat_data?.世界?.天气);
</script>

<style scoped>

.world-view-container {
  max-width: 1200px; /* 限制最大宽度，提升大屏可读性 */
}

.view-title {
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  letter-spacing: 0.1em;
}

.view-description {
  font-size: 1rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 2.5rem;
  max-width: 80ch; /* 限制描述文本的行长，便于阅读 */
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

.label {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  text-transform: uppercase; /* 标签使用大写，增加庄重感 */
  letter-spacing: 0.05em;
}

.value {
  font-family: 'EB Garamond', serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.2;
}
</style>