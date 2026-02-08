<template>
  <div class="main-quest-card" :class="cardTypeClass">
    <!-- 头部：通用 -->
    <div class="card-header">
      <div class="quest-type-label">{{ typeLabel }}</div>
      <h2 class="quest-title">{{ title }}</h2>
    </div>

    <!-- 内容区：描述 -->
    <div class="card-body">
      <p class="description">{{ data.描述 }}</p>

      <!-- 动态组件分发 -->
      <component :is="activeLayout" :data="data" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import LayoutAlertness from '@/尘史使徒/UI/components/task/LayoutAlertness.vue';
import LayoutSouls from '@/尘史使徒/UI/components/task/LayoutSouls.vue';
import LayoutGlow from '@/尘史使徒/UI/components/task/LayoutGlow.vue';
import LayoutDefault from '@/尘史使徒/UI/components/task/LayoutDefault.vue';

const props = defineProps({
  title: String,
  data: Object
});

// 逻辑判断
const hasAlertness = computed(() => props.data.警惕度 !== undefined);
const hasSouls = computed(() => props.data.已交融的魂质 && props.data.已交融的魂质.length > 0);
const isGlowType = computed(() => props.title && props.title.startsWith('启明'));

// 决定使用哪个子组件
const activeLayout = computed(() => {
  if (hasAlertness.value) return LayoutAlertness;
  if (hasSouls.value) return LayoutSouls;
  if (isGlowType.value) return LayoutGlow; // 辉光系列专用
  return LayoutDefault;
});

// 样式类名
const cardTypeClass = computed(() => {
  if (hasAlertness.value) return 'type-stealth';
  if (hasSouls.value) return 'type-power';
  if (isGlowType.value) return 'type-glow';
  return 'type-normal';
});

// 标签文本
const typeLabel = computed(() => {
  if (hasAlertness.value) return 'SURVIVAL PROTOCOL';
  if (hasSouls.value) return 'SOUL RESONANCE';
  if (isGlowType.value) return 'MANSUS REVELATION';
  return 'MEMORY SEQUENCE';
});
</script>

<style scoped>
.main-quest-card {
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 25px;
  margin-bottom: 25px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}
.card-header { margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
.quest-type-label { font-size: 0.7rem; letter-spacing: 3px; opacity: 0.7; margin-bottom: 5px; text-transform: uppercase; }
.quest-title { font-family: serif; font-size: 1.8rem; color: #eee; margin: 0; }
.description { font-size: 1.05rem; line-height: 1.6; color: #ccc; margin-bottom: 20px; font-style: italic; }

/* 类型样式修饰 */
.type-stealth { border-left: 4px solid #d32f2f; }
.type-power { border-left: 4px solid #9c27b0; }
.type-glow {
  border-left: 4px solid #fcd34d;
  background: linear-gradient(160deg, rgba(30, 25, 10, 0.95), rgba(10, 10, 10, 0.98));
  box-shadow: 0 0 20px rgba(252, 211, 77, 0.05);
}
.type-glow .quest-title { color: #fde68a; text-shadow: 0 0 10px rgba(251, 191, 36, 0.4); }
.type-glow .quest-type-label { color: #fcd34d; }
</style>
