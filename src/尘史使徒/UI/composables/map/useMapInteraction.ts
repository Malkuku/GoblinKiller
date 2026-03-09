// @/composables/map/useMapInteraction.js
import { ref, reactive, computed } from 'vue';

export const useMapInteraction = (viewportRef, currentDisplayNodes, closeTooltip) => {
  const transform = reactive({ k: 1, x: 0, y: 0 });
  const baseScale = ref(1);
  const lastClientWidth = ref(0);
  const isPointerDown = ref(false);
  const isMapDragging = ref(false);
  const dragStart = { x: 0, y: 0 };
  const lastTransform = { x: 0, y: 0 };
  const hoverCoords = reactive({ x: 0, y: 0 });
  const isPinching = ref(false);
  const lastTouchDist = ref(0);

  // 样式计算
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

  // 自动缩放与居中
  const updateBaseScale = (resetZoom = false) => {
    if (!viewportRef.value || !currentDisplayNodes.value.length) return;
    const rect = viewportRef.value.getBoundingClientRect();
    const currentWidth = rect.width;
    const isMobile = window.innerWidth < 768;

    if (isMobile && !resetZoom && Math.abs(currentWidth - lastClientWidth.value) < 10) return;
    lastClientWidth.value = currentWidth;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    currentDisplayNodes.value.forEach(node => {
      minX = Math.min(minX, node.displayX); maxX = Math.max(maxX, node.displayX);
      minY = Math.min(minY, node.displayY); maxY = Math.max(maxY, node.displayY);
    });

    if (maxX - minX < 1) { minX -= 5; maxX += 5; }
    if (maxY - minY < 1) { minY -= 5; maxY += 5; }

    const padding = isMobile ? 0.95 : 0.8;
    const scaleX = rect.width / (maxY - minY);
    const scaleY = rect.height / (maxX - minX);
    let newScale = Math.min(Math.max(Math.min(scaleX, scaleY) * padding, 0.5), 150);
    if (isMobile) newScale = newScale * 1.3;

    baseScale.value = newScale;

    if (resetZoom || Math.abs(currentWidth - lastClientWidth.value) > 10) {
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;
      transform.x = -midY * newScale;
      transform.y = midX * newScale;
      if (resetZoom) transform.k = 1;
    }
  };

  // 事件处理
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
    if (Math.hypot(dx, dy) > 3) {
      isMapDragging.value = true;
      transform.x = lastTransform.x + dx;
      transform.y = lastTransform.y + dy;
    }
  };

  const handleMouseUp = () => { isPointerDown.value = false; setTimeout(() => isMapDragging.value = false, 0); };

  // 触摸逻辑
  const getTouchDistance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const getTouchCenter = (touches, rect) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left - rect.width / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top - rect.height / 2
  });

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault(); isPinching.value = true; isMapDragging.value = false;
      lastTouchDist.value = getTouchDistance(e.touches);
    } else if (e.touches.length === 1) {
      isPinching.value = false; handleMouseDown(e.touches[0]);
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
        const newScale = Math.min(Math.max(transform.k * scaleFactor, 0.1), 10.0);
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
    if (e.touches.length < 2) isPinching.value = false;
    handleMouseUp();
  };

  const handleBackgroundClick = () => { if (!isMapDragging.value) closeTooltip(); };

  return {
    transform, baseScale, isMapDragging, translateStyle, gridStyle,
    getNodeStyle, getNodeSizeClass, updateBaseScale,
    handleWheel, handleMouseDown, handleMouseMove, handleMouseUp,
    handleTouchStart, handleTouchMove, handleTouchEnd, handleBackgroundClick
  };
};
