<template>
  <div class="app-container animus-theme">
    <!-- 全局扫描线遮罩 -->
    <div class="scanlines"></div>

    <div class="gallery-card" :class="{ 'active': phase !== 'idle' }">
      <!-- HUD 边角装饰 -->
      <div class="hud-corner top-left"></div>
      <div class="hud-corner top-right"></div>
      <div class="hud-corner bottom-left"></div>
      <div class="hud-corner bottom-right"></div>

      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="header-title">
          <span class="tech-prefix">//</span>
          战斗回溯 <span class="sub-text">MULTI-BEAT_LOG</span> <span class="separator">::</span>
          <span class="entity-red">{{ charNames[0] }}</span>
          <span class="vs-mini">VS</span>
          <span class="entity-gold">{{ charNames[1] }}</span>
        </div>
        <div class="status-indicator" :class="phase">
          <span class="status-dot"></span>
          {{ phaseText }}
          <span v-if="phase !== 'idle' && phase !== 'finished'" class="beat-counter">
            [ 拍数: {{ currentBeatIndex + 1 }} / {{ combatLog.length }} ]
          </span>
        </div>
      </div>

      <!-- 卡片内容 -->
      <div class="card-content">
        <!-- SVG 动画区域 -->
        <div class="svg-container" @click="startCombat">
          <!-- 背景网格与准星 -->
          <div class="grid-bg"></div>
          <div class="crosshair center"></div>

          <div v-if="phase === 'idle'" class="start-hint">
            <span class="bracket">[</span> 启动多拍交锋序列 <span class="bracket">]</span>
          </div>

          <svg viewBox="0 0 800 350" class="combat-svg" v-if="phase !== 'idle'">
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

            <!-- 左侧：当前拍攻方 (红色) -->
            <g class="side-attacker" :class="{ 'fade-out': phase === 'beat-result' }">
              <line x1="40" y1="35" x2="360" y2="35" stroke="#ff3333" stroke-width="1" opacity="0.3" />
              <!-- 名称 -->
              <text x="200" y="25" class="role-title" fill="#ff3333" text-anchor="middle" filter="url(#glow-red)">
                {{ parsedInteraction.atkName }} <tspan font-size="10" fill="#aaa">(攻)</tspan>
              </text>
              <!-- 动作与消耗 -->
              <text x="200" y="50" class="sub-info" fill="#ff3333" text-anchor="middle" opacity="0.8">
                动作: {{ parsedInteraction.atkAction }} | 消耗: {{ currentBeat.攻方.消耗 }}
              </text>
              <!-- 公式 -->
              <text x="200" y="65" class="formula-text" fill="#888" text-anchor="middle">
                公式: {{ currentBeat.攻方.公式 }}
              </text>

              <!-- 攻击方骰子矩阵 -->
              <g>
                <g v-for="(dice, index) in currentAtkRolls" :key="'atk'+index"
                   :transform="`translate(${80 + (index % 5) * 50}, ${90 + Math.floor(index / 5) * 50})`">
                  <rect width="36" height="36" fill="rgba(255,51,51,0.05)" stroke="#ff3333" stroke-width="1" />
                  <line x1="0" y1="0" x2="5" y2="5" stroke="#ff3333" stroke-width="1" opacity="0.5"/>
                  <text x="18" y="25" fill="#fff" font-size="16" font-family="monospace" text-anchor="middle">{{ dice }}</text>
                </g>
              </g>

              <!-- 攻击方总值 -->
              <g v-if="phase === 'clashing' || phase === 'beat-result'" class="total-group" :class="{ 'clash-move-right': phase === 'clashing' }">
                <polygon points="200,245 235,280 200,315 165,280" fill="rgba(255,51,51,0.1)" stroke="#ff3333" stroke-width="1" filter="url(#glow-red)"/>
                <text x="200" y="286" fill="#fff" font-size="20" font-family="monospace" font-weight="bold" text-anchor="middle">{{ currentBeat.攻方.攻击总值 }}</text>
              </g>
            </g>

            <!-- 右侧：当前拍防方 (暗金色) -->
            <g class="side-defender" :class="{ 'fade-out': phase === 'beat-result' }">
              <line x1="440" y1="35" x2="760" y2="35" stroke="#d4af37" stroke-width="1" opacity="0.3" />
              <!-- 名称 -->
              <text x="600" y="25" class="role-title" fill="#d4af37" text-anchor="middle" filter="url(#glow-gold)">
                {{ parsedInteraction.defName }} <tspan font-size="10" fill="#aaa">(防)</tspan>
              </text>
              <!-- 动作与消耗 -->
              <text x="600" y="50" class="sub-info" fill="#d4af37" text-anchor="middle" opacity="0.8">
                应对: {{ parsedInteraction.defAction }} | 消耗: {{ currentBeat.防方.消耗 }}
              </text>
              <!-- 公式 -->
              <text x="600" y="65" class="formula-text" fill="#888" text-anchor="middle">
                公式: {{ currentBeat.防方.公式 }}
              </text>

              <!-- 防御方骰子矩阵 -->
              <g>
                <g v-for="(dice, index) in currentDefRolls" :key="'def'+index"
                   :transform="`translate(${550 + (index % 5) * 50}, ${90 + Math.floor(index / 5) * 50})`">
                  <rect width="36" height="36" fill="rgba(212, 175, 55, 0.05)" stroke="#d4af37" stroke-width="1" />
                  <line x1="0" y1="0" x2="5" y2="5" stroke="#d4af37" stroke-width="1" opacity="0.5"/>
                  <text x="18" y="25" fill="#fff" font-size="16" font-family="monospace" text-anchor="middle">{{ dice }}</text>
                </g>
              </g>

              <!-- 防御方总值 -->
              <g v-if="phase === 'clashing' || phase === 'beat-result'" class="total-group" :class="{ 'clash-move-left': phase === 'clashing' }">
                <polygon points="600,245 635,280 600,315 565,280" fill="rgba(212, 175, 55, 0.1)" stroke="#d4af37" stroke-width="1" filter="url(#glow-gold)"/>
                <text x="600" y="286" fill="#fff" font-size="20" font-family="monospace" font-weight="bold" text-anchor="middle">{{ currentBeat.防方.防御总值 }}</text>
              </g>
            </g>

            <!-- 中心：单拍拼点结果 -->
            <g v-if="phase === 'clashing' || phase === 'beat-result'" class="clash-center">
              <line x1="300" y1="280" x2="500" y2="280" stroke="#fff" stroke-width="1" stroke-dasharray="4 4" opacity="0.5" class="clash-line"/>
              <text x="400" y="286" fill="#fff" font-size="24" font-family="monospace" letter-spacing="4" text-anchor="middle" class="vs-text">VS</text>

              <g v-if="phase === 'beat-result'" class="result-group">
                <rect x="200" y="140" width="400" height="50" fill="rgba(255,51,51,0.1)" stroke="#ff3333" stroke-width="1" />
                <text x="400" y="173" fill="#ff3333" font-size="22" font-family="monospace" font-weight="bold" letter-spacing="2" text-anchor="middle" filter="url(#glow-red)">
                  {{ currentBeat.结果 }}
                </text>
              </g>
            </g>
          </svg>
        </div>

        <!-- 结算与视觉演绎 (分页模式) -->
        <div class="result-panel" v-if="phase === 'finished'">
          <!-- 分页控制器 -->
          <div class="tab-controller">
            <div class="tab-btn" :class="{ active: currentTab === 'data' }" @click="currentTab = 'data'">
              <span class="icon">▧</span> 最终结算 <span class="en">STATUS</span>
            </div>
            <div class="tab-btn" :class="{ active: currentTab === 'visual' }" @click="currentTab = 'visual'">
              <span class="icon">◈</span> 战斗复盘 <span class="en">LOGS</span>
            </div>
            <div class="tab-line"></div>
          </div>

          <div class="tab-content-area">
            <!-- TAB 1: 数值结算 -->
            <transition name="fade-slide" mode="out-in">
              <div v-if="currentTab === 'data'" key="data" class="data-view">
                <div class="data-grid-layout">

                  <!-- 角色状态遍历 -->
                  <div v-for="(charData, charName) in finalSettlement.角色状态" :key="charName" class="data-box tactical-analysis">
                    <div class="box-header">
                      <span class="box-icon"></span>
                      <h4>{{ charName }} // STATUS</h4>
                    </div>
                    <div class="stats-comparison">
                      <div class="stat-col" :class="charName === charNames[0] ? 'red' : 'gold'">
                        <div class="stat-row"><span>生命 (HP)</span> <span class="val-highlight">{{ charData.生命 }}</span></div>
                        <div class="stat-row"><span>体力 (SP)</span> <span>{{ charData.体力 }}</span></div>
                        <div class="stat-row"><span>精神 (SAN)</span> <span>{{ charData.精神 }}</span></div>
                      </div>
                    </div>
                  </div>

                  <!-- 状态附加 -->
                  <div class="data-box settlement" style="grid-column: 1 / -1;">
                    <div class="box-header">
                      <span class="box-icon"></span>
                      <h4>状态附加 // BUFF & DEBUFF</h4>
                    </div>
                    <div class="list-section">
                      <ul>
                        <li v-if="finalSettlement.状态附加.length === 0" style="color: #777;">无新增状态</li>
                        <li v-for="(state, i) in finalSettlement.状态附加" :key="'state'+i" class="status-alert">{{ state }}</li>
                      </ul>
                    </div>
                  </div>

                </div>
              </div>

              <!-- TAB 2: 视觉演绎 (多拍日志) -->
              <div v-else-if="currentTab === 'visual'" key="visual" class="visual-view">
                <div class="data-box visual-narrative">
                  <div class="box-header">
                    <span class="box-icon"></span>
                    <h4>交锋推演记录 // COMBAT LOGS</h4>
                  </div>
                  <div class="narrative-content">
                    <div v-for="(beat, index) in combatLog" :key="'log'+index" class="beat-log-item">
                      <div class="beat-header">
                        <span class="beat-num">拍 {{ index + 1 }}</span>
                        <span class="beat-interaction">{{ beat.交互 }}</span>
                      </div>
                      <p class="narrative-text">{{ beat.短述 }}</p>
                      <div class="beat-result-text">>> {{ beat.结果 }}</div>
                    </div>
                  </div>
                  <div class="narrative-footer">
                    <span class="end-mark">/// END OF LOG ///</span>
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
const charNames = Object.keys(finalSettlement.角色状态);

