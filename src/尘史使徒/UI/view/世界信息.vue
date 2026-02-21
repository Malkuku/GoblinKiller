<template>
  <div class="vision-container" :class="{ 'danger-mode': isDanger && mode === 'gameplay', 'dark-mode': uiStore.darkMode }">

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
                @click="navigateToLayer(crumb)">
            {{ crumb.name }}
          </span>
        </div>
      </div>

      <!-- 新增：搜索功能区 (右上角) -->
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
            <!-- 主要操作按钮组 -->
            <button v-if="hasChildren(tooltip.data)" class="action-btn primary" @click="enterArea(tooltip.data)">
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
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';
import { ERAUtil } from '@/Utils/ERAUtil';

// === 新增 Props 和 Emits ===
const props = defineProps({
  mode: {
    type: String,
    default: 'gameplay', // 'gameplay' | 'selection'
    validator: (value) => ['gameplay', 'selection'].includes(value)
  }
});

const emit = defineEmits(['select']);

const router = useRouter();
const uiStore = useUiStore();

// =====================
// 图标数据
// =====================
const iconPaths = {
  'Default': 'M12 2L2 12l10 10 10-10L12 2zm0 4v2m0 8v2m-4-6h2m4 0h2',
  '王国': 'M2 18h20M4 14l3-8 5 5 5-5 3 8H4z',
  '城市': 'M4 21V8l7-5 7 5v13H4zm4-9h2v4H8v-4zm6 0h2v4h-2v-4z',
  '宫殿': 'M2 22h20M12 2L2 7v2h20V7L12 2zM5 22V9m14 13V9M9 22V9m6 13V9',
  '街区': 'M12 2L2 12l10 10 10-10L12 2zM7 7l10 10M17 7L7 17',
  '别墅': 'M3 21h18M12 3L2 10h3v11h14V10h3L12 3zm-2 8h4v4h-4v-4z',
  '山丘': 'M2 20h20L12 4 2 20zm5.5-4.5l4.5-7 4.5 7h-9z',
  '高山': 'M2 22h20L12 2 2 22zm5-5l5-10 5 10H7z',
  '沼泽': 'M2 18c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4zm10 0c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4zM6 8c0-2 2-4 4-4s4 2 4 4-2 4-4 4-4-2-4-4z',
  '荒地': 'M2 22l4-10 4 6 4-8 4 10 4-2',
  '冰原': 'M12 2v20M2 12h20M4.9 4.9l14.2 14.2M4.9 19.1L19.1 4.9',
  '恶魔': 'M12 2c-4 0-8 4-8 9 0 5 4 9 8 9s8-4 8-9c0-5-4-9-8-9zm-3 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  '广场': 'M3 3h18v18H3V3zm4 4v10h10V7H7zm3 3h4v4h-4v-4z',
  '下水道': 'M4 8h16M4 12h16M4 16h16M8 4v16M16 4v16',
  '教堂': 'M12 22V10M12 2a3 3 0 0 1 3 3c0 2-3 5-3 5s-3-3-3-5a3 3 0 0 1 3-3z',
  '神殿': 'M12 2v4m0 12v4M2 12h4m12 0h4m-2.5-6.5l-2.8 2.8m-5.4 5.4l-2.8 2.8m0-11l2.8 2.8m5.4 5.4l2.8 2.8M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  '墓地': 'M12 3v18M8 8h8M6 21h12',
  '营地': 'M3 21h18L12 3 3 21zm9-5v5',
  '黑市': 'M12 2a7 7 0 0 0-7 7v5l3 3h8l3-3V9a7 7 0 0 0-7-7zm-3 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  '贫民窟': 'M4 21h16M4 10l8-7 8 7v11h-4v-6h-4v6H4V10zm2 4h2v2H6v-2z',
  '学院': 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5H6.5a2.5 2.5 0 0 1 0-5H20',
  '工业区': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6a4 4 0 1 1 0-8 4 4 0 0 1 0 8z',
  '熔炉': 'M4 20h16v-8H4v8zm2-8V8l6-4 6 4v4M8 16h8v2H8v-2z',
  '工厂': 'M2 22h20M18 10l-4-4-4 4V6L6 2v20h12V10z',
  '矿场': 'M18 2l2 2-8 8 2 2-2 2-2-2-8 8-2-2 8-8-2-2 2-2 2 2 8-8z',
  '塔楼': 'M12 2L6 22h12L12 2zm0 4v2m0 4v2',
  '港口': 'M12 2v17m0 0a5 5 0 0 1-5-5H5a7 7 0 0 0 14 0h-2a5 5 0 0 1-5 5zM9 5h6',
  '码头': 'M4 18h16M6 18V8l6-4 6 4v10M9 14h6',
  '市场': 'M12 3v18M3 8l5-2 4 2M12 8l4-2 5 2M8 8v8a3 3 0 0 0 6 0V8',
  '住所': 'M5 20h14M5 10v10M19 10v10M3 10h18M7 5h10v5H7V5z',
  '森林': 'M12 2L7 12h3v10h4V12h3L12 2zM5 14l3-6H6l3-6 3 6h-2l3 6H5z',
  '海洋': 'M2 16c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2v3H2v-3zm0-6c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2v3H2v-3z',
  '沙漠': 'M2 22h20c-2-5-5-9-10-9S4 17 2 22zm16-15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  '天空': 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
  '侵蚀地': 'M2 22l6-18 4 10 6-12 4 20H2zM12 12l-2 4h4l-2-4z',
  '藏宝地': 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 4v10h14V8H5zm7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
};

