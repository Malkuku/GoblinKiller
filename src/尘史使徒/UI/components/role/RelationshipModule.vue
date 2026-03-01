<!-- RelationshipModule.vue -->
<template>
  <div class="relationship-module">
    <div
      v-for="(rel, name) in data"
      :key="name"
      class="rel-card"
      :class="{ expanded: expandedState[name] }"
    >
      <!-- 头部：始终显示，点击切换展开/收起 -->
      <div class="rel-header" @click="toggleExpand(name)">
        <div class="header-main">
          <span class="rel-name">{{ formatName(name) }}</span>
          <span class="rel-summary">{{ getSummary(rel) }}</span>
        </div>
        <div class="toggle-icon">
          {{ expandedState[name] ? '−' : '+' }}
        </div>
      </div>

      <!-- 详情部分：默认收起 -->
      <div v-show="expandedState[name]" class="rel-details">
        <div class="details-grid">

          <!-- 认知了解 -->
          <div class="detail-item" v-if="rel['认知了解']">
            <h4 class="detail-title">认知了解</h4>
            <p class="detail-text">{{ rel['认知了解'] }}</p>
          </div>

          <!-- 情感羁绊 -->
          <div class="detail-item" v-if="rel['情感羁绊']">
            <h4 class="detail-title">情感羁绊</h4>
            <p class="detail-text">{{ rel['情感羁绊'] }}</p>
          </div>

          <!-- 利益纽带 -->
          <div class="detail-item" v-if="rel['利益纽带']">
            <h4 class="detail-title">利益纽带</h4>
            <p class="detail-text">{{ rel['利益纽带'] }}</p>
          </div>

          <!-- 近期影响 -->
          <div class="detail-item" v-if="rel['近期影响'] && Object.keys(rel['近期影响']).length > 0">
            <h4 class="detail-title">近期影响</h4>
            <ul class="recent-impact-list">
              <li v-for="(val, key) in rel['近期影响']" :key="key">
                <span class="impact-key">{{ key }}:</span>
                <span class="impact-val">{{ val }}</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

// 状态管理：记录哪些卡片被展开了
const expandedState = ref({});

const toggleExpand = (name) => {
  expandedState.value[name] = !expandedState.value[name];
};

// 获取关系摘要：截取情感羁绊的前段作为摘要展示
const getSummary = (rel) => {
  if (rel['情感羁绊']) {
    return rel['情感羁绊'].length > 25 ? rel['情感羁绊'].slice(0, 25) + '...' : rel['情感羁绊'];
  }
  return '暂无详细描述';
};

// 假设 substitudeMacros 是全局注入的方法，如果没有则提供回退
const formatName = (name) => {
  if (name === 'user') {
    try {
      // 尝试调用宏替换，如果未定义则回退到 '你'
      return typeof substitudeMacros === 'function' ? substitudeMacros('{{user}}') : '{{user}}';
    } catch (e) {
      return '你';
    }
  }
  return name;
};
</script>

<style scoped>
.relationship-module {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rel-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.rel-card.expanded {
  border-color: var(--c-gold, #d4af37);
  background: rgba(0, 0, 0, 0.5);
}

/* --- 头部样式 --- */
.rel-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
}

.rel-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rel-name {
  font-family: var(--font-title, serif);
  color: var(--c-gold, #d4af37);
  font-size: 1.1rem;
  font-weight: bold;
}

.rel-summary {
  font-size: 0.9rem;
  color: #ccc;
  font-style: italic;
  line-height: 1.4;
}

.toggle-icon {
  color: var(--c-gold, #d4af37);
  font-size: 1.2rem;
  font-weight: bold;
  opacity: 0.7;
}

/* --- 详情区域 --- */
.rel-details {
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-title {
  margin: 0;
  font-size: 0.95rem;
  color: var(--c-text-dim, #a0a0a0);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
}

.detail-text {
  margin: 0;
  font-size: 0.85rem;
  color: #ddd;
  line-height: 1.6;
  white-space: pre-wrap;
}

.recent-impact-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.85rem;
  color: #ddd;
  line-height: 1.6;
}

.recent-impact-list li {
  margin-bottom: 6px;
  display: flex;
  align-items: flex-start;
}

.impact-key {
  color: var(--c-gold, #d4af37);
  margin-right: 8px;
  font-weight: bold;
  white-space: nowrap;
}

.impact-val {
  color: #fff;
  flex: 1;
}
</style>
