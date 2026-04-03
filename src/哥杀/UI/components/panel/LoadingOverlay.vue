<template>
  <transition name="fade-overlay">
    <div class="loading-overlay">
      <div class="quill-loader">
        <svg class="writing-svg" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
          <!-- 墨迹路径 -->
          <path
            class="ink-trail"
            d="M 10,40 C 30,15 45,55 70,35 C 90,20 100,45 115,25"
          />
          <!-- 羽毛笔 -->
          <g class="quill">
            <path class="feather" d="M 0,0 C 8,-12 15,-25 30,-35 C 42,-43 50,-42 50,-42 C 50,-42 40,-32 28,-20 C 18,-10 8,-2 0,0 Z" />
            <path class="feather-details" d="M 15,-18 L 25,-22 M 22,-28 L 32,-32" />
            <path class="nib" d="M 0,0 L 6,-6" />
          </g>
        </svg>
      </div>
      <div class="loading-text">SYNCHRONIZING...</div>
    </div>
  </transition>
</template>

<script setup lang="ts">
// No script logic needed for this component
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  inset: 0;
  background: var(--scroll-paper, #fffcf5);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  /* 确保融化放大时不会出现滚动条 */
  overflow: hidden;
}

.quill-loader {
  position: relative;
  width: 120px;
  height: 60px;
}

.writing-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ink-trail {
  fill: none;
  stroke: var(--accent-gold, #c6a664);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 150;
  stroke-dashoffset: 150;
  animation: drawInk 2.5s ease-in-out infinite;
}

.quill {
  offset-path: path("M 10,40 C 30,15 45,55 70,35 C 90,20 100,45 115,25");
  offset-rotate: 0deg;
  animation: moveQuill 2.5s ease-in-out infinite;
}

.feather {
  fill: var(--accent-gold, #c6a664);
}

.feather-details, .nib {
  fill: none;
  stroke: var(--scroll-paper, #fffcf5);
  stroke-width: 1.5;
  stroke-linecap: round;
}

.loading-text {
  font-family: 'Cinzel', serif;
  color: var(--text-main, #4a3f35);
  letter-spacing: 3px;
  font-size: 0.9rem;
  animation: breathe 2.5s ease-in-out infinite;
}

/* =========================================
   页面切换过渡：交叉融化与延迟 (Cross-melt)
   ========================================= */

/* 进入时：正常淡入 */
.fade-overlay-enter-active {
  transition: opacity 0.6s ease, filter 0.6s ease;
}

/* 离开时：增加 0.3s 延迟，并延长动画时间至 0.8s，让底层内容有时间准备 */
.fade-overlay-leave-active {
  transition: opacity 0.8s ease 0.3s,
  filter 0.8s ease 0.3s,
  transform 0.8s ease 0.3s;
}

/* 初始状态 */
.fade-overlay-enter-from {
  opacity: 0;
  filter: blur(5px);
}

/* 离开状态：透明度降为0，同时增加高斯模糊和轻微放大，形成“融化消散”的视觉 */
.fade-overlay-leave-to {
  opacity: 0;
  filter: blur(12px);
  transform: scale(1.05);
}

/* --- 关键帧动画 --- */
@keyframes drawInk {
  0% { stroke-dashoffset: 150; opacity: 1; }
  60%, 80% { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}

@keyframes moveQuill {
  0% { offset-distance: 0%; opacity: 1; transform: rotate(0deg); }
  30% { transform: rotate(-8deg); }
  60%, 80% { offset-distance: 100%; opacity: 1; transform: rotate(0deg); }
  100% { offset-distance: 100%; opacity: 0; }
}

@keyframes breathe {
  0%, 100% { opacity: 0.4; }
  60% { opacity: 1; }
}
</style>
