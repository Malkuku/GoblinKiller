<template>
  <div class="page-container page-two">
    <div class="arts-layout">
      <h3 class="section-title center">秘史造诣</h3>

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
            <!-- 直接使用 v-model 绑定 defineModel 返回的 ref -->
            <input type="checkbox" v-model="isInfiniteMode">
            <span class="toggle-text">无限制</span>
          </label>
        </div>
      </div>

      <div class="arts-content-row">
        <!-- 左侧列表 -->
        <div class="arts-list-scroll large">
          <div class="art-point-item" v-for="(data, key) in formData.arts" :key="key" :class="{ 'active': data.当前等级 > 0 }">
            <div class="art-icon-placeholder">{{ key }}</div>
            <div class="art-point-info">
              <span class="art-lv-label">等级</span>
              <span class="art-lv-val">Lv.{{ data.当前等级 }}</span>
            </div>
            <div class="art-controls">
              <button class="ctrl-btn" @click="changeArtLevel(key, -1)" :disabled="data.当前等级 <= 0">-</button>
              <div class="cost-preview">
                <span v-if="data.当前等级 < maxArtLevel" class="cost-val">消耗 {{ getUpgradeCost(key, data.当前等级) }}</span>
                <span v-else class="cost-val">MAX</span>
              </div>
              <button class="ctrl-btn" @click="changeArtLevel(key, 1)"
                      :disabled="(!isInfiniteMode && artsRemainingPoints < getUpgradeCost(key, data.当前等级)) || data.当前等级 >= maxArtLevel">
                +
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧预览 -->
        <div class="arts-preview-large">
          <div class="preview-title">能力预览</div>
          <ArtsModule :artsData="formData.arts" mode="creation" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ArtsModule from '@/尘史使徒/UI/components/role/ArtsModule.vue';

// --- 核心修改：使用 defineModel ---
const formData = defineModel('formData', { required: true });
const isInfiniteMode = defineModel('isInfiniteMode', { type: Boolean, default: false });

// 剩余的只读属性继续使用 defineProps
const props = defineProps(['artsRemainingPoints', 'artsSpentPoints', 'maxArtLevel']);

// defineModel 自动处理了 update 事件，这里不需要再声明 update:formData 等
// 如果有其他自定义事件，可以在这里声明
// const emit = defineEmits([]);

const getUpgradeCost = (artKey, currentLevel) => {
  if (currentLevel === 0) {
    let unlockedCount = 0;
    // 使用 formData.value 访问
    for (const key in formData.value.arts) {
      if (formData.value.arts[key].当前等级 > 0) unlockedCount++;
    }
    return 2 * Math.pow(4, unlockedCount);
  } else {
    return currentLevel * 2;
  }
};

const changeArtLevel = (key, delta) => {
  // 使用 formData.value 修改数据，这是允许的
  const art = formData.value.arts[key];
  const newLevel = art.当前等级 + delta;
  if (newLevel < 0 || newLevel > props.maxArtLevel) return;

  if (delta > 0) {
    art.当前等级 = newLevel;
    // 访问 isInfiniteMode.value
    if (!isInfiniteMode.value && props.artsRemainingPoints < 0) {
      art.当前等级 -= delta;
      if (window.toastr) window.toastr.warning("能力点数不足 (最大100点)");
    }
  } else {
    art.当前等级 = newLevel;
  }
};
</script>

<style scoped>
/* 样式保持不变 */
.page-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 20px; overflow-y: auto; }
.arts-layout { display: flex; flex-direction: column; height: 100%; }
.points-header-large { display: flex; justify-content: center; align-items: center; gap: 40px; margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.3); border: 1px solid rgba(197, 160, 89, 0.1); }
.points-val { font-size: 2.5rem; color: #ddd; }
.points-val.error { color: #ff4d4d; }
.arts-content-row { display: flex; flex: 1; gap: 20px; overflow: hidden; }
.arts-list-scroll.large { flex: 1; overflow-y: auto; border: 1px solid #333; background: rgba(0,0,0,0.2); padding: 10px; }
.arts-preview-large { flex: 1; border: 1px solid #333; background: rgba(0,0,0,0.2); padding: 10px; display: flex; flex-direction: column; }
.art-point-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-bottom: 1px solid #333; transition: background 0.2s; }
.art-point-item:hover { background: rgba(255,255,255,0.03); }
.art-point-item.active { background: rgba(197, 160, 89, 0.05); }
.art-icon-placeholder { width: 36px; height: 36px; background: #222; border: 1px solid #444; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: #888; border-radius: 50%; margin-right: 15px; }
.art-point-item.active .art-icon-placeholder { border-color: var(--c-gold); color: var(--c-gold); }
.art-point-info { display: flex; flex-direction: column; flex: 1; }
.art-lv-val { font-size: 1.1rem; color: #ddd; font-weight: bold; }
.art-controls { display: flex; align-items: center; gap: 8px; }
.ctrl-btn { width: 28px; height: 28px; background: #222; border: 1px solid #555; color: #fff; cursor: pointer; }
.ctrl-btn:hover:not(:disabled) { border-color: var(--c-gold); color: var(--c-gold); }
.cost-val { font-size: 0.75rem; color: #888; background: #111; padding: 2px 6px; border-radius: 2px; }
.section-title.center { text-align: center; border-bottom: none; position: relative; display: inline-block; width: 100%; }
.section-title.center::after { content: ''; display: block; width: 60px; height: 2px; background: var(--c-gold); margin: 5px auto 0; }
</style>
