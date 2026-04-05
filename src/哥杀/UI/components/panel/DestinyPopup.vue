<!-- src/哥杀/UI/components/panel/DestinyPopup.vue -->
<template>
  <!-- 动态绑定 dark-mode 类，确保脱离 layout 也能同步主题 -->
  <div class="destiny-overlay" :class="{ 'dark-mode': uiStore?.darkMode }" @click.self="$emit('close')">
    <div class="destiny-modal">
      <!-- 卷轴风格头部 -->
      <div class="modal-header">
        <div class="title">
          <span class="ornament">✧</span>
          <span class="title-text">宿命序列</span>
          <span class="ornament">✧</span>
        </div>
        <button class="close-btn" @click="$emit('close')" title="归隐">
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="parsed.allMatched" class="destiny-list">
          <div v-for="(item, i) in parsed.items" :key="i" class="destiny-row">
            <div class="row-content">
              <!-- 罗马数字序号 -->
              <div class="roman-wrapper">
                <span class="roman-numeral">{{ getRoman(i + 1) }}</span>
                <span class="colon">:</span>
              </div>

              <!-- 纸绘风骰子 (3D材质美化版) -->
              <div class="d-dices">
                <div v-for="(diceVal, dIdx) in item.dices" :key="dIdx" class="dice" :class="{ rolling: isRolling }">
                  <svg viewBox="0 0 100 100" class="dice-svg">
                    <defs>
                      <!-- 骰子立体阴影 -->
                      <filter :id="'dice-shadow-' + i + '-' + dIdx" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3" flood-color="var(--roller-color)"/>
                      </filter>
                      <!-- 骰子表面 3D 光泽渐变 -->
                      <linearGradient :id="'dice-grad-' + i + '-' + dIdx" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="var(--scroll-paper)" />
                        <stop offset="100%" stop-color="var(--scroll-border)" />
                      </linearGradient>
                    </defs>

                    <!-- 骰子实体背景与边框 -->
                    <path d="M 15 12 Q 50 8 85 15 Q 92 50 85 85 Q 50 92 15 85 Q 8 50 15 12 Z"
                          :fill="'url(#dice-grad-' + i + '-' + dIdx + ')'"
                          stroke="var(--scroll-border)"
                          stroke-width="4"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          :filter="'url(#dice-shadow-' + i + '-' + dIdx + ')'"
                          class="hand-drawn-border"/>

                    <!-- 骰子点数 (雕刻感) -->
                    <g :fill="isRolling ? 'var(--text-muted)' : 'var(--accent-gold)'">
                      <circle v-if="[1,3,5].includes(isRolling ? randomFace() : diceVal)" cx="50" cy="50" r="9"/>
                      <circle v-if="[2,3,4,5,6].includes(isRolling ? randomFace() : diceVal)" cx="26" cy="26" r="9"/>
                      <circle v-if="[2,3,4,5,6].includes(isRolling ? randomFace() : diceVal)" cx="74" cy="74" r="9"/>
                      <circle v-if="[4,5,6].includes(isRolling ? randomFace() : diceVal)" cx="26" cy="74" r="9"/>
                      <circle v-if="[4,5,6].includes(isRolling ? randomFace() : diceVal)" cx="74" cy="26" r="9"/>
                      <circle v-if="[6].includes(isRolling ? randomFace() : diceVal)" cx="26" cy="50" r="9"/>
                      <circle v-if="[6].includes(isRolling ? randomFace() : diceVal)" cx="74" cy="50" r="9"/>
                    </g>
                  </svg>
                </div>
              </div>

              <!-- 剩余文本 -->
              <span v-if="item.rest" class="d-rest">{{ item.rest }}</span>
            </div>

            <!-- 手绘下划线 -->
            <svg class="hand-drawn-line" preserveAspectRatio="none" viewBox="0 0 100 10">
              <path d="M 0 5 Q 25 3 50 5 T 100 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <div v-else class="plain-text">
          <p v-for="(line, i) in text.split('\n')" :key="i">{{ line }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUiStore } from '@/哥杀/UI/store/UIStore'; // 引入全局状态以同步主题

const uiStore = useUiStore();
const props = defineProps({ text: String });
defineEmits(['close']);

const isRolling = ref(true);
const currentRandom = ref(1);
let interval;

const randomFace = () => currentRandom.value;

