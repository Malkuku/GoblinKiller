<template>
  <div class="burn-overlay" v-if="visible" :class="{ 'fade-out': isBackgroundFading }">
    <svg width="100%" height="100%">
      <defs>
        <filter id="paper-burn" filterUnits="userSpaceOnUse" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <mask id="holes-mask">
          <rect width="100%" height="100%" fill="white" />
          <g filter="url(#paper-burn)">
            <circle
              v-for="(h, i) in holes" :key="'m'+i"
              :cx="h.x" :cy="h.y" r="0"
              fill="black"
            >
              <animate attributeName="r" from="0" :to="h.maxR" :dur="h.dur" :begin="h.delay" fill="freeze" />
            </circle>
          </g>
        </mask>
      </defs>

      <!-- 黑幕本体 (受 isBackgroundFading 控制) -->
      <rect width="100%" height="100%" fill="#050505" mask="url(#holes-mask)" />

      <!-- 燃烧的火焰边缘 (受 isFireFading 控制，独立淡出) -->
      <!-- 添加 class fire-group 用于控制透明度 -->
      <g filter="url(#paper-burn)" class="fire-group" :class="{ 'fire-fade-out': isFireFading }">
        <!-- 1. 焦黑边缘 -->
        <circle
          v-for="(h, i) in holes" :key="'char'+i"
          :cx="h.x" :cy="h.y" r="0"
          fill="none" stroke="#2a0a00" stroke-width="6"
        >
          <animate attributeName="r" from="0" :to="h.maxR" :dur="h.dur" :begin="h.delay" fill="freeze" />
        </circle>

        <!-- 2. 余烬 -->
        <circle
          v-for="(h, i) in holes" :key="'fire-outer'+i"
          :cx="h.x" :cy="h.y" r="0"
          fill="none" stroke="#8b1c00" stroke-width="3"
        >
          <animate attributeName="r" from="0" :to="h.maxR" :dur="h.dur" :begin="h.delay" fill="freeze" />
        </circle>

        <!-- 3. 火线 -->
        <circle
          v-for="(h, i) in holes" :key="'fire-inner'+i"
          :cx="h.x" :cy="h.y" r="0"
          fill="none" stroke="#ff9900" stroke-width="1"
        >
          <animate attributeName="r" from="0" :to="h.maxR" :dur="h.dur" :begin="h.delay" fill="freeze" />
        </circle>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['complete']);
const visible = ref(true);
const isBackgroundFading = ref(false); // 控制黑幕淡出
const isFireFading = ref(false);       // 控制火圈淡出 (新增)
const holes = ref([]);

onMounted(() => {
  // --- 新增：播放火烧纸 BGM ---
  playAudio('bgm', {
    title: '火烧纸',
    url: 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/bgm/火烧纸.mp3'
  });

  const numHoles = 40 + Math.floor(Math.random() * 20);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minDistancePx = Math.min(vw, vh) * 0.04;
  const maxRetries = 20;

  for (let i = 0; i < numHoles; i++) {
    let xPercent, yPercent, xPx, yPx;
    let isValid = false;
    let retries = 0;

    while (!isValid && retries < maxRetries) {
      xPercent = Math.random() * 100;
      yPercent = Math.random() * 100;
      xPx = (xPercent / 100) * vw;
      yPx = (yPercent / 100) * vh;

      isValid = true;
      for (const existingHole of holes.value) {
        const dx = xPx - existingHole.px;
        const dy = yPx - existingHole.py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistancePx) {
          isValid = false;
          break;
        }
      }
      retries++;
    }

    // --- 修改点 1: 缩小尺寸 ---
    // 原来是 8-12%，现在改为 3-7%
    // 这样既不会太大，也能配合密集的数量
    const maxRadiusPercent = 3 + Math.random() * 4;

    holes.value.push({
      x: xPercent + '%',
      y: yPercent + '%',
      px: xPx,
      py: yPx,
      maxR: maxRadiusPercent + '%',
      delay: (Math.random() * 0.8) + 's',
      dur: (1.5 + Math.random() * 1.5) + 's'
    });
  }

  // --- 修改点 2: 时间轴调整 ---

  // 2.2秒：火圈开始淡出 (此时黑幕还在！)
  // 这样可以解决“火圈滞留不再扩大”看起来很假的问题
  // 因为在它们完全停止前，或者刚停止时，火就灭了
  setTimeout(() => {
    isFireFading.value = true;
  }, 2000);

  setTimeout(() => {
    isBackgroundFading.value = true;
  }, 2500);

  // 4.2秒：彻底移除
  setTimeout(() => {
    visible.value = false;
    // --- 新增：动画结束时暂停音乐 ---
    pauseAudio('bgm');
    emit('complete');
  }, 3300);
});
</script>

<style scoped>
.burn-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9999;
  pointer-events: none;
  transition: opacity 1s ease-out; /* 黑幕的淡出 */
}

.fade-out {
  opacity: 0;
}

/* --- 新增：火圈层的独立过渡 --- */
.fire-group {
  transition: opacity 0.8s ease-out; /* 火圈淡出稍微快一点点 */
  opacity: 1;
}

.fire-fade-out {
  opacity: 0;
}
</style>
