<template>
  <div class="narrative-layout" :data-theme="currentTheme">
    <header class="app-header">
      <!-- 这是一个干净的容器，只用于放置全局控件 -->
      <div class="header-controls">
        <button class="theme-toggle-btn" @click="toggleTheme" aria-label="切换主题">
          <span v-if="currentTheme === 'dark'">☀️</span>
          <span v-else>🌙</span>
        </button>
      </div>
    </header>

    <aside class="app-sidebar">
      <nav>
        <ul>
          <li v-for="item in navItems" :key="item.path">
            <router-link :to="item.path">
              <span class="nav-text">{{ item.name }}</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="main-content-area">
      <router-view v-slot="{ Component }">
        <transition name="fade-main" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { ERAUtil } from '@/Utils/ERAUtil';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useShopStore } from '@/尘史使徒/UI/store/ShopStore';
import { useQuestStore } from '@/尘史使徒/UI/store/QuestStore';

const statStore = useStatStore();
const shopStore = useShopStore();
const questStore = useQuestStore();
const router = useRouter();
const route = useRoute();

// 导航模块定义
const baseNavItems = [
  { name: '视界', path: '/世界信息' },
  { name: '倒影', path: '/角色' },
  { name: '器法', path: '/器与术' },
  { name: '道寻', path: '/任务' },
  { name: '未途', path: '/选项' },
  { name: '祈奉', path: '/设置' },
  { name: '绯廊', path: '/图片' },
];

// 动态导航计算：委托 > 商店 > 基础
const navItems = computed(() => {
  const items = [...baseNavItems];

  // 1. 检查商店 (插入头部)
  if (shopStore.hasShopData) {
    items.unshift({ name: '置物', path: '/商店' });
  }

  // 2. 检查委托 (再次插入头部，这样它会排在商店前面)
  if (questStore.hasQuestData) {
    items.unshift({ name: '榜文', path: '/任务接取' });
  }

  return items;
});

// 优先级跳转逻辑
watch(
  [() => questStore.hasQuestData, () => shopStore.hasShopData],
  ([hasQuest, hasShop]) => {
    // 情况 A: 委托数据出现 (最高优先级)
    if (hasQuest) {
      if (route.path !== '/任务接取') {
        router.push('/任务接取');
      }
      return; // 既然跳转了委托，就不用管商店了
    }

    // 情况 B: 商店数据出现 (且没有新委托出现)
    if (hasShop) {
      // 只有在当前没有委托数据，或者当前不在委托页面时，才跳转商店
      // 如果同时有委托和商店，优先停留在委托
      if (!hasQuest && route.path !== '/商店') {
        router.push('/商店');
      }
    }
  },
);

// 主题切换逻辑
const currentTheme = computed(() => statStore.stat_data?.theme);
const toggleTheme = async () => {
  const theme = currentTheme.value === 'dark' ? 'light' : 'dark';
  await ERAUtil.UpdateByObject({ theme: theme });
};
</script>

<style scoped>
/* 引入字体 */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

/* --- 主题系统：CSS 变量 --- */
.narrative-layout {
  /* 黑夜主题 (默认) */
  --bg-primary: #1a1d24;
  --bg-secondary: #242832;
  --text-primary: #c8d1e0;
  --text-secondary: #7a8291;
  --border-color: #3a4150;
  --accent-primary: #a48b57;
  --accent-danger: #b03a48;
  --shadow-color: rgba(0, 0, 0, 0.5);
}

.narrative-layout[data-theme='light'] {
  /* 白天主题 (苍白之日) */
  --bg-primary: #f4f0e8;
  --bg-secondary: #e9e4d8;
  --text-primary: #4a4130;
  --text-secondary: #8a7a61;
  --border-color: #d1c8b6;
  --accent-primary: #8a6f3e;
  --accent-danger: #9a3d3d;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

/* --- 基础与桌面端布局 --- */
.narrative-layout {
  display: grid;
  grid-template-areas:
    'header header'
    'nav content';
  grid-template-columns: 200px 1fr;
  grid-template-rows: 55px 1fr;
  width: 100vw;
  min-height: 600px;
  max-height: 1400px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'EB Garamond', serif;
  transition:
    background-color 0.4s ease,
    color 0.4s ease;
  overflow-y: auto;
}

/* --- Header --- */
.app-header {
  grid-area: header;
  display: flex;
  justify-content: flex-end; /* 将控件推到右侧 */
  align-items: center;
  padding: 0 20px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 10px var(--shadow-color);
  transition:
    background-color 0.4s ease,
    border-color 0.4s ease;
  z-index: 10;
}

.theme-toggle-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 40px;
  height: 30px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}
.theme-toggle-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
  background-color: rgba(164, 139, 87, 0.1);
}

