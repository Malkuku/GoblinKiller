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
            <p v-if="currentPrinciple.power" class="principle-power">{{ currentPrinciple.power }}</p>
          </div>
        </transition>
      </div>

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
</template>

<script setup>
import { ref, computed } from 'vue';

// 1. 定义八大准则的数据
const principles = ref([
  {name: '准则', title: '自现实世界的表皮"漫宿"所剥落的碎片,逸散成能使人为之引动的力量', power: '人们总结规律，最终领悟了八大准则，它们具备独特而危险的力量'},
  { name: '灯', title: '理性、求知与启明的准则', symbol: '知识、光芒', themeClass: 'theme-lamp', power: '其力量旨在照亮心智、揭示真相、操控光与知识的本质。' },
  { name: '铸', title: '毁灭、塑形与技巧的准则', symbol: '锻造、工艺、力量、火', themeClass: 'theme-forge', power: '其力量专注于力量的精妙运用、物质的彻底改造，以及火焰与毁灭的终极掌控。' },
  { name: '刃', title: '斗争与征服的准则', symbol: '武器、战斗技巧、暗杀',  themeClass: 'theme-blade', power: '其力量专注于提升战斗技巧、强化征服意志、以及暗杀与隐匿的艺术。' },
  { name: '冬', title: '静默、消逝、铭记的准则', symbol: '雪、寒冷、记忆、亡者',  themeClass: 'theme-winter', power: '其力量冻结时间、沉寂生命、触碰亡者，并最终定义存在的终末。' },
  { name: '心', title: '生命、存续、不息的准则', symbol: '运动、生者、心灵、治疗', themeClass: 'theme-heart', power: '其力量主宰生命洪流、塑造群体意志、并维系存在的本质，并能从根本上强化施术者自身的生命活力与体魄。' },
  { name: '杯', title: '欲望、生育、诱惑的准则', symbol: '血肉、性、欲望',  themeClass: 'theme-cup', power: '其力量旨在改造肉体、塑造形态、激发欲望、并最终掌控生命的本质。' },
  { name: '蛾', title: '变化、混沌、未知的准则', symbol: '奇想、幻觉、欺骗、混乱', themeClass: 'theme-moth', power: '其力量编织幻觉、引导偶然、篡改形态，最终模糊现实与可能性的边界。' },
  { name: '启', title: '揭示、洞开、拆解的准则', symbol: '门与钥匙、伤口、揭密',  themeClass: 'theme-key' , power: '其力量破除障碍、揭露秘密、运用"门"与"钥匙"的本质。'},
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
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
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
  justify-content: center;
  padding: 5vh 2rem;
  box-sizing: border-box;
  /* 移除了 margin-left，改为使用左右对称的 margin */
  margin: 0 auto;
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

.principle-power {
  font-size: 1rem;
  color: var(--text-primary);
  margin-top: 1rem;
  line-height: 1.6;
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
.principle-selector {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

.principle-selector ul {
  display: flex;
  flex-direction: column;
  gap: 6px;
  list-style: none;
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

/* 铸 */
.theme-forge { --theme-color: #FF4500; --flame-color-2: #FF8C00; }
.theme-forge .art-name { color: var(--theme-color); text-shadow: 0 0 5px #fff, 0 0 10px var(--theme-color), 0 0 15px var(--flame-color-2); }

/* 刃 */
.theme-blade { --theme-color: #C0C0C0; --metal-dark: #888; --metal-light: #F0F0F0; }
.theme-blade .art-name { background: linear-gradient(180deg, var(--metal-light), var(--theme-color) 50%, var(--metal-dark) 51%, var(--theme-color) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); -webkit-text-fill-color: transparent; }

/* 冬 */
.theme-winter { --theme-color: #A3D5D5; }
.theme-winter .art-name { color: var(--theme-color); text-shadow: 0 0 10px #fff; }

/* 心 */
.theme-heart { --theme-color: #FF69B4; }
.theme-heart .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }

/* 杯 */
.theme-cup { --theme-color: #8B0000; }
.theme-cup .art-name { color: var(--theme-color); text-shadow: 0 0 5px rgba(0,0,0,0.5); }

/* 蛾 */
.theme-moth { --theme-color: #888888; }
.theme-moth .art-name { color: var(--theme-color); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); animation: art-moth-glitch-strong 1.5s infinite steps(1); }

/* 启 */
.theme-key { --theme-color: #9400D3; }
.theme-key .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }
</style>
