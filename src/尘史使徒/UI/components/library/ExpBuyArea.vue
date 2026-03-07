<template>
  <div class="scroll-area transaction-area arts-container">
    <!-- 角色选择器：改为顶部悬浮的神秘下拉框 -->
    <div class="selector-wrapper">
      <div class="character-selector">
        <span class="selector-label">⟡ 灌注目标</span>
        <select v-model="selectedCharacter">
          <option value="user">User</option>
          <option v-for="name in mainCharacterNames" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
        <div class="selector-arrow">▼</div>
      </div>
    </div>

    <!-- 统一结算控制台 -->
    <Transition name="fade-up">
      <div v-if="totalPendingCost > 0" class="checkout-bar">
        <div class="checkout-info">
          <div class="info-row">
            <span class="label">当前异质</span>
            <span class="val-base">{{ userHeterogeneity }}</span>
          </div>
          <div class="arrow">➔</div>
          <div class="info-row">
            <span class="label">剩余</span>
            <span class="val-remain" :class="{ 'danger': remainingHeterogeneity < 0 }">
              {{ remainingHeterogeneity }}
            </span>
          </div>
          <div class="cost-tag">-{{ totalPendingCost }}</div>
        </div>
        <div class="checkout-actions">
          <button class="action-btn clear-btn" @click="resetPending">重置</button>
          <button class="action-btn confirm-btn" @click="confirmSettlement">确认灌注</button>
        </div>
      </div>
    </Transition>

    <div class="card-grid">
      <!-- 遍历所有固定的术 -->
      <div v-for="(data, artName) in projectedArts" :key="artName" class="trade-card art-card" :class="getAspectClass(artName)">
        <div class="card-inner">
          <!-- 头部 -->
          <div class="card-top">
            <div class="art-title-group">
              <span class="art-icon" v-html="getAspectIcon(artName)"></span>
              <span class="card-title">{{ artName }}</span>
            </div>
            <div class="level-display">
              <span class="lv-label">Lv.</span>
              <span class="lv-num">{{ data.baseLevel }}</span>
              <span v-if="data.等级 > data.baseLevel" class="lv-upgrade">➔ {{ data.等级 }}</span>
            </div>
          </div>

          <!-- 主体 -->
          <div class="card-mid">
            <p class="desc" v-if="data.baseLevel === 0">"凡人无法凭空感悟此道..."</p>
            <p class="desc" v-else-if="data.等级 >= 19">"已触及神性，凡物不可度量。"</p>
            <template v-else>
              <div class="progress-container">
                <div class="progress-text">
                  <span>EXP: {{ Math.floor(data.baseExp) }} <span v-if="pendingExp[artName] > 0" class="exp-plus">+{{ pendingExp[artName] }}</span></span>
                  <span>{{ getRequiredExp(data.等级) }}</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="{ width: (data.经验 / getRequiredExp(data.等级) * 100) + '%' }"></div>
                  <!-- 预览进度条 -->
                  <div class="progress-bar-preview"
                       v-if="pendingExp[artName] > 0"
                       :style="{
                         left: ((data.baseExp / getRequiredExp(data.baseLevel)) * 100) + '%',
                         width: ((pendingExp[artName] / getRequiredExp(data.等级)) * 100) + '%'
                       }">
                  </div>
                </div>
              </div>

              <div class="cost-preview">
                <span class="label">下一级需求:</span>
                <span class="value">{{ getExpNeeded(data.等级, data.经验) * 4 }} <span class="unit">异质</span></span>
              </div>
            </template>
          </div>

          <!-- 底部操作 -->
          <div class="card-action art-actions">
            <template v-if="data.baseLevel > 0 && data.等级 < 19">
              <button class="mini-btn" @click="queueExp(artName, 10)" :disabled="remainingHeterogeneity < 40" title="-40 异质">+10</button>
              <button class="mini-btn" @click="queueExp(artName, 100)" :disabled="remainingHeterogeneity < 400" title="-400 异质">+100</button>
              <button class="mini-btn upgrade-btn"
                      @click="queueNextLevel(artName)"
                      :disabled="remainingHeterogeneity < getExpNeeded(data.等级, data.经验) * 4 || getExpNeeded(data.等级, data.经验) === 0">
                UP
              </button>
            </template>
            <button v-else class="mini-btn disabled" disabled>
              {{ data.baseLevel === 0 ? '未入门' : '已登神' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { MvuUtil } from '@/Utils/MvuUtil';

const showToast = inject('showToast', (msg) => console.log(msg));
const statStore = useStatStore();

const ALL_ARTS = ["灯", "铸", "刃", "冬", "心", "杯", "蛾", "启"];
const selectedCharacter = ref('user');
const pendingExp = ref(Object.fromEntries(ALL_ARTS.map(art => [art, 0])));

const mainCharacterNames = computed(() => {
  const mainChars = statStore.stat_data?.角色?.主要角色 || {};
  return Object.keys(mainChars);
});

const currentArts = computed(() => {
  if (selectedCharacter.value === 'user') return statStore.stat_data?.角色?.user?.术之等级 || {};
  return statStore.stat_data?.角色?.主要角色?.[selectedCharacter.value]?.术之等级 || {};
});

const userHeterogeneity = computed(() => statStore.stat_data?.角色?.user?.缥缈异质 || 0);

watch(selectedCharacter, () => resetPending());

const getRequiredExp = (level) => {
  if (level <= 0) return Infinity;
  if (level >= 1 && level <= 13) return level * 200;
  if (level >= 14 && level <= 18) return Math.pow(level, 2) * 500;
  return Infinity;
};

const getExpNeeded = (level, currentExp) => {
  const req = getRequiredExp(level);
  return req === Infinity ? 0 : Math.max(0, req - (currentExp || 0));
};

const projectedArts = computed(() => {
  const result = {};
  ALL_ARTS.forEach(art => {
    const baseData = currentArts.value[art] || { 等级: 0, 经验: 0 };
    const baseLevel = baseData.等级 || 0;
    const baseExp = baseData.经验 || 0;
    const addedExp = pendingExp.value[art] || 0;
    let level = baseLevel;
    let exp = baseExp + addedExp;
    while (level > 0 && level < 19 && exp >= getRequiredExp(level)) {
      exp -= getRequiredExp(level);
      level++;
    }
    result[art] = { baseLevel, baseExp, 等级: level, 经验: exp };
  });
  return result;
});

const totalPendingCost = computed(() => Object.values(pendingExp.value).reduce((sum, exp) => sum + exp * 4, 0));
const remainingHeterogeneity = computed(() => userHeterogeneity.value - totalPendingCost.value);

const queueExp = (artName, amount) => {
  const cost = amount * 4;
  if (remainingHeterogeneity.value < cost) { showToast("异质不足"); return; }
  const proj = projectedArts.value[artName];
  if (proj.baseLevel === 0 || proj.等级 >= 19) return;
  pendingExp.value[artName] += amount;
};

const queueNextLevel = (artName) => {
  const proj = projectedArts.value[artName];
  const needed = getExpNeeded(proj.等级, proj.经验);
  if (needed > 0) queueExp(artName, needed);
};

const resetPending = () => ALL_ARTS.forEach(art => pendingExp.value[art] = 0);

const confirmSettlement = async () => {
  if (totalPendingCost.value === 0) return;
  const diff = { 角色: { user: { 缥缈异质: remainingHeterogeneity.value } } };
  const updatedArts = { ...currentArts.value };
  ALL_ARTS.forEach(art => {
    if (pendingExp.value[art] > 0) {
      updatedArts[art] = { 等级: projectedArts.value[art].等级, 经验: projectedArts.value[art].经验 };
    }
  });

  if (selectedCharacter.value === 'user') diff.角色.user.术之等级 = updatedArts;
  else diff.角色.主要角色 = { [selectedCharacter.value]: { 术之等级: updatedArts } };

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`灌注完成，消耗 ${totalPendingCost.value} 异质`);
    resetPending();
  } catch (e) { showToast("灌注失败"); }
};

