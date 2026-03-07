<template>
  <header class="library-header">
    <div class="header-content">
      <h2 class="title">
        <span class="title-icon">◩</span> 漫宿书库
      </h2>

      <!-- 异质展示区：星云魔导器 -->
      <div v-if="currentMode !== '对话'" class="asset-display tooltip-container">
        <div class="nebula-wrapper">
          <svg class="nebula-icon" viewBox="0 0 24 24">
            <defs>
              <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#d946ef" stop-opacity="1" />
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="swirl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#d4af37" />
                <stop offset="50%" stop-color="#ec4899" />
                <stop offset="100%" stop-color="#06b6d4" />
              </linearGradient>
            </defs>
            <circle class="nebula-core" cx="12" cy="12" r="6" fill="url(#core-glow)" />
            <path class="nebula-swirl" d="M12 3C16.97 3 21 7.03 21 12C21 13.5 20.5 14.8 19.8 16C18.5 13 15.5 11 12 11C8.5 11 5.5 13 4.2 16C3.5 14.8 3 13.5 3 12C3 7.03 7.03 3 12 3Z" fill="url(#swirl-grad)" opacity="0.7" />
            <path class="nebula-swirl-reverse" d="M12 21C7.03 21 3 16.97 3 12C3 10.5 3.5 9.2 4.2 8C5.5 11 8.5 13 12 13C15.5 13 18.5 11 19.8 8C20.5 9.2 21 10.5 21 12C21 16.97 16.97 21 12 21Z" fill="url(#swirl-grad)" opacity="0.5" />
          </svg>
        </div>
        <span class="asset-value">{{ userHeterogeneity }}</span>

        <div class="tooltip-content">
          <div class="tooltip-title">缥缈异质</div>
          禁忌力量、古老知识、遗落传承......它们被混乱无序地糅合在一起，成为了一团黏稠的星云。
        </div>
      </div>

      <!-- 导航栏 -->
      <div class="nav-tabs">
        <div
          v-for="mode in modes"
          :key="mode"
          :class="['nav-item', { active: currentMode === mode }]"
          @click="$emit('switchMode', mode)"
        >
          {{ mode }}
          <span v-if="redDots[mode]" class="notification-dot"></span>
        </div>
        <div class="nav-indicator" :style="indicatorStyle"></div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentMode: String,
  modes: Array,
  redDots: Object,
  userHeterogeneity: Number
});

defineEmits(['switchMode']);

const indicatorStyle = computed(() => {
  const index = props.modes.indexOf(props.currentMode);
  return {
    transform: `translateX(${index * 100}%)`,
    width: `${100 / props.modes.length}%`
  };
});
</script>

<style scoped>
.library-header {
  background: #0a0a0a;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  padding: 15px 20px 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.8);
  z-index: 20;
}
.header-content { max-width: 1000px; margin: 0 auto; position: relative; display: flex; flex-direction: column; gap: 15px; }

.title {
  color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 1.4rem; margin: 0;
  display: flex; align-items: center; gap: 10px; letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
}
.title-icon { font-size: 1.2rem; }

/* 异质展示 */
.asset-display {
  position: absolute; top: 0; right: 0;
  background: rgba(20, 20, 20, 0.8); border: 1px solid #333;
  padding: 4px 12px 4px 6px; border-radius: 20px;
  display: flex; align-items: center; gap: 8px;
  cursor: help; transition: border-color 0.3s;
}
.asset-display:hover { border-color: var(--c-gold-dim); }

.nebula-icon { width: 24px; height: 24px; filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.4)); }
.nebula-core { transform-origin: center; animation: pulse-core 3s ease-in-out infinite; }
.nebula-swirl { transform-origin: center; animation: spin-slow 12s linear infinite; }
.nebula-swirl-reverse { transform-origin: center; animation: spin-slow 15s linear infinite reverse; }
@keyframes pulse-core { 0%, 100% { transform: scale(0.9); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; } }
@keyframes spin-slow { 100% { transform: rotate(360deg); } }

.asset-value { color: var(--c-gold-light); font-family: 'Cinzel', serif; font-weight: bold; font-size: 1.1rem; }

/* Tooltip */
.tooltip-content {
  position: absolute; top: 140%; right: 0; width: 220px;
  background: #111; border: 1px solid var(--c-gold-dim);
  padding: 12px; border-radius: 4px; color: #aaa; font-size: 0.8rem;
  opacity: 0; visibility: hidden; transform: translateY(-10px);
  transition: all 0.3s; pointer-events: none; z-index: 100;
  box-shadow: 0 10px 30px rgba(0,0,0,0.8);
}
.tooltip-title { color: var(--c-gold); font-family: 'Cinzel', serif; margin-bottom: 5px; border-bottom: 1px solid #333; padding-bottom: 3px; }
.asset-display:hover .tooltip-content { opacity: 1; visibility: visible; transform: translateY(0); }

/* 导航 */
.nav-tabs { display: flex; position: relative; border-bottom: 1px solid rgba(255,255,255,0.05); }
.nav-item {
  flex: 1; text-align: center; padding: 12px 0; cursor: pointer;
  color: #666; font-family: 'Cinzel', serif; font-size: 0.9rem;
  transition: all 0.3s; position: relative;
}
.nav-item:hover { color: #aaa; }
.nav-item.active { color: var(--c-gold); text-shadow: 0 0 8px rgba(212, 175, 55, 0.3); }
.nav-indicator {
  position: absolute; bottom: -1px; left: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--c-gold), transparent);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.notification-dot {
  position: absolute; top: 10px; right: 20%; width: 4px; height: 4px;
  background: #e57373; border-radius: 50%; box-shadow: 0 0 5px #e57373;
}
</style>