// 2. 状态管理
const phase = ref('idle'); // idle, rolling, clashing, beat-result, finished
const currentTab = ref('data');
const currentBeatIndex = ref(0);
const currentAtkRolls = ref([]);
const currentDefRolls = ref([]);

// 获取当前拍的数据
const currentBeat = computed(() => combatLog[currentBeatIndex.value]);

// 正则解析 "角色A(动作) vs 角色B(动作)"
const parsedInteraction = computed(() => {
  if (!currentBeat.value) return {};
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
    'idle': '等待指令 // AWAITING',
    'rolling': '概率演算中 // CALCULATING',
    'clashing': '冲突判定 // CONFLICT',
    'beat-result': '单拍结算 // BEAT_RESULT',
    'finished': '序列完成 // COMPLETE'
  };
  return map[phase.value];
});

// 辅助函数：延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 3. 核心动画逻辑 (异步多拍循环)
const startCombat = async () => {
  if (phase.value !== 'idle') return;

  // 遍历每一拍
  for (let i = 0; i < combatLog.length; i++) {
    currentBeatIndex.value = i;
    phase.value = 'rolling';

    const targetAtk = combatLog[i].攻方.骰点详情;
    const targetDef = combatLog[i].防方.骰点详情;

    // 启动随机跳字动画
    const rollInterval = setInterval(() => {
      // 假设最大骰子面数为20用于动画表现
      currentAtkRolls.value = targetAtk.map(() => Math.floor(Math.random() * 20) + 1);
      currentDefRolls.value = targetDef.map(() => Math.floor(Math.random() * 20) + 1);
    }, 50);

    // 掷骰动画持续 0.8 秒
    await delay(800);
    clearInterval(rollInterval);

    // 定格真实骰点
    currentAtkRolls.value = [...targetAtk];
    currentDefRolls.value = [...targetDef];

    // 进入拼点阶段 (展示总值)
    phase.value = 'clashing';
    await delay(800);

    // 展示单拍结果
    phase.value = 'beat-result';
    await delay(1200); // 结果停留 1.2 秒
  }

  // 所有拍数结束，进入最终结算
  phase.value = 'finished';
  currentTab.value = 'data';
};
</script>

