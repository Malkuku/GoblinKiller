<template>
  <div class="character-stats-panel">
    <!-- ================= 1. 生命状态 (进度条) ================= -->
    <div class="stat-grid">
      <!-- 生命 (HP) -->
      <div class="stat-item">
        <span class="label">生命</span>
        <div class="bar-container">
          <div class="bar-fill hp-flow" :style="{width: getPercent(data?.生命状态?.生命) + '%'}"></div>
          <span class="bar-text">{{ data?.生命状态?.生命?.当前 || 0 }} / {{ data?.生命状态?.生命?.最大值 || 0 }}</span>
        </div>
      </div>

      <!-- 体力 (SP) -->
      <div class="stat-item">
        <span class="label">体力</span>
        <div class="bar-container">
          <div class="bar-fill sp-flow" :style="{width: getPercent(data?.生命状态?.体力) + '%'}"></div>
          <span class="bar-text">{{ data?.生命状态?.体力?.当前 || 0 }} / {{ data?.生命状态?.体力?.最大值 || 0 }}</span>
        </div>
      </div>

      <!-- 精神 (MP) -->
      <div class="stat-item">
        <span class="label">精神</span>
        <div class="bar-container">
          <div class="bar-fill mp-flow" :style="{width: getPercent(data?.生命状态?.精神) + '%'}"></div>
          <span class="bar-text">{{ data?.生命状态?.精神?.当前 || 0 }} / {{ data?.生命状态?.精神?.最大值 || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- 分割线 -->
    <div class="divider"></div>

    <!-- ================= 2. 基础数值 (网格) ================= -->
    <div class="base-stats-grid">
      <div class="base-stat-box">
        <span class="stat-label">力量</span>
        <span class="stat-value">{{ data?.基础数值?.力量 || 0 }}</span>
      </div>
      <div class="base-stat-box">
        <span class="stat-label">敏捷</span>
        <span class="stat-value">{{ data?.基础数值?.敏捷 || 0 }}</span>
      </div>
      <div class="base-stat-box">
        <span class="stat-label">智慧</span>
        <span class="stat-value">{{ data?.基础数值?.智慧 || 0 }}</span>
      </div>
      <div class="base-stat-box">
        <span class="stat-label">魅力</span>
        <span class="stat-value">{{ data?.基础数值?.魅力 || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    // 默认值结构对齐角色接口中的 "生命状态" 和 "基础数值"
    default: () => ({
      生命状态: {
        生命: { 当前: 0, 最大值: 100 },
        体力: { 当前: 0, 最大值: 100 },
        精神: { 当前: 0, 最大值: 100 }
      },
      基础数值: {
        力量: 0,
        敏捷: 0,
        智慧: 0,
        魅力: 0
      }
    })
  }
});

/**
 * 计算属性百分比
 * @param {Object} stat - 包含 {当前, 最大值} 的对象
 * @returns {number} 0-100 之间的数值
 */
const getPercent = (stat) => {
  if (!stat || !stat.最大值 || stat.最大值 === 0) return 0;
  const percent = (stat.当前 / stat.最大值) * 100;
  return Math.min(100, Math.max(0, percent));
};
</script>

<style scoped>
/* 依赖父级提供的变量: --font-title, --c-text-dim */

.character-stats-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* --- 进度条区域样式 --- */
.stat-grid { display: flex; flex-direction: column; gap: 15px; }
.stat-item { display: flex; align-items: center; gap: 15px; }
.stat-item .label { width: 40px; font-family: var(--font-title, serif); color: var(--c-text-dim, #a0a0a0); font-weight: bold; }

.bar-container {
  flex: 1; height: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  position: relative;
  overflow: visible;
}

.bar-text {
  position: absolute; width: 100%; text-align: right; right: 5px; top: -18px;
  font-size: 0.75rem; color: var(--c-text-dim, #a0a0a0);
  font-family: monospace; letter-spacing: 0.5px;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  position: relative;
  transition: width 0.3s ease-out;
}

/* --- 末端流水特效 (平面版) --- */
.bar-fill::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  right: 0;
  width: 15px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6) 80%, rgba(255,255,255,0.9) 100%);
  box-shadow: 2px 0 5px currentColor;
  border-radius: 0 2px 2px 0;
  animation: water-tip-flicker 2s infinite;
}

.bar-fill::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-image: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: flat-flow 3s infinite linear;
  z-index: 1;
}

@keyframes water-tip-flicker {
  0%, 100% { opacity: 0.8; width: 15px; }
  50% { opacity: 1; width: 20px; }
}

@keyframes flat-flow {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

/* --- 纯平配色 --- */
.hp-flow { background-color: #e74c3c; color: #ffadad; }
.sp-flow { background-color: #f1c40f; color: #fff5cc; }
.mp-flow { background-color: #3498db; color: #b3e0ff; }

/* --- 分割线 --- */
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 50%, transparent);
  margin: 5px 0;
}

/* --- 基础数值区域样式 --- */
.base-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.base-stat-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.2s;
}

.base-stat-box:hover {
  background: rgba(255, 255, 255, 0.08);
}

.base-stat-box .stat-label {
  color: var(--c-text-dim, #a0a0a0);
  font-family: var(--font-title, serif);
  font-size: 0.9rem;
}

.base-stat-box .stat-value {
  color: #e0e0e0;
  font-weight: bold;
  font-family: monospace;
  font-size: 1.1rem;
}
</style>
