<template>
  <div v-if="visible" :class="{ 'dark-mode': uiStore.darkMode }" class="fantasy-layout">
    <!-- 背景遮罩/底色 -->
    <div class="fantasy-background"></div>

    <!-- 全局弹窗容器 -->
    <div class="ac-toast-container">
      <transition-group name="toast">
        <div v-for="toast in toasts" :key="toast.id" class="ac-toast">
          {{ toast.message }}
        </div>
      </transition-group>
    </div>

    <!-- ========================================== -->
    <!-- 主内容区域：卷轴样式 (占满全屏高度) -->
    <!-- ========================================== -->
    <main class="scroll-main-container">
      <!-- 卷轴左侧/上方轴承 -->
      <div class="scroll-roller roller-start" @click="toggleMobileMenu">
        <div class="roller-rune mobile-only" :class="{ 'is-active': isMobileMenuOpen }">
          ✧
        </div>
      </div>

      <!-- 卷轴纸张 -->
      <div class="scroll-paper">

        <!-- 移动端：卷轴下拉的路由区域 -->
        <div class="mobile-nav-unroll mobile-only" :class="{ 'is-open': isMobileMenuOpen }">
          <div class="mobile-nav-content">
            <div class="mobile-nav-dashed-box">
              <!-- 移动端：特殊操作按钮 -->
              <div class="mobile-nav-item action-item theme-item" @click="toggleTheme">
                <span class="icon">{{ uiStore.darkMode ? '☀' : '☾' }}</span>
                <span class="text">{{ uiStore.darkMode ? '晨光' : '夜幕' }}</span>
              </div>
              <div class="mobile-nav-item action-item close-item" @click="close">
                <span class="icon">✕</span>
                <span class="text">归隐</span>
              </div>
              <div class="mobile-nav-divider"></div>
              <div class="mobile-nav-scroll-row">
                <!-- 常规路由 -->
                <router-link
                  v-for="item in navItems" :key="item.path" :to="item.path"
                  class="mobile-nav-item" active-class="active" @click="isMobileMenuOpen = false"
                >
                  <span class="icon" v-if="item.icon">{{ item.icon }}</span>
                  <span class="text">{{ item.name }}</span>
                  <div v-if="notifications && notifications[item.path]" class="nav-badge"></div>
                </router-link>
              </div>
            </div>
          </div>
          <div class="unroll-divider"></div>
        </div>

        <!-- ========================================== -->
        <!-- PC端头部：竖旗导航 -->
        <!-- ========================================== -->
        <header class="desktop-header">
          <!-- 竖旗路由导航 -->
          <nav class="flag-nav-container">
            <!-- 常规路由竖旗 -->
            <router-link
              v-for="item in navItems" :key="item.path" :to="item.path"
              class="flag-item" active-class="active"
            >
              <div class="flag-content">
                <span class="icon" v-if="item.icon">{{ item.icon }}</span>
                <span class="text">{{ item.name }}</span>
              </div>
              <div v-if="notifications && notifications[item.path]" class="nav-badge"></div>
            </router-link>

            <div class="flag-spacer"></div>

            <!-- 特殊操作竖旗：主题切换 -->
            <div class="flag-item flag-action flag-theme" @click="toggleTheme" :title="uiStore.darkMode ? '切换至晨光' : '切换至夜幕'">
              <div class="flag-content">
                <span class="icon">{{ uiStore.darkMode ? '☀' : '☾' }}</span>
                <span class="text">{{ uiStore.darkMode ? '晨光' : '夜幕' }}</span>
              </div>
            </div>

            <!-- 特殊操作竖旗：关闭 -->
            <div class="flag-item flag-action flag-close" @click="close" title="关闭界面">
              <div class="flag-content">
                <span class="icon">✕</span>
                <span class="text">归隐</span>
              </div>
            </div>
          </nav>
        </header>

        <!-- 路由内容区 -->
        <div class="scroll-content">
          <router-view v-slot="{ Component }">
            <transition name="animus-fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </div>

      </div>

      <!-- 卷轴右侧/下方轴承 -->
      <div class="scroll-roller roller-end"></div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useUiStore } from '@/哥杀/UI/store/UIStore';
const uiStore = useUiStore();
const router = useRouter();
const route = useRoute();

// 模拟数据
const toasts = ref([]);
const notifications = ref({});

