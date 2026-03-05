<template>
  <div class="page-container page-two">
    <div class="arts-layout">
      <h3 class="section-title center">秘史造诣</h3>

      <!-- 顶部点数显示 -->
      <div class="points-header-large">
        <div class="points-info-group">
          <div class="points-label">{{ isInfiniteMode ? '能力消耗点数' : '能力可用点数' }}</div>
          <div class="points-display">
            <template v-if="!isInfiniteMode">
              <span class="points-val" :class="{ 'error': artsRemainingPoints < 0 }">{{ artsRemainingPoints }}</span>
              <span class="points-total">/ 100</span>
            </template>
            <template v-else>
              <span class="points-val text-gold">{{ artsSpentPoints }}</span>
              <span class="points-total" style="font-size: 1.5rem;">∞</span>
            </template>
          </div>
        </div>
        <div class="infinite-toggle">
          <label class="toggle-label">
            <input type="checkbox" v-model="isInfiniteMode">
            <span class="toggle-text">无限制</span>
          </label>
        </div>
      </div>

      <div class="arts-content-row">
        <!-- 左侧列表 -->
        <div class="arts-list-scroll large">
          <div class="art-point-item" v-for="(data, key) in formData.术之等级" :key="key" :class="{ 'active': data.等级 > 0 }">
            <div class="art-icon-placeholder">{{ String(key).charAt(0) }}</div>
            <div class="art-point-info">
              <span class="art-name">{{ key }}</span>
              <div class="art-lv-wrapper">
                <span class="art-lv-label">Lv.</span>
                <span class="art-lv-val">{{ data.等级 }}</span>
              </div>
            </div>
            <div class="art-controls">
              <button class="ctrl-btn minus" @click="changeArtLevel(key, -1)" :disabled="data.等级 <= 0">-</button>
              <div class="cost-preview">
                <span v-if="data.等级 < maxArtLevel" class="cost-val">消耗 {{ getUpgradeCost(key, data.等级) }}</span>
                <span v-else class="cost-val max">MAX</span>
              </div>
              <button class="ctrl-btn plus" @click="changeArtLevel(key, 1)"
                      :disabled="(!isInfiniteMode && artsRemainingPoints < getUpgradeCost(key, data.等级)) || data.等级 >= maxArtLevel">
                +
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧预览 -->
        <div class="arts-preview-large">
          <div class="preview-title">属性预览</div>

          <!-- 1. 插入属性面板组件 -->
          <div class="stats-panel-wrapper">
            <LifeStatusModule :data="formData" />
          </div>

          <!-- 原有的 ArtsModule -->
          <div class="preview-subtitle">性相构成</div>
          <ArtsModule :artsData="formData.术之等级" mode="creation" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import ArtsModule from '@/尘史使徒/UI/components/role/ArtsModule.vue';
import LifeStatusModule from '@/尘史使徒/UI/components/role/LifeStatusModule.vue';
import { calculateCharacterAttributes } from '@/尘史使徒/DOC/数值计算';

const formData = defineModel('formData', { required: true });
const isInfiniteMode = defineModel('isInfiniteMode', { type: Boolean, default: false });

const props = defineProps(['artsRemainingPoints', 'artsSpentPoints', 'maxArtLevel']);

// 基础的8个秘史性相
const DEFAULT_ARTS = ['灯', '铸', '刃', '冬', '心', '杯', '蛾', '启'];

// 中文键名到英文键名的映射 (适配算法)
const ASPECT_MAP = {
  '灯': 'Lantern', '铸': 'Forge', '刃': 'Edge', '冬': 'Winter',
  '心': 'Heart', '杯': 'Grail', '蛾': 'Moth', '启': 'Knock'
};

// 初始化术之等级的数据结构 (防止空对象导致无法渲染列表)
const initArtsData = () => {
  if (!formData.value.术之等级) {
    formData.value.术之等级 = {};
  }
  DEFAULT_ARTS.forEach(art => {
    if (!formData.value.术之等级[art]) {
      // 严格按照 StatData.d.ts 中的 ArtLevelData 结构初始化
      formData.value.术之等级[art] = { 等级: 0, 经验: 0 };
    }
  });
};

