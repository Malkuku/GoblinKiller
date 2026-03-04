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
          <!-- 攻方始终为红色，防方始终为金色，跟随当前拍动态变化 -->
          <span class="entity-red">{{ parsedInteraction.atkName }}</span>
          <span class="vs-mini">VS</span>
          <span class="entity-gold">{{ parsedInteraction.defName }}</span>
        </div>
        <div class="status-indicator" :class="phase">
          <span class="status-dot"></span>
          {{ phaseText }}
          <span v-if="phase !== 'finished'" class="beat-counter">
            [ 拍数: {{ currentBeatIndex + 1 }} / {{ combatLog.length }} ]
          </span>
          <button class="replay-btn" @click="replayCombat">[ 重置 ]</button>
        </div>
      </div>

      <!-- 卡片内容 -->
      <div class="card-content">
        <!-- SVG 动画区域 -->
        <div class="svg-container" @click="advanceCombat" v-if="phase !== 'finished'">
          <div class="grid-bg"></div>

          <svg viewBox="0 0 800 190" class="combat-svg">
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

            <!-- 左侧：攻方基础信息 -->
            <g class="side-attacker anim-group" :class="{ 'fade-out': phase === 'beat-result' || phase === 'switching' }">
              <line x1="40" y1="20" x2="300" y2="20" stroke="#ff3333" stroke-width="1" opacity="0.3" />
              <text x="170" y="15" class="role-title" fill="#ff3333" text-anchor="middle" filter="url(#glow-red)">
                {{ parsedInteraction.atkName }} <tspan font-size="10" fill="#aaa">(攻)</tspan>
              </text>
              <text x="170" y="35" class="sub-info" fill="#ff3333" text-anchor="middle" opacity="0.8">
                动作: {{ parsedInteraction.atkAction }} | 消耗: {{ currentBeat.攻方.消耗 }}
              </text>
              <rect x="50" y="45" width="240" height="20" fill="rgba(255,51,51,0.05)" stroke="rgba(255,51,51,0.2)" stroke-width="1" rx="2"/>
              <text x="170" y="59" class="formula-text" fill="#e8e0c5" text-anchor="middle">
                {{ currentBeat.攻方.公式 }}
              </text>
            </g>

            <!-- 右侧：防方基础信息 -->
            <g class="side-defender anim-group" :class="{ 'fade-out': phase === 'beat-result' || phase === 'switching' }">
              <line x1="500" y1="20" x2="760" y2="20" stroke="#d4af37" stroke-width="1" opacity="0.3" />
              <text x="630" y="15" class="role-title" fill="#d4af37" text-anchor="middle" filter="url(#glow-gold)">
                {{ parsedInteraction.defName }} <tspan font-size="10" fill="#aaa">(防)</tspan>
              </text>
              <text x="630" y="35" class="sub-info" fill="#d4af37" text-anchor="middle" opacity="0.8">
                应对: {{ parsedInteraction.defAction }} | 消耗: {{ currentBeat.防方.消耗 }}
              </text>
              <rect x="510" y="45" width="240" height="20" fill="rgba(212, 175, 55, 0.05)" stroke="rgba(212, 175, 55, 0.2)" stroke-width="1" rx="2"/>
              <text x="630" y="59" class="formula-text" fill="#e8e0c5" text-anchor="middle">
                {{ currentBeat.防方.公式 }}
              </text>
            </g>

            <!-- 中央区域：骰子与总值对决 -->
            <g class="center-clash-area anim-group" :class="{ 'fade-out': phase === 'switching' }">
              <!-- 准备阶段：显示骰子占位符 (?) -->
              <g v-if="phase === 'ready' || phase === 'switching'">
                <g v-for="(_, index) in expectedAtkDice" :key="'atk-placeholder'+index"
                   :transform="`translate(${320 - (expectedAtkDice * 35) / 2 + index * 35}, 80)`">
                  <rect width="26" height="26" fill="transparent" stroke="rgba(255,51,51,0.3)" stroke-width="1" stroke-dasharray="2 2" />
                  <text x="13" y="18" fill="rgba(255,51,51,0.5)" font-size="13" font-family="monospace" text-anchor="middle">?</text>
                </g>
                <g v-for="(_, index) in expectedDefDice" :key="'def-placeholder'+index"
                   :transform="`translate(${480 - (expectedDefDice * 35) / 2 + index * 35}, 80)`">
                  <rect width="26" height="26" fill="transparent" stroke="rgba(212, 175, 55, 0.3)" stroke-width="1" stroke-dasharray="2 2" />
                  <text x="13" y="18" fill="rgba(212, 175, 55, 0.5)" font-size="13" font-family="monospace" text-anchor="middle">?</text>
                </g>
              </g>

              <!-- 投骰/结算阶段：显示真实骰子 -->
              <g v-else>
                <g v-for="(dice, index) in currentAtkRolls" :key="'atk'+index"
                   :transform="`translate(${320 - (currentAtkRolls.length * 35) / 2 + index * 35}, 80)`">
                  <rect width="26" height="26" fill="rgba(255,51,51,0.1)" stroke="#ff3333" stroke-width="1" />
                  <text x="13" y="18" fill="#fff" font-size="13" font-family="monospace" text-anchor="middle">{{ dice }}</text>
                </g>
                <g v-for="(dice, index) in currentDefRolls" :key="'def'+index"
                   :transform="`translate(${480 - (currentDefRolls.length * 35) / 2 + index * 35}, 80)`">
                  <rect width="26" height="26" fill="rgba(212, 175, 55, 0.1)" stroke="#d4af37" stroke-width="1" />
                  <text x="13" y="18" fill="#fff" font-size="13" font-family="monospace" text-anchor="middle">{{ dice }}</text>
                </g>
              </g>

              <!-- 拼点总值与 VS -->
              <g v-if="phase === 'clashing' || phase === 'beat-result'">
                <g class="total-group" :class="{ 'clash-move-right': phase === 'clashing' }">
                  <polygon points="320,120 340,140 320,160 300,140" fill="rgba(255,51,51,0.15)" stroke="#ff3333" stroke-width="1" filter="url(#glow-red)"/>
                  <text x="320" y="145" fill="#fff" font-size="16" font-family="monospace" font-weight="bold" text-anchor="middle">{{ currentBeat.攻方.攻击总值 }}</text>
                </g>
                <g class="total-group" :class="{ 'clash-move-left': phase === 'clashing' }">
                  <polygon points="480,120 500,140 480,160 460,140" fill="rgba(212, 175, 55, 0.15)" stroke="#d4af37" stroke-width="1" filter="url(#glow-gold)"/>
                  <text x="480" y="145" fill="#fff" font-size="16" font-family="monospace" font-weight="bold" text-anchor="middle">{{ currentBeat.防方.防御总值 }}</text>
                </g>
                <line x1="350" y1="140" x2="450" y2="140" stroke="#fff" stroke-width="1" stroke-dasharray="4 4" opacity="0.3" class="clash-line"/>
                <text x="400" y="146" fill="#fff" font-size="18" font-family="monospace" letter-spacing="2" text-anchor="middle" class="vs-text">VS</text>
              </g>
            </g>

            <!-- 底部中央操作提示 -->
            <g class="action-prompt anim-group" v-if="phase === 'ready' || phase === 'beat-result' || phase === 'switching'" :class="{ 'fade-out': phase === 'switching' }">
              <rect x="330" y="165" width="140" height="20" fill="rgba(212, 175, 55, 0.1)" stroke="#d4af37" stroke-width="1" rx="10" />
              <text x="400" y="179" fill="#d4af37" font-size="11" text-anchor="middle" class="click-continue-hint">
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

                    <!-- 战斗进行中：仅显示当前拍 -->
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

                    <!-- 战斗结束：显示全部拍的复盘列表 -->
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
import { ref, computed } from 'vue';

// 1. 注入符合新规则的 JSON 数据
const rawJson = $1

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
    'switching': '重置序列...', // 新增过渡状态文本
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
      // 结束时留在 visual tab 观看完整复盘
      currentTab.value = 'data';
      phase.value = 'finished';
    } else {
      // 增加切拍的平滑过渡动画
      isAnimating.value = true;
      phase.value = 'switching';
      await delay(300); // 等待 SVG 元素淡出

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

.role-title { font-size: 14px; font-weight: bold; }
.sub-info { font-size: 11px; font-family: var(--ac-font-mono); }
.formula-text { font-size: 11px; font-family: var(--ac-font-mono); }

/* 动画组：增加平滑过渡 */
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

/* 终端输出风格的结果框 */
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

/* 完整复盘列表样式 */
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

@media (max-width: 768px) { .data-grid-layout { grid-template-columns: 1fr; } .combat-svg { min-height: 160px; } }
</style>