<style scoped>
/* --- 核心色彩与变量 (暗金主题) --- */
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
  padding: 40px 20px;
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
  max-width: 900px;
  margin: 0 auto;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
  transition: border-color 0.3s;
}

.gallery-card.active {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
}

.hud-corner {
  position: absolute;
  width: 15px; height: 15px;
  border: 2px solid transparent;
  z-index: 10;
}
.top-left { top: -1px; left: -1px; border-top-color: var(--ac-gold); border-left-color: var(--ac-gold); }
.top-right { top: -1px; right: -1px; border-top-color: var(--ac-gold); border-right-color: var(--ac-gold); }
.bottom-left { bottom: -1px; left: -1px; border-bottom-color: var(--ac-gold); border-left-color: var(--ac-gold); }
.bottom-right { bottom: -1px; right: -1px; border-bottom-color: var(--ac-gold); border-right-color: var(--ac-gold); }

.card-header {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--ac-line);
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%);
}

.header-title {
  font-size: 1.1rem;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.tech-prefix { color: var(--ac-gold-dim); }
.sub-text { font-size: 0.7em; color: var(--ac-gold-dim); margin-left: -4px; }
.separator { color: var(--ac-line); }
.entity-red { color: var(--ac-red); text-shadow: 0 0 5px rgba(204, 41, 41, 0.4); }
.entity-gold { color: var(--ac-gold); text-shadow: 0 0 5px rgba(212, 175, 55, 0.4); }
.vs-mini { font-size: 0.8rem; color: var(--ac-gray); font-family: var(--ac-font-mono); }

.status-indicator {
  font-family: var(--ac-font-mono);
  font-size: 0.75rem;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ac-gray);
}
.status-dot {
  width: 6px; height: 6px;
  background-color: var(--ac-gray);
  border-radius: 50%;
}
.beat-counter { color: var(--ac-gold-light); margin-left: 10px; }
.status-indicator.rolling .status-dot { background-color: var(--ac-gold-light); box-shadow: 0 0 5px var(--ac-gold-light); animation: blink 0.5s infinite; }
.status-indicator.clashing .status-dot { background-color: var(--ac-red); box-shadow: 0 0 5px var(--ac-red); }
.status-indicator.beat-result .status-dot { background-color: var(--ac-red); box-shadow: 0 0 5px var(--ac-red); }
.status-indicator.finished .status-dot { background-color: var(--ac-gold); box-shadow: 0 0 5px var(--ac-gold); }

