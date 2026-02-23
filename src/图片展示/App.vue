<template>
  <div class="app-container">

    <div class="gallery-card" :class="{ active: isOpen }">

      <!-- 卡片头部 -->
      <div class="card-header" @click="toggleCard">
        <!--
           显示标题：为了美观，我们将路径中的 "/" 替换回 " - " 显示
           例如：URL是 "人物A/开心1"，标题显示 "人物A - 开心1"
        -->
        <span class="header-title">{{ formattedTitle }}</span>
        <span class="arrow-icon">▼</span>
      </div>

      <!-- 卡片内容 -->
      <div class="card-content" v-show="isOpen">
        <div
          class="img-wrapper"
          @click="openLightbox"
          :class="{ 'has-error': hasError }"
        >
          <!-- 加载圈 -->
          <div v-if="isLoading && !hasError" class="img-loader"></div>

          <!-- 图片 -->
          <img
            v-if="shouldLoadImage"
            :src="currentSrc"
            :alt="rawName"
            class="gallery-image"
            :class="{ loaded: isLoaded }"
            @load="onImageLoad"
            @error="handleImgError"
          />

          <div v-if="isLoaded && !hasError" class="zoom-hint">🔍 点击放大</div>
        </div>
      </div>
    </div>

    <!-- 灯箱组件 -->
    <Teleport to="body">
      <div
        v-if="lightboxShow"
        class="custom-lightbox-overlay show"
        @click.self="closeLightbox"
        @wheel.prevent="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="lightbox-close-btn" @click="closeLightbox">&times;</div>
        <div class="lightbox-tip">滚轮/双指缩放 · 拖拽移动</div>

        <img
          :src="currentSrc"
          class="custom-lightbox-content"
          :style="lightboxTransformStyle"
          alt="Full Preview"
          draggable="false"
        />
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onUnmounted } from 'vue';

const rawName = "$1";

// ============================================================
// ★ 格式修复逻辑 (根据你的最新要求) ★
// ============================================================
let fixedName = rawName || '';

// 1. 去除所有空格 (防止 "人物A - 开心" 这种带空格的情况)
fixedName = fixedName.replace(/\s+/g, '');

// 2. 将 "-" 替换为 "/" (核心修改：把横杠变成斜杠)
// 例如: "人物A-开心" -> "人物A/开心"
fixedName = fixedName.replace(/-/g, '/');

// 3. 补充数字 (如果末尾不是数字，补1)
// 例如: "人物A/开心" -> "人物A/开心1"
if (fixedName.length > 0 && !/\d$/.test(fixedName)) {
  fixedName += '1';
}

const BASE_URL = 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/';
const EXTENSION = '.webp';
const FALLBACK_IMG = 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/猫爹哈气.webp';

// ============================================================
// 2. 逻辑复刻
// ============================================================

// --- 标题显示 ---
// URL 用的是 "/"，但显示给用户看时，用 " - " 比较好看
const formattedTitle = computed(() => {
  return fixedName.replace(/\//g, ' - ');
});

// --- 图片地址拼接 ---
// 使用修复后的 fixedName (包含 / 和 1)
const originalSrc = `${BASE_URL}${fixedName}${EXTENSION}`;

// --- 状态管理 ---
const isOpen = ref(false);
const shouldLoadImage = ref(false);
const isLoading = ref(true);
const isLoaded = ref(false);
const hasError = ref(false);
const currentSrc = ref(originalSrc);
const lightboxShow = ref(false);

// --- 交互函数 ---
const toggleCard = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value && !shouldLoadImage.value) {
    shouldLoadImage.value = true;
  }
};

const onImageLoad = () => {
  isLoading.value = false;
  isLoaded.value = true;
};

const handleImgError = () => {
  isLoading.value = false;
  hasError.value = true;
  currentSrc.value = FALLBACK_IMG;
};

// ============================================================
// 3. 灯箱逻辑
// ============================================================

const zoomState = reactive({
  scale: 1, pX: 0, pY: 0, isDragging: false,
  startX: 0, startY: 0, lastX: 0, lastY: 0
});

let initialDistance = 0;
let initialScale = 1;

const lightboxTransformStyle = computed(() => ({
  transform: `translate(${zoomState.pX}px, ${zoomState.pY}px) scale(${zoomState.scale})`,
  transition: zoomState.isDragging ? 'none' : 'transform 0.1s ease-out'
}));

const openLightbox = () => {
  if (hasError.value || !isLoaded.value) return;
  Object.assign(zoomState, { scale: 1, pX: 0, pY: 0, isDragging: false, startX: 0, startY: 0, lastX: 0, lastY: 0 });
  lightboxShow.value = true;
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  lightboxShow.value = false;
  document.body.style.overflow = '';
};