const getIconPath = (type) => {
  if (!type) return iconPaths['Default'];
  // 直接匹配中文
  if (iconPaths[type]) return iconPaths[type];
  // 兼容处理：移除可能存在的 _Icon 后缀
  const cleanName = type.replace('_Icon', '').replace('Icon', '');
  if (iconPaths[cleanName]) return iconPaths[cleanName];
  return iconPaths['Default'];
};

// =====================
// 状态与数据
// =====================
const store = useStatStore();
const { stat_data } = storeToRefs(store);

// --- 世界信息 ---
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
const lastClientWidth = ref(0);
const isPointerDown = ref(false);
const isMapDragging = ref(false);
const dragStart = { x: 0, y: 0 };
const lastTransform = { x: 0, y: 0 };
const DRAG_THRESHOLD = 3;

// 移动端双指缩放状态
const isPinching = ref(false);
const lastTouchDist = ref(0);

// =====================
// 搜索功能逻辑
// =====================
const isSearchOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const searchInputRef = ref(null);

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
  if (isSearchOpen.value) {
    nextTick(() => {
      if (searchInputRef.value) searchInputRef.value.focus();
    });
  } else {
    searchQuery.value = '';
    searchResults.value = [];
  }
};

// 递归搜索函数
const globalSearch = (root, query, path = []) => {
  let results = [];
  if (!root) return results;

  for (const [key, value] of Object.entries(root)) {
    // 检查当前节点名称是否包含查询词 (忽略大小写)
    if (key.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        name: key,
        node: value,
        path: [...path, { name: key, node: value }]
      });
    }

    // 递归搜索子地图
    if (value['子地图']) {
      const subResults = globalSearch(value['子地图'], query, [...path, { name: key, node: value }]);
      results = results.concat(subResults);
    }
  }
  return results;
};

const handleSearchInput = () => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    searchResults.value = [];
    return;
  }

  if (stat_data.value?.地图) {
    // 从根节点开始搜索
    searchResults.value = globalSearch(stat_data.value.地图, searchQuery.value.trim());
  }
};

const formatPath = (pathArray) => {
  return pathArray.map(p => p.name).join(' > ');
};

