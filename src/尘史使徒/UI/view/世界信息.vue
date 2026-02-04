<!-- Vision.vue -->
<template>
  <div class="vision-container" :class="{ 'danger-mode': isDanger ,'dark-mode': uiStore.darkMode }">

    <!-- 1. 地图层 (交互核心) -->
    <div class="map-viewport" ref="viewportRef"
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

            <div v-if="node.name === playerLocationName" class="player-indicator">
              <div class="indicator-ring"></div>
              <span class="indicator-text">YOU</span>
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
                @click="navigateToLayer(crumb)">
            {{ crumb.name }}
          </span>
        </div>
        <div class="coords-readout">
          CURSOR [ {{ hoverCoords.x }} , {{ hoverCoords.y }} ]
        </div>
      </div>

      <!-- 底部右侧：世界状态 HUD (从Layout移入) -->
      <div class="world-hud" v-if="worldInfo">
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

      <!-- 返回上级按钮 (悬浮) -->
      <transition name="fade">
        <button v-if="breadcrumbs.length > 1" class="back-level-btn" @click.stop="goUpOneLevel">
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
            <button v-if="hasChildren(tooltip.data)" class="action-btn primary" @click="enterArea(tooltip.data)">
              ENTER REGION
            </button>
            <button class="action-btn secondary" @click="handleTravel(tooltip.data)">
              TRAVEL HERE
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';

const uiStore = useUiStore();

// =====================
// 图标数据 (保持原样)
// =====================
const iconPaths = {
  'Default': 'M12 2L2 12l10 10 10-10L12 2zm0 4v2m0 8v2m-4-6h2m4 0h2',
  'Kingdom': 'M2 18h20M4 14l3-8 5 5 5-5 3 8H4z',
  'City': 'M4 21V8l7-5 7 5v13H4zm4-9h2v4H8v-4zm6 0h2v4h-2v-4z',
  'Palace': 'M2 22h20M12 2L2 7v2h20V7L12 2zM5 22V9m14 13V9M9 22V9m6 13V9',
  'District': 'M12 2L2 12l10 10 10-10L12 2zM7 7l10 10M17 7L7 17',
  'Villa_Icon': 'M3 21h18M12 3L2 10h3v11h14V10h3L12 3zm-2 8h4v4h-4v-4z',
  'Hill': 'M2 20h20L12 4 2 20zm5.5-4.5l4.5-7 4.5 7h-9z',
  'Mountain': 'M2 22h20L12 2 2 22zm5-5l5-10 5 10H7z',
  'Forest': 'M12 2L2 22h20L12 2zm0 6l-4 8h8l-4-8z',
  'Swamp': 'M2 18c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4zm10 0c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4zM6 8c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4z',
  'Desert': 'M2 22h20c-2-4-5-8-10-8S4 18 2 22zm10-18a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  'Badlands': 'M2 22l4-10 4 6 4-8 4 10 4-2',
  'Ice': 'M12 2v20M2 12h20M4.9 4.9l14.2 14.2M4.9 19.1L19.1 4.9',
  'Sea': 'M2 12c2 0 3 2 5 2s3-2 5-2 3 2 5 2 3-2 5 2 3-2 5 2 3-2 5-2v4c-2 0-3 2-5 2s-3-2-5-2-3 2-5 2-3-2-5-2v-4z',
  'Demon': 'M12 2c-4 0-8 4-8 9 0 5 4 9 8 9s8-4 8-9c0-5-4-9-8-9zm-3 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  'Plaza': 'M3 3h18v18H3V3zm4 4v10h10V7H7zm3 3h4v4h-4v-4z',
  'Sewer': 'M4 8h16M4 12h16M4 16h16M8 4v16M16 4v16',
  'Chapel': 'M12 22V10M12 2a3 3 0 0 1 3 3c0 2-3 5-3 5s-3-3-3-5a3 3 0 0 1 3-3z',
  'Temple_Icon': 'M12 2v4m0 12v4M2 12h4m12 0h4m-2.5-6.5l-2.8 2.8m-5.4 5.4l-2.8 2.8m0-11l2.8 2.8m5.4 5.4l2.8 2.8M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'Graveyard': 'M12 3v18M8 8h8M6 21h12',
  'Camp': 'M3 21h18L12 3 3 21zm9-5v5',
  'BlackMarket': 'M12 2a7 7 0 0 0-7 7v5l3 3h8l3-3V9a7 7 0 0 0-7-7zm-3 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  'Slum': 'M4 21h16M4 10l8-7 8 7v11h-4v-6h-4v6H4V10zm2 4h2v2H6v-2z',
  'Academy': 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5H6.5a2.5 2.5 0 0 1 0-5H20',
  'Industry_Icon': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6a4 4 0 1 1 0-8 4 4 0 0 1 0 8z',
  'Furnace_Icon': 'M4 20h16v-8H4v8zm2-8V8l6-4 6 4v4M8 16h8v2H8v-2z',
  'Factory': 'M2 22h20M18 10l-4-4-4 4V6L6 2v20h12V10z',
  'Mine': 'M18 2l2 2-8 8 2 2-2 2-2-2-8 8-2-2 8-8-2-2 2-2 2 2 8-8z',
  'Tower': 'M12 2L6 22h12L12 2zm0 4v2m0 4v2',
  'Port': 'M12 2v17m0 0a5 5 0 0 1-5-5H5a7 7 0 0 0 14 0h-2a5 5 0 0 1-5 5zM9 5h6',
  'Dock_Icon': 'M4 18h16M6 18V8l6-4 6 4v10M9 14h6',
  'Market': 'M12 3v18M3 8l5-2 4 2M12 8l4-2 5 2M8 8v8a3 3 0 0 0 6 0V8',
  'Market_Icon': 'M12 3v18M3 8l5-2 4 2M12 8l4-2 5 2M8 8v8a3 3 0 0 0 6 0V8',
  'Inn_Icon': 'M5 20h14M5 10v10M19 10v10M3 10h18M7 5h10v5H7V5z',
};
const getIconPath = (type) => {
  if (!type) return iconPaths['Default'];
  if (iconPaths[type]) return iconPaths[type];
  const cleanName = type.replace('_Icon', '');
  if (iconPaths[cleanName]) return iconPaths[cleanName];
  return iconPaths['Default'];
};