const visible = computed(() => uiStore.showUI);
const close = () => { uiStore.showUI = false; };

// 切换主题
const toggleTheme = () => {
  uiStore.darkMode = !uiStore.darkMode;
};

// 移动端菜单状态
const isMobileMenuOpen = ref(false);
const toggleMobileMenu = () => {
  if (window.innerWidth <= 768) {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  }
};

const navItems = [
  { name: '旅途', path: '/选项', icon: '❖' },
  { name: '视界', path: '/', icon: '👁' },
  { name: '倒影', path: '/', icon: '♟' },
  { name: '器具', path: '/', icon: '▨' },
  { name: '典范', path: '/', icon: 'Ø'},
  { name: '道寻', path: '/', icon: '⚖' },
  { name: '书库', path: '/', icon: '🏛' },
  { name: '忆库', path: '/', icon: '⬡' },
  { name: '卷索', path: '/', icon: '⨳' },
  { name: '绯廊', path: '/', icon: '🖼' },
  { name: '祈奉', path: '/', icon: '⚙' },
];
</script>

<style scoped>
/* ==========================================
   CSS 变量与主题定义
========================================== */
.fantasy-layout {
  --bg-base: #f4f1ea;
  --text-main: #4a3f35;
  --text-muted: #8b7e70;
  --accent-gold: #c6a664;
  --accent-gold-hover: #dfbc73;
  --scroll-paper: #fffcf5;
  --scroll-border: #d4c4a8;
  --roller-color: #8b7e70;
  --flag-bg: #8c3a3a;
  --flag-text: #f4f1ea;
  --flag-active: #c6a664;
  --status-bar-bg: rgba(244, 241, 234, 0.9);

  /* 特殊竖旗颜色 */
  --flag-theme-bg: #3b5998;
  --flag-close-bg: #b33939;

  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh;
  background-color: var(--bg-base);
  color: var(--text-main);
  font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif;
  display: flex; flex-direction: column; overflow: hidden;
  transition: background-color 0.5s ease, color 0.5s ease;
  z-index: 9999;
}

.fantasy-layout.dark-mode {
  --bg-base: #05080f;
  --text-main: #dce4ee;
  --text-muted: #829ab1;
  --accent-gold: #8ba4c7;
  --accent-gold-hover: #a8c1e8;
  --scroll-paper: #1f293d;
  --scroll-border: #3a4b6b;
  --roller-color: #0a0e17;
  --flag-bg: #2a3b5c;
  --flag-text: #dce4ee;
  --flag-active: #8ba4c7;
  --status-bar-bg: rgba(31, 41, 61, 0.9);

  /* 暗黑模式特殊竖旗颜色 */
  --flag-theme-bg: #2c3e50;
  --flag-close-bg: #641e16;
}

.fantasy-background {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.05) 100%);
  pointer-events: none; z-index: 0;
}

.scroll-main-container {
  flex: 1; display: flex; align-items: stretch; justify-content: center;
  padding: 0 40px; position: relative; z-index: 5; overflow: hidden;
}

.scroll-roller {
  width: 30px;
  background: linear-gradient(to right, #5c4e40, var(--roller-color), #5c4e40);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 5px 0 15px rgba(0,0,0,0.3);
  position: relative; z-index: 2;
}

.scroll-paper {
  flex: 1; max-width: 1200px; background-color: var(--scroll-paper);
  margin: 0 -10px; padding: 0; display: flex; flex-direction: column;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.1);
  position: relative; z-index: 1;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="0.03"/></svg>');
}

.scroll-content {
  flex: 1; padding: 20px 40px 40px 40px; overflow-y: auto;
  display: flex; flex-direction: column;
}

.desktop-header {
  position: relative; z-index: 20; display: flex; flex-direction: column;
  align-items: center; width: 100%; flex-shrink: 0;
  height: 45px; /* 【关键修改】固定头部高度，让竖旗展开时脱离限制，自然向下遮挡内容 */
}

.flag-nav-container {
  display: flex; gap: 15px;
  margin-top: -10px; /* 向上溢出，防止下滑时断开 */
}

.flag-spacer {
  width: 10px; /* 在常规路由和特殊按钮之间增加一点间距 */
}

