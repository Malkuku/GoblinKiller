<template>
  <div class="app-container animus-theme">
    <!-- 全局扫描线遮罩 -->
    <div class="scanlines"></div>

    <div class="gallery-card active">
      <!-- HUD 边角装饰 -->
      <div class="hud-corner top-left"></div>
      <div class="hud-corner top-right"></div>
      <div class="hud-corner bottom-left"></div>
      <div class="hud-corner bottom-right"></div>

      <!-- 卡片头部 (动态显示当前攻防角色) -->
      <div class="card-header">
        <div class="header-title">
          <span class="tech-prefix">//</span>
          战斗回溯 <span class="separator">::</span>
          <span class="entity-red">{{ parsedInteraction.atkName }}</span>
          <span class="vs-mini">VS</span>
          <span class="entity-gold">{{ parsedInteraction.defName }}</span>
        </div>
        <div class="status-indicator" :class="phase">
          <div class="status-left">
            <span class="status-dot"></span>
            {{ phaseText }}
            <span v-if="phase !== 'finished'" class="beat-counter">
              [ 拍数: {{ currentBeatIndex + 1 }} / {{ combatLog.length }} ]
            </span>
          </div>
          <button class="replay-btn" @click="replayCombat">[ 重置 ]</button>
        </div>
      </div>

      <!-- 卡片内容 -->
      <div class="card-content">
        <!-- SVG 动画区域 -->
        <div class="svg-container" @click="advanceCombat" v-if="phase !== 'finished'">
          <div class="grid-bg"></div>

          <!-- 动态 viewBox，适配移动端垂直布局与电脑端横向布局 -->
          <svg :viewBox="layout.viewBox" class="combat-svg">
            <defs>
              <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- 攻方基础信息 -->
            <g class="side-attacker anim-group" :class="{ 'fade-out': phase === 'beat-result' || phase === 'switching' }">
              <line :x1="layout.atk.line.x1" :y1="layout.atk.line.y1" :x2="layout.atk.line.x2" :y2="layout.atk.line.y2" stroke="#ff3333" stroke-width="1" opacity="0.3" class="svg-trans" />
              <text :x="layout.atk.title.x" :y="layout.atk.title.y" class="role-title svg-trans" fill="#ff3333" text-anchor="middle" filter="url(#glow-red)">
                {{ parsedInteraction.atkName }} <tspan font-size="10" fill="#aaa">(攻)</tspan>
              </text>
              <text :x="layout.atk.sub.x" :y="layout.atk.sub.y" class="sub-info svg-trans" fill="#ff3333" text-anchor="middle" opacity="0.8">
                动作: {{ parsedInteraction.atkAction }} | 消耗: {{ currentBeat.攻方.消耗 }}
              </text>
              <rect :x="layout.atk.rect.x" :y="layout.atk.rect.y" :width="layout.atk.rect.w" :height="layout.atk.rect.h" fill="rgba(255,51,51,0.05)" stroke="rgba(255,51,51,0.2)" stroke-width="1" rx="2" class="svg-trans"/>
              <text :x="layout.atk.form.x" :y="layout.atk.form.y" class="formula-text svg-trans" fill="#e8e0c5" text-anchor="middle">
                {{ currentBeat.攻方.公式 }}
              </text>
            </g>

            <!-- 防方基础信息 -->
            <g class="side-defender anim-group" :class="{ 'fade-out': phase === 'beat-result' || phase === 'switching' }">
              <line :x1="layout.def.line.x1" :y1="layout.def.line.y1" :x2="layout.def.line.x2" :y2="layout.def.line.y2" stroke="#d4af37" stroke-width="1" opacity="0.3" class="svg-trans" />
              <text :x="layout.def.title.x" :y="layout.def.title.y" class="role-title svg-trans" fill="#d4af37" text-anchor="middle" filter="url(#glow-gold)">
                {{ parsedInteraction.defName }} <tspan font-size="10" fill="#aaa">(防)</tspan>
              </text>
              <text :x="layout.def.sub.x" :y="layout.def.sub.y" class="sub-info svg-trans" fill="#d4af37" text-anchor="middle" opacity="0.8">
                应对: {{ parsedInteraction.defAction }} | 消耗: {{ currentBeat.防方.消耗 }}
              </text>
              <rect :x="layout.def.rect.x" :y="layout.def.rect.y" :width="layout.def.rect.w" :height="layout.def.rect.h" fill="rgba(212, 175, 55, 0.05)" stroke="rgba(212, 175, 55, 0.2)" stroke-width="1" rx="2" class="svg-trans"/>
              <text :x="layout.def.form.x" :y="layout.def.form.y" class="formula-text svg-trans" fill="#e8e0c5" text-anchor="middle">
                {{ currentBeat.防方.公式 }}
              </text>
            </g>

            <!-- 中央区域：骰子与总值对决 -->
            <g class="center-clash-area anim-group" :class="{ 'fade-out': phase === 'switching' }">
              <!-- 准备阶段：显示骰子占位符 (?) -->
              <g v-if="phase === 'ready' || phase === 'switching'">
                <g v-for="(_, index) in expectedAtkDice" :key="'atk-placeholder'+index"
                   :transform="`translate(${layout.dice.atkCenterX - (expectedAtkDice * 35) / 2 + index * 35}, ${layout.dice.atkY})`" class="svg-trans">
                  <rect width="26" height="26" fill="transparent" stroke="rgba(255,51,51,0.3)" stroke-width="1" stroke-dasharray="2 2" />
                  <text x="13" y="18" fill="rgba(255,51,51,0.5)" font-size="13" font-family="monospace" text-anchor="middle">?</text>
                </g>
                <g v-for="(_, index) in expectedDefDice" :key="'def-placeholder'+index"
                   :transform="`translate(${layout.dice.defCenterX - (expectedDefDice * 35) / 2 + index * 35}, ${layout.dice.defY})`" class="svg-trans">
                  <rect width="26" height="26" fill="transparent" stroke="rgba(212, 175, 55, 0.3)" stroke-width="1" stroke-dasharray="2 2" />
                  <text x="13" y="18" fill="rgba(212, 175, 55, 0.5)" font-size="13" font-family="monospace" text-anchor="middle">?</text>
                </g>
              </g>

              <!-- 投骰/结算阶段：显示真实骰子 -->
              <g v-else>
                <g v-for="(dice, index) in currentAtkRolls" :key="'atk'+index"
                   :transform="`translate(${layout.dice.atkCenterX - (currentAtkRolls.length * 35) / 2 + index * 35}, ${layout.dice.atkY})`" class="svg-trans">
                  <rect width="26" height="26" fill="rgba(255,51,51,0.1)" stroke="#ff3333" stroke-width="1" />
                  <text x="13" y="18" fill="#fff" font-size="13" font-family="monospace" text-anchor="middle">{{ dice }}</text>
                </g>
                <g v-for="(dice, index) in currentDefRolls" :key="'def'+index"
                   :transform="`translate(${layout.dice.defCenterX - (currentDefRolls.length * 35) / 2 + index * 35}, ${layout.dice.defY})`" class="svg-trans">
                  <rect width="26" height="26" fill="rgba(212, 175, 55, 0.1)" stroke="#d4af37" stroke-width="1" />
                  <text x="13" y="18" fill="#fff" font-size="13" font-family="monospace" text-anchor="middle">{{ dice }}</text>
                </g>
              </g>

              <!-- 拼点总值与 VS -->
              <g v-if="phase === 'clashing' || phase === 'beat-result'">
                <g class="total-group"
                   :class="{ 'clash-move-right': phase === 'clashing' && !isMobile, 'clash-move-down': phase === 'clashing' && isMobile }"
                   :transform="`translate(${layout.clash.atkTotalX}, ${layout.clash.atkTotalY})`">
                  <polygon points="0,-20 20,0 0,20 -20,0" fill="rgba(255,51,51,0.15)" stroke="#ff3333" stroke-width="1" filter="url(#glow-red)"/>
                  <text x="0" y="5" fill="#fff" font-size="16" font-family="monospace" font-weight="bold" text-anchor="middle">{{ currentBeat.攻方.攻击总值 }}</text>
                </g>
                <g class="total-group"
                   :class="{ 'clash-move-left': phase === 'clashing' && !isMobile, 'clash-move-up': phase === 'clashing' && isMobile }"
                   :transform="`translate(${layout.clash.defTotalX}, ${layout.clash.defTotalY})`">
                  <polygon points="0,-20 20,0 0,20 -20,0" fill="rgba(212, 175, 55, 0.15)" stroke="#d4af37" stroke-width="1" filter="url(#glow-gold)"/>
                  <text x="0" y="5" fill="#fff" font-size="16" font-family="monospace" font-weight="bold" text-anchor="middle">{{ currentBeat.防方.防御总值 }}</text>
                </g>
                <line :x1="layout.clash.lineX1" :y1="layout.clash.lineY" :x2="layout.clash.lineX2" :y2="layout.clash.lineY" stroke="#fff" stroke-width="1" stroke-dasharray="4 4" opacity="0.3" class="clash-line svg-trans"/>
                <text :x="layout.clash.vsX" :y="layout.clash.vsY" fill="#fff" font-size="18" font-family="monospace" letter-spacing="2" text-anchor="middle" class="vs-text svg-trans">VS</text>
              </g>
            </g>

            <!-- 操作提示 -->
            <g class="action-prompt anim-group" v-if="phase === 'ready' || phase === 'beat-result' || phase === 'switching'" :class="{ 'fade-out': phase === 'switching' }">
              <rect :x="layout.clash.promptX" :y="layout.clash.promptY" :width="layout.clash.promptW" :height="layout.clash.promptH" fill="rgba(212, 175, 55, 0.1)" stroke="#d4af37" stroke-width="1" rx="10" class="svg-trans" />
              <text :x="layout.clash.promptTextX" :y="layout.clash.promptTextY" fill="#d4af37" font-size="11" text-anchor="middle" class="click-continue-hint svg-trans">
                {{ phase === 'ready' ? '>> 点击投掷骰子 <<' : '>> 点击进入下一拍 <<' }}
              </text>
            </g>
          </svg>
        </div>

        <!-- 结算与视觉演绎 -->
        <div class="result-panel">
          <div class="tab-controller">
            <div class="tab-btn" :class="{ active: currentTab === 'visual' }" @click="currentTab = 'visual'">
              <span class="icon">◈</span> 战斗复盘
            </div>
            <div class="tab-btn" :class="{ active: currentTab === 'data' }" @click="currentTab = 'data'">
              <span class="icon">▧</span> 最终结算
            </div>
            <div class="tab-line"></div>
          </div>

          <div class="tab-content-area">
            <!-- TAB 1: 视觉演绎 -->
            <transition name="fade-slide" mode="out-in">
              <div v-if="currentTab === 'visual'" key="visual" class="visual-view">
                <div class="data-box visual-narrative">
                  <div class="narrative-content">

                    <div v-if="phase !== 'finished' && currentBeat" class="beat-log-item current-focus">
                      <div class="beat-header">
                        <span class="beat-num">拍数 {{ currentBeatIndex + 1 }}</span>
                        <span class="beat-interaction">{{ currentBeat.交互 }}</span>
                      </div>

                      <div class="narrative-text">
                        <span v-if="phase === 'beat-result' || phase === 'switching'" class="revealed-text">
                          {{ currentBeat.短述 }}
                        </span>
                        <span v-else class="pending-text">
                          <span class="glitch-marks">???</span> 动作轨迹解析中... <span class="glitch-marks">???</span>
                        </span>
                      </div>

                      <div class="system-result-box" :class="phase">
                        <span class="result-arrow">>></span>
                        <span v-if="phase === 'ready' || phase === 'switching'" class="pending">等待投骰演算...</span>
                        <span v-else-if="phase === 'rolling' || phase === 'clashing'" class="pending">正在进行冲突判定...</span>
                        <span v-else-if="phase === 'beat-result'" class="highlight-result">
                          判定结果：{{ currentBeat.结果 }}
                        </span>
                      </div>
                    </div>

                    <div v-else class="full-recap-list">
                      <div v-for="(beat, index) in combatLog" :key="'recap'+index" class="beat-log-item history-item">
                        <div class="beat-header">
                          <span class="beat-num">拍数 {{ index + 1 }}</span>
                          <span class="beat-interaction">{{ beat.交互 }}</span>
                        </div>
                        <div class="narrative-text">
                          <span class="revealed-text">{{ beat.短述 }}</span>
                        </div>
                        <div class="system-result-box beat-result">
                          <span class="result-arrow">>></span>
                          <span class="highlight-result">判定结果：{{ beat.结果 }}</span>
                        </div>
                      </div>
                      <div class="narrative-footer">
                        <span class="end-mark">/// 序列已完成，可切换至[最终结算]查看数值 ///</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <!-- TAB 2: 数值结算 -->
              <div v-else-if="currentTab === 'data'" key="data" class="data-view">
                <div class="data-grid-layout">
                  <div v-for="charName in charNames" :key="charName" class="data-box tactical-analysis">
                    <div class="box-header">
                      <span class="box-icon"></span>
                      <h4>{{ charName }}</h4>
                    </div>
                    <div class="stats-comparison">
                      <div class="stat-col" :class="charName === charNames[0] ? 'red' : 'gold'">
                        <div class="stat-row" v-for="(stat, index) in parseStats(finalSettlement[charName])" :key="index">
                          <span>{{ stat.name }}</span>
                          <span class="val-highlight">{{ stat.value }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="data-box settlement" style="grid-column: 1 / -1;">
                    <div class="box-header">
                      <span class="box-icon"></span>
                      <h4>状态附加</h4>
                    </div>
                    <div class="list-section">
                      <ul>
                        <li v-if="!finalSettlement.状态附加 || finalSettlement.状态附加.length === 0" style="color: #777;">无新增状态</li>
                        <li v-for="(state, i) in finalSettlement.状态附加" :key="'state'+i" class="status-alert">{{ state }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 1. 注入符合新规则的 JSON 数据
const rawJson =  $1

const combatLog = rawJson.交锋推演;
const finalSettlement = rawJson.最终结算;

const charNames = Object.keys(finalSettlement).filter(key => key !== '状态附加');

const parseStats = (statString) => {
  if (!statString || typeof statString !== 'string') return [];
  return statString.split(',').map(s => {
    const parts = s.trim().split(/\s+/);
    return { name: parts[0], value: parts.slice(1).join(' ') || '' };
  });
};

// 2. 状态管理
const phase = ref('ready');
const currentTab = ref('visual');
const currentBeatIndex = ref(0);
const currentAtkRolls = ref([]);
const currentDefRolls = ref([]);
const isAnimating = ref(false);

// --- 新增：响应式布局检测 ---
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// --- 新增：动态 SVG 坐标系 (电脑端横向，移动端垂直) ---
const layout = computed(() => {
  if (isMobile.value) {
    return {
      viewBox: "0 0 400 500",
      atk: {
        line: { x1: 20, y1: 30, x2: 380, y2: 30 },
        title: { x: 200, y: 20 },
        sub: { x: 200, y: 45 },
        rect: { x: 40, y: 55, w: 320, h: 24 },
        form: { x: 200, y: 72 }
      },
      def: {
        line: { x1: 20, y1: 490, x2: 380, y2: 490 },
        title: { x: 200, y: 480 },
        sub: { x: 200, y: 455 },
        rect: { x: 40, y: 415, w: 320, h: 24 },
        form: { x: 200, y: 432 }
      },
      dice: {
        atkY: 100, defY: 370,
        atkCenterX: 200, defCenterX: 200
      },
      clash: {
        atkTotalX: 200, atkTotalY: 170,
        defTotalX: 200, defTotalY: 330,
        vsX: 200, vsY: 246,
        lineX1: 100, lineX2: 300, lineY: 240,
        promptX: 130, promptY: 265, promptW: 140, promptH: 24, promptTextX: 200, promptTextY: 281
      }
    };
  } else {
    // 电脑端：保持原版坐标 100% 不变
    return {
      viewBox: "0 0 800 190",
      atk: {
        line: { x1: 40, y1: 20, x2: 300, y2: 20 },
        title: { x: 170, y: 15 },
        sub: { x: 170, y: 35 },
        rect: { x: 50, y: 45, w: 240, h: 20 },
        form: { x: 170, y: 59 }
      },
      def: {
        line: { x1: 500, y1: 20, x2: 760, y2: 20 },
        title: { x: 630, y: 15 },
        sub: { x: 630, y: 35 },
        rect: { x: 510, y: 45, w: 240, h: 20 },
        form: { x: 630, y: 59 }
      },
      dice: {
        atkY: 80, defY: 80,
        atkCenterX: 320, defCenterX: 480
      },
      clash: {
        atkTotalX: 320, atkTotalY: 140,
        defTotalX: 480, defTotalY: 140,
        vsX: 400, vsY: 146,
        lineX1: 350, lineX2: 450, lineY: 140,
        promptX: 330, promptY: 165, promptW: 140, promptH: 20, promptTextX: 400, promptTextY: 179
      }
    };
  }
});

const currentBeat = computed(() => combatLog[currentBeatIndex.value]);
const expectedAtkDice = computed(() => currentBeat.value?.攻方?.骰点详情?.length || 1);
const expectedDefDice = computed(() => currentBeat.value?.防方?.骰点详情?.length || 1);

const parsedInteraction = computed(() => {
  if (!currentBeat.value) return { atkName: '攻方', atkAction: '未知', defName: '防方', defAction: '未知' };
  const match = currentBeat.value.交互.match(/(.+?)\((.+?)\)\s*vs\s*(.+?)\((.+?)\)/);
  if (match) {
    return {
      atkName: match[1].trim(),
      atkAction: match[2].trim(),
      defName: match[3].trim(),
      defAction: match[4].trim()
    };
  }
  return { atkName: '攻方', atkAction: '未知', defName: '防方', defAction: '未知' };
});

const phaseText = computed(() => {
  const map = {
    'ready': '准备投骰',
    'rolling': '概率演算中',
    'clashing': '冲突判定',
    'beat-result': '单拍结算',
    'switching': '重置序列...',
    'finished': '序列完成'
  };
  return map[phase.value];
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 3. 核心动画逻辑
const advanceCombat = async () => {
  if (isAnimating.value || phase.value === 'finished') return;

  if (phase.value === 'beat-result') {
    if (currentBeatIndex.value >= combatLog.length - 1) {
      currentTab.value = 'data';
      phase.value = 'finished';
    } else {
      isAnimating.value = true;
      phase.value = 'switching';
      await delay(300);

      currentBeatIndex.value++;
      currentAtkRolls.value = [];
      currentDefRolls.value = [];
      phase.value = 'ready';
      isAnimating.value = false;
    }
    return;
  }

  if (phase.value === 'ready') {
    isAnimating.value = true;
    phase.value = 'rolling';

    const targetAtk = combatLog[currentBeatIndex.value].攻方.骰点详情;
    const targetDef = combatLog[currentBeatIndex.value].防方.骰点详情;

    const rollInterval = setInterval(() => {
      currentAtkRolls.value = targetAtk.map(() => Math.floor(Math.random() * 20) + 1);
      currentDefRolls.value = targetDef.map(() => Math.floor(Math.random() * 20) + 1);
    }, 50);

    await delay(600);
    clearInterval(rollInterval);

    currentAtkRolls.value = [...targetAtk];
    currentDefRolls.value = [...targetDef];

    phase.value = 'clashing';
    await delay(600);

    phase.value = 'beat-result';
    isAnimating.value = false;
  }
};

const replayCombat = () => {
  if (isAnimating.value) return;
  phase.value = 'ready';
  currentBeatIndex.value = 0;
  currentTab.value = 'visual';
  currentAtkRolls.value = [];
  currentDefRolls.value = [];
};
</script>

<style scoped>
/* --- 核心色彩与变量 --- */
.animus-theme {
  --ac-bg-dark: #080705;
  --ac-bg-panel: rgba(20, 18, 12, 0.9);
  --ac-gold: #d4af37;
  --ac-gold-dim: #8a7035;
  --ac-gold-light: #f9d77e;
  --ac-red: #cc2929;
  --ac-white: #e8e0c5;
  --ac-gray: #7d7560;
  --ac-line: rgba(212, 175, 55, 0.2);
  --ac-font-main: 'Rajdhani', 'Microsoft YaHei', sans-serif;
  --ac-font-mono: 'Fira Code', monospace;

  background-color: var(--ac-bg-dark);
  color: var(--ac-white);
  font-family: var(--ac-font-main);
  padding: 15px 10px;
  position: relative;
  overflow: hidden;
}

.scanlines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0) 50%, rgba(50,40,0,0.05) 50%, rgba(50,40,0,0.05));
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 999;
  opacity: 0.4;
}

.gallery-card {
  position: relative;
  background-color: var(--ac-bg-panel);
  border: 1px solid var(--ac-line);
  max-width: 850px;
  margin: 0 auto;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
}

.gallery-card.active {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
}

.hud-corner { position: absolute; width: 10px; height: 10px; border: 2px solid transparent; z-index: 10; }
.top-left { top: -1px; left: -1px; border-top-color: var(--ac-gold); border-left-color: var(--ac-gold); }
.top-right { top: -1px; right: -1px; border-top-color: var(--ac-gold); border-right-color: var(--ac-gold); }
.bottom-left { bottom: -1px; left: -1px; border-bottom-color: var(--ac-gold); border-left-color: var(--ac-gold); }
.bottom-right { bottom: -1px; right: -1px; border-bottom-color: var(--ac-gold); border-right-color: var(--ac-gold); }

.card-header {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--ac-line);
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%);
}

