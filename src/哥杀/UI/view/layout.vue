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
      <!-- 卷轴左侧/上方轴承 (移动端作为展开菜单的机关) -->
      <div class="scroll-roller roller-start" @click="toggleMobileMenu">
        <!-- 移动端专属：轴承上的交互暗示 (符文或刻痕) -->
        <div class="roller-rune mobile-only" :class="{ 'is-active': isMobileMenuOpen }">
          ✧
        </div>
      </div>

      <!-- 卷轴纸张 -->
      <div class="scroll-paper">

        <!-- ========================================== -->
        <!-- 移动端：卷轴下拉的路由区域 (内嵌在纸张顶部) -->
        <!-- ========================================== -->
        <div class="mobile-nav-unroll mobile-only" :class="{ 'is-open': isMobileMenuOpen }">
          <div class="mobile-nav-content">

            <!-- 虚线框住的路由栏区域 -->
            <div class="mobile-nav-dashed-box">

              <!-- 第一排：控制按钮 (字体、主题、关闭) -->
              <div class="mobile-controls-row">
                <button class="control-btn" @click="toggleFontSize">
                  A± 字体
                </button>
                <button class="control-btn" @click="toggleTheme">
                  {{ uiStore.darkMode ? '☀ 晨光' : '☾ 夜幕' }}
                </button>
                <button class="control-btn" @click="close">✕ 关闭</button>
              </div>

              <!-- 第二排：路由导航 (溢出横向滚动) -->
              <div class="mobile-nav-scroll-row">
                <router-link
                  v-for="item in navItems"
                  :key="item.path"
                  :to="item.path"
                  class="mobile-nav-item"
                  active-class="active"
                  @click="isMobileMenuOpen = false"
                >
                  <span class="icon" v-if="item.icon">{{ item.icon }}</span>
                  <span class="text">{{ item.name }}</span>
                  <!-- 红点提示 -->
                  <div v-if="notifications && notifications[item.path]" class="nav-badge"></div>
                </router-link>
              </div>

            </div>

          </div>
          <!-- 卷轴展开部分的装饰性分割线 -->
          <div class="unroll-divider"></div>
        </div>

        <!-- ========================================== -->
        <!-- PC端头部：时间状态栏 & 竖旗导航 -->
        <!-- ========================================== -->
        <header class="desktop-header">
          <!-- 时间状态栏 -->
          <div class="status-bar">
            <div class="status-left">
              <span class="status-icon">✧</span>
              <span class="status-time">星历 1024年 翠月</span>
            </div>
            <div class="status-controls">
              <button class="control-btn theme-btn" @click="toggleTheme">
                {{ uiStore.darkMode ? '☀ 晨光' : '☾ 夜幕' }}
              </button>
              <button class="control-btn close-btn" @click="close">✕</button>
            </div>
          </div>

          <!-- 竖旗路由导航 -->
          <nav class="flag-nav-container">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="flag-item"
              active-class="active"
            >
              <div class="flag-content">
                <span class="icon" v-if="item.icon">{{ item.icon }}</span>
                <span class="text">{{ item.name }}</span>
              </div>
              <!-- 红点提示 -->
              <div v-if="notifications && notifications[item.path]" class="nav-badge"></div>
            </router-link>
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
// 假设 uiStore 和 notifications 已经通过某种方式引入或注入
import { useUiStore } from '@/哥杀/UI/store/UIStore';
const uiStore = useUiStore();

const router = useRouter();
const route = useRoute();

// 模拟数据 (请替换为你的实际 store)
const toasts = ref([]);
const notifications = ref({});

const visible = computed(() => uiStore.showUI);
const close = () => { uiStore.showUI = false; };

// 移动端菜单状态
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  if (window.innerWidth <= 768) {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  }
};

// 字体大小切换逻辑 (简单示例，循环切换 3 个档位)
const fontLevel = ref(1);
const toggleFontSize = () => {
  fontLevel.value = fontLevel.value >= 3 ? 1 : fontLevel.value + 1;
  const sizes = { 1: '16px', 2: '18px', 3: '20px' };
  document.documentElement.style.fontSize = sizes[fontLevel.value];
};