// 图标与样式辅助
const getAspectIcon = (aspect) => {
  const baseSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="aspect-svg">`;
  const icons = {
    '刃': `${baseSvg}<path d="M12 2v20M9 7l3-4 3 4M8 11h8"/></svg>`,
    '杯': `${baseSvg}<path d="M7 3h10M7 3v4c0 3 2.5 5.5 5 5.5s5-2.5 5-5V3M12 12.5V21M8 21h8M12 7v.01"/></svg>`,
    '铸': `${baseSvg}<path d="M12 22c4.4 0 8-3.6 8-8 0-5-4-9-8-12-4 3-8 7-8 12 0 4.4 3.6 8 8 8z"/><path d="M12 22c-2 0-3.5-1.5-3.5-3.5 0-2.5 2-4.5 3.5-6.5 1.5 2 3.5 4 3.5 6.5 0 2-1.5 3.5-3.5 3.5z"/></svg>`,
    '蛾': `${baseSvg}<path d="M12 22v-6M12 16c-4 0-8-2-8-8 0-4 3-6 8-6s8 2 8 6c0 6-4 8-8 8z"/><path d="M12 16c-2 0-4-1-4-4 0-2 1.5-3 4-3s4 1 4 3c0 3-2 4-4 4z"/></svg>`,
    '心': `${baseSvg}<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M12 15l-3-3 1.5-1.5L12 12l3-3 1.5 1.5-4.5 4.5z"/></svg>`,
    '灯': `${baseSvg}<path d="M12 2L2 12l10 10 10-10L12 2z"/><circle cx="12" cy="12" r="3"/><path d="M12 9v.01M12 15v.01"/></svg>`,
    '冬': `${baseSvg}<path d="M21 7.5V16.5L13.5 21H10.5L3 16.5V7.5L10.5 3H13.5L21 7.5Z"/><path d="M12 3v18M3 7.5l18 9M3 16.5l18-9"/></svg>`,
    '启': `${baseSvg}<circle cx="12" cy="9" r="4"/><path d="M10.5 12.5L9 21h6l-1.5-8.5"/></svg>`
  };
  return icons[aspect] || icons['灯'];
};
const getAspectClass = (aspect) => {
  const map = { '刃': 'edge', '杯': 'grail', '铸': 'forge', '蛾': 'moth', '心': 'heart', '灯': 'lantern', '冬': 'winter', '启': 'knock' };
  return map[aspect] ? `aspect-${map[aspect]}` : '';
};
</script>

