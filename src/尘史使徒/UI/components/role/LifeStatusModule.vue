<template>
  <div class="stat-grid">
    <!-- 生命 (HP) -->
    <div class="stat-item">
      <span class="label">生命</span>
      <div class="bar-container">
        <div class="bar-fill hp-flow" :style="{width: (data?.生命力 || 0) + '%'}"></div>
        <span class="bar-text">{{ data?.生命力 || 0 }}%</span>
      </div>
    </div>

    <!-- 体力 (SP) -->
    <div class="stat-item">
      <span class="label">体力</span>
      <div class="bar-container">
        <div class="bar-fill sp-flow" :style="{width: (data?.体力 || 0) + '%'}"></div>
        <span class="bar-text">{{ data?.体力 || 0 }}%</span>
      </div>
    </div>

    <!-- 精神 (MP) -->
    <div class="stat-item">
      <span class="label">精神</span>
      <div class="bar-container">
        <div class="bar-fill mp-flow" :style="{width: (data?.精神力 || 0) + '%'}"></div>
        <span class="bar-text">{{ data?.精神力 || 0 }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    default: () => ({
      生命力: 0,
      体力: 0,
      精神力: 0
    })
  }
});
</script>

<style scoped>
/* 依赖父级提供的变量: --font-title, --c-text-dim */

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
</style>
