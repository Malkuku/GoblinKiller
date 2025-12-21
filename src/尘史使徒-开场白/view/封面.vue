<template>
  <!--
    整个容器是可点击的。点击后，会触发 'proceed' 事件，
    通知父组件（App.vue）切换到下一个视图（介绍序列）。
  -->
  <div class="title-screen-container"  @click="proceed">
    <div class="content-wrapper">
      <h1 class="main-title">
        <span class="title-text">于第九重历史？</span>
      </h1>

      <p class="prompt-text">点击任意处继续</p>
    </div>
  </div>
</template>

<script setup>
// 1. 定义组件可以发出的事件
const emit = defineEmits(['proceed']);

// 2. 点击时，发出 'proceed' 事件
const proceed = () => {
  emit('proceed');
};
</script>

<style scoped lang="scss">

.title-screen-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  min-height: 500px;
  background-color: var(--bg-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  z-index: 100; /* 确保它在最上层 */
}

/* --- 特效1: 粒子/星空背景 --- */
.particle-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  /* 使用 CSS Gradient 模拟星空，无需图片 */
  background-image: radial-gradient(var(--border-color) 0.5px, transparent 0.5px);
  background-size: 25px 25px;
  opacity: 0.1;
  animation: move-stars 150s linear infinite;
}
/* 第二层粒子，移动速度和大小不同，制造视差效果 */
.particle-background.layer2 {
  background-size: 40px 40px;
  opacity: 0.05;
  animation: move-stars 250s linear infinite reverse;
}

@keyframes move-stars {
  from { transform: translate(0, 0); }
  to { transform: translate(-50%, -50%); }
}

.content-wrapper {
  text-align: center;
  z-index: 1;
}

/* --- 特效2: 标题显现动画 --- */
.main-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(2.5rem, 6vw, 5rem); /* 响应式字体大小 */
  font-weight: 400;
  color: var(--text-primary);
  letter-spacing: 0.2em;
  text-shadow: 0 0 15px var(--accent-primary-faded);
  margin-bottom: 200px;
  
  /* 流光特效相关样式 */
  position: relative;
  display: inline-block;
  
  /* 动画设置 */
  opacity: 0;
  filter: blur(8px);
  animation: 
    materialize 3s cubic-bezier(0.19, 1, 0.22, 1) 0.5s forwards;
}

.title-text {
  position: relative;
  background: linear-gradient(
    90deg,
    var(--accent-primary),
    var(--text-primary),
    var(--accent-primary)
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 3s ease-in-out 2s infinite;
}

@keyframes shine {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes materialize {
  from {
    opacity: 0;
    filter: blur(8px);
    transform: scale(1.05);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

/* --- 特效3: 提示文字脉冲动画 --- */
.prompt-text {
  margin-top: 2rem;
  font-family: var(--font-body);
  color: var(--text-secondary);
  letter-spacing: 2px;

  /* 动画设置 */
  opacity: 0;
  /* 延迟出现，并在出现后开始脉冲 */
  animation:
    fadeIn 2s ease-out 3s forwards,
    pulse-text 4s ease-in-out 4s infinite;

  margin-bottom: 80px;
}

@keyframes fadeIn {
  to { opacity: 0.7; }
}

@keyframes pulse-text {
  0%, 100% {
    opacity: 0.7;
    text-shadow: 0 0 5px transparent;
  }
  50% {
    opacity: 1;
    text-shadow: 0 0 5px var(--accent-primary-faded);
  }
}
</style>