// =====================
// 状态与数据
// =====================
const store = useStatStore();
const { stat_data } = storeToRefs(store);

// --- 世界信息 (从 Layout 迁移而来) ---
const worldInfo = computed(() => stat_data.value?.['世界'] || {});
const isDanger = computed(() => worldInfo.value?.['危险场景'] === true);

const formattedTime = computed(() => {
  const rawTime = worldInfo.value?.['时间'];
  if (!rawTime) return { date: '--', clock: '--:--', weekday: '' };
  try {
    const match = rawTime.match(/^(.*?)\[(\d+)\]$/);
    let dateTimeStr = rawTime;
    let weekIndex = '1';
    if (match) { dateTimeStr = match[1]; weekIndex = match[2]; }
    const [datePart, timePart] = dateTimeStr.split('T');
    const weekMap = { '1': 'MON', '2': 'TUE', '3': 'WED', '4': 'THU', '5': 'FRI', '6': 'SAT', '7': 'SUN' };
    return { date: datePart, clock: timePart, weekday: weekMap[weekIndex] || `DAY ${weekIndex}` };
  } catch (e) { return { date: rawTime, clock: '', weekday: '' }; }
});

// --- 地图状态 ---
const viewportRef = ref(null);
const currentRootNode = ref(null);
const breadcrumbs = ref([]);
const hoverCoords = reactive({ x: 0, y: 0 });
const tooltip = reactive({ visible: false, data: {}, x: 0, y: 0 });

// 视图变换
const transform = reactive({ k: 1, x: 0, y: 0 });
const baseScale = ref(1);
const isPointerDown = ref(false);
const isMapDragging = ref(false);
const dragStart = { x: 0, y: 0 };
const lastTransform = { x: 0, y: 0 };
const DRAG_THRESHOLD = 3;

// =====================
// 地图逻辑
// =====================
const playerLocationName = computed(() => stat_data.value?.世界?.['地图索引'] || '');

const findNodeAndPath = (root, targetName, currentPath = []) => {
  if (!root) return null;
  for (const [key, value] of Object.entries(root)) {
    if (key === targetName) {
      return { node: value, path: [...currentPath, { name: key, node: value }] };
    }
    if (value['子地图']) {
      const result = findNodeAndPath(value['子地图'], targetName, [...currentPath, { name: key, node: value }]);
      if (result) return result;
    }
  }
  return null;
};

