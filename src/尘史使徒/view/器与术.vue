<template>
  <div class="arts-items-view-container">
    <!-- 1. 顶层选项卡 -->
    <div class="tabs">
      <button class="tab-button" :class="{ active: activeTab === 'arts' }" @click="selectTab('arts')">
        术
      </button>
      <button class="tab-button" :class="{ active: activeTab === 'items' }" @click="selectTab('items')">
        器
      </button>
    </div>

    <!-- 2. 内容展示区 -->
    <div class="content-wrapper">
      <!-- A. "术" 的内容区 -->
      <template v-if="activeTab === 'arts'">
        <div v-if="userArts.length > 0" class="arts-layout">
          <!-- A1. 分页导航 -->
          <nav class="pagination-nav">
            <ul>
              <li v-for="(art, index) in userArts" :key="art.name">
                <button class="art-button" :class="{ active: index === currentArtIndex }" @click="selectArt(index)">
                  {{ art.name }}
                </button>
              </li>
            </ul>
          </nav>

          <!-- A2. 术的详情面板 -->
          <div class="panel-display-area">
            <transition name="fade-main" mode="out-in">
              <div v-if="currentArt" :key="currentArt.name"
                   class="art-panel" :class="artPrinciples[currentArt.name]?.themeClass">

                <!-- 特效背景 -->
                <div class="art-bg-effect"></div>

                <div class="art-content">
                  <h2 class="art-name">{{ currentArt.name }}</h2>
                  <!-- 通用描述 -->
                  <p class="art-description">{{ artPrinciples[currentArt.name]?.description }}</p>

                  <div class="level-info">
                    <div class="level-display">
                      <span class="label">等级</span>
                      <span class="value">{{ currentArt.data.当前等级 }}</span>
                    </div>

                    <!-- 经验值 (非满级) -->
                    <div v-if="currentArt.data.下一级需求经验 !== -1" class="xp-bar">
                      <div class="xp-fill" :style="{ width: xpPercentage + '%' }"></div>
                      <span class="xp-text">{{ currentArt.data.累计经验值 }} / {{ currentArt.data.下一级需求经验 }}</span>
                    </div>

                    <!-- 满级文本 -->
                    <div v-if="currentArt.data.下一级需求经验 === -1" class="max-level-notice">
                      {{ maxLevelText }}
                    </div>
                  </div>

                  <!-- 等级解锁描述 -->
                  <div v-if="currentArtLevelDescriptions.length > 0" class="level-descriptions-container">
                    <p v-for="(desc, index) in currentArtLevelDescriptions" :key="index" class="level-description-item">
                      {{ desc }}
                    </p>
                  </div>

                </div>
              </div>
            </transition>
          </div>
        </div>
        <div v-else class="loading-state">尚未习得任何“术”...</div>
      </template>

      <!-- B. "器" 的内容区 -->
      <template v-else-if="activeTab === 'items'">
        <div v-if="userItems.length > 0" class="items-list-container">
          <h2 class="items-title">持有器具</h2>
          <ul class="items-list">
            <li v-for="item in userItems" :key="item.name" class="item-entry">
              <strong>{{ item.name }}</strong>: {{ item.description }}
            </li>
          </ul>
        </div>
        <div v-else class="loading-state">身无长物...</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStatStore } from '@/尘史使徒/store/StatStore';

// --- 静态数据：术的原则与主题 ---
const artPrinciples = {
  '灯': { description: '灯是理性、求知与启明的准则。',  themeClass: 'theme-lamp' },
  '铸': { description: '铸是毁灭、塑形与技巧的准则。',  themeClass: 'theme-forge' },
  '刃': { description: '刃是斗争与征服的准则。',  themeClass: 'theme-blade' },
  '冬': { description:'冬是静默、消逝、铭记、终结的准则。', themeClass: 'theme-winter' },
  '心': { description: '心是生命、存续、不息的准则。', themeClass: 'theme-heart' },
  '杯': { description: '杯是欲望、生育、诱惑的准则。', themeClass: 'theme-cup' },
  '蛾': { description: '蛾是变化、混沌、未知的准则。', themeClass: 'theme-moth' },
  '启': { description: '启是揭示、洞开、拆解的准则。',  themeClass: 'theme-key' },
};

const statStore = useStatStore();

// --- 状态管理 ---
const activeTab = ref('arts');
const currentArtIndex = ref(0);

// --- 计算属性 ---
const isOmniscient = computed(() => statStore.stat_data?.全知视角 === true);
const currentUserKey = ref('user');
const artLevelDescriptions = computed(() => statStore.stat_data?.术);

const userArts = computed(() => {
  const artsData = statStore.stat_data?.角色?.主要角色?.[currentUserKey.value]?.术之等级;
  return artsData ? Object.entries(artsData).map(([name, data]) => ({ name, data })) : [];
});

