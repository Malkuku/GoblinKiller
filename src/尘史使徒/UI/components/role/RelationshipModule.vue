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
          <span class="rel-summary">{{ rel.关系总结 || '暂无详细描述' }}</span>
        </div>
        <div class="toggle-icon">
          {{ expandedState[name] ? '−' : '+' }}
        </div>
      </div>

      <!-- 详情部分：默认收起 -->
      <div v-show="expandedState[name]" class="rel-details">
        <div class="metrics-grid">
          <!-- 情感维度 (-100 ~ 100) -->
          <div class="metric-group">
            <h4 class="group-title">情感认知</h4>
            <div class="metric-item" v-for="key in bipolarKeys" :key="key">
              <div class="metric-label">
                <span>{{ key }}</span>
                <span class="metric-val">{{ rel[key] ?? 0 }}</span>
              </div>
              <div class="bar-container bipolar">
                <div class="bar-bg"></div>
                <!-- 动态计算宽度和位置 -->
                <div
                  class="bar-fill"
                  :class="getBipolarColorClass(key, rel[key])"
                  :style="getBipolarStyle(rel[key])"
                ></div>
                <div class="center-line"></div>
              </div>
              <div class="metric-desc">{{ getStatusLabel(key, rel[key]) }}</div>
            </div>
          </div>

          <!-- 客观维度 (0 ~ 100) -->
          <div class="metric-group">
            <h4 class="group-title">客观羁绊</h4>
            <div class="metric-item" v-for="key in unipolarKeys" :key="key">
              <div class="metric-label">
                <span>{{ key }}</span>
                <span class="metric-val">{{ rel[key] ?? 0 }}</span>
              </div>
              <div class="bar-container unipolar">
                <div class="bar-bg"></div>
                <div
                  class="bar-fill gold-fill"
                  :style="{ width: (rel[key] ?? 0) + '%' }"
                ></div>
              </div>
              <div class="metric-desc">{{ getStatusLabel(key, rel[key]) }}</div>
            </div>
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

// 假设 substitudeMacros 是全局注入的方法，如果没有则提供回退
// 在实际项目中，你可能需要 import { substitudeMacros } from '@/utils';
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

// 定义两类维度的键名
const bipolarKeys = ['信任度', '好感度', '浪漫度', '情欲', '依赖度'];
const unipolarKeys = ['熟悉度', '洞察度', '影响力', '责任义务', '利用价值'];

// 计算双极进度条样式 (-100 到 100)
const getBipolarStyle = (val = 0) => {
  const value = Math.max(-100, Math.min(100, val));
  // 0 在中间 (50%)
  // 如果是正数，left: 50%, width: val/2 %
  // 如果是负数，left: 50% - |val|/2 %, width: |val|/2 %
  if (value >= 0) {
    return { left: '50%', width: `${value / 2}%` };
  } else {
    return { left: `${50 - (Math.abs(value) / 2)}%`, width: `${Math.abs(value) / 2}%` };
  }
};

const getBipolarColorClass = (key, val = 0) => {
  if (val >= 0) return 'positive';
  return 'negative';
};

// 核心逻辑：根据描述文件映射文本标签
const getStatusLabel = (key, val = 0) => {
  const v = Number(val);

  switch (key) {
    case '信任度':
      if (v >= 81) return '无条件信任';
      if (v >= 41) return '高度信任';
      if (v >= 10) return '基础信任';
      if (v >= -9) return '中立/不确定';
      if (v >= -39) return '普遍不信';
      if (v >= -79) return '深度怀疑';
      return '背叛与敌意';

    case '好感度':
      if (v >= 81) return '深爱/奉献';
      if (v >= 41) return '喜爱/珍视';
      if (v >= 10) return '友善';
      if (v >= -9) return '漠不关心';
      if (v >= -39) return '不喜欢';
      if (v >= -79) return '厌恶';
      return '憎恨';

    case '浪漫度':
      if (v >= 81) return '灵魂伴侣';
      if (v >= 41) return '明确爱意';
      if (v >= 10) return '萌芽倾心';
      if (v >= -9) return '浪漫模糊';
      if (v >= -39) return '浪漫无感';
      if (v >= -79) return '浪漫排斥';
      return '毁灭性执念';

    case '情欲':
      if (v >= 81) return '痴迷';
      if (v >= 41) return '强烈渴求';
      if (v >= 10) return '生理吸引';
      if (v >= -9) return '无';
      if (v >= -49) return '无吸引力';
      return '生理排斥';

    case '依赖度':
      if (v >= 81) return '绝对依赖';
      if (v >= 41) return '功能性依赖';
      if (v >= 10) return '情感依赖';
      if (v >= -9) return '对等';
      if (v >= -49) return '独立';
      return '反向依赖';

    case '熟悉度':
      if (v >= 81) return '知己';
      if (v >= 61) return '密友';
      if (v >= 41) return '同伴';
      if (v >= 21) return '相识者';
      return '陌生人';

    case '洞察度':
      if (v >= 81) return '本质洞悉';
      if (v >= 61) return '深层理解';
      if (v >= 41) return '动机推断';
      if (v >= 21) return '情绪察觉';
      return '表层认知';

    case '影响力':
      if (v >= 81) return '意志灯塔';
      if (v >= 61) return '主导决策';
      if (v >= 41) return '重要影响者';
      if (v >= 21) return '参考因素';
      return '微乎其微';

    case '责任义务':
      if (v >= 81) return '终极责任';
      if (v >= 61) return '个人责任';
      if (v >= 41) return '角色责任';
      if (v >= 21) return '社会责任';
      return '无责任';

    case '利用价值':
      if (v >= 81) return '不可或缺';
      if (v >= 61) return '重要资产';
      if (v >= 41) return '有价值的工具';
      if (v >= 21) return '潜在价值';
      return '无用/累赘';

    default:
      return '';
  }
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

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 600px) {
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.group-title {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  color: var(--c-text-dim, #a0a0a0);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
}

.metric-item {
  margin-bottom: 12px;
}

.metric-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #ddd;
  margin-bottom: 4px;
}

.metric-val {
  font-family: monospace;
  color: var(--c-gold, #d4af37);
}

.metric-desc {
  font-size: 0.75rem;
  color: #888;
  text-align: right;
  margin-top: 2px;
  height: 14px; /* 防止文字跳动 */
}

/* --- 进度条通用 --- */
.bar-container {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  position: absolute;
  top: 0;
  transition: width 0.5s ease, left 0.5s ease;
}

/* 双极进度条样式 */
.center-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.3);
  z-index: 2;
}

.bar-fill.positive {
  background: linear-gradient(90deg, #d4af37, #f0e68c); /* 金色/绿色系 */
}

.bar-fill.negative {
  background: linear-gradient(90deg, #8b0000, #cd5c5c); /* 红色系 */
}

/* 单极进度条样式 */
.gold-fill {
  background: var(--c-gold, #d4af37);
  left: 0;
}
</style>