const initMapPosition = () => {
  if (!stat_data.value?.地图) return;
  const rootMap = stat_data.value.地图;
  const target = playerLocationName.value;
  const defaultRootKey = Object.keys(rootMap)[0];
  const defaultRoot = { name: defaultRootKey, node: rootMap[defaultRootKey] };

  if (target) {
    const result = findNodeAndPath(rootMap, target);
    if (result && result.path.length > 1) {
      const parentPathItem = result.path[result.path.length - 2];
      currentRootNode.value = parentPathItem.node;
      breadcrumbs.value = result.path.slice(0, result.path.length - 1);
    } else {
      currentRootNode.value = rootMap[defaultRootKey];
      breadcrumbs.value = [defaultRoot];
    }
  } else {
    currentRootNode.value = rootMap[defaultRootKey];
    breadcrumbs.value = [defaultRoot];
  }
  nextTick(() => { updateBaseScale(); resetView(); });
};

watch(() => stat_data.value, (newVal) => {
  if (newVal && !currentRootNode.value) initMapPosition();
}, { immediate: true });

const currentDisplayNodes = computed(() => {
  if (!currentRootNode.value || !currentRootNode.value['子地图']) return [];
  const rawNodes = [];
  const subMap = currentRootNode.value['子地图'];
  for (const [key, val] of Object.entries(subMap)) {
    const xRange = val.方位?.x || [0, 0];
    const yRange = val.方位?.y || [0, 0];
    const zRange = val.方位?.z || [0, 0];
    rawNodes.push({
      name: key,
      rawX: (xRange[0] + xRange[1]) / 2,
      rawY: (yRange[0] + yRange[1]) / 2,
      z: (zRange[0] + zRange[1]) / 2,
      displayX: (xRange[0] + xRange[1]) / 2,
      displayY: (yRange[0] + yRange[1]) / 2,
      desc: val.描述,
      details: val.详情,
      icon: val.图标,
      hasChildren: !!val['子地图'],
      originalData: val
    });
  }
  // 简单的重叠处理
  const positionMap = new Map();
  rawNodes.forEach(node => {
    const key = `${node.rawX.toFixed(1)},${node.rawY.toFixed(1)}`;
    if (!positionMap.has(key)) positionMap.set(key, []);
    positionMap.get(key).push(node);
  });
  positionMap.forEach((nodes) => {
    if (nodes.length > 1) {
      nodes.forEach((node, index) => {
        if (index === 0) return;
        node.displayX += (Math.cos(index) * 0.5);
        node.displayY += (Math.sin(index) * 0.5);
      });
    }
  });
  return rawNodes;
});

const updateBaseScale = () => {
  if (!viewportRef.value || !currentDisplayNodes.value.length) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  currentDisplayNodes.value.forEach(node => {
    minX = Math.min(minX, node.displayX); maxX = Math.max(maxX, node.displayX);
    minY = Math.min(minY, node.displayY); maxY = Math.max(maxY, node.displayY);
  });
  if (maxX - minX < 1) { minX -= 5; maxX += 5; }
  if (maxY - minY < 1) { minY -= 5; maxY += 5; }
  const scaleX = viewportRef.value.clientWidth / (maxY - minY);
  const scaleY = viewportRef.value.clientHeight / (maxX - minX);
  baseScale.value = Math.min(Math.max(Math.min(scaleX, scaleY) * 0.6, 0.5), 150);
};

// =====================
// 样式与交互
// =====================
const translateStyle = computed(() => ({ transform: `translate(${transform.x}px, ${transform.y}px)` }));
const gridStyle = computed(() => ({ backgroundSize: `${100 * transform.k}px ${100 * transform.k}px` }));

const getNodeStyle = (node) => {
  const scale = baseScale.value * transform.k;
  return {
    left: `calc(50% + ${node.displayY * scale}px)`,
    top: `calc(50% + ${-node.displayX * scale}px)`,
    zIndex: Math.floor(node.z * 100) + 10
  };
};

const getNodeSizeClass = (node) => {
  if (baseScale.value > 40) return 'size-large';
  if (baseScale.value < 2) return 'size-small';
  return 'size-medium';
};

const hasChildren = (nodeData) => nodeData.originalData && !!nodeData.originalData['子地图'];

const navigateToLayer = (crumb) => {
  const idx = breadcrumbs.value.findIndex(c => c.name === crumb.name);
  if (idx !== -1) {
    breadcrumbs.value = breadcrumbs.value.slice(0, idx + 1);
    currentRootNode.value = crumb.node;
    resetView();
  }
};

const enterArea = (nodeData) => {
  if (hasChildren(nodeData)) {
    breadcrumbs.value.push({ name: nodeData.name, node: nodeData.originalData });
    currentRootNode.value = nodeData.originalData;
    resetView();
  }
};

const goUpOneLevel = () => {
  if (breadcrumbs.value.length > 1) {
    breadcrumbs.value.pop();
    currentRootNode.value = breadcrumbs.value[breadcrumbs.value.length - 1].node;
    resetView();
  }
};

