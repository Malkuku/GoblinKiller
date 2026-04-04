<template>
  <div class="skill-list-module">
    <h3 class="section-title">角色技能</h3>

    <!-- 技能类型标签页 (替代原分页) -->
    <div class="type-tabs" v-if="availableTabs.length > 0">
      <button
        v-for="tab in availableTabs"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}技能
      </button>
    </div>

    <div class="skills-container" :class="getTabClass(activeTab)">
      <div v-if="displayedSkills.length === 0" class="empty-skills">
        暂无掌握的技能...
      </div>

      <div
        v-for="skill in displayedSkills"
        :key="skill.name"
        class="skill-card"
        :class="{ expanded: expandedSkills.has(skill.name) }"
      >
        <div class="skill-header" @click="toggleSkill(skill.name)">
          <span class="skill-name">
            <span class="icon-wrapper" v-html="skillIcon"></span>
            {{ skill.name }}
          </span>
          <div class="header-actions">
            <button class="use-btn" @click.stop="useSkill(skill.name)">使用</button>
            <button class="forget-btn" @click.stop="forgetSkill(skill.name)">遗忘</button>
            <span class="toggle-icon">{{ expandedSkills.has(skill.name) ? '▼' : '▶' }}</span>
          </div>
        </div>

        <transition name="expand">
          <div v-if="expandedSkills.has(skill.name)" class="skill-details">
            <template v-if="typeof skill.data === 'object' && skill.data !== null">

              <!-- 1. 消耗区域 (置于最上) -->
              <div v-if="Object.keys(parsedData(skill.data).costs).length > 0" class="detail-section costs-section">
                <div v-for="(val, key) in parsedData(skill.data).costs" :key="key" class="detail-item full-width cost-item">
                  <span class="detail-key">{{ translateField(key) }}</span>
                  <span class="detail-val">{{ val }}</span>
                </div>
              </div>

              <!-- 2. 描述区域 (置于消耗下方) -->
              <div v-if="Object.keys(parsedData(skill.data).descs).length > 0" class="detail-section descs-section">
                <div v-for="(val, key) in parsedData(skill.data).descs" :key="key" class="detail-item full-width desc-item">
                  <span class="detail-key">{{ translateField(key) }}</span>
                  <span class="detail-val">{{ val }}</span>
                </div>
              </div>

              <!-- 3. 其他属性区域 (网格布局) -->
              <div v-if="Object.keys(parsedData(skill.data).others).length > 0" class="skill-details-grid">
                <div
                  v-for="(val, key) in parsedData(skill.data).others"
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
  </div>
</template>

<script setup>
import { MvuUtil } from '@/Utils/MvuUtil';
import { getSVG } from '@/哥杀/UI/composables/icon/icon';
import { useStatStore } from '@/哥杀/UI/store/StatStore';
import { useUiStore } from '@/哥杀/UI/store/UIStore';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const statStore = useStatStore();
const uiStore = useUiStore();
const router = useRouter();

// 技能图标
const skillIcon = getSVG('skill', { size: 18, color: 'var(--accent-gold)' });

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
  cast_time: '施法时间',
  efficiency: '效率' // 新增效率翻译
};

// 字段翻译函数
const translateField = (key) => {
  const lowerKey = String(key).toLowerCase();
  return fieldMap[lowerKey] || key;
};

// 判断是否为长文本
const isLongText = (val) => {
  return typeof val === 'string' && val.length > 15;
};

// 获取主角技能数据并转为数组
const skillsArray = computed(() => {
  const player = statStore.stat_data?.['主角'];
  const skillsObj = player?.['技能列表'] || {};
  return Object.entries(skillsObj).map(([name, data]) => ({ name, data }));
});

// 按类型分组技能
const groupedSkills = computed(() => {
  const groups = {};
  skillsArray.value.forEach(skill => {
    let type = '未分类';
    if (skill.data && typeof skill.data === 'object') {
      const rawType = skill.data.type || skill.data['类型'];
      if (rawType) {
        const lowerType = String(rawType).toLowerCase();
        if (lowerType === 'active' || lowerType === '主动') type = '主动';
        else if (lowerType === 'passive' || lowerType === '被动') type = '被动';
        else type = rawType;
      }
    }
    if (!groups[type]) groups[type] = [];
    groups[type].push(skill);
  });
  return groups;
});

