<template>
  <div class="app-container">

    <!-- 思考链卡片 -->
    <div class="thought-card" :class="{ active: isOpen }">

      <!-- 卡片头部：点击切换 -->
      <div class="card-header" @click="toggleCard">
        <span class="header-title">思考过程</span>
        <span class="arrow-icon" :class="{ rotated: isOpen }">▼</span>
      </div>

      <!-- 卡片内容：折叠区域 -->
      <transition name="slide-fade">
        <div class="card-content" v-show="isOpen">
          <div class="text-wrapper">
            <div class="thought-text">{{ rawContent }}</div>
          </div>
        </div>
      </transition>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';

// ============================================================
// 1. 数据配置区
// ============================================================
const rawContent = `` + `$1`;

// ============================================================
// 2. 交互逻辑
// ============================================================

// 默认收起 (false)
const isOpen = ref(false);

const toggleCard = () => {
  isOpen.value = !isOpen.value;
};
</script>

<style>
:root {
  /* 移除了 --c-bg-main，因为 body 背景变透明了 */
  --c-bg-card: rgba(20, 24, 32, 0.95);
  --c-gold: #a48b57;
  --c-gold-dim: rgba(164, 139, 87, 0.3);
  --c-text-main: #e0e0e0;
  --c-text-dim: #8a92a0;

  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;
}

/* ★★★ 核心修改区域 ★★★ */
body {
  margin: 0;
  padding: 20px; /* 增加一点内边距，防止贴边 */
  background-color: transparent; /* 【关键】背景透明，不再遮挡 */
  color: var(--c-text-main);
  font-family: var(--font-body);
  /* 移除了 min-height: 100vh 和 flex 居中，改用 margin 居中 */
}

.app-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto; /* 【关键】让卡片在页面水平居中 */
  box-sizing: border-box;
}
/* ★★★ 修改结束 ★★★ */

/* ========================================== */
/* 卡片样式 */
/* ========================================== */
.thought-card {
  background-color: var(--c-bg-card);
  border: 1px solid var(--c-gold-dim);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}

/* 激活状态（展开时）边框变亮 */
.thought-card.active {
  border-color: var(--c-gold);
  box-shadow: 0 0 15px rgba(164, 139, 87, 0.15);
}

/* ========================================== */
/* 头部样式 */
/* ========================================== */
.card-header {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: linear-gradient(90deg, rgba(164,139,87,0.05) 0%, transparent 100%);
  border-bottom: 1px solid transparent;
  transition: background 0.3s;
  user-select: none;
}

.thought-card.active .card-header {
  border-bottom-color: var(--c-gold-dim);
  background: linear-gradient(90deg, rgba(164,139,87,0.1) 0%, transparent 100%);
}

.card-header:hover {
  background-color: rgba(164, 139, 87, 0.05);
}

.header-title {
  font-family: var(--font-title);
  font-weight: 700;
  color: var(--c-gold);
  font-size: 0.9rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.arrow-icon {
  color: var(--c-text-dim);
  font-size: 0.6rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.arrow-icon.rotated {
  transform: rotate(180deg);
  color: var(--c-gold);
}

/* ========================================== */
/* 内容区域样式 */
/* ========================================== */
.card-content {
  background-color: rgba(0, 0, 0, 0.2);
}

.text-wrapper {
  padding: 25px;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--c-gold) transparent;
}

.text-wrapper::-webkit-scrollbar {
  width: 6px;
}
.text-wrapper::-webkit-scrollbar-thumb {
  background-color: var(--c-gold);
  border-radius: 3px;
}

.thought-text {
  white-space: pre-wrap;
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--c-text-main);
  text-align: justify;
}

/* ========================================== */
/* 动画 */
/* ========================================== */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  max-height: 1000px;
  opacity: 1;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}
</style>
