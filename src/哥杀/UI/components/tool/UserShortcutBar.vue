<template>
  <div class="user-shortcut-bar">
    <!-- 生命状态三维 (横向胶囊风格) -->
    <div class="status-group">
      <div class="stat-pill hp" :title="`生命: ${lifeStatus?.['生命']?.['当前'] || 0} / ${lifeStatus?.['生命']?.['最大值'] || 0}`">
        <span class="icon">❤</span>
        <div class="bar-bg"><div class="bar-fill" :style="{ width: getPercent(lifeStatus?.['生命']) + '%' }"></div></div>
      </div>
      <div class="stat-pill sp" :title="`体力: ${lifeStatus?.['体力']?.['当前'] || 0} / ${lifeStatus?.['体力']?.['最大值'] || 0}`">
        <span class="icon">⚡</span>
        <div class="bar-bg"><div class="bar-fill" :style="{ width: getPercent(lifeStatus?.['体力']) + '%' }"></div></div>
      </div>
      <div class="stat-pill mp" :title="`精神: ${lifeStatus?.['精神']?.['当前'] || 0} / ${lifeStatus?.['精神']?.['最大值'] || 0}`">
        <span class="icon">✧</span>
        <div class="bar-bg"><div class="bar-fill" :style="{ width: getPercent(lifeStatus?.['精神']) + '%' }"></div></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  lifeStatus: any;
}>();

const emit = defineEmits(['update:strategy', 'update:customContent']);

const getPercent = (stat: any) => {
  if (!stat || !stat['最大值']) return 0;
  return Math.min(100, Math.max(0, (stat['当前'] / stat['最大值']) * 100));
};
</script>

<style scoped>
.user-shortcut-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

/* --- 状态条样式 (横向胶囊) --- */
.status-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(164, 139, 87, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  height: 32px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}
.stat-pill:hover {
  border-color: rgba(164, 139, 87, 0.6);
}

.stat-pill .icon {
  font-size: 0.8rem;
  line-height: 1;
}

.hp .icon { color: #ff4d4d; }
.sp .icon { color: #ffd700; }
.mp .icon { color: #4da6ff; }

.bar-bg {
  width: 40px; /* 紧凑的血条宽度 */
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.hp .bar-fill { background: linear-gradient(90deg, #8b0000, #ff4d4d); }
.sp .bar-fill { background: linear-gradient(90deg, #b8860b, #ffd700); }
.mp .bar-fill { background: linear-gradient(90deg, #00008b, #4da6ff); }

/* --- 策略模块 --- */
.strategy-module {
  display: flex;
  align-items: center;
  gap: 8px;
}

.strategy-selector {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(164, 139, 87, 0.3);
  padding: 0 10px;
  border-radius: 4px;
  height: 32px;
  transition: all 0.3s ease;
}
.strategy-selector:hover {
  border-color: var(--c-gold, #a48b57);
}

.strategy-selector .icon {
  font-size: 0.9rem;
}

.custom-select {
  background: transparent;
  color: var(--c-gold, #a48b57);
  border: none;
  outline: none;
  font-family: 'EB Garamond', 'Cinzel', serif;
  font-size: 0.85rem;
  cursor: pointer;
  appearance: none;
  text-align: center;
}

.custom-select option {
  background: #14161c;
  color: #a48b57;
}

/* --- 自定义输入框 --- */
.custom-input-wrapper {
  display: flex;
  align-items: center;
}

.custom-strategy-input {
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-bottom: 1px solid rgba(164, 139, 87, 0.5);
  color: #fff;
  font-family: 'EB Garamond', serif;
  font-size: 0.85rem;
  padding: 4px 8px;
  width: 150px;
  height: 32px;
  outline: none;
  transition: all 0.3s ease;
}

.custom-strategy-input:focus {
  border-bottom-color: var(--c-gold, #a48b57);
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 2px 5px rgba(164, 139, 87, 0.1);
}

.custom-strategy-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* 动画 */
.slide-fade-input-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-input-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-input-enter-from,
.slide-fade-input-leave-to {
  transform: translateX(-10px);
  opacity: 0;
  width: 0;
  padding: 0;
  overflow: hidden;
}
</style>
