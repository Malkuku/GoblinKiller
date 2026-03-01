<template>
  <div v-if="data && Object.keys(data).length > 0" class="special-status-container">
    <ul class="status-list-styled">
      <template v-for="(status, name) in data" :key="name">
        <li :class="getStatusClass(name)">
          <div class="status-header">
            <strong class="status-title">
              {{ name }}
              <span v-if="typeof status !== 'string' && status.不可移除" class="unremovable-tag" title="此状态不可移除">[不可移除]</span>
            </strong>
          </div>
          <div class="status-body">
            <!-- 使用 formatText 处理描述文本 -->
            <p class="status-desc">{{ formatText(typeof status === 'string' ? status : status.描述) }}</p>
            <!-- 使用 formatText 处理效果文本 -->
            <p v-if="typeof status !== 'string' && status.效果" class="status-effect">
              效果：{{ formatText(status.效果) }}
            </p>
          </div>
        </li>
      </template>
    </ul>
  </div>
  <div v-else class="no-status">无特殊状态</div>
</template>

<script setup>
// 接收 data (状态列表) 和 stats (角色属性数据，包含"基础数值"和"生命状态")
const props = defineProps(['data', 'stats']);

/**
 * 格式化文本，将 ${属性名} 替换为 属性名[数值]
 * 例如: "减少 (${智慧}/10) 点伤害" -> "减少 (智慧[50]/10) 点伤害"
 */
const formatText = (text) => {
  if (!text || typeof text !== 'string') return text;

  // 正则匹配 ${...}
  return text.replace(/\$\{([^}]+)\}/g, (match, key) => {
    // 如果没有传入 stats，直接返回原文本
    if (!props.stats) return match;

    // 1. 尝试从 [基础数值] 中查找 (力量, 敏捷, 智慧, 魅力)
    if (props.stats['基础数值'] && props.stats['基础数值'][key] !== undefined) {
      return `${key}[${props.stats['基础数值'][key]}]`;
    }

    // 2. 尝试从 [生命状态] 中查找 (生命, 体力, 精神)
    if (props.stats['生命状态'] && props.stats['生命状态'][key]) {
      const val = props.stats['生命状态'][key];
      // 如果是对象且包含'当前'字段 (例如: {当前: 100, 最大值: 100})
      if (typeof val === 'object' && val['当前'] !== undefined) {
        return `${key}[${val['当前']}]`;
      }
      // 防守性处理：如果是直接数值
      if (typeof val === 'number' || typeof val === 'string') {
        return `${key}[${val}]`;
      }
    }

    // 如果未找到对应属性，保留原样
    return match;
  });
};

const getStatusClass = (name) => {
  const n = name.toString();
  return {
    'status-item': true,
    'status-soul-quality': n.includes('魂质'),
    'status-pact': n.includes('印记') || n.includes('契约'),
    'status-blessing': n.includes('祝福'),
    'status-curse': n.includes('诅咒') || n.includes('侵染'),
    'status-injury': n.includes('伤病')
  };
};
</script>

<style scoped>
.special-status-container { width: 100%; }
.no-status { color: var(--c-text-dim, #888); font-style: italic; }

/* --- 特殊状态列表样式 (复用自 UserPanel) --- */
.status-list-styled { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.status-item { padding: 10px 15px; border-left: 4px solid #555; background: rgba(255, 255, 255, 0.03); transition: all 0.3s ease; position: relative; overflow: hidden; }
.status-title { display: flex; justify-content: space-between; font-size: 1.05rem; margin-bottom: 5px; color: #e0e0e0; }
.unremovable-tag { font-size: 0.7em; color: #ff6b6b; opacity: 0.8; margin-left: 8px; }
.status-desc { margin: 0; font-size: 0.95rem; color: #a0a0a0; line-height: 1.4; }
.status-effect { margin: 5px 0 0 0; font-size: 0.9rem; color: #ffb74d; }

/* 动画定义 */
@keyframes streaming-light { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

/* 各类状态配色与特效 */
.status-soul-quality { color: #0096FF; border-left-color: #0096FF; background-image: linear-gradient(90deg, transparent, rgba(0, 150, 255, 0.2), transparent); background-size: 200% 100%; animation: streaming-light 4s ease-in-out infinite; }
.status-pact { color: #FFD700; border-left-color: #FFD700; background-image: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.2), transparent); background-size: 200% 100%; animation: streaming-light 3.5s linear infinite; }
.status-blessing { color: #4CAF50; border-left-color: #4CAF50; background-image: linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.2), transparent); background-size: 200% 100%; animation: streaming-light 6s ease-in-out infinite; }
.status-curse { color: #9C27B0; border-left-color: #9C27B0; background-image: linear-gradient(90deg, transparent, rgba(156, 39, 176, 0.25), transparent); background-size: 200% 100%; animation: streaming-light 5s ease-in infinite; }
.status-injury { color: #2E7D32; border-left-color: #2E7D32; background-image: linear-gradient(90deg, transparent, rgba(46, 125, 50, 0.3), transparent); background-size: 200% 100%; animation: streaming-light 4.5s linear infinite; }
</style>
