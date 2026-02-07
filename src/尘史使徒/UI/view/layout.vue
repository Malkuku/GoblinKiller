<template>
  <div v-if="visible" :class="{ 'dark-mode': uiStore.darkMode }" class="ac-layout">
    <!-- 背景遮罩 -->
    <div class="animus-background"></div>

    <!-- 导航区域 -->
    <aside class="ac-sidebar">
      <div class="sidebar-controls">
        <button class="control-btn theme-btn" @click="toggleTheme">
          {{  uiStore.darkMode === true ? '☀' : '☾' }}
        </button>
        <button class="control-btn close-btn" @click="close">✕</button>
      </div>

      <div class="sidebar-line"></div>

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

            <!-- 红点提示 -->
            <div v-if="notifications[item.path]" class="nav-badge"></div>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-border"></div>
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
import { computed, watch, reactive, provide } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useShopStore } from '@/尘史使徒/UI/store/ShopStore';
import { useQuestStore } from '@/尘史使徒/UI/store/QuestStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';

const shopStore = useShopStore();
const questStore = useQuestStore();
const uiStore = useUiStore();
const router = useRouter();
const route = useRoute();

const visible = computed(() => uiStore.showUI);
const close = () => { uiStore.showUI = false; };

// --- 红点通知接口 ---
const notifications = reactive({});
const setNotification = (path, active) => {
  notifications[path] = active;
};
provide('setNotification', setNotification);

// 监听任务布告栏状态 -> 控制 '/任务' 路由的红点
watch(() => questStore.hasBoardData, (hasNew) => {
  setNotification('/任务', hasNew);
}, { immediate: true });

// 基础导航项
const baseNavItems = [
  { name: '未途', path: '/选项', icon: '❖' },
  { name: '视界', path: '/世界信息', icon: '👁' },
  { name: '倒影', path: '/角色', icon: '♟' },
  { name: '道寻', path: '/任务', icon: '⚖' },
  { name: '绯廊', path: '/图片', icon: '🖼' },
  { name: '卷索', path: '/世界情报', icon: '§' },
  { name: '祈奉', path: '/设置', icon: '⚙' },
];

const navItems = computed(() => {
  const items = [...baseNavItems];
  // 商店仍然作为独立项，但任务接取已合并
  if (shopStore.hasShopData) {
    items.unshift({ name: '置物', path: '/商店', icon: '◑' });
  }
  return items;
});

const toggleTheme = async () => {
  uiStore.darkMode = !uiStore.darkMode;
  await uiStore.saveModeSetting();
};
</script>

<style scoped>
/* 保持原有样式，新增 .nav-badge */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

.ac-layout {
  /* ...原有变量保持不变... */
  --c-bg-overlay: rgba(15, 18, 24, 0.95);
  --c-gold: #a48b57;
  --c-text-main: #e0e0e0;
  --c-text-dim: #8a92a0;
  --c-border: rgba(164, 139, 87, 0.3);
  --c-hover-bg: rgba(164, 139, 87, 0.1);
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;
  --sidebar-width: 220px;
  --c-accent-danger: #a83232; /* 新增红色变量 */

  position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: row;
  font-family: var(--font-body); color: var(--c-text-main); overflow: hidden;
  height: 100vh; width: 100vw;
}

/* ...原有样式保持不变... */
.animus-background { position: absolute; inset: 0; background-color: var(--c-bg-overlay); backdrop-filter: blur(8px); z-index: -1; }
.ac-sidebar { background: rgba(0,0,0,0.1); flex-shrink: 0; display: flex; position: relative; }
.ac-nav-container { flex: 1; min-height: 0; min-width: 0; display: flex; }
.nav-scroll-wrapper { overflow: auto; scrollbar-width: none; }
.ac-nav-item { position: relative; text-decoration: none; color: var(--c-text-dim); font-family: var(--font-title); font-weight: 700; text-transform: uppercase; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 10px; white-space: nowrap; }
.ac-nav-item:hover, .ac-nav-item.active { color: var(--c-text-main); background-color: var(--c-hover-bg); }
.ac-nav-item.active { color: var(--c-gold); }
.active-indicator { position: absolute; background-color: var(--c-gold); transition: all 0.3s ease; box-shadow: 0 0 8px var(--c-gold); }
.sidebar-controls { display: flex; align-items: center; justify-content: center; gap: 10px; }
.control-btn { background: transparent; border: 1px solid var(--c-border); color: var(--c-text-dim); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; border-radius: 50%; }
.ac-main { flex: 1; height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; }

/* 新增：导航栏红点样式 */
.nav-badge {
  position: absolute;
  width: 8px; height: 8px;
  background-color: var(--c-accent-danger);
  border-radius: 50%;
  box-shadow: 0 0 5px var(--c-accent-danger);
  /* Desktop 位置 */
  top: 15px; right: 15px;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

/* Desktop 样式 */
@media (min-width: 769px) {
  .ac-sidebar { width: var(--sidebar-width); height: 100%; flex-direction: column; padding-top: 20px; }
  .sidebar-border { position: absolute; right: 0; top: 0; bottom: 0; width: 1px; background: linear-gradient(to bottom, transparent, var(--c-border), transparent); }
  .ac-nav-container { flex-direction: column; }
  .nav-scroll-wrapper { height: 100%; display: flex; flex-direction: column; padding: 0 10px; }
  .ac-nav-item { padding: 15px 20px; margin-bottom: 5px; justify-content: flex-start; border-radius: 4px; }
  .active-indicator { left: 0; top: 50%; width: 3px; height: 0%; transform: translateY(-50%); }
  .ac-nav-item.active .active-indicator { height: 70%; }
  .sidebar-controls { padding: 20px; border-top: 1px solid var(--c-border); }
  .control-btn { width: 40px; height: 40px; font-size: 1.2rem; }
}

/* Mobile 样式 */
@media (max-width: 768px) {
  .ac-layout { flex-direction: column; }
  .ac-sidebar { width: 100%; height: 60px; flex-direction: row; align-items: center; padding: 0; background: var(--c-bg-overlay); box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 10; }
  .sidebar-border { position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--c-border); }
  .ac-nav-container { flex-direction: row; overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 10px, #000 90%, transparent); }
  .nav-scroll-wrapper { display: flex; flex-direction: row; align-items: center; padding: 0 10px; width: 100%; overflow-x: auto; }
  .ac-nav-item { padding: 0 15px; height: 60px; font-size: 0.9rem; border-radius: 0; }
  .active-indicator { bottom: 0; left: 50%; width: 0%; height: 3px; transform: translateX(-50%); }
  .ac-nav-item.active .active-indicator { width: 60%; }
  .sidebar-controls { padding: 0 10px; border-left: 1px solid var(--c-border); height: 100%; background: rgba(0,0,0,0.2); }
  .control-btn { width: 32px; height: 32px; font-size: 1rem; border: none; }

  /* Mobile 红点位置调整 */
  .nav-badge { top: 12px; right: 12px; }
}

.animus-fade-enter-active, .animus-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.animus-fade-enter-from { opacity: 0; transform: translateY(10px); }
.animus-fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
