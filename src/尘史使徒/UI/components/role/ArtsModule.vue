<template>
  <div class="arts-module">
    <!-- 概览区域 -->
    <div class="section-header-row">
      <h3>术之等级</h3>
      <span class="hint-text" v-if="mode === 'creation'">点击图标查看详情 (剩余点数决定等级上限)</span>
      <span class="hint-text" v-else>点击查看详情</span>
    </div>

    <div v-if="hasArts" class="arts-summary-grid">
      <div
        v-for="(art, name) in artsData"
        :key="name"
        class="art-summary-card"
        :class="[getArtThemeClass(name), { 'locked': (art.等级 || 0) === 0 && mode === 'view' }]"
        @click="openArtModal(name)"
      >
        <div class="art-card-top">
          <span class="art-card-name">{{ name }}</span>
          <span class="art-card-lv">Lv.{{ art.等级 || 0 }}</span>
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
                    <span class="nav-lv" v-if="mode === 'creation'">Lv.{{ art.等级 || 0 }}</span>
                  </button>
                </li>
              </ul>
            </nav>

            <!-- 右侧：详情 -->
            <div class="panel-display-area" v-if="selectedArtData">
              <div class="art-bg-effect"></div>

              <div class="art-content-scroll">
                <header class="art-detail-header">
                  <h2 class="art-big-name art-name">{{ selectedArtName }}</h2>
                  <div class="art-stage-badge">{{ getArtStageText(selectedArtData.等级) }}</div>
                </header>

                <!-- 核心数据 -->
                <div class="art-core-stats" v-if="mode === 'view' || (selectedArtData.等级 || 0) > 0">
                  <div class="level-circle">
                    <span class="lvl-label">LEVEL</span>
                    <span class="lvl-val">{{ selectedArtData.等级 || 0 }}</span>
                  </div>
                  <div class="xp-section" v-if="mode === 'view'">
                    <div class="xp-text-row">
                      <span>经验积累</span>
                      <!-- 动态计算经验需求显示 -->
                      <span v-if="calculateNextLevelXp(selectedArtData.等级) !== -1">
                        {{ selectedArtData.经验 || selectedArtData.经验值 || 0 }} / {{ calculateNextLevelXp(selectedArtData.等级) }}
                      </span>
                      <span v-else>MAX (秘而不宣)</span>
                    </div>
                    <div class="xp-bar-large">
                      <div class="xp-fill-anim" :style="{ width: calculateXpPercent(selectedArtData) + '%' }"></div>
                    </div>
                  </div>
                  <div class="xp-section" v-else>
                    <p class="xp-hint">当前等级已赋予的能力如下。</p>
                  </div>
                </div>

                <!-- 描述与能力列表 -->
                <div class="art-description-block">
                  <h3>准则描述</h3>
                  <p class="desc-text">{{ getArtDescription(selectedArtName) }}</p>
                </div>

                <!-- 详细能力展示区 -->
                <div class="art-abilities-block">
                  <h3>{{ mode === 'creation' ? '全阶位能力预览' : '当前掌握能力' }}</h3>

                  <div class="ability-timeline">
                    <!-- 动态获取 Store 中的详情数据 -->
                    <template v-for="(desc, levelStr) in getArtDetails(selectedArtName)" :key="levelStr">
                      <div
                        class="ability-item"
                        :class="{
                          'active': Number(levelStr) <= (selectedArtData.等级 || 0),
                          'future': Number(levelStr) > (selectedArtData.等级 || 0),
                          'hidden': mode === 'view' && Number(levelStr) > (selectedArtData.等级 || 0)
                        }"
                        v-if="mode === 'creation' || Number(levelStr) <= (selectedArtData.等级 || 0)"
                      >
                        <div class="ability-lv-badge">Lv.{{ levelStr }}</div>
                        <div class="ability-text">{{ desc }}</div>
                      </div>
                    </template>

                    <div v-if="!getArtDetails(selectedArtName)" class="no-detail-hint">
                      该准则的详细记录尚未被破译，或正在从虚空中读取...
                    </div>
                  </div>
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
import { storeToRefs } from 'pinia';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';

