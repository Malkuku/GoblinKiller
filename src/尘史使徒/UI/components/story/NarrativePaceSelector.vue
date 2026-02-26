<template>
  <div class="pace-grid">
    <div
      v-for="pace in NarrativePaceConfig"
      :key="pace.key"
      class="pace-card"
      :class="{ active: currentActivePace === pace.key }"
      @click="handleSelect(pace.key)"
      :style="{ '--pace-color': pace.color }"
    >
      <!-- 渲染 SVG -->
      <div class="pace-icon" v-html="pace.svg"></div>

      <div class="pace-info">
        <div class="pace-name">{{ pace.title }}</div>
        <div class="pace-desc">{{ pace.desc }}</div>
      </div>

      <!-- 选中时的标记 -->
      <div class="active-indicator" v-if="currentActivePace === pace.key">SELECTED</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { NarrativePaceConfig } from '@/尘史使徒/UI/types/叙事配置';
import { MvuUtil } from '@/Utils/MvuUtil';

const props = defineProps({
  modelValue: {
    type: String,
    default: undefined
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const statStore = useStatStore();
const { stat_data } = storeToRefs(statStore);

const currentActivePace = computed(() => {
  if (props.modelValue !== undefined) {
    return props.modelValue;
  }
  return stat_data.value?.system?.['叙事节奏'] || '诡异现实';
});

// 处理点击事件
const handleSelect = (key) => {
  if (currentActivePace.value === key) return;

  // --- 新增：警告逻辑 ---
  const targetConfig = NarrativePaceConfig.find(p => p.key === key);
  if (targetConfig && targetConfig.warning) {
    const confirmed = window.confirm(
      `【⚠️警告】
您正在选择“${targetConfig.title}”模式。

这不是推荐的标准玩法，可能会导致：
1. 剧情逻辑崩坏或极度不合理。
2. 产生无法预期的结果。
3. 角色性格严重OOC。

确定要继续吗？`
    );
    if (!confirmed) return;
  }
  // --------------------

  emit('update:modelValue', key);
  emit('change', key);

  if (props.modelValue === undefined) {
    updateSystemSetting(key);
  }
};

const updateSystemSetting = async (key) => {
  // 使用 MvuUtil 的差分更新方法更新叙事节奏
  const diffPayload = {
    system: {
      "叙事节奏": key
    }
  };
  await MvuUtil.updateMvuDataByDiff(diffPayload);
};
</script>

<style scoped>
.pace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
}

.pace-card {
  position: relative;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #8a92a0;
  padding: 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  overflow: hidden;
}

.pace-card:hover {
  background: rgba(255, 255, 255, 0.05);
  /* 使用 CSS 变量动态改变 hover 边框颜色 */
  border-color: var(--pace-color, #a48b57);
}

.pace-card.active {
  /* 动态背景色：微弱的彩色光晕 */
  background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(255, 255, 255, 0.05));
  border-color: var(--pace-color, #a48b57);
  /* 动态阴影 */
  box-shadow: 0 0 15px var(--pace-color, rgba(164, 139, 87, 0.2));
}

/* 针对 active 状态下的背景微调，利用 mix-blend-mode 或伪元素可以做得更细致，
   这里简单处理，让 active 的背景稍微带点对应色调 */
.pace-card.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--pace-color);
  opacity: 0.1;
  pointer-events: none;
  z-index: 0;
}

.pace-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: #8a92a0;
  transition: all 0.3s;
  z-index: 1;
}

.pace-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.pace-card.active .pace-icon {
  color: var(--pace-color, #a48b57);
  filter: drop-shadow(0 0 5px var(--pace-color, rgba(164, 139, 87, 0.5)));
}

.pace-info {
  flex: 1;
  z-index: 1;
}

.pace-name {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  color: #e0e0e0;
  margin-bottom: 8px;
  transition: color 0.3s;
}

.pace-card.active .pace-name {
  color: var(--pace-color, #a48b57);
}

.pace-desc {
  font-family: 'EB Garamond', serif;
  font-size: 0.9rem;
  color: #8a92a0;
  line-height: 1.4;
}

.active-indicator {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--pace-color, #a48b57);
  color: #000;
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-bottom-left-radius: 4px;
  font-weight: bold;
  z-index: 2;
}
</style>