.header-title { font-size: 0.95rem; display: flex; align-items: center; gap: 6px; font-weight: bold; }
.tech-prefix { color: var(--ac-gold-dim); }
.separator { color: var(--ac-line); }
.entity-red { color: var(--ac-red); transition: color 0.3s; }
.entity-gold { color: var(--ac-gold); transition: color 0.3s; }
.vs-mini { font-size: 0.75rem; color: var(--ac-gray); font-family: var(--ac-font-mono); }

.status-indicator { font-family: var(--ac-font-mono); font-size: 0.75rem; display: flex; align-items: center; gap: 6px; color: var(--ac-gray); }
.status-left { display: flex; align-items: center; gap: 6px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.beat-counter { color: var(--ac-gold-light); margin-left: 6px; }
.status-indicator.ready .status-dot { background-color: var(--ac-gold); animation: pulse 1.5s infinite; }
.status-indicator.rolling .status-dot { background-color: var(--ac-gold-light); animation: blink 0.5s infinite; }
.status-indicator.clashing .status-dot { background-color: var(--ac-red); }
.status-indicator.beat-result .status-dot { background-color: var(--ac-red); }
.status-indicator.switching .status-dot { background-color: var(--ac-gray); animation: blink 0.3s infinite; }
.status-indicator.finished .status-dot { background-color: var(--ac-gold); }

.replay-btn {
  background: transparent; border: 1px solid var(--ac-gold-dim); color: var(--ac-gold-light);
  font-family: var(--ac-font-mono); font-size: 0.7rem; padding: 2px 6px; margin-left: 6px; cursor: pointer;
}
.replay-btn:hover { background: rgba(212, 175, 55, 0.2); color: #fff; border-color: var(--ac-gold); }

/* SVG 区域 */
.svg-container {
  position: relative; width: 100%; cursor: pointer; border-bottom: 1px solid var(--ac-line);
  background-color: #0b0a08; min-height: 190px;
}
.grid-bg {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-image: linear-gradient(var(--ac-line) 1px, transparent 1px), linear-gradient(90deg, var(--ac-line) 1px, transparent 1px);
  background-size: 40px 40px; opacity: 0.15;
}
.combat-svg { width: 100%; height: auto; display: block; position: relative; z-index: 2; }
.svg-trans { transition: all 0.3s ease; } /* 坐标切换时的平滑过渡 */

.role-title { font-size: 14px; font-weight: bold; }
.sub-info { font-size: 11px; font-family: var(--ac-font-mono); }
.formula-text { font-size: 11px; font-family: var(--ac-font-mono); }

/* 动画组 */
.anim-group { transition: all 0.3s ease-in-out; }
.total-group { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.clash-move-right { transform: translateX(15px); }
.clash-move-left { transform: translateX(-15px); }
.fade-out { opacity: 0; transform: translateY(-5px); filter: grayscale(100%); pointer-events: none; }
.side-attacker.fade-out, .side-defender.fade-out { opacity: 0.15; transform: translateY(0); }

.clash-line { animation: drawLine 0.3s ease forwards; }
.vs-text { animation: glitchPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
.click-continue-hint { animation: blink 1.5s infinite; pointer-events: none; font-family: var(--ac-font-mono); }

/* 底部面板 */
.result-panel { padding: 12px 15px; background: linear-gradient(to bottom, rgba(212, 175, 55, 0.03), transparent); min-height: 160px; }
.tab-controller { display: flex; gap: 2px; margin-bottom: 10px; position: relative; }
.tab-btn {
  padding: 4px 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--ac-line); border-bottom: none;
  color: var(--ac-gray); font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px;
  clip-path: polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px);
}
.tab-btn.active { background: rgba(212, 175, 55, 0.15); color: var(--ac-gold); border-color: var(--ac-gold); }
.tab-line { position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: var(--ac-gold); opacity: 0.3; }

.data-grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.data-box {
  position: relative; padding: 10px 12px; background: rgba(20, 18, 12, 0.5); border: 1px solid var(--ac-line);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.box-header { display: flex; align-items: center; margin-bottom: 8px; border-bottom: 1px solid var(--ac-line); padding-bottom: 4px; }
.box-icon { width: 4px; height: 4px; background-color: var(--ac-gold); margin-right: 6px; transform: rotate(45deg); }
.box-header h4 { margin: 0; font-size: 0.85rem; color: var(--ac-white); font-weight: normal; }

.stats-comparison { font-family: var(--ac-font-mono); font-size: 0.75rem; }
.stat-col { display: flex; flex-direction: column; gap: 4px; }
.stat-col.red { color: #ffaaaa; }
.stat-col.gold { color: var(--ac-gold-light); }
.stat-row { display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 2px; }
.val-highlight { font-weight: bold; color: var(--ac-white); }

.list-section ul { margin: 0; padding: 0; list-style: none; font-size: 0.75rem; font-family: var(--ac-font-mono); }
.list-section ul li::before { content: '>'; color: var(--ac-gold); margin-right: 4px; }
.status-alert { color: var(--ac-red); }

/* --- 文本展示优化 --- */
.visual-narrative { padding: 0; background: transparent; border: none; clip-path: none; }
.beat-log-item {
  padding: 10px 12px;
  border-left: 3px solid var(--ac-gold);
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.08), transparent);
  margin-bottom: 8px;
}
.beat-header { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; font-family: var(--ac-font-mono); }
.beat-num { background: var(--ac-gold); color: #000; padding: 1px 5px; font-size: 0.7rem; font-weight: bold; border-radius: 2px; }
.beat-interaction { font-size: 0.8rem; color: var(--ac-gold-light); opacity: 0.9; }

.narrative-text {
  font-family: 'Microsoft YaHei', sans-serif;
  line-height: 1.4;
  font-size: 0.9rem;
  color: #e2dac2;
  text-align: justify;
  margin-bottom: 8px;
}

.pending-text { color: var(--ac-gray); font-style: italic; font-family: var(--ac-font-mono); font-size: 0.85rem; }
.glitch-marks { color: var(--ac-gold-dim); animation: blink 1s infinite; }
.revealed-text { animation: glitchPop 0.3s ease forwards; }

.system-result-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  padding: 6px 10px;
  font-family: var(--ac-font-mono);
  font-size: 0.85rem;
  border-radius: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.system-result-box.beat-result { border-color: rgba(204, 41, 41, 0.4); background: rgba(204, 41, 41, 0.05); }
.result-arrow { color: var(--ac-gold); font-weight: bold; }
.system-result-box .pending { color: var(--ac-gray); font-style: italic; }
.highlight-result { color: var(--ac-red); font-weight: bold; text-shadow: 0 0 5px rgba(204, 41, 41, 0.3); animation: glitchPop 0.3s ease forwards;}

.full-recap-list {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: fadeSlideUp 0.4s ease forwards;
}
.full-recap-list::-webkit-scrollbar { width: 4px; }
.full-recap-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
.full-recap-list::-webkit-scrollbar-thumb { background: var(--ac-gold-dim); border-radius: 2px; }
.history-item { opacity: 0.85; transition: opacity 0.2s; }
.history-item:hover { opacity: 1; background: linear-gradient(90deg, rgba(212, 175, 55, 0.15), transparent); }

.narrative-footer { margin-top: 10px; text-align: right; font-family: var(--ac-font-mono); font-size: 0.7rem; color: var(--ac-gold-dim); opacity: 0.8; }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; text-shadow: 0 0 10px var(--ac-gold); } }
@keyframes drawLine { from { stroke-dashoffset: 200; stroke-dasharray: 200; } to { stroke-dashoffset: 0; stroke-dasharray: 4 4; } }
@keyframes glitchPop { 0% { opacity: 0; transform: scale(0.98); filter: blur(2px); } 100% { opacity: 1; transform: scale(1); filter: blur(0); } }
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }

