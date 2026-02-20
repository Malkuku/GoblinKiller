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
import { useStatStore } from '@/尘史使徒/UI/store/StatStore'; // 确保路径正确
import { NarrativePaceConfig } from '@/尘史使徒/UI/types/叙事配置';
import { ERAUtil } from '@/Utils/ERAUtil'; // 确保路径正确

const props = defineProps({
  // 如果传入 modelValue，组件将变为“受控模式”（用于人物创建表单）
  modelValue: {
    type: String,
    default: undefined
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// 引入 Store
const statStore = useStatStore();
const { stat_data } = storeToRefs(statStore);

// 计算当前选中的节奏
// 逻辑：如果有外部传入的 modelValue，优先用它；否则从 Store 里读 system.叙事节奏
const currentActivePace = computed(() => {
  if (props.modelValue !== undefined) {
    return props.modelValue;
  }
  // 默认回退值，防止 store 为空时报错
  return stat_data.value?.system?.['叙事节奏'] || '诡异现实';
});

// 处理点击事件
const handleSelect = (key) => {
  if (currentActivePace.value === key) return;

  // 1. 无论是哪种模式，都抛出事件（方便外部监听或更新 v-model）
  emit('update:modelValue', key);
  emit('change', key);

  // 2. 只有在“非受控模式”（即没有传 v-model，通常是设置页面）下，才直接调用 API
  if (props.modelValue === undefined) {
    updateSystemSetting(key);
  }
};

// 调用 ERA API 更新后端
const updateSystemSetting = (key) => {
  ERAUtil.UpdateByObject({
    system: {
      "叙事节奏": key
    }
  });
};
</script>

<style scoped>
/* 样式保持不变 */
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
  border-color: #a48b57;
}

.pace-card.active {
  background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(164, 139, 87, 0.1));
  border-color: #a48b57;
  box-shadow: 0 0 15px rgba(164, 139, 87, 0.2);
}

.pace-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: #8a92a0;
  transition: all 0.3s;
}

.pace-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.pace-card.active .pace-icon {
  color: #a48b57;
  filter: drop-shadow(0 0 5px rgba(164, 139, 87, 0.5));
}

.pace-info {
  flex: 1;
}

.pace-name {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  color: #e0e0e0;
  margin-bottom: 8px;
  transition: color 0.3s;
}

.pace-card.active .pace-name {
  color: #a48b57;
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
  background: #a48b57;
  color: #000;
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-bottom-left-radius: 4px;
  font-weight: bold;
}
</style>
