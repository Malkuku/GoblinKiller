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
  const numHoles = 5 + Math.floor(Math.random() * 3); // 5 到 7 个洞

  // 获取屏幕宽高，用于计算真实的像素距离，防止在宽屏/长屏上距离计算变形
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 设定两个火圈中心点的最小安全距离（取屏幕较短边的 35% 作为防重叠半径）
  const minDistancePx = Math.min(vw, vh) * 0.35;
  const maxRetries = 50; // 最大重试次数，防止死循环

  for (let i = 0; i < numHoles; i++) {
    let xPercent, yPercent, xPx, yPx;
    let isValid = false;
    let retries = 0;

    // 拒绝采样算法：生成坐标 -> 检查距离 -> 不合格则重试
    while (!isValid && retries < maxRetries) {
      xPercent = 10 + Math.random() * 80;
      yPercent = 10 + Math.random() * 80;

      // 转换为实际像素坐标
      xPx = (xPercent / 100) * vw;
      yPx = (yPercent / 100) * vh;

      isValid = true;

      // 与已存在的火圈进行距离校验
      for (const existingHole of holes.value) {
        const dx = xPx - existingHole.px;
        const dy = yPx - existingHole.py;
        const distance = Math.sqrt(dx * dx + dy * dy); // 勾股定理计算直线距离

        if (distance < minDistancePx) {
          isValid = false; // 距离太近，标记为不合格，跳出当前比对，重新生成
          break;
        }
      }
      retries++;
    }

    // 将合格的（或达到最大重试次数妥协的）火圈加入数组
    holes.value.push({
      x: xPercent + '%',
      y: yPercent + '%',
      px: xPx, // 保存像素坐标供后续比对使用
      py: yPx,
      delay: (Math.random() * 0.5) + 's',
      dur: '4s'
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
  transition: opacity 0.5s ease-out;
}
.fade-out {
  opacity: 0;
}
</style>