const navItems = [
  { name: '未途', path: '/', icon: '❖' },
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

const toggleTheme = async () => {
  uiStore.darkMode = !uiStore.darkMode;
  await uiStore.saveModeSetting();
};
</script>

<style scoped>
/* ==========================================
   CSS 变量与主题定义 (日式西幻风格)
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

  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background-color: var(--bg-base);
  color: var(--text-main);
  font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background-color 0.5s ease, color 0.5s ease;
  z-index: 9999;
}

.fantasy-layout.dark-mode {
  --bg-base: #121826;
  --text-main: #dce4ee;
  --text-muted: #829ab1;
  --accent-gold: #8ba4c7;
  --accent-gold-hover: #a8c1e8;
  --scroll-paper: #1e2738;
  --scroll-border: #2d3b54;
  --roller-color: #0f141e;
  --flag-bg: #2a3b5c;
  --flag-text: #dce4ee;
  --flag-active: #8ba4c7;
  --status-bar-bg: rgba(18, 24, 38, 0.9);
}

.fantasy-background {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.05) 100%);
  pointer-events: none;
  z-index: 0;
}

/* ==========================================
   主内容区域：卷轴 (占满全屏)
========================================== */
.scroll-main-container {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0 40px;
  position: relative;
  z-index: 5;
  overflow: hidden;
}

.scroll-roller {
  width: 30px;
  background: linear-gradient(to right, #5c4e40, var(--roller-color), #5c4e40);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 5px 0 15px rgba(0,0,0,0.3);
  position: relative;
  z-index: 2;
}

.scroll-paper {
  flex: 1;
  max-width: 1200px;
  background-color: var(--scroll-paper);
  margin: 0 -10px;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="0.03"/></svg>');
}

.scroll-content {
  flex: 1;
  padding: 20px 40px 40px 40px;
  overflow-y: auto;
}

/* ==========================================
   PC端头部：状态栏与竖旗
========================================== */
.desktop-header {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
}

.status-bar {
  width: 100%;
  height: 40px;
  background: var(--status-bar-bg);
  border-bottom: 1px solid var(--scroll-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  backdrop-filter: blur(4px);
}

.status-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  letter-spacing: 2px;
}

.status-controls {
  display: flex;
  gap: 15px;
}

.control-btn {
  background: none;
  border: 1px solid var(--scroll-border);
  color: var(--text-main);
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 4px;
  font-family: inherit;
  transition: all 0.3s;
}
.control-btn:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.flag-nav-container {
  display: flex;
  gap: 15px;
  margin-top: -1px;
}

.flag-item {
  position: relative;
  width: 46px;
  height: 90px;
  background-color: var(--flag-bg);
  color: var(--flag-text);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 15px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%);
  transition: transform 0.3s ease, background-color 0.3s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.flag-item:hover {
  transform: translateY(5px);
}

.flag-item.active {
  background-color: var(--flag-active);
  color: var(--bg-base);
  height: 100px;
}

.flag-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.flag-content .text {
  writing-mode: vertical-rl;
  font-size: 0.9rem;
  letter-spacing: 2px;
}

.nav-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  background-color: #e74c3c;
  border-radius: 50%;
}

/* ==========================================
   响应式：移动端适配 (卷轴下拉导航)
========================================== */
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-header {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .scroll-main-container {
    flex-direction: column;
    padding: 20px 0; /* 上下留出空间，左右占满 */
  }

  /* 上下轴承变为横向 */
  .scroll-roller {
    width: 100%;
    height: 28px;
    background: linear-gradient(to bottom, #5c4e40, var(--roller-color), #5c4e40);
  }

  /* 上方轴承作为交互机关 */
  .scroll-roller.roller-start {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }

  /* 轴承上的符文/刻痕暗示 */
  .roller-rune {
    color: var(--accent-gold);
    font-size: 14px;
    opacity: 0.7;
    transition: transform 0.4s ease, opacity 0.4s;
    text-shadow: 0 0 5px var(--accent-gold);
  }
  .roller-rune.is-active {
    transform: rotate(180deg);
    opacity: 1;
  }

  .scroll-paper {
    margin: -5px 0;
  }

  /* 移动端下拉的路由区域 */
  .mobile-nav-unroll {
    display: grid;
    grid-template-rows: 0fr; /* 核心：利用 grid 实现平滑高度动画 */
    transition: grid-template-rows 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    background: rgba(0, 0, 0, 0.02);
  }

  .mobile-nav-unroll.is-open {
    grid-template-rows: 1fr;
  }

  .mobile-nav-content {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* 虚线框容器 */
  .mobile-nav-dashed-box {
    border: 1px dashed var(--accent-gold);
    margin: 15px 20px;
    padding: 15px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    background: rgba(255, 255, 255, 0.1);
  }

  /* 第一排：控制按钮 */
  .mobile-controls-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .mobile-controls-row .control-btn {
    flex: 1;
    font-size: 0.85rem;
    padding: 6px 0;
    text-align: center;
  }

  /* 第二排：横向滚动路由 */
  .mobile-nav-scroll-row {
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding-bottom: 5px; /* 给滚动条留点空间 */
    /* 隐藏滚动条 */
    scrollbar-width: none; /* Firefox */
  }
  .mobile-nav-scroll-row::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }

  .mobile-nav-item {
    flex-shrink: 0; /* 防止被挤压 */
    width: 65px; /* 固定宽度 */
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 5px;
    text-decoration: none;
    color: var(--text-main);
    border: 1px solid var(--scroll-border);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
  }

  .mobile-nav-item.active {
    background-color: var(--flag-bg);
    color: var(--flag-text);
    border-color: var(--flag-bg);
    box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
  }

  /* 展开区域底部的装饰线 */
  .unroll-divider {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-gold), transparent);
    margin: 0 20px;
    opacity: 0.5;
  }

  .scroll-content {
    padding: 20px;
  }
}

/* ==========================================
   过渡动画
========================================== */
.animus-fade-enter-active,
.animus-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.animus-fade-enter-from,
.animus-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
