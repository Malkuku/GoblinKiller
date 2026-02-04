<template>
  <div class="arts-module">
    <!-- 概览区域 -->
    <div class="section-header-row">
      <h3>术之等级</h3>
      <span class="hint-text">点击查看详情</span>
    </div>

    <div v-if="hasArts" class="arts-summary-grid">
      <div
        v-for="(art, name) in artsData"
        :key="name"
        class="art-summary-card"
        :class="getArtThemeClass(name)"
        @click="openArtModal(name)"
      >
        <div class="art-card-top">
          <span class="art-card-name">{{ name }}</span>
          <span class="art-card-lv">Lv.{{ art.当前等级 }}</span>
        </div>
        <div class="xp-bar-mini">
          <div class="xp-fill" :style="{ width: calculateXpPercent(art) + '%' }"></div>
        </div>
      </div>
    </div>
    <div v-else class="no-data">暂无术之等级数据</div>

    <!-- 详情弹窗 -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="art-modal-overlay" @click.self="closeModal">
        <!-- 动态绑定主题类名，用于触发特效 -->
        <div class="art-modal-content" :class="getArtThemeClass(selectedArtName)">
          <button class="close-btn" @click="closeModal">×</button>

          <div class="arts-layout">
            <!-- 左侧：导航 -->
            <nav class="pagination-nav">
              <ul>
                <li v-for="(art, name) in artsData" :key="name">
                  <button
                    class="art-button"
                    :class="{ active: selectedArtName === name }"
                    @click="switchArt(name)"
                  >
                    {{ name }}
                  </button>
                </li>
              </ul>
            </nav>

            <!-- 右侧：详情 -->
            <div class="panel-display-area" v-if="selectedArtData">
              <!-- 背景特效层 -->
              <div class="art-bg-effect"></div>

              <div class="art-content-scroll">
                <header class="art-detail-header">
                  <!-- 标题应用特效类 -->
                  <h2 class="art-big-name art-name">{{ selectedArtName }}</h2>
                  <div class="art-stage-badge">{{ getArtStageText(selectedArtData.当前等级) }}</div>
                </header>

                <!-- 核心数据 -->
                <div class="art-core-stats">
                  <div class="level-circle">
                    <span class="lvl-label">LEVEL</span>
                    <span class="lvl-val">{{ selectedArtData.当前等级 }}</span>
                  </div>

                  <div class="xp-section">
                    <template v-if="selectedArtData.下一级需求经验 === -1">
                      <div v-if="selectedArtData.当前等级 === 0" class="barrier-box">
                        <strong class="barrier-title">无适应式</strong>
                        <p>无法理解和掌握该术，除非经历特殊际遇。</p>
                      </div>
                      <div v-else-if="selectedArtData.当前等级 >= 14" class="barrier-box">
                        <strong class="barrier-title">经验壁垒</strong>
                        <p>单纯的练习已无法精进。需寻求【禁忌知识】或举行【准则仪式】以突破。</p>
                      </div>
                      <div v-else class="barrier-box">
                        <strong>特殊状态</strong>
                        <p>当前无法获取经验。</p>
                      </div>
                    </template>

                    <template v-else>
                      <div class="xp-text-row">
                        <span>经验积累</span>
                        <span>{{ selectedArtData.累计经验值 }} / {{ selectedArtData.下一级需求经验 }}</span>
                      </div>
                      <div class="xp-bar-large">
                        <div class="xp-fill-anim" :style="{ width: calculateXpPercent(selectedArtData) + '%' }"></div>
                      </div>
                      <p class="xp-hint">
                        通过符合【{{ selectedArtName }}】准则的行为获取经验。
                      </p>
                    </template>
                  </div>
                </div>

                <!-- 描述与能力 -->
                <div class="art-description-block">
                  <h3>准则描述</h3>
                  <!-- 使用 artPrinciples 中的标准描述 -->
                  <p class="desc-text">{{ getArtDescription(selectedArtName) }}</p>
                  <!-- 如果有额外描述，追加显示 -->
                  <p v-if="selectedArtData.描述 && selectedArtData.描述 !== getArtDescription(selectedArtName)" class="desc-sub-text">
                    {{ selectedArtData.描述 }}
                  </p>
                </div>

                <div class="art-abilities-block" v-if="selectedArtData.能力列表">
                  <h3>已掌握能力</h3>
                  <ul class="ability-list">
                    <li v-for="(ability, idx) in selectedArtData.能力列表" :key="idx">
                      {{ ability }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  artsData: {
    type: Object,
    default: () => ({})
  }
});

