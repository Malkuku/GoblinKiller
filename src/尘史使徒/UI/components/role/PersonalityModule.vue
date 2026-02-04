<template>
  <div class="personality-module">
    <!-- 顶部总结 -->
    <div class="trait-summary" v-if="summary">
      <span class="quote-mark">“</span>
      {{ summary }}
      <span class="quote-mark">”</span>
    </div>

    <!-- 维度列表 -->
    <div class="trait-list">
      <div v-for="(trait, key) in traitDefinitions" :key="key" class="trait-row">

        <!-- 头部：标题与当前状态 -->
        <div class="trait-header">
          <span class="trait-name">{{ key }}</span>
          <span class="trait-value-text" :class="getValueColorClass(data[key])">
            {{ getTraitLabel(key, data[key]) }}
            <span class="value-number">({{ data[key] || 0 }})</span>
          </span>
        </div>

        <!-- 视觉：双向进度条 -->
        <div class="spectrum-track">
          <!-- 中心刻度 -->
          <div class="center-line"></div>

          <!-- 进度条 -->
          <div
            class="spectrum-bar"
            :class="data[key] < 0 ? 'negative' : 'positive'"
            :style="getBarStyle(data[key])"
          >
            <!-- 进度条末端的光点 -->
            <div class="bar-tip"></div>
          </div>
        </div>

        <!-- 底部：两极描述 (可选，用于提示范围) -->
        <div class="trait-footer">
          <span class="min-label">{{ trait.minLabel }}</span>
          <span class="max-label">{{ trait.maxLabel }}</span>
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

const summary = computed(() => {
  if (Array.isArray(props.data.性格总结)) return props.data.性格总结.join('，');
  return props.data.性格总结 || '';
});

// 定义规则矩阵
const traitDefinitions = {
  '社交取向': {
    minLabel: '社交壁垒', maxLabel: '社交核心',
    ranges: [
      { min: -100, max: -80, label: '社交壁垒' },
      { min: -79, max: -40, label: '独处偏好' },
      { min: -39, max: -10, label: '内敛' },
      { min: -9, max: 9, label: '中性' },
      { min: 10, max: 40, label: '友好参与' },
      { min: 41, max: 80, label: '活跃组织者' },
      { min: 81, max: 100, label: '社交核心' },
    ]
  },
  '决策模式': {
    minLabel: '纯粹直觉', maxLabel: '极致理性',
    ranges: [
      { min: -100, max: -80, label: '纯粹直觉' },
      { min: -79, max: -40, label: '情绪主导' },
      { min: -39, max: -10, label: '情感倾向' },
      { min: -9, max: 9, label: '平衡' },
      { min: 10, max: 40, label: '逻辑优先' },
      { min: 41, max: 80, label: '系统分析' },
      { min: 81, max: 100, label: '极致理性' },
    ]
  },
  '思维倾向': {
    minLabel: '顽固排斥', maxLabel: '颠覆创新',
    ranges: [
      { min: -100, max: -80, label: '顽固排斥' },
      { min: -79, max: -40, label: '固执' },
      { min: -39, max: -10, label: '谨慎' },
      { min: -9, max: 9, label: '中立' },
      { min: 10, max: 40, label: '乐于尝试' },
      { min: 41, max: 80, label: '积极探索' },
      { min: 81, max: 100, label: '颠覆创新' },
    ]
  },
  '人际姿态': {
    minLabel: '主动攻击', maxLabel: '无私奉献',
    ranges: [
      { min: -100, max: -80, label: '主动攻击' },
      { min: -79, max: -40, label: '竞争优先' },
      { min: -39, max: -10, label: '防御反击' },
      { min: -9, max: 9, label: '适时调整' },
      { min: 10, max: 40, label: '合作倾向' },
      { min: 41, max: 80, label: '协同者' },
      { min: 81, max: 100, label: '无条件奉献' },
    ]
  },
  '人性温度': {
    minLabel: '极端冷酷', maxLabel: '至善',
    ranges: [
      { min: -100, max: -80, label: '极端冷酷' },
      { min: -79, max: -40, label: '无情' },
      { min: -39, max: -10, label: '冷漠' },
      { min: -9, max: 9, label: '原则主义' },
      { min: 10, max: 40, label: '有限同情' },
      { min: 41, max: 80, label: '善良' },
      { min: 81, max: 100, label: '至善' },
    ]
  }
};

// 获取当前数值对应的文字描述
const getTraitLabel = (key, value) => {
  const val = parseInt(value) || 0;
  const def = traitDefinitions[key];
  if (!def) return '未知';

  const match = def.ranges.find(r => val >= r.min && val <= r.max);
  return match ? match.label : '未知';
};

// 计算样式：从中心(50%)向左右延伸
const getBarStyle = (value) => {
  const val = parseInt(value) || 0;
  // 将 -100~100 映射为 0~50 的长度
  const width = Math.abs(val) / 2;

  if (val >= 0) {
    // 正值：从50%向右
    return { left: '50%', width: `${width}%` };
  } else {
    // 负值：从 (50% - width) 向右延伸到 50%
    return { left: `${50 - width}%`, width: `${width}%` };
  }
};

const getValueColorClass = (value) => {
  const val = parseInt(value) || 0;
  if (val > 10) return 'text-pos';
  if (val < -10) return 'text-neg';
  return 'text-neu';
};
</script>

<style scoped>
.personality-module {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'EB Garamond', serif;
}

.trait-summary {
  text-align: center;
  font-style: italic;
  color: #d4af37;
  padding: 10px;
  background: rgba(212, 175, 55, 0.05);
  border-radius: 4px;
  margin-bottom: 10px;
}
.quote-mark { font-size: 1.5em; vertical-align: middle; opacity: 0.6; }

.trait-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trait-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 0.9rem;
}

.trait-name {
  color: #e0e0e0;
  font-weight: bold;
}

.trait-value-text {
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
}
.value-number { font-size: 0.75em; opacity: 0.6; margin-left: 4px; font-family: monospace; }
.text-pos { color: #d4af37; } /* 金色：正向/阳性 */
.text-neg { color: #a0c4ff; } /* 淡蓝：负向/阴性 */
.text-neu { color: #a0a0a0; } /* 灰色：中性 */

/* --- 谱系条轨道 --- */
.spectrum-track {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden; /* 保持条在轨道内 */
}

.center-line {
  position: absolute;
  left: 50%;
  top: 0; bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-50%);
  z-index: 1;
}

.spectrum-bar {
  position: absolute;
  height: 100%;
  top: 0;
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 正向条样式 (金色) */
.spectrum-bar.positive {
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.4), rgba(212, 175, 55, 1));
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
}

/* 负向条样式 (冰蓝色/银色) */
.spectrum-bar.negative {
  background: linear-gradient(270deg, rgba(160, 196, 255, 0.4), rgba(160, 196, 255, 1));
  box-shadow: 0 0 8px rgba(160, 196, 255, 0.4);
}

/* 底部标签 */
.trait-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #666;
  margin-top: -2px;
}
</style>