.svg-container {
  position: relative;
  width: 100%;
  cursor: pointer;
  border-bottom: 1px solid var(--ac-line);
  overflow: hidden;
  background-color: #0b0a08;
  min-height: 350px;
}

.grid-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    linear-gradient(var(--ac-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--ac-line) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.15;
}

.crosshair {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 100px; height: 100px;
  pointer-events: none;
}
.crosshair::before, .crosshair::after { content: ''; position: absolute; background: var(--ac-gold-dim); }
.crosshair::before { top: 50%; left: 0; width: 100%; height: 1px; }
.crosshair::after { left: 50%; top: 0; height: 100%; width: 1px; }

.start-hint {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  color: var(--ac-white);
  font-family: var(--ac-font-main);
  font-size: 1.2rem;
  letter-spacing: 3px;
  animation: pulse 2s infinite;
  pointer-events: none;
  white-space: nowrap;
}
.bracket { color: var(--ac-gold); margin: 0 5px; }

.combat-svg { width: 100%; height: auto; display: block; position: relative; z-index: 2; }

.role-title { font-size: 16px; letter-spacing: 2px; font-weight: bold; }
.sub-info { font-size: 11px; font-family: var(--ac-font-mono); letter-spacing: 1px; }
.formula-text { font-size: 10px; font-family: var(--ac-font-mono); letter-spacing: 0.5px; }