// --- 静态数据 (移植自文件1) ---
const artPrinciples = {
  '灯': { description: '灯是理性、求知与启明的准则。', themeClass: 'theme-lamp' },
  '铸': { description: '铸是毁灭、塑形与技巧的准则。', themeClass: 'theme-forge' },
  '刃': { description: '刃是斗争与征服的准则。', themeClass: 'theme-blade' },
  '冬': { description: '冬是静默、消逝、铭记、终结的准则。', themeClass: 'theme-winter' },
  '心': { description: '心是生命、存续、不息的准则。', themeClass: 'theme-heart' },
  '杯': { description: '杯是欲望、生育、诱惑的准则。', themeClass: 'theme-cup' },
  '蛾': { description: '蛾是变化、混沌、未知的准则。', themeClass: 'theme-moth' },
  '启': { description: '启是揭示、洞开、拆解的准则。', themeClass: 'theme-key' },
};

const showModal = ref(false);
const selectedArtName = ref('');

const hasArts = computed(() => props.artsData && Object.keys(props.artsData).length > 0);

const selectedArtData = computed(() => {
  if (!props.artsData) return null;
  return props.artsData[selectedArtName.value];
});

// 计算百分比
const calculateXpPercent = (art) => {
  if (!art) return 0;
  if (art.下一级需求经验 === -1) return 100;
  return Math.min((art.累计经验值 / art.下一级需求经验) * 100, 100);
};

// 阶段文本
const getArtStageText = (level) => {
  if (level === 0) return '无适应式';
  if (level >= 1 && level <= 13) return '初阶 · 模仿';
  if (level >= 14 && level <= 18) return '高阶 · 献祭';
  if (level >= 19) return '秘而不宣';
  return '未知';
};

// 获取主题色 Class (修改逻辑以匹配 artPrinciples)
const getArtThemeClass = (name) => {
  if (!name) return 'theme-default';
  // 查找名称中包含的关键字 (例如 "灯之术" 包含 "灯")
  const key = Object.keys(artPrinciples).find(k => name.includes(k));
  return key ? artPrinciples[key].themeClass : 'theme-default';
};

// 获取描述文本
const getArtDescription = (name) => {
  if (!name) return '';
  const key = Object.keys(artPrinciples).find(k => name.includes(k));
  return key ? artPrinciples[key].description : '该准则的力量在阴影中涌动，性质未明。';
};

const openArtModal = (name) => {
  selectedArtName.value = name;
  showModal.value = true;
};

const switchArt = (name) => {
  selectedArtName.value = name;
};

const closeModal = () => {
  showModal.value = false;
};
</script>

<style scoped>
/* 局部变量 */
.arts-module {
  --c-gold: #d4af37;
  --c-text: #e0e0e0;
  --c-text-dim: #a0a0a0;
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;
}

.section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-header-row h3 { color: var(--c-gold); border-left: 3px solid var(--c-gold); padding-left: 10px; margin: 0; font-family: var(--font-title); font-size: 1.1rem; }
.hint-text { font-size: 0.8rem; color: var(--c-text-dim); }
.no-data { color: var(--c-text-dim); font-style: italic; padding: 10px; }

/* --- 概览卡片 --- */
.arts-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.art-summary-card {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  padding: 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s;
  position: relative; overflow: hidden;
}
.art-summary-card:hover { transform: translateY(-2px); border-color: var(--c-gold); }
.art-card-top { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem; }
.art-card-name { font-weight: bold; color: var(--c-text); }
.art-card-lv { color: var(--c-gold); }
.xp-bar-mini { height: 4px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden; }
.xp-fill { height: 100%; background: var(--c-gold); }

/* --- 弹窗样式 --- */
.art-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
  z-index: 2000; display: flex; justify-content: center; align-items: center;
}
.art-modal-content {
  width: 90%; max-width: 1000px; height: 85vh;
  background: #121212; border: 1px solid #333;
  display: flex; flex-direction: column; position: relative;
  box-shadow: 0 0 50px rgba(0,0,0,0.8);
  border-radius: 6px;
  overflow: hidden;

  /* 默认主题变量 */
  --theme-color: #d4af37;
  --theme-glow: rgba(212, 175, 55, 0.2);
}