const handleJumpToResult = (result) => {
  // 1. 确定要显示的层级
  // 如果结果路径长度 > 1，说明它在某个父节点下，我们应该导航到它的父节点，这样能在地图上看到它
  // 如果结果是根节点（路径长度1），直接显示它

  let targetBreadcrumbs = [];
  let targetRoot = null;

  if (result.path.length > 1) {
    // 取父路径作为面包屑
    targetBreadcrumbs = result.path.slice(0, result.path.length - 1);
    targetRoot = targetBreadcrumbs[targetBreadcrumbs.length - 1].node;
  } else {
    // 已经是顶层，直接显示
    targetBreadcrumbs = result.path;
    targetRoot = result.node;
  }

  // 2. 更新视图状态
  breadcrumbs.value = targetBreadcrumbs;
  currentRootNode.value = targetRoot;

  // 4. 重置视图并尝试打开详情
  resetView();

  // 5. 尝试在当前显示的节点列表中找到该节点并打开 Tooltip
  nextTick(() => {
    const targetNodeInDisplay = currentDisplayNodes.value.find(n => n.name === result.name);
    if (targetNodeInDisplay) {
      handleNodeClick(targetNodeInDisplay);

      // 自动居中到该节点
      transform.x = -targetNodeInDisplay.displayY * baseScale.value;
      transform.y = targetNodeInDisplay.displayX * baseScale.value;
    }
  });

  // 6. 关闭搜索面板 (可选，或者保留方便继续搜索)
  // isSearchOpen.value = false;
};

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