const userItems = computed(() => {
  const itemsData = statStore.stat_data?.器具;
  if (!itemsData) {
    return [];
  }

  // 将其从 { "器具名": { "描述": "..." } } 的格式
  // 转换为 [ { name: "器具名", description: "..." } ] 的数组格式
  return Object.entries(itemsData).map(([itemName, itemDetails]) => ({
    name: itemName,
    description: itemDetails?.描述 || '描述缺失'
  }));
});


const currentArt = computed(() => userArts.value[currentArtIndex.value]);

const xpPercentage = computed(() => {
  if (!currentArt.value || currentArt.value.data.下一级需求经验 <= 0) return 0;
  return (currentArt.value.data.累计经验值 / currentArt.value.data.下一级需求经验) * 100;
});

const maxLevelText = computed(() => {
  if (!currentArt.value || currentArt.value.data.下一级需求经验 !== -1) return '';
  const level = currentArt.value.data.当前等级;
  if (level === 0) return "此道初开，然前路已尽。";
  if (level >= 14 && level <= 18) return "已臻化境，此道再无寸进。";
  if (level >= 19) return "此道已穷尽，汝即是准则本身。";
  return "前路已断，无法再精进。";
});

// --- 新增：计算当前术的等级描述 ---
const currentArtLevelDescriptions = computed(() => {
  if (!currentArt.value) return [];

  const artName = currentArt.value.name;
  const currentLevel = currentArt.value.data.当前等级;
  const descriptionsMap = artLevelDescriptions[artName];

  if (!descriptionsMap) return [];

  const unlockedDescriptions = [];
  // 获取所有等级阈值，并按数字大小排序
  const levelThresholds = Object.keys(descriptionsMap)
    .map(Number)
    .sort((a, b) => a - b);

  for (const threshold of levelThresholds) {
    // 规则：展示所有小于等于当前等级，且大于0的描述
    if (threshold > 0 && threshold <= currentLevel) {
      const descriptions = descriptionsMap[String(threshold)];
      if (descriptions && Array.isArray(descriptions)) {
        unlockedDescriptions.push(...descriptions);
      }
    }
  }
  return unlockedDescriptions;
});


// --- 方法 ---
function selectTab(tabName) {
  activeTab.value = tabName;
}

function selectArt(index) {
  currentArtIndex.value = index;
}
</script>

<style scoped>
/* --- 基础布局与通用样式 --- */
.arts-items-view-container { display: flex; flex-direction: column; height: 100%; }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); }
.tab-button { background: none; border: none; border-bottom: 3px solid transparent; padding: 0.75rem 1.5rem; font-family: 'Cinzel', serif; font-size: 1.1rem; color: var(--text-secondary); cursor: pointer; transition: all 0.3s ease; transform: translateY(1px); }
.tab-button:hover { color: var(--text-primary); }
.tab-button.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
.content-wrapper { flex-grow: 1; overflow: auto; }
.loading-state { color: var(--text-secondary); font-style: italic; text-align: center; padding: 4rem 0; }