.art-modal-content { border-color: var(--theme-color); }
.close-btn { position: absolute; top: 15px; right: 20px; background: none; border: none; color: #666; font-size: 2rem; cursor: pointer; z-index: 10; }
.close-btn:hover { color: var(--theme-color); }

.arts-layout { display: grid; grid-template-columns: 240px 1fr; height: 100%; overflow: hidden; }

/* 导航 */
.pagination-nav { background: rgba(0,0,0,0.3); border-right: 1px solid rgba(255,255,255,0.05); overflow-y: auto; padding: 20px 0; z-index: 2; }
.pagination-nav ul { list-style: none; padding: 0; margin: 0; }
.art-button {
  width: 100%; text-align: left; padding: 15px 25px; background: none; border: none;
  color: #888; font-family: var(--font-title); font-size: 1.1rem; cursor: pointer;
  border-left: 3px solid transparent; transition: 0.3s;
}
.art-button:hover { background: rgba(255,255,255,0.05); color: #ccc; }
.art-button.active {
  background: linear-gradient(90deg, var(--theme-glow), transparent);
  color: var(--theme-color); border-left-color: var(--theme-color);
}

/* 详情区 */
.panel-display-area { position: relative; height: 100%; overflow: hidden; display: flex; flex-direction: column; }

/* --- 移植的特效样式 (Start) --- */
.art-bg-effect { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

/* 灯 (Lamp) */
.theme-lamp { --theme-color: #FFD700; --theme-glow: rgba(255, 215, 0, 0.3); }
.theme-lamp .art-name { color: var(--theme-color); text-shadow: 0 0 10px var(--theme-color); }
.theme-lamp .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 70%); opacity: 0.15; }

/* 铸 (Forge) */
.theme-forge { --theme-color: #FF4500; --flame-color-2: #FF8C00; --theme-glow: rgba(255, 69, 0, 0.3); }
.theme-forge .art-name { color: var(--theme-color); text-shadow: 0 0 5px #fff, 0 0 10px var(--theme-color), 0 0 15px var(--flame-color-2); }
.theme-forge .art-bg-effect { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 0; }
@keyframes art-forge-seamless-rise { from { transform: translateY(0); } to { transform: translateY(-50%); } }
.theme-forge .art-bg-effect::before, .theme-forge .art-bg-effect::after { content: ''; position: absolute; left: 0; width: 100%; height: 200%; background-image: radial-gradient(circle, var(--theme-color) 1px, transparent 1px); background-repeat: repeat; animation-name: art-forge-seamless-rise; animation-timing-function: linear; animation-iteration-count: infinite; }
.theme-forge .art-bg-effect::before { top: 0; background-size: 70px 70px; animation-duration: 6s; opacity: 0.7; }
.theme-forge .art-bg-effect::after { top: 0; background-size: 110px 110px; animation-duration: 10s; opacity: 0.6; animation-delay: -3s; }

/* 刃 (Blade) */
.theme-blade { --theme-color: #C0C0C0; --metal-dark: #888; --metal-light: #F0F0F0; --theme-glow: rgba(192, 192, 192, 0.3); }
.theme-blade .art-name { background: linear-gradient(180deg, var(--metal-light), var(--theme-color) 50%, var(--metal-dark) 51%, var(--theme-color) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); -webkit-text-fill-color: transparent; }
.theme-blade .art-bg-effect { background: linear-gradient(0deg, rgba(255,255,255,0.05), rgba(0,0,0,0.05)), repeating-linear-gradient(90deg, #ccc, #ccc 1px, #bbb 1px, #bbb 2px); opacity: 0.15; }

/* 冬 (Winter) */
.theme-winter { --theme-color: #A3D5D5; --theme-glow: rgba(163, 213, 213, 0.3); }
.theme-winter .art-name { color: var(--theme-color); }
.theme-winter .art-bg-effect { background: radial-gradient(circle, #fff 5%, transparent 6%), radial-gradient(circle, #fff 3%, transparent 4%); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: snow 10s linear infinite; opacity: 0.3; }
@keyframes snow { 0% {background-position: 0 0, 25px 25px;} 100% {background-position: 0 300px, 25px 325px;} }

/* 心 (Heart) */
.theme-heart { --theme-color: #FF69B4; --theme-glow: rgba(255, 105, 180, 0.3); }
.theme-heart .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }
.theme-heart .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 50%) no-repeat center; animation: art-heart-pulse-gradient 2s infinite ease-in-out; opacity: 0.15; }
@keyframes art-heart-pulse-gradient { 0%, 100% { background-size: 100% 100%; opacity: 0.1; } 50% { background-size: 150% 150%; opacity: 0.2; } }

/* 杯 (Cup) */
.theme-cup { --theme-color: #8B0000; --theme-glow: rgba(139, 0, 0, 0.4); }
.theme-cup .art-name { color: var(--theme-color); text-shadow: 0 0 5px rgba(0,0,0,0.5); }
.theme-cup .art-bg-effect { background-image: linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%); background-repeat: no-repeat; background-size: 2px 150%, 3px 200%, 1px 220%; background-position: 10% 0, 50% 0, 90% 0; animation: art-cup-drip-y 6s linear infinite; opacity: 0.4; }
@keyframes art-cup-drip-y { from { background-position-y: -250%; } to { background-position-y: 100%; } }

/* 蛾 (Moth) */
.theme-moth { --theme-color: #888888; --theme-glow: rgba(136, 136, 136, 0.3); }
.theme-moth .art-name { color: var(--theme-color); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); animation: art-moth-glitch-strong 1.5s infinite steps(1); }
.theme-moth .art-bg-effect { background: repeating-linear-gradient(45deg, #0001, #0001 1px, transparent 1px, transparent 5px); opacity: 0.15; }
@keyframes art-moth-glitch-strong { 0% { transform: translate(0, 0) skew(0); } 10% { transform: translate(-5px, 3px) skew(-5deg); } 20% { transform: translate(5px, -3px) skew(5deg); } 30% { transform: translate(-8px, 5px) skew(-2deg); } 40% { transform: translate(8px, -5px) skew(2deg); } 50% { transform: translate(-5px, 3px) skew(-5deg); } 60% { transform: translate(5px, -3px) skew(5deg); } 70% { transform: translate(-8px, 5px) skew(-2deg); } 80% { transform: translate(0, 0) skew(0); } 100% { transform: translate(0, 0) skew(0); } }

/* 启 (Key) */
.theme-key { --theme-color: #9400D3; --theme-glow: rgba(148, 0, 211, 0.3); }
.theme-key .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }
.theme-key .art-bg-effect { background: radial-gradient(ellipse at center, var(--theme-color) 0%, rgba(148, 0, 211, 0.5) 30%, rgba(148, 0, 211, 0.1) 60%, transparent 80%); transform-origin: center; animation: art-key-slow-spin 30s linear infinite; opacity: 0.4; }
@keyframes art-key-slow-spin { from { transform: scale(1.5) rotate(0deg); } to { transform: scale(1.5) rotate(360deg); } }
/* --- 移植的特效样式 (End) --- */

.art-content-scroll { position: relative; z-index: 1; height: 100%; overflow-y: auto; padding: 40px 60px; }
.art-content-scroll::-webkit-scrollbar { width: 6px; }
.art-content-scroll::-webkit-scrollbar-thumb { background: var(--theme-color); border-radius: 3px; }

.art-detail-header { text-align: center; margin-bottom: 40px; }
.art-big-name { font-family: var(--font-title); font-size: 3.5rem; margin: 0; }
.art-stage-badge { display: inline-block; margin-top: 10px; padding: 4px 12px; border: 1px solid var(--theme-color); color: var(--theme-color); border-radius: 20px; font-size: 0.9rem; letter-spacing: 2px; }

.art-core-stats { display: flex; align-items: center; gap: 40px; margin-bottom: 40px; background: rgba(0,0,0,0.4); padding: 30px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
.level-circle {
  width: 100px; height: 100px; border: 3px solid var(--theme-color); border-radius: 50%;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  box-shadow: 0 0 20px var(--theme-glow); flex-shrink: 0;
}
.lvl-label { font-size: 0.7rem; color: #aaa; }
.lvl-val { font-size: 2.5rem; font-weight: bold; color: var(--theme-color); }

.xp-section { flex: 1; }
.xp-text-row { display: flex; justify-content: space-between; margin-bottom: 8px; color: #ccc; font-family: monospace; }
.xp-bar-large { height: 12px; background: #222; border-radius: 6px; overflow: hidden; border: 1px solid #444; }
.xp-fill-anim {
  height: 100%; background: var(--theme-color);
  background-image: linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent);
  background-size: 20px 20px; animation: flow-bar 1s linear infinite;
}
@keyframes flow-bar { 0% { background-position: 40px 0; } 100% { background-position: 0 0; } }
.xp-hint { font-size: 0.85rem; color: #888; margin-top: 8px; font-style: italic; }

.barrier-box { border-left: 3px solid var(--theme-color); padding-left: 15px; color: #ccc; }
.barrier-title { color: var(--theme-color); font-size: 1.1rem; display: block; margin-bottom: 5px; }

.art-description-block, .art-abilities-block { margin-bottom: 30px; }
.art-description-block h3, .art-abilities-block h3 { color: var(--theme-color); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px; font-family: var(--font-title); margin-top: 0; }
.desc-text { line-height: 1.8; font-size: 1.1rem; text-align: justify; color: #ddd; font-family: var(--font-body); }
.desc-sub-text { font-size: 0.95rem; color: #aaa; font-style: italic; margin-top: 10px; }
.ability-list { list-style: none; padding: 0; margin: 0; }
.ability-list li { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #ccc; font-family: var(--font-body); }
.ability-list li::before { content: '◈'; color: var(--theme-color); margin-right: 10px; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
