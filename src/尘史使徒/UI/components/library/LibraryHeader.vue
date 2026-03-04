<template>
  <header class="library-header">
    <div class="header-content">
      <h2 class="title">
        <span class="icon">◩</span> 漫宿书库
      </h2>

      <!-- 优化后的异质显示区域 -->
      <div v-if="currentMode !== '对话'" class="asset-display tooltip-container">
        <!-- 动态星云 SVG 图标 -->
        <svg class="nebula-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- 核心发光渐变 -->
            <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#d946ef" stop-opacity="1" /> <!-- 神秘紫红 -->
              <stop offset="60%" stop-color="#8b5cf6" stop-opacity="0.8" /> <!-- 深邃紫 -->
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
            </radialGradient>
            <!-- 黏稠星云外环渐变 -->
            <linearGradient id="swirl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--c-gold, #d4af37)" />
              <stop offset="50%" stop-color="#ec4899" />
              <stop offset="100%" stop-color="#06b6d4" />
            </linearGradient>
          </defs>

          <!-- 核心星体 (带呼吸动画) -->
          <circle class="nebula-core" cx="12" cy="12" r="6" fill="url(#core-glow)" />

          <!-- 混沌星云轨迹 1 (顺时针慢转) -->
          <path class="nebula-swirl" d="M12 3C16.97 3 21 7.03 21 12C21 13.5 20.5 14.8 19.8 16C18.5 13 15.5 11 12 11C8.5 11 5.5 13 4.2 16C3.5 14.8 3 13.5 3 12C3 7.03 7.03 3 12 3Z" fill="url(#swirl-grad)" opacity="0.7" />

          <!-- 混沌星云轨迹 2 (逆时针慢转) -->
          <path class="nebula-swirl-reverse" d="M12 21C7.03 21 3 16.97 3 12C3 10.5 3.5 9.2 4.2 8C5.5 11 8.5 13 12 13C15.5 13 18.5 11 19.8 8C20.5 9.2 21 10.5 21 12C21 16.97 16.97 21 12 21Z" fill="url(#swirl-grad)" opacity="0.5" />

          <!-- 散落的星尘 -->
          <circle cx="7" cy="7" r="1" fill="#fff" opacity="0.8" />
          <circle cx="17" cy="16" r="0.8" fill="var(--c-gold, #d4af37)" opacity="0.9" />
          <circle cx="18" cy="8" r="1.2" fill="#fff" opacity="0.6" />
        </svg>

        <span class="asset-value">{{ userHeterogeneity }}</span>

        <!-- 自定义悬浮提示框 -->
        <div class="tooltip-content">
          禁忌力量、古老知识、遗落传承......它们被混乱无序地糅合在一起，成为了一团黏稠的星云
        </div>
      </div>

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
/* --- 原有样式 --- */
.library-header {
  background: linear-gradient(180deg, #111 0%, #1a1a1a 100%);
  border-bottom: 1px solid var(--c-gold);
  padding: 15px 20px 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  z-index: 10;
}
.header-content { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 15px; }
.title { color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 1.5rem; margin: 0; display: flex; align-items: center; gap: 10px; text-shadow: 0 0 10px var(--c-gold-dim); }

/* --- 修改与新增的异质区域样式 --- */
.asset-display {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.6); /* 稍微加深背景以突出图标 */
  padding: 5px 12px 5px 8px; /* 左侧内边距调小，给图标留空间 */
  border-radius: 20px;
  border: 1px solid var(--c-gold-dim);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  cursor: help; /* 鼠标悬浮显示问号，提示可查看 */
}

.asset-value {
  color: var(--c-gold-light);
  font-weight: bold;
  margin-left: 6px;
  font-family: 'Cinzel', serif; /* 建议数字也用古典字体 */
  font-size: 1.1rem;
}

/* SVG 图标样式与动画 */
.nebula-icon {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.5)); /* 整体外发光 */
}

@keyframes pulse-core {
  0%, 100% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
}
@keyframes spin-slow {
  100% { transform: rotate(360deg); }
}

.nebula-core {
  transform-origin: center;
  animation: pulse-core 3s ease-in-out infinite;
}
.nebula-swirl {
  transform-origin: center;
  animation: spin-slow 12s linear infinite;
}
.nebula-swirl-reverse {
  transform-origin: center;
  animation: spin-slow 15s linear infinite reverse;
}

/* 自定义 Tooltip 样式 */
.tooltip-container {
  position: absolute;
}

.tooltip-content {
  position: absolute;
  top: 130%; /* 显示在下方 */
  right: 0;
  width: 240px;
  background: rgba(15, 15, 18, 0.95);
  border: 1px solid var(--c-gold-dim);
  padding: 12px 16px;
  border-radius: 8px;
  color: #d1d5db;
  font-size: 0.85rem;
  line-height: 1.6;
  letter-spacing: 0.5px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8), 0 0 15px rgba(212, 175, 55, 0.1) inset;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  pointer-events: none; /* 防止遮挡鼠标事件 */
  text-align: justify;
}

/* Tooltip 顶部的小三角指示器 */
.tooltip-content::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 35px; /* 对齐到图标正下方 */
  width: 10px;
  height: 10px;
  background: rgba(15, 15, 18, 0.95);
  border-left: 1px solid var(--c-gold-dim);
  border-top: 1px solid var(--c-gold-dim);
  transform: rotate(45deg);
}

/* 悬浮触发动画 */
.tooltip-container:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* --- 原有导航样式 --- */
.nav-tabs { display: flex; position: relative; border-bottom: 2px solid rgba(255,255,255,0.05); }
.nav-item { flex: 1; text-align: center; padding: 12px 0; cursor: pointer; color: #888; transition: color 0.3s; position: relative; font-weight: bold; font-size: 0.95rem; }
.nav-item:hover { color: var(--c-text); background: rgba(255,255,255,0.02); }
.nav-item.active { color: var(--c-gold); }
.nav-indicator { position: absolute; bottom: -2px; left: 0; height: 2px; background: var(--c-gold); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 -2px 10px var(--c-gold); }
.notification-dot { position: absolute; top: 8px; right: 20%; width: 6px; height: 6px; background: var(--c-danger); border-radius: 50%; box-shadow: 0 0 5px var(--c-danger); }
</style>

