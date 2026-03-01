<template>
  <div class="personality-module">
    <!-- 核心性格维度列表 -->
    <div class="trait-list">
      <div v-for="key in coreTraits" :key="key" class="trait-row">
        <!-- 头部：维度名称 -->
        <div class="trait-header">
          <span class="trait-name">{{ key }}</span>
        </div>

        <!-- 内容：文本描述 -->
        <div class="trait-description">
          {{ data[key] || '暂无描述' }}
        </div>
      </div>
    </div>

    <!-- 近期影响 (如果有) -->
    <div class="recent-impacts" v-if="hasRecentImpacts">
      <div class="impact-header">
        <span class="impact-title">近期影响</span>
      </div>
      <div class="impact-list">
        <div v-for="(value, key) in data['近期影响']" :key="key" class="impact-item">
          <span class="impact-key">【{{ key }}】</span>
          <span class="impact-value">{{ value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

// 对应 PersonalityData 接口中的核心字符串字段
const coreTraits = [
  '社交表现',
  '行动逻辑',
  '思维习惯',
  '人际距离',
  '道德底色'
];

// 判断是否存在近期影响数据
const hasRecentImpacts = computed(() => {
  return props.data['近期影响'] && Object.keys(props.data['近期影响']).length > 0;
});
</script>

<style scoped>
.personality-module {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'EB Garamond', serif;
}

/* --- 核心维度列表样式 --- */
.trait-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trait-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.trait-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.trait-header {
  display: flex;
  align-items: center;
}

.trait-name {
  font-family: 'Cinzel', serif;
  color: #d4af37; /* 金色主题 */
  font-weight: bold;
  font-size: 1.1rem;
  letter-spacing: 1px;
  position: relative;
  padding-left: 14px;
}

/* 标题前的小菱形点缀 */
.trait-name::before {
  content: '♦';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: #a0c4ff; /* 冰蓝色点缀 */
}

.trait-description {
  color: #e0e0e0;
  font-size: 0.95rem;
  line-height: 1.6;
  text-align: justify;
  padding-left: 14px;
}

/* --- 近期影响模块样式 --- */
.recent-impacts {
  margin-top: 8px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(0, 0, 0, 0.2));
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 6px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

.impact-header {
  margin-bottom: 14px;
  text-align: center;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  padding-bottom: 10px;
}

.impact-title {
  font-family: 'Cinzel', serif;
  color: #a0c4ff;
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 2px;
}

.impact-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.impact-item {
  font-size: 0.9rem;
  line-height: 1.5;
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 14px;
  border-left: 3px solid #a0c4ff;
  border-radius: 0 4px 4px 0;
}

.impact-key {
  color: #d4af37;
  font-weight: bold;
  margin-right: 6px;
}

.impact-value {
  color: #cccccc;
}
</style>