// 罗马数字转换
const getRoman = (num) => {
  const romanNumerals = ['O', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanNumerals[num] || num;
};

onMounted(() => {
  interval = setInterval(() => {
    currentRandom.value = Math.floor(Math.random() * 6) + 1;
  }, 80);
  setTimeout(() => {
    isRolling.value = false;
    clearInterval(interval);
  }, 1200);
});

onUnmounted(() => {
  clearInterval(interval);
});

const parsed = computed(() => {
  const items = [];
  const regex = /([^:|()\n]+?)\s*:\s*\(([\d\s,]+)\)([^|\n]*)/g;
  const matches = [...props.text.matchAll(regex)];

  if (matches.length > 0) {
    for (const m of matches) {
      items.push({
        label: m[1].trim(),
        dices: m[2].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)),
        rest: m[3].trim()
      });
    }
    return { items, allMatched: true };
  }
  return { items: [], allMatched: false };
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Noto+Serif+SC:wght@400;700&display=swap');

/* ==========================================
   局部重新声明主题变量，防止脱离 layout 作用域
========================================== */
.destiny-overlay {
  --bg-base: #f4f1ea;
  --text-main: #4a3f35;
  --text-muted: #8b7e70;
  --accent-gold: #c6a664;
  --scroll-paper: #fffcf5;
  --scroll-border: #d4c4a8;
  --roller-color: #8b7e70;

  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 10000;
  transition: color 0.5s ease;
}

.destiny-overlay.dark-mode {
  --bg-base: #05080f;
  --text-main: #dce4ee;
  --text-muted: #829ab1;
  --accent-gold: #8ba4c7;
  --scroll-paper: #1f293d;
  --scroll-border: #3a4b6b;
  --roller-color: #0a0e17;
}

.destiny-modal {
  background-color: var(--scroll-paper);
  color: var(--text-main);
  border: 2px solid var(--scroll-border);
  border-radius: 2px;
  width: 90%; max-width: 500px;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.5);
  position: relative;
  animation: unroll 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  transition: background-color 0.5s ease, border-color 0.5s ease;
}

/* 模拟卷轴上下轴承 - 材质完全对齐 layout.vue */
.destiny-modal::before, .destiny-modal::after {
  content: '';
  position: absolute;
  left: -12px; right: -12px;
  height: 14px;
  /* 边缘深棕色，中间跟随主题变量，彻底消除异常蓝色 */
  background: linear-gradient(to right, #5c4e40, var(--roller-color), #5c4e40);
  border-radius: 4px;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.3);
  z-index: 10;
  transition: background 0.5s ease;
}
.destiny-modal::before { top: -7px; }
.destiny-modal::after { bottom: -7px; }

.modal-header {
  padding: 28px 24px 16px;
  text-align: center;
  position: relative;
  background: transparent !important; /* 强制透明，防止被全局样式污染 */
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(to right, transparent, var(--accent-gold), transparent) 1;
  margin: 0 20px;
}

.title {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  font-family: 'Cinzel', 'Noto Serif SC', serif;
  font-weight: 700; font-size: 1.4rem; letter-spacing: 2px;
  color: var(--accent-gold);
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  transition: color 0.5s ease;
}

.ornament { font-size: 1.2rem; opacity: 0.7; }

.close-btn {
  position: absolute;
  top: 20px; right: 0;
  background: none; border: none;
  color: var(--text-muted);
  cursor: pointer; padding: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}
.close-btn:hover {
  color: #b33939;
  transform: rotate(90deg) scale(1.1);
}

.modal-body {
  padding: 20px 24px 32px;
  max-height: 65vh; overflow-y: auto;
}

.destiny-list { display: flex; flex-direction: column; gap: 20px; }
.destiny-row { display: flex; flex-direction: column; gap: 6px; }
.row-content { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }

.roman-wrapper { display: flex; align-items: baseline; gap: 4px; }
.roman-numeral {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem; font-weight: bold;
  color: var(--accent-gold);
  min-width: 28px; text-align: right;
  transition: color 0.5s ease;
}
.colon {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem; font-weight: bold;
  opacity: 0.6;
}

.d-dices {
  display: flex; gap: 10px;
  padding: 4px 0; /* 给阴影留出空间 */
}

.dice {
  width: 36px; height: 36px;
  transition: transform 0.3s ease;
}

/* 赋予骰子自然散落的轻微旋转感 */
.dice:nth-child(odd) { transform: rotate(-4deg); }
.dice:nth-child(even) { transform: rotate(5deg); }
.dice:nth-child(3n) { transform: rotate(-2deg); }

.dice-svg {
  width: 100%; height: 100%;
  opacity: 0.95;
}

.rolling .dice-svg {
  animation: dice-roll 0.3s infinite;
  transform-origin: center;
}

.d-rest {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.05rem; line-height: 1.5;
  opacity: 0.9; flex: 1;
}

.hand-drawn-line {
  width: 100%; height: 6px;
  color: var(--scroll-border);
  opacity: 0.6;
  transition: color 0.5s ease;
}

.plain-text {
  line-height: 1.8; white-space: pre-wrap; font-size: 1.05rem;
  font-family: 'Noto Serif SC', serif;
}

.modal-body::-webkit-scrollbar { width: 4px; }
.modal-body::-webkit-scrollbar-track { background: transparent; }
.modal-body::-webkit-scrollbar-thumb { background: var(--scroll-border); border-radius: 2px; }

@keyframes unroll {
  from { transform: scaleY(0.1); opacity: 0; }
  to { transform: scaleY(1); opacity: 1; }
}

/* 优化后的立体滚动动画 */
@keyframes dice-roll {
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  25% { transform: translate(2px, -2px) rotate(-15deg) scale(1.1); }
  50% { transform: translate(-2px, 2px) rotate(10deg) scale(0.9); }
  75% { transform: translate(2px, 2px) rotate(20deg) scale(1.05); }
  100% { transform: translate(0, 0) rotate(0deg) scale(1); }
}
</style>
