<template>
  <div class="vision-container" :class="{ 'danger-mode': isDanger && mode === 'gameplay', 'dark-mode': uiStore.darkMode }">

    <!-- 1. 地图层 (交互核心) -->
    <div
class="map-viewport" ref="viewportRef"
         @wheel.prevent="handleWheel"
         @mousedown="handleMouseDown"
         @mousemove="handleMouseMove"
         @mouseup="handleMouseUp"
         @mouseleave="handleMouseUp"
         @touchstart="handleTouchStart"
         @touchmove="handleTouchMove"
         @touchend="handleTouchEnd"
         @click="handleBackgroundClick">

      <!-- 变换容器 -->
      <div class="map-transform-layer" :style="translateStyle">
        <!-- 动态网格背景 -->
        <div class="grid-lines" :style="gridStyle"></div>

        <!-- 节点渲染 -->
        <transition-group name="map-fade" tag="div" class="map-layer">
          <div v-for="node in currentDisplayNodes" :key="node.name"
               class="map-node"
               :class="{ 'is-player-here': node.name === playerLocationName }"
               :style="getNodeStyle(node)"
               @click.stop="handleNodeClick(node)">

            <div class="node-icon-wrapper" :class="getNodeSizeClass(node)">
              <svg viewBox="0 0 24 24" class="node-svg">
                <path v-if="getIconPath(node.icon)" :d="getIconPath(node.icon)" />
                <text v-else x="12" y="16" text-anchor="middle" fill="red" font-size="12">?</text>
              </svg>
            </div>

            <span class="node-label">{{ node.name }}</span>

            <div v-if="mode === 'gameplay' && node.name === playerLocationName" class="player-indicator">
              <div class="indicator-ring"></div>
              <span class="indicator-text">YOU</span>
            </div>
            <div v-else-if="mode === 'selection' && node.name === playerLocationName" class="player-indicator selection-mode">
              <div class="indicator-ring"></div>
              <span class="indicator-text">当前选择</span>
            </div>
          </div>
        </transition-group>
      </div>
    </div>

    <!-- 2. 视界 UI 层 (HUD Overlay) -->
    <div class="vision-ui-overlay">

      <!-- 顶部左侧：区域面包屑 -->
      <div class="region-breadcrumbs">
        <div class="breadcrumb-track">
          <span v-for="(crumb, index) in breadcrumbs" :key="crumb.name"
                class="crumb-item"
                :class="{ active: index === breadcrumbs.length - 1 }"
                @click="wrappedNavigateToLayer(crumb)">
            {{ crumb.name }}
          </span>
        </div>
      </div>

      <!-- 搜索功能区 (右上角) -->
      <div class="search-container">
        <button class="search-toggle-btn" @click="toggleSearch" :class="{ active: isSearchOpen }">
          <span v-if="!isSearchOpen">🔍 搜索节点</span>
          <span v-else>✕ 关闭</span>
        </button>

        <transition name="fade">
          <div v-if="isSearchOpen" class="search-panel">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              @input="handleSearchInput"
              placeholder="输入地点名称..."
              class="search-input"
            />
            <div v-if="searchResults.length > 0" class="search-results-list">
              <div
                v-for="(res, idx) in searchResults"
                :key="idx"
                class="search-result-item"
                @click="handleJumpToResult(res)"
              >
                <div class="res-name">{{ res.name }}</div>
                <div class="res-path">{{ formatPath(res.path) }}</div>
              </div>
            </div>
            <div v-else-if="searchQuery && searchResults.length === 0" class="search-no-result">
              未找到相关地点
            </div>
          </div>
        </transition>
      </div>

      <!-- 底部右侧：世界状态 HUD (仅游戏模式显示) -->
      <div class="world-hud" v-if="worldInfo && mode === 'gameplay'">
        <div class="hud-content">
          <!-- 危险警报 -->
          <div class="danger-alert" v-if="isDanger">
            <span class="pulse-icon">⚠</span> DANGER ZONE
          </div>

          <div class="hud-row">
            <div class="hud-block location">
              <div class="label">CURRENT LOCATION</div>
              <div class="value main">{{ worldInfo.地点 }}</div>
              <div class="value sub">{{ worldInfo.天气 }} / {{ worldInfo.季节 }}</div>
            </div>

            <div class="hud-divider"></div>

            <div class="hud-block time">
              <div class="label">CHRONOS</div>
              <div class="value main">{{ formattedTime.clock }}</div>
              <div class="value sub">
                {{ formattedTime.date }} <span class="weekday">{{ formattedTime.weekday }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 选择模式下的提示 HUD -->
      <div class="world-hud selection-hud" v-if="mode === 'selection'">
        <div class="hud-content">
          <div class="hud-block">
            <div class="label">SELECTION MODE</div>
            <div class="value main">选择出生地</div>
            <div class="value sub">点击节点查看详情并确认</div>
          </div>
        </div>
      </div>

      <!-- 返回上级按钮 (悬浮) -->
      <transition name="fade">
        <button v-if="breadcrumbs.length > 1" class="back-level-btn" @click.stop="wrappedGoUpOneLevel">
          <span class="arrow">←</span> LEAVE {{ breadcrumbs[breadcrumbs.length - 1].name }}
        </button>
      </transition>

      <!-- 详情弹窗 -->
      <transition name="scale-fade">
        <div v-if="tooltip.visible" class="node-tooltip" @click.stop :style="tooltipStyle">
          <div class="tooltip-header">
            <h3>{{ tooltip.data.name }}</h3>
            <button class="close-icon" @click="closeTooltip">×</button>
          </div>
          <div class="tooltip-body">
            <p class="desc">{{ tooltip.data.desc }}</p>
            <div class="coords">N:{{ tooltip.data.displayX.toFixed(1) }} E:{{ tooltip.data.displayY.toFixed(1) }}</div>
            <ul class="details-list">
              <li v-for="(detail, idx) in (tooltip.data.details || []).slice(0, 3)" :key="idx">
                {{ detail }}
              </li>
            </ul>
          </div>
          <div class="tooltip-footer">
            <!-- 主要操作按钮组 -->
            <button v-if="hasChildren(tooltip.data)" class="action-btn primary" @click="wrappedEnterArea(tooltip.data)">
              进入地区
            </button>

            <!-- 游戏模式：前往此处 -->
            <button v-if="mode === 'gameplay'" class="action-btn secondary" @click="handleTravel(tooltip.data)">
              前往此处
            </button>

            <!-- 选择模式：确认为出生地 -->
            <button v-else class="action-btn confirm-selection" @click="handleSelectLocation(tooltip.data)">
              确定出生于此
            </button>

            <!-- 删除地图按钮 (独占一行) -->
            <button v-if="mode === 'gameplay' && canDelete(tooltip.data)" class="action-btn delete-btn" @click="handleDeleteMap(tooltip.data)">
              删除地图
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';

import { useIconSystem } from '@/尘史使徒/UI/composables/map/useIconSystem';
import { useWorldStatus } from '@/尘史使徒/UI/composables/map/useWorldStatus';
import { useMapSearch } from '@/尘史使徒/UI/composables/map/useMapSearch';
import { useMapCore } from '@/尘史使徒/UI/composables/map/useMapCore';
import { useMapInteraction } from '@/尘史使徒/UI/composables/map/useMapInteraction';

// ==========================================
// 基础配置
// ==========================================
const props = defineProps({
  mode: { type: String, default: 'gameplay', validator: (v) => ['gameplay', 'selection'].includes(v) }
});
const emit = defineEmits(['select']);
const router = useRouter();
const uiStore = useUiStore();
const store = useStatStore();
const { stat_data } = storeToRefs(store);
const viewportRef = ref(null);

// ==========================================
// 模块初始化
// ==========================================
const { getIconPath } = useIconSystem();
const { worldInfo, isDanger, formattedTime } = useWorldStatus(stat_data);
const { isSearchOpen, searchQuery, searchResults, searchInputRef, toggleSearch, handleSearchInput, formatPath } = useMapSearch(stat_data);

// 核心数据模块
const {
  currentRootNode, breadcrumbs, tooltip, playerLocationName, currentDisplayNodes,
  initMapPosition, navigateToLayer, enterArea, goUpOneLevel, closeTooltip,
  handleNodeClick, handleTravel, handleSelectLocation, handleDeleteMap, canDelete, hasChildren
} = useMapCore(stat_data, uiStore, router, emit);

// 交互模块 (依赖核心数据模块的 currentDisplayNodes)
const {
  transform, baseScale, translateStyle, gridStyle,
  getNodeStyle, getNodeSizeClass, updateBaseScale,
  handleWheel, handleMouseDown, handleMouseMove, handleMouseUp,
  handleTouchStart, handleTouchMove, handleTouchEnd, handleBackgroundClick
} = useMapInteraction(viewportRef, currentDisplayNodes, closeTooltip);

// ==========================================
// 胶水逻辑 (Glue Logic) - 连接不同模块
// ==========================================

// 1. 桥接逻辑：搜索跳转需要同时操作 MapCore 和 MapInteraction
const handleJumpToResult = (result) => {
  let targetBreadcrumbs = [];
  let targetRoot = null;
  if (result.path.length > 1) {
    targetBreadcrumbs = result.path.slice(0, result.path.length - 1);
    targetRoot = targetBreadcrumbs[targetBreadcrumbs.length - 1].node;
  } else {
    targetBreadcrumbs = result.path;
    targetRoot = result.node;
  }
  breadcrumbs.value = targetBreadcrumbs;
  currentRootNode.value = targetRoot;
  closeTooltip();

  nextTick(() => {
    updateBaseScale(true);
    const targetNodeInDisplay = currentDisplayNodes.value.find(n => n.name === result.name);
    if (targetNodeInDisplay) {
      handleNodeClick(targetNodeInDisplay);
      transform.x = -targetNodeInDisplay.displayY * baseScale.value;
      transform.y = targetNodeInDisplay.displayX * baseScale.value;
    }
  });
};

// 2. 桥接逻辑：导航或层级变化时重置视图
const resetView = () => {
  closeTooltip();
  nextTick(() => updateBaseScale(true));
};

// 拦截 Core 的导航操作以触发视图重置
const wrappedNavigateToLayer = (crumb) => { navigateToLayer(crumb); resetView(); };
const wrappedEnterArea = (node) => { enterArea(node); resetView(); };
const wrappedGoUpOneLevel = () => { goUpOneLevel(); resetView(); };

// 3. 监听数据变化
watch(() => stat_data.value, (newVal) => {
  if (!newVal) return;
  if (!currentRootNode.value) {
    initMapPosition();
    nextTick(() => updateBaseScale(true));
  } else {
    // 简单重置逻辑，依赖 initMapPosition 的健壮性
    // 实际项目中可能需要更复杂的 diff 逻辑
  }
}, { immediate: true });

// 4. 生命周期管理
let resizeObserver = null;
onMounted(() => {
  if (viewportRef.value) {
    resizeObserver = new ResizeObserver(() => updateBaseScale(false));
    resizeObserver.observe(viewportRef.value);
  }
  if (stat_data.value) {
    initMapPosition();
    nextTick(() => updateBaseScale(true));
  }
});
onUnmounted(() => { if (resizeObserver) resizeObserver.disconnect(); });
</script>

<style scoped>
.vision-container {
  width: 100%;
  height: 100vh; /* 兼容旧浏览器 */
  height: 100dvh; /* 关键修复：使用动态视口高度，自动适应浏览器地址栏/工具栏 */
  flex: 1;      /* 在 Flex 环境下自动撑开 */
  position: relative;
  overflow: hidden;
  background-color: #1a1d24;
  user-select: none;
  --c-gold: #c5a059;
  --c-bg-panel: rgba(20, 22, 28, 0.95);
  --font-cinzel: 'Cinzel', serif;
}

/* 1. 地图层样式 */
.map-viewport {
  width: 100%; height: 100%; position: absolute; top: 0; left: 0;
  cursor: crosshair;
  background: radial-gradient(circle at center, #2a2f3a 0%, #15171c 100%);
  touch-action: none; /* 禁止浏览器默认触摸行为 */
}
.map-transform-layer { width: 100%; height: 100%; position: absolute; will-change: transform; }
.grid-lines {
  position: absolute; inset: -200%; width: 500%; height: 500%;
  background-image: linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px);
  opacity: 0.08; pointer-events: none;
}

/* 节点样式 */
.map-node {
  position: absolute; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center;
  cursor: pointer; transition: z-index 0s;
}
.map-node:hover { z-index: 100 !important; }
.node-icon-wrapper {
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s ease; color: var(--c-gold);
}
.node-svg {
  width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2px;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.8));
}
.size-small { width: 24px; height: 24px; }
.size-medium { width: 32px; height: 32px; }
.size-large { width: 48px; height: 48px; }