const getUpgradeCost = (artKey, currentLevel) => {
  if (currentLevel === 0) {
    let unlockedCount = 0;
    for (const key in formData.value.术之等级) {
      if (formData.value.术之等级[key].等级 > 0) unlockedCount++;
    }
    return 2 * Math.pow(4, unlockedCount);
  } else {
    return currentLevel * 2;
  }
};

/**
 * 核心逻辑：更新玩家三维/四维
 */
const updateCharacterStats = () => {
  // 1. 提取当前等级并转换为算法需要的格式 { Lantern: 5, Forge: 2 ... }
  const levels = {};
  for (const key in formData.value.术之等级) {
    const engKey = ASPECT_MAP[key] || key; // 兼容中文或英文键名
    levels[engKey] = formData.value.术之等级[key].等级 || 0;
  }

  // 2. 调用算法计算
  const result = calculateCharacterAttributes(levels);

  // 3. 确保目标对象结构存在 (防止报错)
  if (!formData.value.基础数值) formData.value.基础数值 = {};
  if (!formData.value.生命状态) formData.value.生命状态 = { 生命: {}, 体力: {}, 精神: {} };

  // 4. 更新四维 (基础数值)
  formData.value.基础数值.力量 = result.Strength;
  formData.value.基础数值.敏捷 = result.Agility;
  formData.value.基础数值.智慧 = result.Wisdom;
  formData.value.基础数值.魅力 = result.Charisma;

  // 5. 更新三维 (生命状态 - 更新最大值并填满当前值)
  const updateStatus = (key, val) => {
    if (!formData.value.生命状态[key]) formData.value.生命状态[key] = {};
    formData.value.生命状态[key].最大值 = val;
    formData.value.生命状态[key].当前 = val;
  };

  updateStatus('生命', result.Life);
  updateStatus('体力', result.Stamina);
  updateStatus('精神', result.Spirit);
};

const changeArtLevel = (key, delta) => {
  const currentLevel = formData.value.术之等级[key].等级;
  const newLevel = currentLevel + delta;
  if (newLevel < 0 || newLevel > props.maxArtLevel) return;

  if (delta > 0) {
    const cost = getUpgradeCost(key, currentLevel);
    if (!isInfiniteMode.value && props.artsRemainingPoints < cost) {
      if (window.toastr) window.toastr.warning("能力点数不足");
      return;
    }
  }

  // 更新等级
  formData.value.术之等级[key].等级 = newLevel;

  // === 实时计算属性 ===
  updateCharacterStats();
};

// 初始化时先注入模板，再计算一次属性
onMounted(() => {
  initArtsData();
  updateCharacterStats();
});
</script>

<style scoped>
.stats-panel-wrapper {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px dashed rgba(197, 160, 89, 0.3);
}

.preview-subtitle {
  font-size: 1rem;
  color: #888;
  margin: 10px 0;
  text-align: center;
  font-family: var(--font-title, serif);
}

.page-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 20px; overflow-y: auto; box-sizing: border-box; }
.arts-layout { display: flex; flex-direction: column; height: 100%; }