const props = defineProps({
  artsData: {
    type: Object,
    default: () => ({})
  },
  mode: {
    type: String,
    default: 'view' // 'view' | 'creation'
  }
});

// --- 接入 Store ---
const statStore = useStatStore();
const { stat_data } = storeToRefs(statStore);

// --- 静态配置 (仅保留主题色和通用描述，具体等级详情走Store) ---
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

// --- 核心修改：从 Store 获取详情 ---
const getArtDetails = (name) => {
  // 1. 确保数据已加载
  if (!stat_data.value || !stat_data.value['术']) {
    return null;
  }

  const artsDb = stat_data.value['术'];

  // 2. 尝试直接匹配
  if (artsDb[name]) return artsDb[name];

  // 3. 尝试模糊匹配 (例如 name="灯之术", key="灯")
  const key = Object.keys(artsDb).find(k => name.includes(k));
  return key ? artsDb[key] : null;
};

// --- 新增：根据规则计算下一级所需经验 ---
const calculateNextLevelXp = (level) => {
  const lvl = level || 0;
  if (lvl === 0) return -1;

  // 初阶 (1-13级): 当前等级 * 200
  if (lvl >= 1 && lvl <= 13) return lvl * 200;

  // 高阶 (14-18级): 当前等级^2 * 500
  if (lvl >= 14 && lvl <= 18) return Math.pow(lvl, 2) * 500;

  // 秘而不宣 (19级+): 无法获取经验
  return -1;
};

const calculateXpPercent = (art) => {
  if (!art) return 0;
  const level = art.等级 || 0;
  const currentXp = art.经验 || art.经验值 || 0; // 兼容字段
  const reqXp = calculateNextLevelXp(level);

  if (reqXp === -1) return 0; // 满级或无法获取经验时不显示进度条（或显示满）
  return Math.min((currentXp / reqXp) * 100, 100);
};

const getArtStageText = (level) => {
  const lvl = level || 0;
  if (lvl === 0) return '未入门';
  if (lvl >= 1 && lvl <= 13) return '初阶 · 模仿';
  if (lvl >= 14 && lvl <= 18) return '高阶 · 献祭';
  if (lvl >= 19) return '秘而不宣';
  return '未知';
};

const getArtThemeClass = (name) => {
  if (!name) return 'theme-default';
  const key = Object.keys(artPrinciples).find(k => name.includes(k));
  return key ? artPrinciples[key].themeClass : 'theme-default';
};

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
/* 样式保持不变，复用之前的 CSS */
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

.arts-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.art-summary-card {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  padding: 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s;
  position: relative; overflow: hidden;
}
.art-summary-card:hover { transform: translateY(-2px); border-color: var(--c-gold); }
.art-summary-card.locked { opacity: 0.5; filter: grayscale(1); }

.art-card-top { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem; }
.art-card-name { font-weight: bold; color: var(--c-text); }
.art-card-lv { color: var(--c-gold); }
.xp-bar-mini { height: 4px; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden; }
.xp-fill { height: 100%; background: var(--c-gold); }

/* 弹窗样式 */
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
  border-radius: 6px; overflow: hidden;
  --theme-color: #d4af37;
  --theme-glow: rgba(212, 175, 55, 0.2);
  border-color: var(--theme-color);
}

