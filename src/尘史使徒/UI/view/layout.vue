<!-- Layout.vue -->
<template>
  <div v-if="visible" class="ac-layout" :data-theme="currentTheme">
    <!-- 背景遮罩与噪点纹理 -->
    <div class="animus-background"></div>

    <!-- 侧边导航栏 (Sidebar) -->
    <aside class="ac-sidebar">
      <!-- 顶部装饰线 -->
      <div class="sidebar-line top"></div>

      <!-- 导航列表区域 (可滑动) -->
      <nav class="ac-nav-container">
        <div class="nav-scroll-wrapper">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="ac-nav-item"
            active-class="active"
          >
            <div class="active-indicator"></div>
            <span class="icon" v-if="item.icon">{{ item.icon }}</span>
            <span class="text">{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <!-- 底部控制区 -->
      <div class="sidebar-controls">
        <button class="control-btn theme-btn" @click="toggleTheme" title="切换主题">
          {{ currentTheme === 'dark' ? '☀' : '☾' }}
        </button>
        <button class="control-btn close-btn" @click="close" title="关闭">✕</button>
      </div>

      <!-- 侧边装饰线 -->
      <div class="sidebar-border-right"></div>
    </aside>

    <!-- 主内容区域 -->
    <main class="ac-main">
      <router-view v-slot="{ Component }">
        <transition name="animus-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { ERAUtil } from '@/Utils/ERAUtil';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useShopStore } from '@/尘史使徒/UI/store/ShopStore';
import { useQuestStore } from '@/尘史使徒/UI/store/QuestStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';

const statStore = useStatStore();
const shopStore = useShopStore();
const questStore = useQuestStore();
const UIStore = useUiStore();
const router = useRouter();
const route = useRoute();

const visible = computed(() => UIStore.showUI);
const close = () => { UIStore.showUI = false; };

// --- 导航逻辑 ---
const baseNavItems = [
  { name: '视界', path: '/世界信息', icon: '👁' },
  { name: '倒影', path: '/角色', icon: '♟' },
  { name: '器法', path: '/器与术', icon: '⚔' },
  { name: '道寻', path: '/任务', icon: '⚖' },
  { name: '未途', path: '/选项', icon: '❖' },
  { name: '祈奉', path: '/设置', icon: '⚙' },
  { name: '绯廊', path: '/图片', icon: '🖼' },
];

const navItems = computed(() => {
  const items = [...baseNavItems];
  if (shopStore.hasShopData) items.unshift({ name: '置物', path: '/商店', icon: '💰' });
  if (questStore.hasQuestData) items.unshift({ name: '榜文', path: '/任务接取', icon: '📜' });
  return items;
});

// 优先级跳转
watch(
  [() => questStore.hasQuestData, () => shopStore.hasShopData],
  ([hasQuest, hasShop]) => {
    if (hasQuest) {
      if (route.path !== '/任务接取') router.push('/任务接取');
      return;
    }
    if (hasShop && !hasQuest && route.path !== '/商店') {
      router.push('/商店');
    }
  },
);

// 主题切换
const currentTheme = computed(() => statStore.stat_data?.theme || 'dark');
const toggleTheme = async () => {
  const theme = currentTheme.value === 'dark' ? 'light' : 'dark';
  await ERAUtil.UpdateByObject({ theme: theme });
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

.ac-layout {
  --c-bg-overlay: rgba(15, 18, 24, 0.95);
  --c-gold: #a48b57;
  --c-text-main: #e0e0e0;
  --c-text-dim: #8a92a0;
  --c-border: rgba(164, 139, 87, 0.3);
  --c-hover-bg: rgba(164, 139, 87, 0.1);
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;
  --sidebar-width: 220px;

  position: fixed; inset: 0; z-index: 9999;
  display: flex;
  /* 关键修改：改为行布局 */
  flex-direction: row;
  font-family: var(--font-body); color: var(--c-text-main);
  overflow: hidden;
}

.ac-layout[data-theme='light'] {
  --c-bg-overlay: rgba(240, 238, 233, 0.98);
  --c-gold: #8a6f3e;
  --c-text-main: #2c2c2c;
  --c-text-dim: #666;
  --c-border: rgba(138, 111, 62, 0.3);
  --c-hover-bg: rgba(138, 111, 62, 0.1);
}

.animus-background {
  position: absolute; inset: 0;
  background-color: var(--c-bg-overlay);
  backdrop-filter: blur(8px); z-index: -1;
  background-image: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%);
}

/* --- 侧边栏样式 --- */
.ac-sidebar {
  width: var(--sidebar-width);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: rgba(0,0,0,0.1); /* 轻微加深侧边栏背景 */
  flex-shrink: 0;
}

.sidebar-border-right {
  position: absolute; right: 0; top: 0; bottom: 0; width: 1px;
  background: linear-gradient(to bottom, transparent, var(--c-border) 10%, var(--c-border) 90%, transparent);
}

.ac-nav-container {
  flex: 1;
  /* 关键：min-height: 0 允许 flex 子项滚动 */
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
}

.nav-scroll-wrapper {
  /* 关键：设置滚动 */
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  padding: 0 10px;

  /* 隐藏滚动条但保留功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE 10+ */
}
.nav-scroll-wrapper::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.ac-nav-item {
  position: relative;
  text-decoration: none;
  color: var(--c-text-dim);
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 15px 20px;
  margin-bottom: 5px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 4px;
}

.ac-nav-item:hover {
  color: var(--c-text-main);
  background-color: var(--c-hover-bg);
}

.ac-nav-item.active {
  color: var(--c-gold);
  background-color: var(--c-hover-bg);
  text-shadow: 0 0 8px rgba(164, 139, 87, 0.2);
}

/* 激活指示器：改为左侧竖条 */
.active-indicator {
  position: absolute;
  left: 0; top: 50%;
  width: 3px; height: 0%;
  background-color: var(--c-gold);
  transform: translateY(-50%);
  transition: height 0.3s ease;
  box-shadow: 0 0 8px var(--c-gold);
}

.ac-nav-item.active .active-indicator {
  height: 70%;
}

/* 底部控制区 */
.sidebar-controls {
  padding: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
  border-top: 1px solid var(--c-border);
  background: rgba(0,0,0,0.05);
}

.control-btn {
  width: 40px; height: 40px;
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text-dim);
  cursor: pointer;
  font-family: var(--font-title);
  font-size: 1.2rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
  border-radius: 50%;
}

.control-btn:hover {
  color: var(--c-gold);
  border-color: var(--c-gold);
  transform: rotate(90deg); /* 简单的悬停动画 */
}

/* --- 主内容区域 --- */
.ac-main {
  flex: 1;
  min-width: 0; /* 防止内容撑开 */
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 动画过渡 */
.animus-fade-enter-active,
.animus-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.animus-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.animus-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
