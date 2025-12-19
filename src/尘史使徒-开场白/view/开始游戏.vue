<template>
  <div class="start-game-container">
    <!--
      特效1: 脉冲光晕背景
      一个持续的、微弱的脉冲光晕，吸引玩家的注意力。
    -->
    <div class="pulse-glow"></div>

    <button class="start-button animate-enter" @click="handleStartGame">
      <span class="button-text">踏入此界</span>
      <span class="button-subtext animate-fade-in">历史的帷幕将由此揭开</span>

      <!-- 特效2: 悬停时的能量流动效果 -->
      <div class="flow-effect"></div>
    </button>
  </div>
</template>

<script setup>
// 处理点击事件的方法
const handleStartGame = async () => {
  await setChatMessages([{ message_id: 0, swipe_id: Number(1) }], { refresh: 'all' });
};
</script>

<style scoped>
/* 引入通用样式 */
.start-game-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden; /* 确保特效不会溢出容器 */
}

/* --- 特效1: 脉冲光晕 --- */
.pulse-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--accent-primary) 0%, transparent 70%);
  opacity: 0.15;
  animation: pulse 5s infinite ease-in-out;
  border-radius: 50%;
}
@keyframes pulse {
  0%, 100% {
    transform: scale(0.9);
    opacity: 0.15;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.25;
  }
}

/* --- 开始按钮主体样式 --- */
.start-button {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 4rem;
  background-color: rgba(12, 12, 15, 0.6);
  border: 2px solid var(--border-color);
  color: var(--accent-primary);
  font-family: 'Cinzel', serif;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  overflow: hidden; /* 隐藏流光特效的溢出部分 */
  backdrop-filter: blur(5px);
}

.button-text {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 3px;
  transition: color 0.4s;
}

.button-subtext {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  letter-spacing: 1px;
  opacity: 0; /* 默认隐藏 */
  animation: fadeIn 1s ease-out 1.2s forwards; /* 延迟淡入 */
}

/* --- 入场动画 --- */
.animate-enter {
  opacity: 0;
  transform: scale(0.95);
  animation: enter-animation 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) 0.2s forwards;
}
@keyframes enter-animation {
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fade-in {
  animation: fadeIn 1s ease-out forwards;
}
@keyframes fadeIn {
  to { opacity: 1; }
}

/* --- 悬停效果 --- */
.start-button:hover {
  border-color: var(--accent-primary);
  color: var(--text-primary);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px;
}

.start-button:hover .button-text {
  color: #fff;
}

/* --- 特效2: 悬停时的能量流动效果 --- */
.flow-effect {
  position: absolute;
  top: 0;
  left: -150%; /* 从左侧外部开始 */
  width: 50%;
  height: 100%;
  background: linear-gradient(to right, transparent 0%, var(--accent-primary) 50%, transparent 100%);
  opacity: 0.3;
  transform: skewX(-25deg); /* 倾斜以产生速度感 */
  transition: left 0.8s;
}

.start-button:hover .flow-effect {
  left: 150%; /* 鼠标悬停时，移动到右侧外部 */
}
</style>
