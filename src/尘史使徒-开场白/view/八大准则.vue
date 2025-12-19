<template>
  <!--
    主容器:
    - 动态绑定 :class="currentPrinciple.themeClass" 是实现所有特效切换的核心。
    - 它会根据当前选择的准则，将 'theme-lamp', 'theme-forge' 等类名应用到自身。
  -->
  <div class="principles-container" :class="currentPrinciple.themeClass">

    <!-- 特效背景层: 这个div本身是空的，它的样式完全由父容器的 themeClass 控制 -->
    <div class="art-bg-effect"></div>

    <!-- 内容展示区 -->
    <div class="content-wrapper">

      <!-- 准则详情显示 -->
      <div class="principle-display">
        <transition name="fade-description" mode="out-in">
          <!-- 使用 :key 来确保切换准则时，整个div被替换，从而触发动画 -->
          <div :key="selectedPrincipleIndex">
            <h2 class="art-name">{{ currentPrinciple.name }}</h2>
            <p class="principle-title">{{ currentPrinciple.title }}</p>
            <p v-if="currentPrinciple.symbol" class="principle-symbols">象征: {{ currentPrinciple.symbol }}</p>
          </div>
        </transition>
      </div>

      <!-- 准则选择器 -->
      <div class="principle-selector">
        <ul>
          <li
v-for="(principle, index) in principles"
              :key="principle.name"
              :class="{ 'active': index === selectedPrincipleIndex }"
              @click="selectPrinciple(index)">
            <div class="selector-name">{{ principle.name }}</div>
            <!-- 这个div用来展示从 .xp-fill 继承来的样式 -->
            <div class="active-indicator xp-fill"></div>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 1. 定义八大准则的数据
const principles = ref([
  {name: '准则', title: '自现实世界的表皮“漫宿”所剥落的碎片,逸散成能使人为之引动的力量', themeClass: ''},
  { name: '灯', title: '理性、求知与启明的准则', symbol: '知识、光芒', themeClass: 'theme-lamp' },
  { name: '铸', title: '毁灭、塑形与技巧的准则', symbol: '锻造、工艺、力量、火', themeClass: 'theme-forge' },
  { name: '刃', title: '斗争与征服的准则', symbol: '武器、战斗技巧、暗杀',  themeClass: 'theme-blade' },
  { name: '冬', title: '静默、消逝、铭记的准则', symbol: '雪、寒冷、记忆、亡者',  themeClass: 'theme-winter' },
  { name: '心', title: '生命、存续、不息的准则', symbol: '运动、生者、心灵、治疗', themeClass: 'theme-heart' },
  { name: '杯', title: '欲望、生育、诱惑的准则', symbol: '血肉、性、欲望',  themeClass: 'theme-cup' },
  { name: '蛾', title: '变化、混沌、未知的准则', symbol: '奇想、幻觉、欺骗、混乱', themeClass: 'theme-moth' },
  { name: '启', title: '揭示、洞开、拆解的准则', symbol: '门与钥匙、伤口、揭密',  themeClass: 'theme-key' },
]);

// 2. 状态管理
const selectedPrincipleIndex = ref(0);

// 3. 计算属性，获取当前选中的准则对象
const currentPrinciple = computed(() => principles.value[selectedPrincipleIndex.value]);

// 4. 方法，用于切换选中的准则
const selectPrinciple = (index) => {
  selectedPrincipleIndex.value = index;
};
</script>

<style scoped>

/* --- 基础布局 --- */
.principles-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition: background-color 0.5s ease; /* 背景色平滑过渡 */
}

.art-bg-effect {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 0; /* 确保在最底层 */
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 上下分布 */
  padding: 5vh 2rem;
  box-sizing: border-box;
}

/* --- 准则详情显示区 --- */
.principle-display {
  text-align: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 30px;
}

.art-name {
  font-family: 'Cinzel', serif;
  font-size: 4rem;
  font-weight: 700;
  margin: 0;
}

.principle-title {
  font-size: 1.2rem;
  color: var(--text-primary);
  margin: 0.5rem 0;
}

.principle-symbols {
  font-size: 1rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* 详情文字切换动画 */
.fade-description-enter-active,
.fade-description-leave-active {
  transition: opacity 0.4s ease;
}
.fade-description-enter-from,
.fade-description-leave-to {
  opacity: 0;
}

/* --- 准则选择器 --- */
.principle-selector ul {
  display: flex;
  justify-content: center;
  gap: 6px;
  list-style: none;
  padding: 0;
  margin: 0;
  background: rgba(0,0,0,0.2);
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.principle-selector li {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  overflow: hidden; /* 隐藏 active-indicator */
}

.principle-selector li:hover {
  background-color: rgba(255,255,255,0.1);
}

.selector-icon {
  font-size: 1.4rem;
}

.selector-name {
  font-size: 0.7rem;
  font-family: 'Cinzel', serif;
  margin-top: 3px;
  color: var(--text-secondary);
}

.principle-selector li.active .selector-name {
  color: var(--text-primary);
}

/* 激活指示器 (利用 .xp-fill 样式) */
.active-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}
.principle-selector li.active .active-indicator {
  transform: translateY(0);
}


/*
================================================================
  ↓↓↓ 从附件中直接移植过来的特效代码 ↓↓↓
================================================================
*/

/* --- 动态主题与特效 --- */
/* 灯 */
.theme-lamp { --theme-color: #FFD700; }
.theme-lamp .art-name { color: var(--theme-color); text-shadow: 0 0 10px var(--theme-color); }
.theme-lamp .xp-fill { background: var(--theme-color); }
.theme-lamp .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 70%); opacity: 0.15; }