// 监听数据变化，自动刷新视图
watch(() => stat_data.value, (newVal) => {
  if (!newVal) return;

  if (!currentRootNode.value) {
    initMapPosition();
  } else {
    // 数据更新后，尝试保持在当前查看的层级
    // 获取当前视图的名称（从面包屑末尾获取）
    const currentViewName = breadcrumbs.value.length > 0
      ? breadcrumbs.value[breadcrumbs.value.length - 1].name
      : null;

    if (currentViewName) {
      // 在新数据中重新查找该节点
      const result = findNodeAndPath(newVal.地图, currentViewName);
      if (result) {
        // 更新节点引用和面包屑路径（确保引用的是新数据对象）
        currentRootNode.value = result.node;
        breadcrumbs.value = result.path;
      } else {
        // 如果当前查看的节点被删除了，或者找不到了，则重置回初始位置
        initMapPosition();
      }
    } else {
      initMapPosition();
    }
  }
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

// --- 修复1: 动态缩放与居中 ---
const updateBaseScale = (resetZoom = false) => {
  if (!viewportRef.value || !currentDisplayNodes.value.length) return;

  const rect = viewportRef.value.getBoundingClientRect();
  const currentWidth = rect.width;
  const isMobile = window.innerWidth < 768;

  // 1. 移动端防抖：如果宽度没变（仅高度变，例如地址栏伸缩），且不是强制重置，则跳过计算
  // 这能防止移动端浏览时地图突然跳动
  if (isMobile && !resetZoom && Math.abs(currentWidth - lastClientWidth.value) < 10) {
    return;
  }
  lastClientWidth.value = currentWidth;

  // 2. 计算节点边界
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  currentDisplayNodes.value.forEach(node => {
    minX = Math.min(minX, node.displayX); maxX = Math.max(maxX, node.displayX);
    minY = Math.min(minY, node.displayY); maxY = Math.max(maxY, node.displayY);
  });

  if (maxX - minX < 1) { minX -= 5; maxX += 5; }
  if (maxY - minY < 1) { minY -= 5; maxY += 5; }

  // 3. 计算适配比例
  // 移动端使用更大的 padding (0.95) 以利用更多屏幕空间
  const padding = isMobile ? 0.95 : 0.8;
  const scaleX = rect.width / (maxY - minY);
  const scaleY = rect.height / (maxX - minX);

  // 基础比例计算
  let newScale = Math.min(Math.max(Math.min(scaleX, scaleY) * padding, 0.5), 150);

  // 4. 移动端增益：强制放大，避免节点过小
  if (isMobile) {
    // 如果计算出的比例让地图显得太小，强制放大 1.3 倍，保证可点击性
    newScale = newScale * 1.3;
  }

  baseScale.value = newScale;

  // 5. 居中逻辑
  // 只有在 "强制重置" (切换地图) 或 "宽度发生实质变化" (旋转屏幕/桌面缩放) 时才重新居中
  if (resetZoom || Math.abs(currentWidth - lastClientWidth.value) > 10) {
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // 重新计算中心偏移量
    transform.x = -midY * newScale;
    transform.y = midX * newScale;

    // 只有在明确要求重置缩放级别时 (如进入新层级)，才重置 k=1
    // 这样 resize 时不会丢失用户的缩放状态
    if (resetZoom) {
      transform.k = 1;
    }
  }
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
  // 注意：这里不再重置 transform.x/y 为 0，因为 updateBaseScale 会计算正确的偏移
  closeTooltip();
  nextTick(() => updateBaseScale(true));
};

const handleNodeClick = (node) => {
  if (isMapDragging.value) return;
  tooltip.data = node;
  tooltip.visible = true;
};

// --- 修复2: 路径计算逻辑 ---
// 辅助：获取从根节点到目标节点的完整路径栈
const findPathStack = (root, targetName, currentStack = []) => {
  if (!root) return null;
  for (const [key, value] of Object.entries(root)) {
    if (key === targetName) {
      return [...currentStack, key];
    }
    if (value['子地图']) {
      const res = findPathStack(value['子地图'], targetName, [...currentStack, key]);
      if (res) return res;
    }
  }
  return null;
};

// 核心：计算导航路径 (LCA算法)
const getNavigationPath = (startName, endName) => {
  if (!stat_data.value?.地图) return [endName];
  const rootMap = stat_data.value.地图;

  const pathStart = findPathStack(rootMap, startName);
  const pathEnd = findPathStack(rootMap, endName);

  if (!pathStart || !pathEnd) return [endName]; // 找不到路径则直接返回目标

  // 寻找最近公共祖先索引
  let i = 0;
  while(i < pathStart.length && i < pathEnd.length && pathStart[i] === pathEnd[i]) {
    i++;
  }

  // 路径 = (起点到分叉点的逆序) + (分叉点到终点)
  // 注意：通常不需要包含分叉点本身作为步骤，除非它是换乘站。
  // 这里我们生成：离开A -> 离开B -> 进入C -> 进入D
  const upPath = pathStart.slice(i).reverse();
  const downPath = pathEnd.slice(i);

  const fullPath = [...upPath, ...downPath];
  return fullPath.length > 0 ? fullPath : [endName];
};

// =====================
// 删除地图功能
// =====================

/**
 * 判断是否可以删除该节点
 * 规则：不能删除包含玩家当前位置的节点（即不能是当前位置或其祖先节点）
 */
const canDelete = (node) => {
  if (!stat_data.value?.地图) return false;

  // 1. 获取玩家当前位置的完整路径
  const playerPath = findPathStack(stat_data.value.地图, playerLocationName.value);
  if (!playerPath) return true; // 玩家不在地图上？理论上可以删除任何东西

  // 2. 获取目标节点的完整路径
  // breadcrumbs 包含了当前视图容器的路径，加上目标节点名即为目标完整路径
  const currentPathNames = breadcrumbs.value.map(b => b.name);
  const targetPath = [...currentPathNames, node.name];

  // 3. 检查目标节点是否是玩家位置的祖先（或本身）
  // 如果玩家路径以目标路径开头，说明玩家在目标节点内部
  if (playerPath.length < targetPath.length) return true; // 目标比玩家位置更深，肯定是子节点，安全

  for (let i = 0; i < targetPath.length; i++) {
    if (playerPath[i] !== targetPath[i]) return true; // 路径分叉，安全
  }

  // 路径完全匹配，说明目标是玩家位置的祖先或本身，不可删除
  return false;
};

/**
 * 处理删除地图操作
 */
const handleDeleteMap = async (node) => {
  if (!confirm(`警告：确定要彻底删除 "${node.name}" 及其所有子区域吗？\n此操作将永久移除该地图节点，且不可恢复。`)) return;

  // 构建删除对象的路径
  // 结构示例: { "地图": { "World": { "子地图": { "City": { "子地图": { "Target": {} } } } } } }
  const payload = { "地图": {} };
  let ptr = payload["地图"];

  // 遍历面包屑构建父级路径
  for (const crumb of breadcrumbs.value) {
    ptr[crumb.name] = { "子地图": {} };
    ptr = ptr[crumb.name]["子地图"];
  }

  // 设置目标节点为空对象，触发删除
  ptr[node.name] = {};

  try {
    await ERAUtil.DeleteByObject(payload);
    closeTooltip();

    // 延迟1秒后刷新数据
    setTimeout(async () => {
      await ERAUtil.EmitEraSnapshot();
      // 数据更新后，上面的 watch 会自动处理视图刷新
    }, 1000);

  } catch (e) {
    console.error("删除地图失败", e);
    alert("删除失败，请检查控制台日志。");
  }
};

// 处理"前往此处" (游戏模式)
const handleTravel = (targetNode) => {
  const startName = playerLocationName.value || '未知位置';
  const targetName = targetNode.name;

  if (startName === targetName) return;

  const route = getNavigationPath(startName, targetName);
  const pathStr = route.join(' -> ');

  const option = `<user>计划前往${targetName}，路径：${pathStr}`;

  // 修复逻辑：使用 store 传递输入并跳转路由
  uiStore.setPendingInput(option);
  closeTooltip();
  router.push('/选项');
};

// 新增：处理"确认选择" (选择模式)
const handleSelectLocation = (targetNode) => {
  // 触发事件，将选中的节点名称传回父组件
  emit('select', targetNode.name);
  closeTooltip();
};

// 鼠标/触摸逻辑
const handleWheel = (e) => {
  const rect = viewportRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left - rect.width / 2;
  const mouseY = e.clientY - rect.top - rect.height / 2;
  const scaleFactor = 1 + (0.1 * -Math.sign(e.deltaY));
  const newScale = Math.min(Math.max(transform.k * scaleFactor, 0.001), 1000.0);
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

// --- 移动端双指缩放逻辑 ---
const getTouchDistance = (touches) => {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  );
};

const getTouchCenter = (touches, rect) => {
  const cx = (touches[0].clientX + touches[1].clientX) / 2;
  const cy = (touches[0].clientY + touches[1].clientY) / 2;
  return {
    x: cx - rect.left - rect.width / 2,
    y: cy - rect.top - rect.height / 2
  };
};

const handleTouchStart = (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    isPinching.value = true;
    isMapDragging.value = false; // 取消单指拖拽状态
    lastTouchDist.value = getTouchDistance(e.touches);
  } else if (e.touches.length === 1) {
    isPinching.value = false;
    handleMouseDown(e.touches[0]);
  }
};

const handleTouchMove = (e) => {
  e.preventDefault();
  if (e.touches.length === 2 && isPinching.value) {
    const currentDist = getTouchDistance(e.touches);
    if (lastTouchDist.value > 0) {
      const scaleFactor = currentDist / lastTouchDist.value;
      const rect = viewportRef.value.getBoundingClientRect();
      const center = getTouchCenter(e.touches, rect);

      // 应用缩放
      const newScale = Math.min(Math.max(transform.k * scaleFactor, 0.1), 10.0);

      // 计算新的位移以保持中心点稳定
      // 公式: NewPos = Center - (Center - OldPos) * (NewScale / OldScale)
      const ratio = newScale / transform.k;
      transform.x = center.x - (center.x - transform.x) * ratio;
      transform.y = center.y - (center.y - transform.y) * ratio;
      transform.k = newScale;

      lastTouchDist.value = currentDist;
    }
  } else if (e.touches.length === 1 && !isPinching.value) {
    handleMouseMove(e.touches[0]);
  }
};

const handleTouchEnd = (e) => {
  if (e.touches.length < 2) {
    isPinching.value = false;
  }
  handleMouseUp();
};

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
    resizeObserver = new ResizeObserver(() => updateBaseScale(false));
    resizeObserver.observe(viewportRef.value);
  }
  if (stat_data.value) initMapPosition();
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