/* --- 侧边导航栏 (桌面) --- */
.app-sidebar {
  grid-area: nav;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding-top: 20px;
  transition:
    background-color 0.4s ease,
    border-color 0.4s ease;
  z-index: 5;
}

.app-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.app-sidebar a {
  display: block;
  padding: 18px 25px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 1.1rem;
  font-family: 'Cinzel', serif;
  font-weight: 400;
  border-left: 3px solid transparent;
  transition: all 0.3s ease;
}

.app-sidebar a:hover {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.app-sidebar a.router-link-active {
  background-color: var(--bg-primary);
  color: var(--accent-primary);
  border-left-color: var(--accent-danger);
  font-weight: 700;
  box-shadow: inset 2px 0 5px var(--shadow-color);
}

/* --- 主内容区域 --- */
.main-content-area {
  grid-area: content;
  padding: 25px;
  background-color: var(--bg-primary);
  transition: background-color 0.4s ease;
  overflow-y: auto;
}

/* --- 路由切换动画 --- */
.fade-main-enter-active,
.fade-main-leave-active {
  transition: opacity 0.2s ease;
}
.fade-main-enter-from,
.fade-main-leave-to {
  opacity: 0;
}

/*
 * =========================================
 *   响应式设计：移动端适配 (<= 768px)
 * =========================================
*/
@media (max-width: 768px) {
  /* 1. 重新定义页面网格布局 */
  .narrative-layout {
    grid-template-areas:
      'header'
      'content'
      'nav'; /* 导航移动到底部 */
    grid-template-columns: 1fr; /* 单列布局 */
    grid-template-rows: 50px 1fr 60px; /* 顶部Header, 中间内容(自适应), 底部Nav */
  }

  .app-header {
    padding: 0 15px;
  }

  /* 2. 将侧边栏转换为底部导航栏 */
  .app-sidebar {
    padding-top: 0;
    border-right: none;
    border-top: 1px solid var(--border-color);
    display: flex; /* 用于垂直居中导航列表 */
    align-items: center;
    box-shadow: 0 -2px 10px var(--shadow-color);
  }

  .app-sidebar nav {
    width: 100%;
  }

  .app-sidebar ul {
    display: flex; /* 让导航项水平排列 */
    justify-content: space-around; /* 均匀分布 */
    height: 100%;
  }

  /* 3. 调整导航链接的样式以适应底部栏 */
  .app-sidebar a {
    padding: 8px 5px;
    border-left: none; /* 移除左侧边框 */
    border-bottom: 3px solid transparent; /* 使用底部边框作为激活指示器 */
    font-size: 0.8rem; /* 减小字体以适应空间 */
    text-align: center;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .app-sidebar a.router-link-active {
    border-left-color: transparent; /* 覆盖桌面端样式 */
    border-bottom-color: var(--accent-danger); /* 激活时显示底部边框 */
    box-shadow: none; /* 移除桌面端阴影 */
    background-color: transparent; /* 移除背景色变化 */
    color: var(--accent-primary);
  }

  /* 4. 调整主内容区的内边距 */
  .main-content-area {
    padding: 15px;
  }
}

/* 1. 针对 Webkit 内核 (Chrome, Edge, Safari) */

/* 定义滚动条整体宽高 */
.narrative-layout::-webkit-scrollbar,
.main-content-area::-webkit-scrollbar {
  width: 8px; /* 纵向滚动条宽度 */
  height: 8px; /* 横向滚动条高度 */
}

/* 定义滚动条轨道 (Track) */
.narrative-layout::-webkit-scrollbar-track,
.main-content-area::-webkit-scrollbar-track {
  background: var(--bg-secondary); /* 与侧边栏/Header背景一致，视觉融合 */
  border-left: 1px solid var(--border-color); /* 增加一条淡淡的分隔线 */
}

/* 定义滚动条滑块 (Thumb) */
.narrative-layout::-webkit-scrollbar-thumb,
.main-content-area::-webkit-scrollbar-thumb {
  background-color: var(--border-color); /* 默认状态使用边框色，低调不抢眼 */
  border-radius: 4px; /* 圆角设计，符合现代UI */
  /* 下面这行是为了让滑块看起来比轨道细，制造一种悬浮感 */
  border: 2px solid var(--bg-secondary);
  background-clip: content-box;
}

/* 定义滑块悬停/激活状态 */
.narrative-layout::-webkit-scrollbar-thumb:hover,
.main-content-area::-webkit-scrollbar-thumb:active {
  background-color: var(--accent-primary); /* 悬停时变更为“金色/强调色”，提供交互反馈 */
  border-color: var(--bg-secondary);
}

/* 2. 针对 Firefox (标准属性) */
.narrative-layout,
.main-content-area {
  scrollbar-width: thin; /* 细滚动条 */
  /* 语法: scrollbar-color: <滑块颜色> <轨道颜色>; */
  scrollbar-color: var(--border-color) var(--bg-secondary);
}
</style>