/* --- "术" 模块布局 --- */
.arts-layout { display: grid; grid-template-columns: 220px 1fr; gap: 1.5rem; height: 100%; }
.pagination-nav { background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem 0; overflow-y: auto; }
.pagination-nav ul { list-style: none; padding: 0; margin: 0; }
.art-button { width: 100%; background: none; border: none; border-left: 3px solid transparent; padding: 0.8rem 1.5rem; text-align: left; font-family: 'EB Garamond', serif; font-size: 1rem; color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
.art-button:hover { background-color: var(--bg-primary); color: var(--text-primary); }
.art-button.active { background-color: var(--bg-primary); color: var(--accent-primary); border-left-color: var(--accent-danger); font-weight: bold; }
.panel-display-area { overflow: hidden; }

/* --- "术" 面板通用样式 --- */
.art-panel {
  position: relative;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.art-bg-effect { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
.art-content { position: relative; z-index: 1; padding: 2rem 3rem; text-align: center; max-width: 60ch; width: 100%; overflow-y: auto; height: 100%; }
.art-name { font-family: 'Cinzel', serif; font-size: 3rem; margin: 0; }
.art-symbol { font-size: 1rem; font-style: italic; color: var(--text-secondary); margin: 0.5rem 0 2rem 0; }
.level-info { margin-bottom: 2rem; }
.level-display { margin-bottom: 1rem; }
.level-display .label { font-size: 1rem; color: var(--text-secondary); margin-right: 1rem; }
.level-display .value { font-size: 2.5rem; font-weight: bold; }
.xp-bar { background-color: var(--bg-primary); border-radius: 4px; height: 24px; position: relative; overflow: hidden; }
.xp-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease-out; }
.xp-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.8rem; color: var(--text-primary); mix-blend-mode: difference; filter: invert(1) grayscale(1) contrast(100); }
.max-level-notice { font-style: italic; color: var(--accent-primary); margin-top: 1rem; }
.art-description { font-family: 'EB Garamond', serif; font-size: 1.1rem; line-height: 1.6; }

/* --- 等级描述样式 --- */
.level-descriptions-container { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var( rgba(136, 136, 136, 0.3)); text-align: left; }
.level-description-item { font-family: 'EB Garamond', serif; font-size: 1rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 0.75rem; padding-left: 1.2em; text-indent: -1.2em; }
.level-description-item::before { content: '◈'; margin-right: 0.5em; color: var(--theme-color, var(--accent-primary)); font-size: 0.8em; vertical-align: middle; }

/* --- "器" 模块样式 --- */
.items-list-container { background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 2rem; }
.items-title { font-family: 'Cinzel', serif; font-size: 1.5rem; margin: 0 0 1.5rem 0; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
.items-list { list-style-type: none; padding-left: 0; }
.item-entry { font-family: 'EB Garamond', serif; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 1rem; line-height: 1.5; }
.item-entry strong { color: var(--accent-primary); display: block; margin-bottom: 0.25rem; }

/* --- 动态主题与特效 --- */
/* 灯 */
.theme-lamp { --theme-color: #FFD700; }
.theme-lamp .art-name { color: var(--theme-color); text-shadow: 0 0 10px var(--theme-color); }
.theme-lamp .xp-fill { background: var(--theme-color); }
.theme-lamp .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 70%); opacity: 0.15; }


/* 铸 (无缝视差最终版) */
.theme-forge { --theme-color: #FF4500; --flame-color-2: #FF8C00; }
.theme-forge .art-name { color: var(--theme-color); text-shadow: 0 0 5px #fff, 0 0 10px var(--theme-color), 0 0 15px var(--flame-color-2); }
.theme-forge .xp-fill { background: linear-gradient(90deg, var(--theme-color), var(--flame-color-2)); }

/*
  解决方案：
  1. 使用 transform: translateY 替代 background-position，利用GPU加速，实现绝对平滑的无缝滚动，杜绝卡顿。
  2. 将动画层的高度设为200%，动画移动-50%的距离。当动画结束时，下半部分无缝衔接上半部分，实现不间断循环。
  3. 使用两个伪元素创建两层“相同样式”的粒子，但赋予它们不同的密度(background-size)和速度(animation-duration)，让它们交错运行，形成统一但内部速度不一的动态效果。
*/
.theme-forge .art-bg-effect {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  overflow: hidden; /* 关键：裁剪掉超出容器的动画部分 */
  z-index: 0;
}

@keyframes art-forge-seamless-rise {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); } /* 向上移动自身高度的一半 */
}

/* 为两个粒子层定义共同的动画属性 */
.theme-forge .art-bg-effect::before,
.theme-forge .art-bg-effect::after {
  content: '';
  position: absolute;
  left: 0;
  width: 100%;
  height: 200%; /* 关键：高度为容器的两倍 */
  background-image: radial-gradient(circle, var(--theme-color) 1px, transparent 1px);
  background-repeat: repeat;
  animation-name: art-forge-seamless-rise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

/* 粒子层 1: 速度较快，密度较高 */
.theme-forge .art-bg-effect::before {
  top: 0;
  background-size: 70px 70px; /* 粒子间距 */
  animation-duration: 6s; /* 动画速度 */
  opacity: 0.7;
}

/* 粒子层 2: 速度较慢，密度较低 (形成交错感) */
.theme-forge .art-bg-effect::after {
  top: 0;
  background-size: 110px 110px; /* 粒子间距 */
  animation-duration: 10s; /* 动画速度 */
  opacity: 0.6;
  animation-delay: -3s; /* 使动画初始状态错开 */
}

/* 刃 */
.theme-blade { --theme-color: #C0C0C0; --metal-dark: #888; --metal-light: #F0F0F0; }
.theme-blade .art-name { background: linear-gradient(180deg, var(--metal-light), var(--theme-color) 50%, var(--metal-dark) 51%, var(--theme-color) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); -webkit-text-fill-color: transparent; }
.theme-blade .xp-fill { background: linear-gradient(45deg, var(--metal-dark), var(--metal-light)); }
.theme-blade .art-bg-effect { background: linear-gradient(0deg, rgba(255,255,255,0.05), rgba(0,0,0,0.05)), repeating-linear-gradient(90deg, #ccc, #ccc 1px, #bbb 1px, #bbb 2px); opacity: 0.3; }

/* 冬 */
.theme-winter { --theme-color: #A3D5D5; }
.theme-winter .art-name { color: var(--theme-color); }
.theme-winter .xp-fill { background: var(--theme-color); }
.theme-winter .art-bg-effect { background: radial-gradient(circle, #fff 5%, transparent 6%), radial-gradient(circle, #fff 3%, transparent 4%); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: snow 10s linear infinite; }
@keyframes snow { 0% {background-position: 0 0, 25px 25px;} 100% {background-position: 0 300px, 25px 325px;} }

/* 心 */
.theme-heart { --theme-color: #FF69B4; }
.theme-heart .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }
.theme-heart .xp-fill { background: var(--theme-color); }
.theme-heart .art-bg-effect {
  background: radial-gradient(circle, var(--theme-color) 0%, transparent 50%) no-repeat center;
  animation: art-heart-pulse-gradient 2s infinite ease-in-out; opacity: 0.15; }
@keyframes art-heart-pulse-gradient { 0%, 100% { background-size: 100% 100%; opacity: 0.1; } 50% { background-size: 150% 150%; opacity: 0.2; } }

/* 杯 */
.theme-cup { --theme-color: #8B0000; }
.theme-cup .art-name { color: var(--theme-color); text-shadow: 0 0 5px rgba(0,0,0,0.5); }
.theme-cup .xp-fill { background: var(--theme-color); }
.theme-cup .art-bg-effect {
  background-image:
    linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%),
    linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%),
    linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%);
  background-repeat: no-repeat;
  background-size: 2px 150%, 3px 200%, 1px 220%, 2px 180%, 3px 250%, 1px 160%;
  background-position: 10% 0, 25% 0, 40% 0, 60% 0, 75% 0, 90% 0;
  animation:
    art-cup-drip-y 4s linear 0s infinite, art-cup-drip-y 6s linear 1.5s infinite,
    art-cup-drip-y 5s linear 3.5s infinite, art-cup-drip-y 7s linear 2s infinite,
    art-cup-drip-y 4.5s linear 5s infinite, art-cup-drip-y 5.5s linear 0.5s infinite;
  opacity: 0.5;
}
@keyframes art-cup-drip-y { from { background-position-y: -250%; } to { background-position-y: 100%; } }

/* 蛾 */
.theme-moth { --theme-color: #888888; }
.theme-moth .art-name { color: var(--theme-color); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); animation: art-moth-glitch-strong 1.5s infinite steps(1); }
.theme-moth .xp-fill { background: linear-gradient(90deg, #333, #888, #555); }
.theme-moth .art-bg-effect { background: repeating-linear-gradient(45deg, #0001, #0001 1px, transparent 1px, transparent 5px); opacity: 0.15; }
@keyframes art-moth-glitch-strong { 0% { transform: translate(0, 0) skew(0); } 10% { transform: translate(-5px, 3px) skew(-5deg); } 20% { transform: translate(5px, -3px) skew(5deg); } 30% { transform: translate(-8px, 5px) skew(-2deg); } 40% { transform: translate(8px, -5px) skew(2deg); } 50% { transform: translate(-5px, 3px) skew(-5deg); } 60% { transform: translate(5px, -3px) skew(5deg); } 70% { transform: translate(-8px, 5px) skew(-2deg); } 80% { transform: translate(0, 0) skew(0); } 100% { transform: translate(0, 0) skew(0); } }

/* 启 (重制) */
.theme-key { --theme-color: #9400D3; }
.theme-key .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }
.theme-key .xp-fill { background: var(--theme-color); }
/* 解决方案：使用单个、巨大的 radial-gradient 模拟星云，通过动画缓慢旋转它。 */
.theme-key .art-bg-effect {
  background: radial-gradient(ellipse at center,
  var(--theme-color) 0%,
  rgba(148, 0, 211, 0.5) 30%,
  rgba(148, 0, 211, 0.1) 60%,
  transparent 80%
  );
  transform-origin: center;
  animation: art-key-slow-spin 30s linear infinite;
  opacity: 0.4; /* 提高不透明度使其更明显 */
}
@keyframes art-key-slow-spin {
  from { transform: scale(1.5) rotate(0deg); }
  to { transform: scale(1.5) rotate(360deg); }
}



/* --- 响应式与动画 --- */
@media (max-width: 900px) {
  .arts-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .pagination-nav ul { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
  .art-button { width: auto; border-left: none; border-bottom: 2px solid transparent; border-radius: 4px; }
  .art-button.active { border-bottom-color: var(--accent-danger); }
}
.fade-main-enter-active, .fade-main-leave-active { transition: opacity 0.3s ease; }
.fade-main-enter-from, .fade-main-leave-to { opacity: 0; }
</style>
