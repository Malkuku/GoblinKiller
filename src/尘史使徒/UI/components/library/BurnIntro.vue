<template>
  <div v-if="visible" class="burn-overlay" :class="{ 'fade-out': isBackgroundFading }">
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
import { useAudioStore } from '@/尘史使徒/UI/store/AudioStore';

const emit = defineEmits(['complete']);
const visible = ref(true);
const isBackgroundFading = ref(false);
const isFireFading = ref(false);
const holes = ref([]);

// 初始化 Store
const audioStore = useAudioStore();

onMounted(() => {
  // 2. 增加监听逻辑，防止直接跳过
  if (audioStore.loadStatus.burnBgm === 'ready') {
    playAudio('bgm', {
      title: '火烧纸',
      url: audioStore.getUrl('burnBgm')
    });
  } else {
    console.log('火烧纸BGM尚未就绪，等待下载...');
    const unwatch = watch(() => audioStore.loadStatus.burnBgm, (newStatus) => {
      if (newStatus === 'ready') {
        playAudio('bgm', {
          title: '火烧纸',
          url: audioStore.getUrl('burnBgm')
        });
        unwatch(); // 播放后取消监听
      }
    });
  }

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

  setTimeout(() => {
    isFireFading.value = true;
  }, 2000);

  setTimeout(() => {
    isBackgroundFading.value = true;
  }, 2500);

  setTimeout(() => {
    visible.value = false;
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
  transition: opacity 1s ease-out;
}

.fade-out {
  opacity: 0;
}

.fire-group {
  transition: opacity 0.8s ease-out;
  opacity: 1;
}

.fire-fade-out {
  opacity: 0;
}
</style>