const resetView = () => {
  transform.k = 1; transform.x = 0; transform.y = 0;
  closeTooltip();
  nextTick(updateBaseScale);
};

const handleNodeClick = (node) => {
  if (isMapDragging.value) return;
  tooltip.data = node;
  tooltip.visible = true;
};

const handleTravel = (targetNode) => {
  const option = `<user>打算前往${targetNode.name}`;
  try {
    const input = window.parent.document.querySelector('#send_textarea');
    if (input) {
      input.value = input.value.trim() ? `${input.value.trim()} ${option}` : option;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    }
    closeTooltip();
  } catch (error) { console.error("Interaction Error:", error); }
};

// 鼠标/触摸逻辑
const handleWheel = (e) => {
  const rect = viewportRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left - rect.width / 2;
  const mouseY = e.clientY - rect.top - rect.height / 2;
  const scaleFactor = 1 + (0.1 * -Math.sign(e.deltaY));
  const newScale = Math.min(Math.max(transform.k * scaleFactor, 0.3), 4.0);
  transform.x = mouseX - (mouseX - transform.x) * (newScale / transform.k);
  transform.y = mouseY - (mouseY - transform.y) * (newScale / transform.k);
  transform.k = newScale;
  updateCursor(e);
};

const handleMouseDown = (e) => {
  isPointerDown.value = true; isMapDragging.value = false;
  dragStart.x = e.clientX; dragStart.y = e.clientY;
  lastTransform.x = transform.x; lastTransform.y = transform.y;
};
const handleMouseMove = (e) => {
  updateCursor(e);
  if (!isPointerDown.value) return;
  const dx = e.clientX - dragStart.x; const dy = e.clientY - dragStart.y;
  if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
    isMapDragging.value = true;
    transform.x = lastTransform.x + dx;
    transform.y = lastTransform.y + dy;
  }
};
const handleMouseUp = () => { isPointerDown.value = false; setTimeout(() => isMapDragging.value = false, 0); };
const handleTouchStart = (e) => { if(e.touches.length===1) handleMouseDown(e.touches[0]); };
const handleTouchMove = (e) => { e.preventDefault(); if(e.touches.length===1) handleMouseMove(e.touches[0]); };
const handleTouchEnd = () => handleMouseUp();
const handleBackgroundClick = () => { if (!isMapDragging.value) closeTooltip(); };
const closeTooltip = () => { tooltip.visible = false; };

const updateCursor = (e) => {
  if (!viewportRef.value) return;
  const rect = viewportRef.value.getBoundingClientRect();
  const clientX = e.clientX || (e.touches?.[0]?.clientX) || 0;
  const clientY = e.clientY || (e.touches?.[0]?.clientY) || 0;
  const scale = baseScale.value * transform.k;
  const rawPixelX = (clientX - rect.left) - transform.x - rect.width / 2;
  const rawPixelY = (clientY - rect.top) - transform.y - rect.height / 2;
  hoverCoords.x = -(rawPixelY / scale).toFixed(1);
  hoverCoords.y = (rawPixelX / scale).toFixed(1);
};

// 生命周期
let resizeObserver = null;
onMounted(() => {
  if (viewportRef.value) {
    resizeObserver = new ResizeObserver(() => updateBaseScale());
    resizeObserver.observe(viewportRef.value);
  }
  if (stat_data.value) initMapPosition();
});
onUnmounted(() => { if (resizeObserver) resizeObserver.disconnect(); });
</script>

<style scoped>
.vision-container {
  width: 100%;
  height: 100%; /* 兼容非 Flex 环境 */
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
.tooltip-footer { padding: 15px; display: flex; gap: 10px; }
.action-btn { flex: 1; padding: 8px; cursor: pointer; font-family: var(--font-cinzel); transition: all 0.2s; }
.action-btn.primary { background: var(--c-gold); border: none; color: #000; font-weight: bold; }
.action-btn.primary:hover { background: #fff; }
.action-btn.secondary { background: transparent; border: 1px solid #666; color: #aaa; }
.action-btn.secondary:hover { border-color: #fff; color: #fff; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
.map-fade-enter-active, .map-fade-leave-active { transition: opacity 0.5s ease; }
.map-fade-enter-from, .map-fade-leave-to { opacity: 0; }
.scale-fade-enter-active, .scale-fade-leave-active { transition: all 0.3s ease; }
.scale-fade-enter-from, .scale-fade-leave-to { opacity: 0; transform: translateX(20px); }

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

  .hud-block .value.main {
    font-size: 1.1rem; /* 稍微调小字体 */
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
}
</style>