// --- 鼠标/触摸事件 ---
const handleWheel = (e) => {
  const delta = -Math.sign(e.deltaY);
  const step = 0.15;
  let newScale = zoomState.scale + (delta * step * zoomState.scale);
  if (newScale < 0.5) newScale = 0.5;
  if (newScale > 10) newScale = 10;
  zoomState.scale = newScale;
};

const handleMouseDown = (e) => {
  e.preventDefault();
  zoomState.isDragging = true;
  zoomState.startX = e.clientX;
  zoomState.startY = e.clientY;
  zoomState.lastX = zoomState.pX;
  zoomState.lastY = zoomState.pY;
};

const handleMouseMove = (e) => {
  if (!zoomState.isDragging) return;
  zoomState.pX = zoomState.lastX + (e.clientX - zoomState.startX);
  zoomState.pY = zoomState.lastY + (e.clientY - zoomState.startY);
};

const handleMouseUp = () => { zoomState.isDragging = false; };

const handleTouchStart = (e) => {
  if (e.touches.length === 1) {
    zoomState.isDragging = true;
    zoomState.startX = e.touches[0].clientX;
    zoomState.startY = e.touches[0].clientY;
    zoomState.lastX = zoomState.pX;
    zoomState.lastY = zoomState.pY;
  } else if (e.touches.length === 2) {
    zoomState.isDragging = false;
    initialDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    initialScale = zoomState.scale;
  }
};

const handleTouchMove = (e) => {
  if (e.touches.length === 1 && zoomState.isDragging) {
    zoomState.pX = zoomState.lastX + (e.touches[0].clientX - zoomState.startX);
    zoomState.pY = zoomState.lastY + (e.touches[0].clientY - zoomState.startY);
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (initialDistance > 0) {
      let newScale = initialScale * (dist / initialDistance);
      if (newScale < 0.5) newScale = 0.5; if (newScale > 10) newScale = 10;
      zoomState.scale = newScale;
    }
  }
};

const handleTouchEnd = (e) => {
  zoomState.isDragging = false;
  if (e.touches.length < 2) initialDistance = 0;
};

onUnmounted(() => { document.body.style.overflow = ''; });
</script>

<style>
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --accent-primary: #d4af37;
  --border-color: #404040;
  --shadow-color: rgba(0, 0, 0, 0.5);
}

body {
  background-color: transparent;
  color: var(--text-primary);
  font-family: sans-serif;
  margin: 0;
  padding: 20px;
}

.gallery-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 4px 6px var(--shadow-color);
  transition: border-color 0.3s;
}

.gallery-card.active {
  border-color: var(--accent-primary);
  margin-bottom: 15px;
}

.card-header {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: rgba(0,0,0,0.2);
  user-select: none;
}

.card-header:hover {
  background-color: rgba(255,255,255,0.05);
}

.header-title {
  font-family: serif;
  font-weight: bold;
  color: var(--accent-primary);
  font-size: 1.0rem;
}

.arrow-icon {
  font-size: 0.8rem;
  color: var(--text-secondary);
  transition: transform 0.3s;
}

.gallery-card.active .arrow-icon {
  transform: rotate(180deg);
}

.card-content {
  padding: 15px;
  background-color: var(--bg-primary);
  text-align: center;
  animation: fadeIn 0.3s ease;
}

.img-wrapper {
  position: relative;
  display: inline-block;
  min-height: 200px;
  min-width: 200px;
  background-color: #000;
  border-radius: 4px;
  overflow: hidden;
  cursor: zoom-in;
  border: 1px solid var(--border-color);
}

.img-wrapper.has-error {
  cursor: default;
}

.gallery-image {
  max-width: 100%;
  max-height: 500px;
  display: block;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.gallery-image.loaded {
  opacity: 1;
}

.img-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 1;
  pointer-events: none;
}

.zoom-hint {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 2;
}

.img-wrapper:hover .zoom-hint {
  opacity: 1;
}

@keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

/* 灯箱样式 */
.custom-lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
  overflow: hidden;
  touch-action: none;
}

.custom-lightbox-content {
  max-width: 95vw;
  max-height: 95vh;
  box-shadow: 0 0 30px rgba(0,0,0,0.9);
  border: 1px solid #d4af37;
  object-fit: contain;
  transform-origin: center center;
  will-change: transform;
  cursor: grab;
  user-select: none;
  -webkit-user-drag: none;
}

.custom-lightbox-content:active {
  cursor: grabbing;
}

.lightbox-close-btn {
  position: absolute;
  top: 20px;
  right: 30px;
  color: #e0e0e0;
  font-size: 50px;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  z-index: 10000;
  user-select: none;
  text-shadow: 0 2px 5px rgba(0,0,0,0.8);
  transition: color 0.2s, transform 0.2s;
  font-family: sans-serif;
}

.lightbox-close-btn:hover {
  color: #d4af37;
  transform: scale(1.1);
}

.lightbox-tip {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  pointer-events: none;
  z-index: 10000;
}
</style>