<style scoped>
/* 继承全局变量 */
.arts-container { padding-bottom: 80px; }

/* 角色选择器 */
.selector-wrapper { display: flex; justify-content: center; margin-bottom: 20px; }
.character-selector {
  position: relative;
  background: linear-gradient(90deg, transparent, #1a1a1a, transparent);
  border-bottom: 1px solid var(--c-gold-dim);
  padding: 5px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.selector-label { color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 0.9rem; }
.character-selector select {
  appearance: none;
  background: transparent;
  border: none;
  color: #e0e0e0;
  font-family: 'Lato', sans-serif;
  font-size: 1rem;
  padding-right: 20px;
  cursor: pointer;
  outline: none;
}
.character-selector select option { background: #111; color: #ccc; }
.selector-arrow { color: var(--c-gold-dim); font-size: 0.8rem; pointer-events: none; }

/* 结算栏 (复用 SkillBuyArea 样式逻辑) */
.checkout-bar {
  position: sticky; bottom: 0; z-index: 10;
  background: rgba(15, 15, 15, 0.95); backdrop-filter: blur(10px);
  border-top: 1px solid var(--c-gold-dim);
  padding: 12px 20px;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 -5px 20px rgba(0,0,0,0.5);
}
.checkout-info { display: flex; align-items: center; gap: 15px; font-family: 'Cinzel', serif; }
.info-row { display: flex; flex-direction: column; align-items: center; }
.info-row .label { font-size: 0.65rem; color: #666; text-transform: uppercase; }
.val-base { color: #888; font-size: 1.1rem; }
.val-remain { color: var(--c-gold); font-size: 1.1rem; font-weight: bold; }
.val-remain.danger { color: #e57373; }
.arrow { color: #444; font-size: 1.2rem; }
.cost-tag { background: rgba(212, 175, 55, 0.1); color: #e57373; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; border: 1px solid rgba(229, 115, 115, 0.3); }

.checkout-actions { display: flex; gap: 10px; }
.action-btn { padding: 6px 16px; font-family: 'Cinzel', serif; font-weight: bold; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
.clear-btn { background: transparent; color: #888; border-color: #333; }
.clear-btn:hover { color: #ccc; border-color: #555; }
.confirm-btn { background: var(--c-gold); color: #000; }
.confirm-btn:hover { background: #eec95e; box-shadow: 0 0 15px rgba(212, 175, 55, 0.4); }

/* 卡片样式 */
.art-card {
  background: linear-gradient(145deg, #161616, #0f0f0f);
  border: 1px solid #333;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.art-card:hover { transform: translateY(-2px); }

/* 性相颜色定义 */
.aspect-lantern { --a-color: #fbc02d; }
.aspect-forge { --a-color: #f57c00; }
.aspect-edge { --a-color: #7cb342; } /* 刃改为偏绿/锋利色 */
.aspect-winter { --a-color: #90a4ae; }
.aspect-heart { --a-color: #e91e63; }
.aspect-grail { --a-color: #d32f2f; }
.aspect-moth { --a-color: #d7ccc8; }
.aspect-knock { --a-color: #9c27b0; }

.art-card::before {
  content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
  background: var(--a-color, #555); opacity: 0.7;
  box-shadow: 0 0 10px var(--a-color, transparent);
}

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.art-title-group { display: flex; align-items: center; gap: 8px; }
.art-icon { width: 20px; height: 20px; color: var(--a-color, #888); }
.card-title { font-family: 'Cinzel', serif; font-weight: bold; color: #e0e0e0; font-size: 1.1rem; }

.level-display { font-family: 'Cinzel', serif; color: #888; }
.lv-num { color: var(--a-color, #ccc); font-size: 1.2rem; font-weight: bold; margin: 0 2px; }
.lv-upgrade { color: var(--c-gold-light); font-size: 0.9rem; margin-left: 4px; animation: pulse 2s infinite; }

.desc { font-style: italic; color: #666; font-size: 0.85rem; text-align: center; margin: 10px 0; }

/* 进度条 */
.progress-container { margin-bottom: 10px; }
.progress-text { display: flex; justify-content: space-between; font-size: 0.75rem; color: #888; margin-bottom: 4px; font-family: monospace; }
.exp-plus { color: var(--c-gold-light); }
.progress-bar-bg { height: 4px; background: #222; border-radius: 2px; position: relative; overflow: hidden; }
.progress-bar-fill { height: 100%; background: var(--a-color, #555); transition: width 0.3s; }
.progress-bar-preview { position: absolute; top: 0; height: 100%; background: #fff; opacity: 0.3; animation: stripe 1s linear infinite; }

.cost-preview { font-size: 0.8rem; color: #666; display: flex; justify-content: space-between; margin-top: 8px; }
.cost-preview .value { color: #e57373; }

/* 按钮组 */
.art-actions { display: flex; gap: 5px; margin-top: 12px; }
.mini-btn {
  flex: 1; background: transparent; border: 1px solid #444; color: #888;
  padding: 4px 0; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;
  font-family: 'Cinzel', serif;
}
.mini-btn:hover:not(:disabled) { border-color: var(--a-color, #888); color: var(--a-color, #ccc); background: rgba(255,255,255,0.05); }
.mini-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.upgrade-btn { border-color: var(--c-gold-dim); color: var(--c-gold); }
.upgrade-btn:hover:not(:disabled) { background: var(--c-gold); color: #000; }

@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
.fade-up-enter-active, .fade-up-leave-active { transition: all 0.3s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(20px); }
</style>