/* 铸 */
.theme-forge { --theme-color: #FF4500; --flame-color-2: #FF8C00; }
.theme-forge .art-name { color: var(--theme-color); text-shadow: 0 0 5px #fff, 0 0 10px var(--theme-color), 0 0 15px var(--flame-color-2); }
.theme-forge .xp-fill { background: linear-gradient(90deg, var(--theme-color), var(--flame-color-2)); }
.theme-forge .art-bg-effect { overflow: hidden; }
@keyframes art-forge-seamless-rise {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}
.theme-forge .art-bg-effect::before,
.theme-forge .art-bg-effect::after {
  content: ''; position: absolute; left: 0; width: 100%; height: 200%;
  background-image: radial-gradient(circle, var(--theme-color) 1px, transparent 1px);
  background-repeat: repeat; animation-name: art-forge-seamless-rise;
  animation-timing-function: linear; animation-iteration-count: infinite;
}
.theme-forge .art-bg-effect::before { top: 0; background-size: 70px 70px; animation-duration: 6s; opacity: 0.7; }
.theme-forge .art-bg-effect::after { top: 0; background-size: 110px 110px; animation-duration: 10s; opacity: 0.6; animation-delay: -3s; }

/* 刃 */
.theme-blade { --theme-color: #C0C0C0; --metal-dark: #888; --metal-light: #F0F0F0; }
.theme-blade .art-name { background: linear-gradient(180deg, var(--metal-light), var(--theme-color) 50%, var(--metal-dark) 51%, var(--theme-color) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); -webkit-text-fill-color: transparent; }
.theme-blade .xp-fill { background: linear-gradient(45deg, var(--metal-dark), var(--metal-light)); }
.theme-blade .art-bg-effect { background: linear-gradient(0deg, rgba(255,255,255,0.05), rgba(0,0,0,0.05)), repeating-linear-gradient(90deg, #ccc, #ccc 1px, #bbb 1px, #bbb 2px); opacity: 0.3; }

/* 冬 */
.theme-winter { --theme-color: #A3D5D5; }
.theme-winter .art-name { color: var(--theme-color); text-shadow: 0 0 10px #fff; }
.theme-winter .xp-fill { background: var(--theme-color); }
.theme-winter .art-bg-effect { background: radial-gradient(circle, #fff 5%, transparent 6%), radial-gradient(circle, #fff 3%, transparent 4%); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: snow 10s linear infinite; }
@keyframes snow { 100% {background-position: 0 300px, 25px 325px;} }

/* 心 */
.theme-heart { --theme-color: #FF69B4; }
.theme-heart .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }
.theme-heart .xp-fill { background: var(--theme-color); }
.theme-heart .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 50%) no-repeat center; animation: art-heart-pulse-gradient 2s infinite ease-in-out; opacity: 0.15; }
@keyframes art-heart-pulse-gradient { 0%, 100% { background-size: 100% 100%; opacity: 0.1; } 50% { background-size: 150% 150%; opacity: 0.2; } }

/* 杯 */
.theme-cup { --theme-color: #8B0000; }
.theme-cup .art-name { color: var(--theme-color); text-shadow: 0 0 5px rgba(0,0,0,0.5); }
.theme-cup .xp-fill { background: var(--theme-color); }
.theme-cup .art-bg-effect {
  background-image: linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%);
  background-repeat: no-repeat; background-size: 2px 150%, 3px 200%, 1px 220%, 2px 180%, 3px 250%, 1px 160%;
  background-position: 10% 0, 25% 0, 40% 0, 60% 0, 75% 0, 90% 0;
  animation: art-cup-drip-y 4s linear 0s infinite, art-cup-drip-y 6s linear 1.5s infinite, art-cup-drip-y 5s linear 3.5s infinite, art-cup-drip-y 7s linear 2s infinite, art-cup-drip-y 4.5s linear 5s infinite, art-cup-drip-y 5.5s linear 0.5s infinite;
  opacity: 0.5;
}
@keyframes art-cup-drip-y { from { background-position-y: -250%; } to { background-position-y: 100%; } }

/* 蛾 */
.theme-moth { --theme-color: #888888; }
.theme-moth .art-name { color: var(--theme-color); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); animation: art-moth-glitch-strong 1.5s infinite steps(1); }
.theme-moth .xp-fill { background: linear-gradient(90deg, #333, #888, #555); }
.theme-moth .art-bg-effect { background: repeating-linear-gradient(45deg, #0001, #0001 1px, transparent 1px, transparent 5px); opacity: 0.15; }
@keyframes art-moth-glitch-strong { 0% { transform: translate(0, 0) skew(0); } 10% { transform: translate(-5px, 3px) skew(-5deg); } 20% { transform: translate(5px, -3px) skew(5deg); } 30% { transform: translate(-8px, 5px) skew(-2deg); } 40% { transform: translate(8px, -5px) skew(2deg); } 50% { transform: translate(-5px, 3px) skew(-5deg); } 60% { transform: translate(5px, -3px) skew(5deg); } 70% { transform: translate(-8px, 5px) skew(-2deg); } 80% { transform: translate(0, 0) skew(0); } 100% { transform: translate(0, 0) skew(0); } }

/* 启 */
.theme-key { --theme-color: #9400D3; }
.theme-key .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }
.theme-key .xp-fill { background: var(--theme-color); }
.theme-key .art-bg-effect {
  background: radial-gradient(ellipse at center, var(--theme-color) 0%, rgba(148, 0, 211, 0.5) 30%, rgba(148, 0, 211, 0.1) 60%, transparent 80%);
  transform-origin: center; animation: art-key-slow-spin 30s linear infinite; opacity: 0.4;
}
@keyframes art-key-slow-spin { from { transform: scale(1.5) rotate(0deg); } to { transform: scale(1.5) rotate(360deg); } }
</style>
