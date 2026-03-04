<template>
  <div class="burn-overlay" v-if="visible" :class="{ 'fade-out': isFading }">
    <svg width="100%" height="100%">
      <defs>
        <!-- 蛀烧滤镜：保留纸张边缘的粗糙感 -->
        <filter id="paper-burn" filterUnits="userSpaceOnUse" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <!-- 遮罩：白色保留，黑色挖空 -->
        <mask id="holes-mask">
          <rect width="100%" height="100%" fill="white" />
          <g filter="url(#paper-burn)">
            <circle
              v-for="(h, i) in holes" :key="'m'+i"
              :cx="h.x" :cy="h.y" r="0"
              fill="black"
            >
              <animate attributeName="r" from="0" to="80%" :dur="h.dur" :begin="h.delay" fill="freeze" />
            </circle>
          </g>
        </mask>
      </defs>

      <!-- 黑幕本体 -->
      <rect width="100%" height="100%" fill="#050505" mask="url(#holes-mask)" />

      <!-- 燃烧的火焰边缘 -->
      <g filter="url(#paper-burn)">
        <!-- 1. 最外层：烧焦的碳化边缘 (宽) -->
        <circle
          v-for="(h, i) in holes" :key="'char'+i"
          :cx="h.x" :cy="h.y" r="0"
          fill="none" stroke="#1a0500" stroke-width="18"
        >
          <animate attributeName="r" from="0" to="80%" :dur="h.dur" :begin="h.delay" fill="freeze" />
        </circle>

        <!-- 2. 中间层：暗红色的余烬 -->
        <circle
          v-for="(h, i) in holes" :key="'fire-outer'+i"
          :cx="h.x" :cy="h.y" r="0"
          fill="none" stroke="#8b1c00" stroke-width="8"
        >
          <animate attributeName="r" from="0" to="80%" :dur="h.dur" :begin="h.delay" fill="freeze" />
        </circle>

        <!-- 3. 最内层：明亮的高温火线 (极细) -->
        <circle
          v-for="(h, i) in holes" :key="'fire-inner'+i"
          :cx="h.x" :cy="h.y" r="0"
          fill="none" stroke="#ff7700" stroke-width="2"
        >
          <animate attributeName="r" from="0" to="80%" :dur="h.dur" :begin="h.delay" fill="freeze" />
        </circle>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['complete']);
const visible = ref(true);
const isFading = ref(false);
const holes = ref([]);

onMounted(() => {
  const numHoles = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numHoles; i++) {
    holes.value.push({
      x: (10 + Math.random() * 80) + '%',
      y: (10 + Math.random() * 80) + '%',
      delay: (Math.random() * 0.5) + 's',
      dur: '4s' // 保持缓慢扩张，维持蛀烧感
    });
  }

  setTimeout(() => {
    isFading.value = true;
  }, 1200);

  setTimeout(() => {
    visible.value = false;
    emit('complete');
  }, 2000);
});
</script>

<style scoped>
.burn-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9999;
  pointer-events: none;
  /* 核心改动 3：淡出时间从 1.2s 缩短到 0.5s，消失得更干脆快速 */
  transition: opacity 0.5s ease-out;
}
.fade-out {
  opacity: 0;
}
</style>