const availableTabs = computed(() => Object.keys(groupedSkills.value));
const currentTab = ref('');

// 当前激活的标签页
const activeTab = computed({
  get() {
    if (availableTabs.value.includes(currentTab.value)) return currentTab.value;
    return availableTabs.value[0] || '';
  },
  set(val) {
    currentTab.value = val;
  }
});

// 当前显示的技能列表
const displayedSkills = computed(() => {
  return groupedSkills.value[activeTab.value] || [];
});

// 为不同类型的技能提供不同的UI Class
const getTabClass = (tabName) => {
  if (tabName === '主动') return 'is-active-type';
  if (tabName === '被动') return 'is-passive-type';
  return 'is-default-type';
};

// 解析技能数据，分离消耗、描述和其他属性，并过滤掉类型
const parsedData = (data) => {
  const costs = {};
  const descs = {};
  const others = {};

  const costKeys = ['cost', 'mp_cost', 'sp_cost', '消耗', '法力消耗', '体力消耗'];
  const descKeys = ['desc', 'description', '描述'];

  for (const [key, val] of Object.entries(data)) {
    const lowerKey = String(key).toLowerCase();

    // 过滤掉类型字段，因为已经通过标签页分类了
    if (lowerKey === 'type' || lowerKey === '类型') continue;

    if (costKeys.includes(lowerKey)) {
      costs[key] = val;
    } else if (descKeys.includes(lowerKey)) {
      descs[key] = val;
    } else {
      others[key] = val;
    }
  }

  return { costs, descs, others };
};

// 记录展开状态的技能名称集合
const expandedSkills = ref(new Set());

const toggleSkill = (skillName) => {
  if (expandedSkills.value.has(skillName)) {
    expandedSkills.value.delete(skillName);
  } else {
    expandedSkills.value.add(skillName);
  }
};

// 遗忘（移除）技能
const forgetSkill = async (skillName) => {
  if (confirm(`确定要遗忘技能【${skillName}】吗？此操作不可逆。`)) {
    await MvuUtil.updateMvuDataByDiff({
      '主角': {
        '技能列表': {
          [skillName]: null
        }
      }
    });
    expandedSkills.value.delete(skillName);
  }
};

// 使用技能
const useSkill = (skillName) => {
  uiStore.setPendingInput(`<user>准备施展【${skillName}】`);
  router.push('/选项');
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

/* 标签页样式 */
.type-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 5px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 6px 12px;
  font-size: 0.95rem;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  color: var(--text-main);
  background: rgba(0, 0, 0, 0.03);
}

.tab-btn.active {
  color: var(--accent-gold);
  font-weight: bold;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -7px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent-gold);
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

/* UI差异化：主动技能偏红/金，被动技能偏绿/蓝 */
.is-active-type .skill-card {
  border-left-color: #e67e22;
}
.is-active-type .skill-card.expanded {
  border-color: #e67e22;
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.15);
}

.is-passive-type .skill-card {
  border-left-color: #27ae60;
}
.is-passive-type .skill-card.expanded {
  border-color: #27ae60;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.15);
}

.is-default-type .skill-card.expanded {
  border-color: var(--accent-gold);
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.forget-btn {
  background: transparent;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  padding: 2px 8px;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0; /* 默认隐藏，悬浮显示 */
}

.skill-card:hover .forget-btn {
  opacity: 1;
}

.forget-btn:hover {
  background: #e74c3c;
  color: #fff;
}

.use-btn {
  background: transparent;
  border: 1px solid #27ae60;
  color: #27ae60;
  padding: 2px 8px;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0;
}

.skill-card:hover .use-btn {
  opacity: 1;
}

.use-btn:hover {
  background: #27ae60;
  color: #fff;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 消耗项特殊样式 */
.cost-item {
  background: rgba(230, 126, 34, 0.05) !important;
  border-color: rgba(230, 126, 34, 0.2) !important;
}
.cost-item .detail-key {
  color: #d35400;
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