.total-group { transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.clash-move-right { transform: translateX(120px); }
.clash-move-left { transform: translateX(-120px); }
.fade-out { opacity: 0.15; transition: opacity 0.3s ease; filter: grayscale(100%); }

.clash-line { animation: drawLine 0.3s ease forwards; }
.vs-text { animation: glitchPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
.result-group { animation: stampIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

.result-panel {
  padding: 20px;
  background: linear-gradient(to bottom, rgba(212, 175, 55, 0.03), transparent);
  animation: slideDown 0.5s ease forwards;
  min-height: 350px;
}

.tab-controller { display: flex; gap: 2px; margin-bottom: 20px; position: relative; }
.tab-btn {
  padding: 8px 24px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--ac-line);
  border-bottom: none;
  color: var(--ac-gray);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex; align-items: center; gap: 8px;
  clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px);
}
.tab-btn:hover { background: rgba(212, 175, 55, 0.05); color: var(--ac-white); }
.tab-btn.active {
  background: rgba(212, 175, 55, 0.15);
  color: var(--ac-gold);
  border-color: var(--ac-gold);
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
}
.tab-btn .en { font-size: 0.7em; opacity: 0.6; font-family: var(--ac-font-mono); }
.tab-line { position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: var(--ac-gold); opacity: 0.3; z-index: 0; }

.data-grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.data-box {
  position: relative; padding: 20px;
  background: rgba(20, 18, 12, 0.5);
  border: 1px solid var(--ac-line);
  clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px));
}

.box-header { display: flex; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--ac-line); padding-bottom: 8px; }
.box-icon { width: 6px; height: 6px; background-color: var(--ac-gold); margin-right: 10px; box-shadow: 0 0 5px var(--ac-gold); transform: rotate(45deg); }
.box-header h4 { margin: 0; font-size: 0.95rem; letter-spacing: 1px; color: var(--ac-white); font-weight: normal; }

.stats-comparison { font-family: var(--ac-font-mono); font-size: 0.85rem; }
.stat-col { display: flex; flex-direction: column; gap: 8px; }
.stat-col.red { color: #ffaaaa; }
.stat-col.gold { color: var(--ac-gold-light); }
.stat-row { display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px; }
.val-highlight { font-size: 1.1em; font-weight: bold; color: var(--ac-white); }

.list-section ul { margin: 0; padding: 0; list-style: none; font-size: 0.85rem; line-height: 1.8; font-family: var(--ac-font-mono); }
.list-section ul li::before { content: '>'; color: var(--ac-gold); margin-right: 8px; }
.status-alert { color: var(--ac-red); }

/* 多拍日志样式 */
.visual-narrative { min-height: 200px; display: flex; flex-direction: column; }
.narrative-content { flex-grow: 1; display: flex; flex-direction: column; gap: 15px; }
.beat-log-item {
  padding: 12px 15px;
  border-left: 2px solid var(--ac-gold);
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.05), transparent);
}
.beat-header { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; font-family: var(--ac-font-mono); }
.beat-num { background: var(--ac-gold); color: #000; padding: 2px 6px; font-size: 0.7rem; font-weight: bold; border-radius: 2px; }
.beat-interaction { font-size: 0.8rem; color: var(--ac-gold-light); opacity: 0.8; }
.narrative-text { font-family: 'Microsoft YaHei', sans-serif; line-height: 1.8; font-size: 0.95rem; color: #e2dac2; text-align: justify; margin: 0 0 8px 0; }
.beat-result-text { font-family: var(--ac-font-mono); font-size: 0.85rem; color: var(--ac-red); font-weight: bold; }

.narrative-footer { margin-top: 20px; text-align: right; font-family: var(--ac-font-mono); font-size: 0.7rem; color: var(--ac-gold-dim); opacity: 0.5; }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; text-shadow: 0 0 10px var(--ac-gold); } }
@keyframes drawLine { from { stroke-dashoffset: 200; stroke-dasharray: 200; } to { stroke-dashoffset: 0; stroke-dasharray: 4 4; } }
@keyframes glitchPop { 0% { opacity: 0; transform: scale(0.8) skewX(20deg); } 20% { opacity: 1; transform: scale(1.2) skewX(-20deg); } 40% { transform: scale(0.9) skewX(10deg); } 100% { opacity: 1; transform: scale(1) skewX(0); } }
@keyframes stampIn { 0% { opacity: 0; transform: scale(1.5); } 70% { opacity: 1; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }

@media (max-width: 768px) { .data-grid-layout { grid-template-columns: 1fr; } .combat-svg { min-height: 200px; } }
</style>