.section-title.center { text-align: center; border-bottom: none; position: relative; display: inline-block; width: 100%; margin-top: 0; margin-bottom: 20px; color: var(--c-gold, #c5a059); font-size: 1.5rem; }
.section-title.center::after { content: ''; display: block; width: 60px; height: 2px; background: var(--c-gold, #c5a059); margin: 8px auto 0; }

.points-header-large {
  display: flex; justify-content: center; align-items: center; gap: 40px;
  margin-bottom: 20px; padding: 15px 30px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(197, 160, 89, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.points-info-group { display: flex; flex-direction: column; align-items: center; }
.points-label { font-size: 0.9rem; color: #aaa; margin-bottom: 5px; }
.points-display { display: flex; align-items: baseline; gap: 5px; }
.points-val { font-size: 2.5rem; color: #ddd; font-weight: bold; line-height: 1; }
.points-val.error { color: #ff4d4d; }
.points-val.text-gold { color: var(--c-gold, #c5a059); }
.points-total { font-size: 1.2rem; color: #888; }

.infinite-toggle { display: flex; align-items: center; }
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #ccc; font-size: 0.95rem; }
.toggle-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--c-gold, #c5a059); cursor: pointer; }

.arts-content-row { display: flex; flex: 1; gap: 20px; overflow: hidden; min-height: 0; }

.arts-list-scroll.large {
  flex: 1; overflow-y: auto;
  border: 1px solid rgba(197, 160, 89, 0.2);
  background: rgba(0,0,0,0.3);
  padding: 12px;
  border-radius: 8px;
}
.arts-list-scroll.large::-webkit-scrollbar { width: 6px; }
.arts-list-scroll.large::-webkit-scrollbar-thumb { background: rgba(197, 160, 89, 0.3); border-radius: 3px; }

.arts-preview-large {
  flex: 1;
  border: 1px solid rgba(197, 160, 89, 0.2);
  background: rgba(0,0,0,0.3);
  padding: 15px;
  display: flex; flex-direction: column;
  border-radius: 8px;
  overflow-y: auto;
}

.preview-title {
  font-size: 1.2rem;
  color: var(--c-gold, #c5a059);
  margin-bottom: 15px;
  text-align: center;
  font-weight: bold;
  border-bottom: 1px solid rgba(197, 160, 89, 0.2);
  padding-bottom: 10px;
}

.art-point-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: all 0.3s ease;
  border-radius: 6px;
  margin-bottom: 6px;
  background: rgba(255,255,255,0.02);
}
.art-point-item:last-child { margin-bottom: 0; border-bottom: none; }
.art-point-item:hover { background: rgba(255,255,255,0.06); transform: translateX(2px); }
.art-point-item.active { background: rgba(197, 160, 89, 0.1); border: 1px solid rgba(197, 160, 89, 0.3); }

.art-icon-placeholder {
  width: 42px; height: 42px;
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border: 1px solid #444;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: #aaa;
  border-radius: 8px; margin-right: 15px;
  font-weight: bold;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
  flex-shrink: 0;
}
.art-point-item.active .art-icon-placeholder {
  border-color: var(--c-gold, #c5a059); color: var(--c-gold, #c5a059);
  background: linear-gradient(135deg, rgba(197, 160, 89, 0.2), rgba(0,0,0,0.8));
  box-shadow: 0 0 10px rgba(197, 160, 89, 0.2);
}

.art-point-info { display: flex; flex-direction: column; flex: 1; gap: 4px; overflow: hidden; }
.art-name { font-size: 1.1rem; color: #eee; font-weight: bold; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.art-lv-wrapper { display: flex; align-items: baseline; gap: 4px; }
.art-lv-label { font-size: 0.8rem; color: #888; }
.art-lv-val { font-size: 1rem; color: var(--c-gold, #c5a059); font-weight: bold; }

.art-controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ctrl-btn {
  width: 32px; height: 32px;
  background: #222; border: 1px solid #555;
  color: #fff; cursor: pointer;
  border-radius: 4px; font-size: 1.2rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.ctrl-btn:hover:not(:disabled) {
  border-color: var(--c-gold, #c5a059); color: var(--c-gold, #c5a059);
  background: rgba(197, 160, 89, 0.1);
}
.ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.cost-preview { min-width: 65px; text-align: center; }
.cost-val {
  font-size: 0.8rem; color: #aaa;
  background: rgba(0,0,0,0.5);
  padding: 4px 8px; border-radius: 4px;
  border: 1px solid #333;
  white-space: nowrap;
}
.cost-val.max { color: var(--c-gold, #c5a059); border-color: var(--c-gold, #c5a059); font-weight: bold; background: rgba(197, 160, 89, 0.1); }
</style>