.close-btn { position: absolute; top: 15px; right: 20px; background: none; border: none; color: #666; font-size: 2rem; cursor: pointer; z-index: 10; }
.close-btn:hover { color: var(--theme-color); }

.arts-layout { display: grid; grid-template-columns: 240px 1fr; height: 100%; overflow: hidden; }

/* 导航 */
.pagination-nav { background: rgba(0,0,0,0.3); border-right: 1px solid rgba(255,255,255,0.05); overflow-y: auto; padding: 20px 0; z-index: 2; }
.pagination-nav ul { list-style: none; padding: 0; margin: 0; }
.art-button {
  width: 100%; text-align: left; padding: 15px 25px; background: none; border: none;
  color: #888; font-family: var(--font-title); font-size: 1.1rem; cursor: pointer;
  border-left: 3px solid transparent; transition: 0.3s; display: flex; justify-content: space-between;
}
.art-button:hover { background: rgba(255,255,255,0.05); color: #ccc; }
.art-button.active {
  background: linear-gradient(90deg, var(--theme-glow), transparent);
  color: var(--theme-color); border-left-color: var(--theme-color);
}
.nav-lv { font-size: 0.8rem; opacity: 0.7; font-family: var(--font-body); }

/* 详情区 */
.panel-display-area { position: relative; height: 100%; overflow: hidden; display: flex; flex-direction: column; }
.art-content-scroll { position: relative; z-index: 1; height: 100%; overflow-y: auto; padding: 40px 60px; }
.art-content-scroll::-webkit-scrollbar { width: 6px; }
.art-content-scroll::-webkit-scrollbar-thumb { background: var(--theme-color); border-radius: 3px; }

/* 头部 */
.art-detail-header { text-align: center; margin-bottom: 40px; }
.art-big-name { font-family: var(--font-title); font-size: 3.5rem; margin: 0; }
.art-stage-badge { display: inline-block; margin-top: 10px; padding: 4px 12px; border: 1px solid var(--theme-color); color: var(--theme-color); border-radius: 20px; font-size: 0.9rem; letter-spacing: 2px; }

/* 核心数据 */
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

/* 描述与能力 */
.art-description-block, .art-abilities-block { margin-bottom: 30px; }
.art-description-block h3, .art-abilities-block h3 { color: var(--theme-color); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px; font-family: var(--font-title); margin-top: 0; }
.desc-text { line-height: 1.8; font-size: 1.1rem; text-align: justify; color: #ddd; font-family: var(--font-body); }

/* 能力时间轴列表 */
.ability-timeline { display: flex; flex-direction: column; gap: 15px; }
.ability-item {
  display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03);
  border-left: 2px solid #444; transition: all 0.3s;
}
.ability-item.active { border-left-color: var(--theme-color); background: linear-gradient(90deg, rgba(255,255,255,0.08), transparent); }
.ability-item.future { opacity: 0.5; border-left-style: dashed; }
.ability-item.hidden { display: none; }

.ability-lv-badge {
  flex-shrink: 0; width: 50px; text-align: center; font-weight: bold;
  color: var(--theme-color); font-family: var(--font-title);
}
.ability-text { color: #ccc; font-family: var(--font-body); line-height: 1.5; }
.no-detail-hint { color: #666; font-style: italic; padding: 10px; }

/* 特效样式 */
.art-bg-effect { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
.theme-lamp { --theme-color: #FFD700; --theme-glow: rgba(255, 215, 0, 0.3); }
.theme-lamp .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 70%); opacity: 0.15; }

.theme-forge { --theme-color: #FF4500; --flame-color-2: #FF8C00; --theme-glow: rgba(255, 69, 0, 0.3); }
.theme-forge .art-bg-effect { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 0; }
@keyframes art-forge-seamless-rise { from { transform: translateY(0); } to { transform: translateY(-50%); } }
.theme-forge .art-bg-effect::before, .theme-forge .art-bg-effect::after { content: ''; position: absolute; left: 0; width: 100%; height: 200%; background-image: radial-gradient(circle, var(--theme-color) 1px, transparent 1px); background-repeat: repeat; animation-name: art-forge-seamless-rise; animation-timing-function: linear; animation-iteration-count: infinite; }
.theme-forge .art-bg-effect::before { top: 0; background-size: 70px 70px; animation-duration: 6s; opacity: 0.7; }
.theme-forge .art-bg-effect::after { top: 0; background-size: 110px 110px; animation-duration: 10s; opacity: 0.6; animation-delay: -3s; }

.theme-blade { --theme-color: #C0C0C0; --metal-dark: #888; --metal-light: #F0F0F0; --theme-glow: rgba(192, 192, 192, 0.3); }
.theme-blade .art-bg-effect { background: linear-gradient(0deg, rgba(255,255,255,0.05), rgba(0,0,0,0.05)), repeating-linear-gradient(90deg, #ccc, #ccc 1px, #bbb 1px, #bbb 2px); opacity: 0.15; }

.theme-winter { --theme-color: #A3D5D5; --theme-glow: rgba(163, 213, 213, 0.3); }
.theme-winter .art-bg-effect { background: radial-gradient(circle, #fff 5%, transparent 6%), radial-gradient(circle, #fff 3%, transparent 4%); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: snow 10s linear infinite; opacity: 0.3; }
@keyframes snow { 0% {background-position: 0 0, 25px 25px;} 100% {background-position: 0 300px, 25px 325px;} }

.theme-heart { --theme-color: #FF69B4; --theme-glow: rgba(255, 105, 180, 0.3); }
.theme-heart .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 50%) no-repeat center; animation: art-heart-pulse-gradient 2s infinite ease-in-out; opacity: 0.15; }
@keyframes art-heart-pulse-gradient { 0%, 100% { background-size: 100% 100%; opacity: 0.1; } 50% { background-size: 150% 150%; opacity: 0.2; } }

.theme-cup { --theme-color: #8B0000; --theme-glow: rgba(139, 0, 0, 0.4); }
.theme-cup .art-bg-effect { background-image: linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%); background-repeat: no-repeat; background-size: 2px 150%, 3px 200%, 1px 220%; background-position: 10% 0, 50% 0, 90% 0; animation: art-cup-drip-y 6s linear infinite; opacity: 0.4; }
@keyframes art-cup-drip-y { from { background-position-y: -250%; } to { background-position-y: 100%; } }

.theme-moth { --theme-color: #888888; --theme-glow: rgba(136, 136, 136, 0.3); }
.theme-moth .art-bg-effect { background: repeating-linear-gradient(45deg, #0001, #0001 1px, transparent 1px, transparent 5px); opacity: 0.15; }

.theme-key { --theme-color: #9400D3; --theme-glow: rgba(148, 0, 211, 0.3); }
.theme-key .art-bg-effect { background: radial-gradient(ellipse at center, var(--theme-color) 0%, rgba(148, 0, 211, 0.5) 30%, rgba(148, 0, 211, 0.1) 60%, transparent 80%); transform-origin: center; animation: art-key-slow-spin 30s linear infinite; opacity: 0.4; }
@keyframes art-key-slow-spin { from { transform: scale(1.5) rotate(0deg); } to { transform: scale(1.5) rotate(360deg); } }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* =========================================
   移动端适配 (Mobile Responsive)
   ========================================= */
@media (max-width: 768px) {
  .art-modal-content {
    width: 95%;
    height: 90vh;
    max-height: 90vh;
  }

  .close-btn {
    top: 5px;
    right: 10px;
    font-size: 1.8rem;
    z-index: 20;
  }

  .arts-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .pagination-nav {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 0;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    padding-right: 40px;
  }

  .pagination-nav ul {
    display: flex;
    flex-direction: row;
  }

  .pagination-nav li {
    flex: 0 0 auto;
  }

  .art-button {
    width: auto;
    padding: 12px 15px;
    border-left: none;
    border-bottom: 3px solid transparent;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 0.9rem;
  }

  .art-button.active {
    background: linear-gradient(0deg, var(--theme-glow), transparent);
    border-bottom-color: var(--theme-color);
  }

  .nav-lv {
    font-size: 0.7rem;
  }

  .art-content-scroll {
    padding: 20px 15px;
  }

  .art-detail-header {
    margin-bottom: 25px;
  }

  .art-big-name {
    font-size: 2rem;
    line-height: 1.2;
  }

  .art-core-stats {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    margin-bottom: 25px;
  }

  .level-circle {
    width: 80px;
    height: 80px;
  }

  .lvl-val {
    font-size: 2rem;
  }

  .xp-section {
    width: 100%;
  }

  .desc-text {
    font-size: 1rem;
    text-align: left;
  }

  .ability-item {
    padding: 12px;
    gap: 10px;
  }

  .ability-lv-badge {
    width: 40px;
    font-size: 0.9rem;
  }

  .ability-text {
    font-size: 0.9rem;
  }
}
</style>
