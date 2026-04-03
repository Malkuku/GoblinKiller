<template>
  <div class="skill-list-module">
    <h3 class="section-title">角色技能</h3>

    <div class="skills-container">
      <div v-if="skillsArray.length === 0" class="empty-skills">
        暂无掌握的技能...
      </div>

      <div
        v-for="skill in paginatedSkills"
        :key="skill.name"
        class="skill-card"
        :class="{ expanded: expandedSkills.has(skill.name) }"
      >
        <div class="skill-header" @click="toggleSkill(skill.name)">
          <span class="skill-name">
            <span class="icon-wrapper" v-html="skillIcon"></span>
            {{ skill.name }}
          </span>
          <span class="toggle-icon">{{ expandedSkills.has(skill.name) ? '▼' : '▶' }}</span>
        </div>

        <transition name="expand">
          <div v-if="expandedSkills.has(skill.name)" class="skill-details">
            <template v-if="typeof skill.data === 'object' && skill.data !== null">
              <div class="skill-details-grid">
                <div
                  v-for="(val, key) in skill.data"
                  :key="key"
                  class="detail-item"
                  :class="{ 'full-width': isLongText(val) }"
                >
                  <span class="detail-key">{{ translateField(key) }}</span>
                  <span class="detail-val">{{ val }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="detail-item full-width">
                <span class="detail-val">{{ skill.data }}</span>
              </div>
            </template>
          </div>
        </transition>
      </div>
    </div>

    <!-- 技能分页控制 -->
    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStatStore } from '@/哥杀/UI/store/StatStore';
import { getSVG } from '@/哥杀/UI/composables/icon/icon';

const statStore = useStatStore();

// 技能图标
const skillIcon = getSVG('skill', { size: 18, color: 'var(--accent-gold)' });

// 分页控制
const currentPage = ref(1);
const itemsPerPage = 10;

// 常见英文字段映射字典
const fieldMap = {
  level: '等级',
  exp: '经验',
  experience: '经验',
  desc: '描述',
  description: '描述',
  cost: '消耗',
  mp_cost: '法力消耗',
  sp_cost: '体力消耗',
  cooldown: '冷却',
  cd: '冷却',
  damage: '伤害',
  type: '类型',
  effect: '效果',
  duration: '持续时间',
  range: '范围',
  target: '目标',
  proficiency: '熟练度',
  tier: '阶级',
  element: '元素属性',
  cast_time: '施法时间'
};

// 字段翻译函数
const translateField = (key) => {
  const lowerKey = String(key).toLowerCase();
  return fieldMap[lowerKey] || key;
};

// 判断是否为长文本（用于控制网格布局跨行）
const isLongText = (val) => {
  return typeof val === 'string' && val.length > 15;
};

// 获取主角技能数据并转为数组
const skillsArray = computed(() => {
  const player = statStore.stat_data?.['主角'];
  const skillsObj = player?.['技能列表'] || {};
  return Object.entries(skillsObj).map(([name, data]) => ({ name, data }));
});

// 分页计算
const totalPages = computed(() => Math.ceil(skillsArray.value.length / itemsPerPage) || 1);
const paginatedSkills = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return skillsArray.value.slice(start, start + itemsPerPage);
});

// 记录展开状态的技能名称集合
const expandedSkills = ref(new Set());

const toggleSkill = (skillName) => {
  if (expandedSkills.value.has(skillName)) {
    expandedSkills.value.delete(skillName);
  } else {
    expandedSkills.value.add(skillName);
  }
};
</script>

<style scoped>
.skill-list-module {
  margin-top: 20px;
}

.section-title {
  color: var(--accent-gold);
  border-bottom: 1px solid var(--scroll-border);
  padding-bottom: 5px;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.skills-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 技能卡片基础样式 */
.skill-card {
  background: var(--bg-base);
  border: 1px solid var(--scroll-border);
  border-left: 4px solid var(--scroll-border);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.skill-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skill-card.expanded {
  border-color: var(--accent-gold);
  border-left: 4px solid var(--accent-gold);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 技能头部 */
.skill-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.02);
  user-select: none;
  transition: background 0.2s;
}

.skill-header:hover {
  background: rgba(198, 166, 100, 0.1);
}

.skill-name {
  font-weight: bold;
  color: var(--text-main);
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon {
  color: var(--accent-gold);
  font-size: 0.8rem;
  transition: transform 0.3s;
}

/* 技能详情区域 */
.skill-details {
  padding: 15px;
  border-top: 1px dashed var(--scroll-border);
  background: rgba(255, 255, 255, 0.4);
}

/* 网格布局优化 */
.skill-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
  line-height: 1.4;
  background: rgba(0, 0, 0, 0.03);
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* 长文本跨越整行 */
.detail-item.full-width {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: baseline;
  flex-wrap: wrap;
}

.detail-item.full-width .detail-key {
  margin-right: 8px;
}

.detail-key {
  color: var(--accent-gold);
  font-weight: bold;
  font-size: 0.85rem;
}

.detail-val {
  color: var(--text-muted);
  word-break: break-word;
}

.empty-skills {
  color: var(--text-muted);
  font-style: italic;
  padding: 10px;
  text-align: center;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.pagination button {
  background: transparent;
  border: 1px solid var(--scroll-border);
  color: var(--text-main);
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination button:not(:disabled):hover {
  background: var(--accent-gold);
  color: #fff;
  border-color: var(--accent-gold);
}

.page-info {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: bold;
}

/* 展开动画 */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 800px;
  opacity: 1;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-top-color: transparent;
}
</style>
```
