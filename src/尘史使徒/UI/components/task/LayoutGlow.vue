<template>
  <div class="layout-glow">
    <!-- 如果有课题 (Questions) -->
    <div v-if="data.课题" class="questions-grid">
      <div
        v-for="(qData, qKey) in data.课题"
        :key="qKey"
        class="question-card"
        :style="getPrincipleStyle(qKey)"
      >
        <div class="q-header">
          <!-- 动态 SVG 图标 -->
          <div class="q-icon-wrapper" v-html="getIcon(qKey)"></div>
          <span class="q-title">{{ qKey }}</span>
        </div>

        <p class="q-desc">{{ qData.描述 }}</p>

        <div class="q-answer-box">
          <span class="q-label">ANSWER:</span>
          <span class="q-text">{{ qData.我的回答 }}</span>
        </div>
      </div>
    </div>

    <!-- 如果没有课题 (仅展示装饰线，不展示详细列表) -->
    <div v-else class="glow-divider">
      <span class="glow-symbol">❖ 辉光照彻 ❖</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: Object
});

// 准则配置表
const PRINCIPLES = {
  lantern: { color: '#FCD34D', label: '灯', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9H9.5L12 2M12 22L9.5 15H14.5L12 22M2 12L9 14.5V9.5L2 12M22 12L15 14.5V9.5L22 12M12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7Z"/></svg>' }, // 黄色
  forge:   { color: '#EF4444', label: '铸', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.92 6.4 7.9 9.07 9.06 12.16C9.15 12.38 9.1 12.61 8.94 12.82C8.78 13.03 8.5 13.13 8.28 13.08C7.05 12.83 6.13 12.03 5.5 10.95C5.06 13.8 5.94 16.5 7.95 18.5C9.7 20.24 12.05 21.1 14.5 20.96C17.16 20.81 19.58 19.29 20.88 16.95C21.64 15.6 21.8 14.1 21.3 12.65C20.8 11.2 19.5 10.2 18.1 9.6C18.1 10.2 17.9 10.7 17.66 11.2Z"/></svg>' }, // 红色
  edge:    { color: '#52525b', label: '刃', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>' }, // 黑色 (用深灰+亮边框表现)
  winter:  { color: '#E0F7FA', label: '冬', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2L14,7L19,6L16,10L21,12L16,14L19,18L14,17L12,22L10,17L5,18L8,14L3,12L8,10L5,6L10,7L12,2Z"/></svg>' }, // 补充：白色/冰蓝
  heart:   { color: '#F472B6', label: '心', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/></svg>' }, // 粉红色
  grail:   { color: '#991B1B', label: '杯', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3,5H21V7C21,12.5 16.5,17 11,17C5.5,17 1,12.5 1,7V5H3M5,7V5H19V7C19,11.4 15.4,15 11,15C6.6,15 3,11.4 3,7Z"/></svg>' }, // 补充：深红/血色
  moth:    { color: '#A1A1AA', label: '蛾', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C12,2 8,5 8,9C8,13 11,15 12,18C13,15 16,13 16,9C16,5 12,2 12,2M12,22C11,22 9,20 9,18C9,18 11,19 12,19C13,19 15,18 15,18C15,20 13,22 12,22Z"/></svg>' }, // 灰色
  knock:   { color: '#A855F7', label: '启', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,10C10.9,10 10,10.9 10,12C10,13.1 10.9,14 12,14C13.1,14 14,13.1 14,12C14,10.9 13.1,10 12,10M19,12C19,15.86 15.86,19 12,19C8.14,19 5,15.86 5,12C5,8.14 8.14,5 12,5C15.86,5 19,8.14 19,12M21,12C21,7.03 16.97,3 12,3C7.03,3 3,7.03 3,12C3,16.97 7.03,21 12,21C16.97,21 21,16.97 21,12Z"/></svg>' }  // 紫色
};

// 辅助函数：根据标题关键词匹配准则
const matchPrinciple = (text) => {
  if (text.includes('灯')) return PRINCIPLES.lantern;
  if (text.includes('铸')) return PRINCIPLES.forge;
  if (text.includes('刃')) return PRINCIPLES.edge;
  if (text.includes('冬')) return PRINCIPLES.winter;
  if (text.includes('心')) return PRINCIPLES.heart;
  if (text.includes('杯')) return PRINCIPLES.grail;
  if (text.includes('蛾')) return PRINCIPLES.moth;
  if (text.includes('启')) return PRINCIPLES.knock;
  return PRINCIPLES.lantern; // 默认
};

// 获取样式变量
const getPrincipleStyle = (key) => {
  const p = matchPrinciple(key);
  return {
    '--p-color': p.color,
    // 针对“刃”(黑色)，我们需要特殊的边框色让它显眼，其他颜色则直接使用自身
    '--p-border': p.label === '刃' ? '#71717a' : p.color,
    '--p-glow': p.label === '刃' ? 'rgba(255,255,255,0.1)' : `${p.color}33` // 33 is approx 20% opacity hex
  };
};

// 获取 SVG 图标
const getIcon = (key) => {
  return matchPrinciple(key).icon;
};
</script>

<style scoped>
.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.question-card {
  /* 使用 CSS 变量动态着色 */
  background: linear-gradient(145deg, rgba(20,20,20,0.6), rgba(0,0,0,0.8));
  border: 1px solid var(--p-border);
  padding: 15px;
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 悬停效果：增强光晕 */
.question-card:hover {
  box-shadow: 0 0 15px var(--p-glow);
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.03);
}

.q-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.q-icon-wrapper {
  width: 24px;
  height: 24px;
  color: var(--p-color);
  /* 刃属性特殊处理：如果是黑色，给一个白色滤镜或者描边效果，这里直接用颜色变量控制 */
  filter: drop-shadow(0 0 2px var(--p-glow));
}

.q-title {
  color: var(--p-color);
  font-family: serif;
  font-weight: bold;
  font-size: 1.1rem;
  letter-spacing: 1px;
}

.q-desc {
  font-size: 0.9rem;
  color: #a1a1aa;
  margin-bottom: 15px;
  line-height: 1.4;
  min-height: 3em; /* 保持卡片高度相对一致 */
}

.q-answer-box {
  background: rgba(0, 0, 0, 0.4);
  padding: 10px;
  border-left: 3px solid var(--p-color);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.q-label {
  font-size: 0.65rem;
  color: #71717a;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.q-text {
  font-size: 0.95rem;
  color: #e4e4e7;
  font-style: italic;
  font-family: serif;
}

/* 装饰线 */
.glow-divider {
  text-align: center;
  margin-top: 20px;
  opacity: 0.6;
  border-top: 1px solid rgba(252, 211, 77, 0.2);
  padding-top: 10px;
}
.glow-symbol {
  color: #fcd34d;
  font-size: 0.8rem;
  letter-spacing: 4px;
  text-shadow: 0 0 5px #fcd34d;
}
</style>
