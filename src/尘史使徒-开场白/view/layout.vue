<template>
  <div class="intro-sequence-layout">
    <router-view  @proceed="nextPage"/>

    <!--
      导航控制区域：
      - 这里的控件由 Layout 统一管理，负责在不同概念模块之间切换。
    -->
    <div class="navigation-controls">
      <!-- 上一页按钮：第一页不显示 -->
      <button v-if="currentPageIndex > 0" class="nav-btn prev-btn" @click="prevPage">
        &lt;
      </button>

      <!-- 页面指示器 -->
      <div v-if="totalPages > 0" class="page-indicator">
        {{ currentPageIndex + 1 }} / {{ totalPages }}
      </div>

      <!-- 下一页按钮：最后一页不显示 (最后一页模块将自带进入按钮) -->
      <button v-if="!isLastPage" class="nav-btn next-btn" @click="nextPage">
         &gt;
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// --- 1. 初始化路由 ---
const router = useRouter();
const route = useRoute();

// --- 2. 从路由获取状态 ---

// 从路由配置中获取开场白的所有子路由，用于导航和计算总页数
const introRoutes = router.options.routes[0]?.children || [];
const totalPages = introRoutes.length;

// 计算属性，根据当前路由的 meta 信息获取当前页索引
const currentPageIndex = computed(() => route.meta.index ?? 0);

// 计算属性，判断当前是否为最后一页
const isLastPage = computed(() => currentPageIndex.value === totalPages - 1);

// --- 3. 导航方法 ---
const navigateByIndex = (index) => {
  // 根据索引在路由配置中找到目标路由
  const targetRoute = introRoutes.find(r => r.meta?.index === index);
  console.log('导航到：', targetRoute);
  console.log('name：', targetRoute.name);
  if (targetRoute) {
    router.push({ name: targetRoute.name });
  }
};

const nextPage = () => {
  if (!isLastPage.value) {
    navigateByIndex(currentPageIndex.value + 1);
  }
};

const prevPage = () => {
  if (currentPageIndex.value > 0) {
    navigateByIndex(currentPageIndex.value - 1);
  }
};
</script>

<style scoped>

.intro-sequence-layout {
  top: 0;
  left: 0;
  width: 100vw;
  min-height: 600px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'EB Garamond', serif;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 100px; /* 添加底部填充，为导航控件留出空间 */
  box-sizing: border-box;
}

/* 页面切换动画 */
.fade-page-enter-active,
.fade-page-leave-active {
  transition: opacity 0.5s ease;
}
.fade-page-enter-from,
.fade-page-leave-to {
  opacity: 0;
}

/* 导航控件 */
.navigation-controls {
  position: absolute;
  margin-top: 20px;
  bottom: 30px; /* 调整底部距离 */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  border: 1px solid var(--border-color);
  z-index: 10;
}

.page-indicator {
  color: var(--text-secondary);
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  min-width: 50px;
  text-align: center;
}

.nav-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: 'Cinzel', serif;
  font-size: 0.9rem; /* 减小字体大小 */
  cursor: pointer;
  padding: 0.3rem 0.8rem; /* 减小内边距 */
  transition: color 0.3s ease;
}

.nav-btn:hover {
  color: var(--accent-primary);
}
</style>
