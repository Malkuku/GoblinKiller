<template>
  <div v-if="data && Object.keys(data).length > 0" class="skills-container">
    <div class="skills-grid">
      <template v-for="(skill, name) in data" :key="name">
        <div class="skill-card" :class="getAspectClass(skill.性相)">
          <!-- 头部：名称、等级、性相 -->
          <div class="skill-header">
            <div class="skill-title-group">
              <span class="skill-icon">{{ getAspectIcon(skill.性相) }}</span>
              <strong class="skill-name">{{ name }}</strong>
            </div>
            <div class="skill-meta">
              <span class="skill-level-badge">Lv.{{ skill.技能等级 }}</span>
              <span class="skill-aspect-tag">{{ skill.性相 }}</span>
            </div>
          </div>

          <!-- 主体：描述 -->
          <div class="skill-body">
            <p class="skill-desc">{{ skill.描述 }}</p>

            <div class="skill-details">
              <!-- 消耗 -->
              <div class="detail-row cost">
                <span class="label">消耗:</span>
                <span class="value">{{ formatSkillText(skill.消耗, skill) }}</span>
              </div>

              <!-- 作用 -->
              <div class="detail-row effect">
                <span class="label">作用:</span>
                <span class="value">{{ formatSkillText(skill.作用, skill) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
  <div v-else class="no-skills">暂无技能</div>
</template>

<script setup>
import { defineProps } from 'vue';

// 接收 data (技能列表对象) 和 stats (完整的角色数据对象)
const props = defineProps(['data', 'stats']);

/**
 * 格式化技能文本
 * @param {string} text - 原始文本，包含 ${...}
 * @param {object} currentSkill - 当前技能对象，用于获取 ${技能等级}
 */
const formatSkillText = (text, currentSkill) => {
  if (!text || typeof text !== 'string') return text || '无';

  return text.replace(/\$\{([^}]+)\}/g, (match, key) => {
    // 1. 处理 ${技能等级} - 直接从当前技能对象获取
    if (key === '技能等级') {
      return `技能等级[${currentSkill.技能等级}]`;
    }

    // 如果没有传入 stats，无法解析外部属性，直接返回
    if (!props.stats) return match;

    // 2. 处理 [基础数值] (力量, 敏捷, 智慧, 魅力)
    if (props.stats['基础数值'] && props.stats['基础数值'][key] !== undefined) {
      return `${key}[${props.stats['基础数值'][key]}]`;
    }

    // 3. 处理 [术之等级] (刃, 杯, 铸, 等)
    // 假设结构为: stats.术之等级 = { "刃": { "等级": 4, ... }, ... }
    if (props.stats['术之等级'] && props.stats['术之等级'][key]) {
      const artData = props.stats['术之等级'][key];
      // 如果是对象且有等级字段
      if (typeof artData === 'object' && artData['等级'] !== undefined) {
        return `${key}[${artData['等级']}]`;
      }
      // 如果直接是数值
      if (typeof artData === 'number') {
        return `${key}[${artData}]`;
      }
    }

    // 4. 处理 [生命状态] (作为备选，虽然技能消耗通常写在消耗里，但有时公式会用到当前生命)
    if (props.stats['生命状态'] && props.stats['生命状态'][key]) {
      const status = props.stats['生命状态'][key];
      if (typeof status === 'object' && status['当前'] !== undefined) {
        return `${key}[${status['当前']}]`;
      }
    }

    return match;
  });
};

// 根据性相返回简单的图标或首字母 (可选优化)
const getAspectIcon = (aspect) => {
  const icons = {
    '刃': '⚔️',
    '杯': '🍷',
    '铸': '🔥',
    '蛾': '🦋',
    '心': '💓',
    '灯': '💡',
    '冬': '❄️',
    '启': '🗝️'
  };
  return icons[aspect] || '✨';
};

// 根据性相生成 CSS 类名，用于配色
const getAspectClass = (aspect) => {
  // 简单的映射，如果没有匹配则返回 generic
  const map = {
    '刃': 'aspect-edge',
    '杯': 'aspect-grail',
    '铸': 'aspect-forge',
    '蛾': 'aspect-moth',
    '心': 'aspect-heart',
    '灯': 'aspect-lantern',
    '冬': 'aspect-winter',
    '启': 'aspect-knock'
  };
  return map[aspect] || 'aspect-generic';
};
</script>

<style scoped>
.skills-container {
  width: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.no-skills {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 10px;
}

/* 网格布局：大屏双列，小屏单列 */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

/* 卡片基础样式 */
.skill-card {
  background: rgba(30, 30, 30, 0.6);
  border: 1px solid #444;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 头部样式 */
.skill-header {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-name {
  font-size: 1.1rem;
  color: #e0e0e0;
  letter-spacing: 0.5px;
}

.skill-meta {
  display: flex;
  gap: 6px;
  font-size: 0.8rem;
}

.skill-level-badge {
  background: #444;
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.skill-aspect-tag {
  padding: 1px 6px;
  border-radius: 4px;
  color: #111;
  font-weight: bold;
  background: #aaa; /* 默认 */
}

/* 内容区域 */
.skill-body {
  padding: 10px 12px;
  font-size: 0.9rem;
  color: #ccc;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-desc {
  margin: 0;
  line-height: 1.4;
  font-style: italic;
  color: #aaa;
  margin-bottom: 4px;
}

.skill-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px;
  border-radius: 4px;
}

.detail-row {
  display: flex;
  align-items: baseline;
  line-height: 1.4;
}

.detail-row .label {
  flex-shrink: 0;
  width: 40px;
  font-weight: bold;
  margin-right: 4px;
  opacity: 0.8;
}

/* 消耗文本颜色 */
.detail-row.cost .label { color: #ff6b6b; }
.detail-row.cost .value { color: #ff8a80; }

/* 作用文本颜色 */
.detail-row.effect .label { color: #ffd700; }
.detail-row.effect .value { color: #ffe082; }

/* --- 性相配色方案 --- */

/* 刃 (Edge) - 绿色/锋利 */
.aspect-edge { border-color: #2e7d32; }
.aspect-edge .skill-header { background: linear-gradient(90deg, rgba(46, 125, 50, 0.2), transparent); }
.aspect-edge .skill-aspect-tag { background: #66bb6a; color: #000; }

/* 杯 (Grail) - 红色/血肉 */
.aspect-grail { border-color: #c62828; }
.aspect-grail .skill-header { background: linear-gradient(90deg, rgba(198, 40, 40, 0.2), transparent); }
.aspect-grail .skill-aspect-tag { background: #ef5350; color: #fff; }

/* 铸 (Forge) - 橙色/火焰 */
.aspect-forge { border-color: #ef6c00; }
.aspect-forge .skill-header { background: linear-gradient(90deg, rgba(239, 108, 0, 0.2), transparent); }
.aspect-forge .skill-aspect-tag { background: #ffa726; color: #000; }

/* 蛾 (Moth) - 浅褐/混沌 */
.aspect-moth { border-color: #d7ccc8; }
.aspect-moth .skill-header { background: linear-gradient(90deg, rgba(215, 204, 200, 0.15), transparent); }
.aspect-moth .skill-aspect-tag { background: #d7ccc8; color: #3e2723; }

/* 心 (Heart) - 粉红/生命 */
.aspect-heart { border-color: #ad1457; }
.aspect-heart .skill-header { background: linear-gradient(90deg, rgba(173, 20, 87, 0.2), transparent); }
.aspect-heart .skill-aspect-tag { background: #f48fb1; color: #000; }

/* 灯 (Lantern) - 金黄/理智 */
.aspect-lantern { border-color: #fbc02d; }
.aspect-lantern .skill-header { background: linear-gradient(90deg, rgba(251, 192, 45, 0.15), transparent); }
.aspect-lantern .skill-aspect-tag { background: #fff59d; color: #000; }

/* 冬 (Winter) - 苍白/寂静 */
.aspect-winter { border-color: #90a4ae; }
.aspect-winter .skill-header { background: linear-gradient(90deg, rgba(144, 164, 174, 0.2), transparent); }
.aspect-winter .skill-aspect-tag { background: #cfd8dc; color: #000; }

/* 启 (Knock) - 紫色/开启 */
.aspect-knock { border-color: #6a1b9a; }
.aspect-knock .skill-header { background: linear-gradient(90deg, rgba(106, 27, 154, 0.2), transparent); }
.aspect-knock .skill-aspect-tag { background: #ba68c8; color: #fff; }

</style>