.map-node:hover .node-icon-wrapper { transform: scale(1.3); color: #fff; filter: drop-shadow(0 0 5px var(--c-gold)); }
.node-label {
  margin-top: 5px; font-size: 0.8rem; color: #aaa; text-shadow: 0 2px 4px #000;
  background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; pointer-events: none;
}
.is-player-here .node-label { color: var(--c-gold); font-weight: bold; border: 1px solid var(--c-gold); }

/* 搜索高亮样式 */
.is-search-target .node-icon-wrapper {
  color: #fff;
  filter: drop-shadow(0 0 10px var(--c-gold));
  animation: pulse-target 1.5s infinite;
}
.is-search-target .node-label {
  color: #fff;
  background: var(--c-gold);
  color: #000;
  font-weight: bold;
}

@keyframes pulse-target {
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}

.player-indicator {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;
}
.indicator-ring {
  width: 60px; height: 60px; border: 2px dashed var(--c-gold); border-radius: 50%;
  animation: spin 10s linear infinite; opacity: 0.5;
}
.indicator-text {
  position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
  font-size: 0.7rem; color: var(--c-gold); font-weight: bold;
  white-space: nowrap;
}

/* 2. UI Overlay 层 (HUD) */
.vision-ui-overlay {
  position: absolute; inset: 0; pointer-events: none; /* 让鼠标穿透到地图 */
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 20px;
}
.vision-ui-overlay > * { pointer-events: auto; /* 恢复UI元素的交互 */ }

/* 顶部面包屑 */
.region-breadcrumbs {
  display: flex; justify-content: space-between; align-items: center;
  background: linear-gradient(90deg, var(--c-bg-panel), transparent);
  padding: 10px 20px; border-left: 3px solid var(--c-gold);
  margin-top: 10px;
}
.breadcrumb-track .crumb-item {
  font-family: var(--font-cinzel); font-size: 1rem; color: #888; cursor: pointer; margin-right: 10px;
}
.breadcrumb-track .crumb-item::after { content: '/'; margin-left: 10px; color: #444; }
.breadcrumb-track .crumb-item:last-child { color: var(--c-gold); cursor: default; }
.breadcrumb-track .crumb-item:last-child::after { content: ''; }
.coords-readout { font-family: monospace; color: #666; font-size: 0.8rem; }

/* 搜索功能样式 */
.search-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.search-toggle-btn {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid var(--c-gold);
  color: var(--c-gold);
  padding: 8px 15px;
  font-family: var(--font-cinzel);
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(5px);
}

.search-toggle-btn:hover, .search-toggle-btn.active {
  background: var(--c-gold);
  color: #000;
}

.search-panel {
  margin-top: 10px;
  width: 280px;
  background: var(--c-bg-panel);
  border: 1px solid #444;
  border-top: 2px solid var(--c-gold);
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-input {
  width: 100%;
  background: rgba(0,0,0,0.3);
  border: 1px solid #444;
  color: #eee;
  padding: 8px;
  font-family: inherit;
  outline: none;
}
.search-input:focus { border-color: var(--c-gold); }

.search-results-list {
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid #333;
}

.search-result-item {
  padding: 8px;
  cursor: pointer;
  border-bottom: 1px solid #2a2a2a;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: rgba(197, 160, 89, 0.1);
}

.res-name { color: var(--c-gold); font-weight: bold; font-size: 0.9rem; }
.res-path { color: #666; font-size: 0.75rem; margin-top: 2px; }

.search-no-result {
  color: #666;
  text-align: center;
  padding: 10px;
  font-size: 0.8rem;
}

/* 底部 HUD */
.world-hud {
  align-self: flex-end; margin-bottom: 20px;
  background: linear-gradient(to left, var(--c-bg-panel), rgba(0,0,0,0));
  padding: 15px 30px; border-right: 3px solid var(--c-gold);
  text-align: right; min-width: 300px;
}
.hud-content { position: relative; }
.hud-row { display: flex; align-items: center; justify-content: flex-end; gap: 20px; }
.hud-block { display: flex; flex-direction: column; }
.hud-block .label { font-size: 0.7rem; color: #666; letter-spacing: 1px; margin-bottom: 4px; }
.hud-block .value.main { font-family: var(--font-cinzel); font-size: 1.5rem; color: #eee; font-weight: bold; }
.hud-block .value.sub { font-size: 0.9rem; color: var(--c-gold); font-style: italic; }
.hud-divider { width: 1px; height: 40px; background: #444; }

.danger-alert {
  position: absolute; top: -40px; right: 0; color: #b03a48;
  font-family: var(--font-cinzel); font-weight: bold; letter-spacing: 2px;
  display: flex; align-items: center; gap: 8px; animation: pulse 2s infinite;
}

/* 悬浮按钮 */
.back-level-btn {
  position: absolute; bottom: 40px; left: 40px;
  background: rgba(0,0,0,0.8); border: 1px solid var(--c-gold); color: var(--c-gold);
  padding: 10px 20px; font-family: var(--font-cinzel); cursor: pointer;
  display: flex; align-items: center; gap: 10px; transition: all 0.3s;
}
.back-level-btn:hover { background: var(--c-gold); color: #000; }

/* 详情弹窗 */
.node-tooltip {
  position: absolute; top: 20%; right: 40px; width: 300px;
  background: var(--c-bg-panel); border: 1px solid #444; border-top: 3px solid var(--c-gold);
  box-shadow: 0 10px 30px rgba(0,0,0,0.8); backdrop-filter: blur(10px);
}
.tooltip-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15px; border-bottom: 1px solid #333;
}
.tooltip-header h3 { margin: 0; color: var(--c-gold); font-family: var(--font-cinzel); }
.close-icon { background: none; border: none; color: #666; font-size: 1.5rem; cursor: pointer; }
.tooltip-body { padding: 15px; color: #ccc; font-size: 0.9rem; }
.tooltip-body .coords { font-family: monospace; color: #666; margin: 5px 0 10px; font-size: 0.8rem; }
.details-list { padding-left: 20px; color: #888; font-size: 0.85rem; }

/* 优化后的底部按钮布局 */
.tooltip-footer {
  padding: 15px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap; /* 允许换行 */
}
.action-btn {
  flex: 1 1 40%; /* 默认两个按钮一行 */
  padding: 8px;
  cursor: pointer;
  font-family: var(--font-cinzel);
  transition: all 0.2s;
  min-width: 80px;
}
.action-btn.primary { background: var(--c-gold); border: none; color: #000; font-weight: bold; }
.action-btn.primary:hover { background: #fff; }
.action-btn.secondary { background: transparent; border: 1px solid #666; color: #aaa; }
.action-btn.secondary:hover { border-color: #fff; color: #fff; }
.action-btn.confirm-selection { background: var(--c-gold); border: 1px solid var(--c-gold); color: #000; font-weight: bold; }
.action-btn.confirm-selection:hover { background: #fff; box-shadow: 0 0 15px rgba(197, 160, 89, 0.8); }

/* 删除按钮样式 - 独占一行 */
.action-btn.delete-btn {
  flex: 1 1 100%; /* 强制占满一行 */
  margin-top: 5px; /* 增加顶部间距 */
  background: rgba(176, 58, 72, 0.15);
  border: 1px solid #b03a48;
  color: #b03a48;
}
.action-btn.delete-btn:hover {
  background: #b03a48;
  color: #fff;
  box-shadow: 0 0 10px rgba(176, 58, 72, 0.5);
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
.map-fade-enter-active, .map-fade-leave-active { transition: opacity 0.5s ease; }
.map-fade-enter-from, .map-fade-leave-to { opacity: 0; }
.scale-fade-enter-active, .scale-fade-leave-active { transition: all 0.3s ease; }
.scale-fade-enter-from, .scale-fade-leave-to { opacity: 0; transform: translateX(20px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 新增样式：选择模式下的确认按钮 */
.action-btn.confirm-selection {
  background: var(--c-gold);
  color: #000;
  border: 1px solid var(--c-gold);
  font-weight: bold;
  animation: pulse-btn 2s infinite;
}

@keyframes pulse-btn {
  0% { box-shadow: 0 0 0 0 rgba(197, 160, 89, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(197, 160, 89, 0); }
  100% { box-shadow: 0 0 0 0 rgba(197, 160, 89, 0); }
}

/* 选择模式下的指示器样式 */
.player-indicator.selection-mode .indicator-text {
  color: #4caf50;
  font-weight: bold;
}

.player-indicator.selection-mode .indicator-ring {
  border-color: #4caf50;
}

/* 选择模式 HUD 样式 */
.selection-hud .value.main {
  color: var(--c-gold);
}

/* --- 移动端适配 --- */
@media (max-width: 768px) {
  /* 1. 调整 UI 层容器 */
  .vision-ui-overlay {
    padding: 10px;
    /* 确保 UI 元素不会超出屏幕 */
    width: 100vw;
    box-sizing: border-box;
  }

  /* 2. 顶部面包屑调整 */
  .region-breadcrumbs {
    padding: 5px 10px;
    font-size: 0.9rem;
    max-width: 100%;
    overflow: hidden;
  }
  /* 移动端隐藏坐标显示，节省空间 */
  .coords-readout {
    display: none;
  }

  /* 搜索框移动端适配 */
  .search-container {
    top: 60px; /* 避开面包屑 */
    right: 10px;
  }
  .search-panel {
    width: 200px; /* 缩小宽度 */
  }

  /* 3. 底部 HUD (世界信息) 改为底部通栏 */
  .world-hud {
    width: 100%;
    min-width: unset; /* 取消最小宽度限制 */
    margin-bottom: 0;
    padding: 10px 15px;
    border-right: none;
    border-top: 2px solid var(--c-gold);
    background: rgba(20, 22, 28, 0.98); /* 加深背景防止看不清 */

    /* 绝对定位到底部，防止被其他元素挤压 */
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
  }

  .hud-row {
    justify-content: space-between; /* 分散对齐 */
    gap: 10px;
  }

  /* 缩小 HUD 字体 */
  .hud-block .value.main {
    font-size: 1rem;
  }
  .hud-block .label {
    font-size: 0.6rem;
  }
  .hud-block .value.sub {
    font-size: 0.7rem;
  }

  /* 缩小面包屑字体 */
  .breadcrumb-track .crumb-item {
    font-size: 0.8rem;
  }

  /* 4. 详情弹窗 (Tooltip) 改为底部抽屉模式 */
  .node-tooltip {
    top: auto !important;
    right: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    max-height: 60vh; /* 最大高度不超过屏幕60% */
    overflow-y: auto;
    border: none;
    border-top: 3px solid var(--c-gold);
    z-index: 1000; /* 确保在 HUD 之上 */

    /* 动画改为从底部滑入 */
    transform-origin: bottom center;
  }

  /* 5. 调整返回按钮位置 */
  .back-level-btn {
    bottom: 100px; /* 抬高位置，避开底部的 HUD */
    left: 10px;
    padding: 8px 12px;
    font-size: 0.8rem;
  }

  /* 6. 危险警告位置微调 */
  .danger-alert {
    top: -30px;
    font-size: 0.8rem;
  }

  /* 7. 新增：缩小图标和字体 */
  .node-icon-wrapper {
    width: 24px; height: 24px; /* 强制缩小基础尺寸 */
  }
  .node-icon-wrapper.size-large { width: 32px; height: 32px; }
  .node-icon-wrapper.size-small { width: 16px; height: 16px; }

  .node-label {
    font-size: 0.6rem; /* 缩小标签字体 */
    padding: 1px 4px;
  }
}
</style>