.flag-item {
  position: relative; width: 46px;
  height: 55px; /* 默认全部缩短，配合clip-path刚好只显示图标 */
  background-color: var(--flag-bg); color: var(--flag-text);
  text-decoration: none; display: flex; flex-direction: column;
  align-items: center;
  padding-top: 25px; /* 将内容往下推，适应向上溢出 */
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%);
  transition: transform 0.3s ease, background-color 0.3s, height 0.3s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  z-index: 10;
}

.flag-item:hover {
  transform: translateY(5px);
  height: 130px; /* 【关键修改】悬浮时拉得更长，足以遮挡下方内容 */
  z-index: 15; /* 保证悬浮时处于最上层 */
}

.flag-item.active {
  background-color: var(--flag-active);
  color: var(--bg-base);
}

/* 特殊操作竖旗样式 */
.flag-action { cursor: pointer; }
.flag-theme { background-color: var(--flag-theme-bg); }
.flag-close { background-color: var(--flag-close-bg); }

.flag-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.flag-content .text { writing-mode: vertical-rl; font-size: 0.9rem; letter-spacing: 2px; }

.nav-badge {
  position: absolute;
  top: 18px; /* 稍微往下移一点，防止在向上溢出区域被遮挡 */
  right: 8px;
  width: 8px; height: 8px;
  background-color: #e74c3c; border-radius: 50%;
}

.mobile-only { display: none; }

@media (max-width: 768px) {
  .desktop-header { display: none; }
  .mobile-only { display: block; }
  .scroll-main-container { flex-direction: column; padding: 20px 0; }
  .scroll-roller { width: 100%; height: 28px; background: linear-gradient(to bottom, #5c4e40, var(--roller-color), #5c4e40); }
  .scroll-roller.roller-start { cursor: pointer; display: flex; justify-content: center; align-items: center; z-index: 10; }
  .roller-rune { color: var(--accent-gold); font-size: 14px; opacity: 0.7; transition: transform 0.4s ease, opacity 0.4s; text-shadow: 0 0 5px var(--accent-gold); }
  .roller-rune.is-active { transform: rotate(180deg); opacity: 1; }
  .scroll-paper { margin: -5px 0; }
  .mobile-nav-unroll { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.5s cubic-bezier(0.25, 0.8, 0.25, 1); background: rgba(0, 0, 0, 0.02); }
  .mobile-nav-unroll.is-open { grid-template-rows: 1fr; }
  .mobile-nav-content { overflow: hidden; display: flex; flex-direction: column; }

  /* 移动端路由UI缩小优化 */
  .mobile-nav-dashed-box {
    border: 1px dashed var(--accent-gold);
    margin: 10px 15px;
    padding: 10px;
    border-radius: 6px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.1);
  }
  .mobile-nav-scroll-row {
    display: flex; overflow-x: auto; gap: 8px; padding-bottom: 0; scrollbar-width: none; align-items: center; flex: 1;
  }
  .mobile-nav-scroll-row::-webkit-scrollbar { display: none; }

  .mobile-nav-item {
    flex-shrink: 0;
    width: 50px;
    position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px;
    padding: 8px 4px;
    font-size: 0.8rem;
    text-decoration: none; color: var(--text-main); border: 1px solid var(--scroll-border); border-radius: 6px; background: rgba(255, 255, 255, 0.4); transition: all 0.3s ease;
  }
  .mobile-nav-item .icon { font-size: 1.1rem; }
  .mobile-nav-item.active { background-color: var(--flag-bg); color: var(--flag-text); border-color: var(--flag-bg); box-shadow: inset 0 0 10px rgba(0,0,0,0.2); }

  /* 移动端特殊按钮样式 */
  .mobile-nav-divider { width: 1px; height: 30px; background-color: var(--scroll-border); margin: 0 5px; flex-shrink: 0; }
  .action-item { cursor: pointer; color: var(--flag-text); border: none; }
  .theme-item { background-color: var(--flag-theme-bg); }
  .close-item { background-color: var(--flag-close-bg); }

  .unroll-divider { height: 2px; background: linear-gradient(90deg, transparent, var(--accent-gold), transparent); margin: 0 20px; opacity: 0.5; }
  .scroll-content { padding: 20px; }
}

.animus-fade-enter-active, .animus-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.animus-fade-enter-from, .animus-fade-leave-to { opacity: 0; transform: translateY(10px); }
</style>