/* ==========================================
   移动端深度优化 (完全重构，不影响电脑端)
========================================== */
@media (max-width: 768px) {
  .animus-theme { padding: 10px 5px; }
  .gallery-card { border-radius: 6px; }

  /* 1. 头部排版优化：上下堆叠，信息清晰 */
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
  }
  .header-title {
    font-size: 1.1rem;
    flex-wrap: wrap;
    line-height: 1.4;
  }
  .status-indicator {
    width: 100%;
    justify-content: space-between;
    font-size: 0.85rem;
  }
  .replay-btn {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  /* 2. SVG 区域：取消强行放大和横向滚动，让 SVG 垂直自然铺开 */
  .svg-container {
    min-height: auto;
    padding: 15px 0;
  }
  .combat-svg {
    width: 100%;
    height: auto;
    max-width: 400px;
    margin: 0 auto;
  }

  /* 移动端专属的拼点动画方向 (上下移动) */
  .clash-move-down { transform: translateY(15px); }
  .clash-move-up { transform: translateY(-15px); }

  /* 3. 底部 Tab 栏：增大触控面积 */
  .tab-controller { gap: 4px; margin-bottom: 15px; }
  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 12px 0;
    font-size: 0.95rem;
  }

  /* 4. 文本复盘区域：增大字号和间距 */
  .beat-log-item { padding: 12px; }
  .beat-header { flex-wrap: wrap; gap: 8px; }
  .beat-num { font-size: 0.8rem; padding: 3px 6px; }
  .beat-interaction { font-size: 0.95rem; }
  .narrative-text { font-size: 1rem; line-height: 1.5; }
  .system-result-box { font-size: 0.9rem; padding: 10px; flex-wrap: wrap; }

  /* 5. 数据面板：单列布局 */
  .data-grid-layout { grid-template-columns: 1fr; gap: 12px; }
  .box-header h4 { font-size: 1rem; }
  .stats-comparison { font-size: 0.9rem; }
  .stat-row { padding-bottom: 6px; }
  .list-section ul { font-size: 0.9rem; }
  .list-section ul li { margin-bottom: 6px; }
}
</style>
