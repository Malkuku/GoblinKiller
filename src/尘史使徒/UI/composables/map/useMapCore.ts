// @/composables/map/useMapCore.js
import { ref, reactive, computed } from 'vue';
import { MvuUtil } from '@/Utils/MvuUtil';

export const useMapCore = (stat_data, uiStore, router, emit) => {
  const currentRootNode = ref(null);
  const breadcrumbs = ref([]);
  const tooltip = reactive({ visible: false, data: {}, x: 0, y: 0 });
  const playerLocationName = computed(() => stat_data.value?.世界?.['地图索引'] || '');

  // --- 内部辅助函数 ---
  const findNodeAndPath = (root, targetName, currentPath = []) => {
    if (!root) return null;
    for (const [key, value] of Object.entries(root)) {
      if (key === targetName) return { node: value, path: [...currentPath, { name: key, node: value }] };
      if (value['子地图']) {
        const result = findNodeAndPath(value['子地图'], targetName, [...currentPath, { name: key, node: value }]);
        if (result) return result;
      }
    }
    return null;
  };

  const findPathStack = (root, targetName, currentStack = []) => {
    if (!root) return null;
    for (const [key, value] of Object.entries(root)) {
      if (key === targetName) return [...currentStack, key];
      if (value['子地图']) {
        const res = findPathStack(value['子地图'], targetName, [...currentStack, key]);
        if (res) return res;
      }
    }
    return null;
  };

  // --- 核心功能 ---
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
  };

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

  // --- 导航与交互 ---
  const closeTooltip = () => { tooltip.visible = false; };

  const navigateToLayer = (crumb) => {
    const idx = breadcrumbs.value.findIndex(c => c.name === crumb.name);
    if (idx !== -1) {
      breadcrumbs.value = breadcrumbs.value.slice(0, idx + 1);
      currentRootNode.value = crumb.node;
      closeTooltip();
    }
  };

  const enterArea = (nodeData) => {
    if (nodeData.originalData && nodeData.originalData['子地图']) {
      breadcrumbs.value.push({ name: nodeData.name, node: nodeData.originalData });
      currentRootNode.value = nodeData.originalData;
      closeTooltip();
    }
  };

  const goUpOneLevel = () => {
    if (breadcrumbs.value.length > 1) {
      breadcrumbs.value.pop();
      currentRootNode.value = breadcrumbs.value[breadcrumbs.value.length - 1].node;
      closeTooltip();
    }
  };

  const handleNodeClick = (node) => { tooltip.data = node; tooltip.visible = true; };

  const getNavigationPath = (startName, endName) => {
    if (!stat_data.value?.地图) return [endName];
    const rootMap = stat_data.value.地图;
    const pathStart = findPathStack(rootMap, startName);
    const pathEnd = findPathStack(rootMap, endName);
    if (!pathStart || !pathEnd) return [endName];

    let i = 0;
    while(i < pathStart.length && i < pathEnd.length && pathStart[i] === pathEnd[i]) i++;
    const upPath = pathStart.slice(i).reverse();
    const downPath = pathEnd.slice(i);
    const fullPath = [...upPath, ...downPath];
    return fullPath.length > 0 ? fullPath : [endName];
  };

  const handleTravel = (targetNode) => {
    const startName = playerLocationName.value || '未知位置';
    const targetName = targetNode.name;
    if (startName === targetName) return;
    const route = getNavigationPath(startName, targetName);
    const option = `<user>计划前往${targetName}，路径：${route.join(' -> ')}`;
    uiStore.setPendingInput(option);
    closeTooltip();
    router.push('/选项');
  };

  const handleSelectLocation = (targetNode) => {
    emit('select', targetNode.name);
    closeTooltip();
  };

  const canDelete = (node) => {
    if (!stat_data.value?.地图) return false;
    const playerPath = findPathStack(stat_data.value.地图, playerLocationName.value);
    if (!playerPath) return true;
    const currentPathNames = breadcrumbs.value.map(b => b.name);
    const targetPath = [...currentPathNames, node.name];
    if (playerPath.length < targetPath.length) return true;
    for (let i = 0; i < targetPath.length; i++) {
      if (playerPath[i] !== targetPath[i]) return true;
    }
    return false;
  };

  const handleDeleteMap = async (node) => {
    if (!confirm(`警告：确定要彻底删除 "${node.name}" 及其所有子区域吗？`)) return;
    const diffPayload = { 地图: {} };
    let diffPtr = diffPayload.地图;
    for (const crumb of breadcrumbs.value) {
      diffPtr[crumb.name] = { 子地图: {} };
      diffPtr = diffPtr[crumb.name].子地图;
    }
    diffPtr[node.name] = null;
    try {
      await MvuUtil.updateMvuDataByDiff(diffPayload);
      closeTooltip();
    } catch (e) {
      console.error("删除地图失败", e);
    }
  };

  const hasChildren = (nodeData) => nodeData.originalData && !!nodeData.originalData['子地图'];

  return {
    currentRootNode, breadcrumbs, tooltip, playerLocationName, currentDisplayNodes,
    initMapPosition, navigateToLayer, enterArea, goUpOneLevel, closeTooltip,
    handleNodeClick, handleTravel, handleSelectLocation, handleDeleteMap, canDelete, hasChildren
  };
};
