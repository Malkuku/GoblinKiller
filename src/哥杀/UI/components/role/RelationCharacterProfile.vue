<template>
  <div class="relation-profile-container" v-if="character && character !== '待初始化'">

    <!-- 左侧书签导航 -->
    <div class="bookmarks-sidebar">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="bookmark-tab"
        :class="{ 'is-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="bookmark-text">{{ tab.label }}</span>
      </div>
    </div>

    <!-- 右侧书页内容区 -->
    <div class="page-content">
      <transition name="page-fade" mode="out-in">

        <!-- ================= 第一页：基础信息 ================= -->
        <div v-if="activeTab === 'basic'" class="page-section" key="basic">
          <h2 class="section-title">基础印记</h2>

          <div class="basic-layout">
            <!-- 左侧：信息网格 -->
            <div class="info-grid basic-info-grid">
              <div class="info-item">
                <span class="label">真名：</span>
                <span class="value highlight">{{ character['姓名'] || '未知' }}</span>
              </div>
              <div class="info-item">
                <span class="label">种族：</span>
                <span class="value">{{ character['种族'] || '未知' }}</span>
              </div>
              <div class="info-item">
                <span class="label">与主角关系：</span>
                <span class="value">{{ character['与主角关系'] || '萍水相逢' }}</span>
              </div>
              <div class="info-item">
                <span class="label">羁绊层级：</span>
                <span class="value">{{ character['层级'] || '0' }}</span>
              </div>
              <div class="info-item">
                <span class="label">专属称呼：</span>
                <span class="value">{{ character['称呼'] || '无' }}</span>
              </div>
              <div class="info-item">
                <span class="label">同行状态：</span>
                <span class="value">{{ character['is_companion'] ? '结伴同行' : '独自行动' }}</span>
              </div>
              <div class="info-item">
                <span class="label">当前在场：</span>
                <span class="value">{{ character['在场'] ? '是' : '否' }}</span>
              </div>
            </div>

            <!-- 右侧：角色立绘显示 -->
            <div class="portrait-container" v-if="portraitUrl">
              <img :src="portraitUrl" alt="角色立绘" class="character-portrait" />
            </div>
          </div>
        </div>

        <!-- ================= 第二页：档案信息 ================= -->
        <div v-else-if="activeTab === 'profile'" class="page-section" key="profile">
          <h2 class="section-title">生平档案</h2>

          <div class="profile-block">
            <h3 class="sub-title">外貌特征</h3>
            <p class="desc-text">{{ character['外貌'] || '未记载' }}</p>
          </div>

          <div class="profile-block">
            <h3 class="sub-title">身份背景</h3>
            <p class="desc-text">{{ character['身份背景'] || '未记载' }}</p>
          </div>

          <div class="profile-block" v-if="character['性格标签']">
            <h3 class="sub-title">性格侧写</h3>
            <div class="tags-container">
              <span v-for="(val, key) in character['性格标签']" :key="key" class="trait-tag" v-show="val">
                {{ key }}
              </span>
            </div>
          </div>

          <div class="profile-block" v-if="character['小简历']">
            <h3 class="sub-title">履历简述</h3>
            <p class="desc-text" v-if="typeof character['小简历'] === 'string'">{{ character['小简历'] }}</p>
            <ul class="desc-list" v-else>
              <li v-for="(val, key) in character['小简历']" :key="key">
                <strong>{{ key }}：</strong>{{ val }}
              </li>
            </ul>
          </div>

          <!-- 私密档案 -->
          <div class="profile-block secret-block" v-if="character['性档案']">
            <h3 class="sub-title">私密档案</h3>
            <div class="info-grid">
              <div class="info-item" v-for="(val, key) in character['性档案']" :key="key">
                <span class="label">{{ key }}：</span>
                <span class="value">{{ typeof val === 'string' ? val : '详见卷宗' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= 第三页：能力相关 ================= -->
        <div v-else-if="activeTab === 'ability'" class="page-section" key="ability">
          <h2 class="section-title">能力刻印</h2>

          <div class="info-grid mb-4">
            <div class="info-item">
              <span class="label">主修职业：</span>
              <span class="value highlight">{{ getPrimaryClass(character['职业']) }}</span>
            </div>
            <div class="info-item">
              <span class="label">职业等级：</span>
              <span class="value">{{ character['职业等级'] || 1 }}</span>
            </div>
          </div>

          <div class="stats-container" v-if="character['能力']">
            <div class="stat-box">
              <h3 class="sub-title">基础属性</h3>
              <AbilityScoresDisplay :abilities="character['能力']" mode="bar" />
            </div>

            <div class="stat-box" v-if="character['历练进度']">
              <h3 class="sub-title">历练进度</h3>
              <div class="stat-row" v-for="(val, key) in character['历练进度']" :key="key">
                <span class="stat-name">{{ key }}</span>
                <span class="stat-val">{{ val }}%</span>
              </div>
            </div>
          </div>

          <div class="profile-block mt-4" v-if="character['技能列表']">
            <h3 class="sub-title">掌握技能</h3>
            <div class="tags-container">
              <span v-for="(val, key) in character['技能列表']" :key="key" class="skill-tag">
                {{ key }}
              </span>
            </div>
          </div>

          <div class="profile-block mt-4" v-if="character['装备']">
            <h3 class="sub-title">当前武装</h3>
            <div class="equip-grid">
              <div class="equip-item" v-for="(items, slot) in character['装备']" :key="slot">
                <span class="equip-slot">{{ slot }}</span>
                <span class="equip-name">{{ getFirstItemName(items) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= 第四页：资源相关 ================= -->
        <div v-else-if="activeTab === 'resource'" class="page-section" key="resource">
          <h2 class="section-title">物资与状态</h2>

          <div class="resource-bars mb-4">
            <h3 class="sub-title">生命体征</h3>
            <div class="res-row" v-for="res in ['生命值', '魔力值', '体力值', '信仰力值', '护甲值']" :key="res">
              <template v-if="character[res]">
                <span class="res-name">{{ res }}</span>
                <span class="res-val">{{ character[res]['当前值'] }} / {{ character[res]['最大值'] }}</span>
              </template>
            </div>
          </div>

          <div class="profile-block" v-if="character['背包'] && character['背包']['金钱']">
            <h3 class="sub-title">随身资产</h3>
            <div class="money-container">
              <span class="coin gold">金 {{ character['背包']['金钱']['金币'] || 0 }}</span>
              <span class="coin silver">银 {{ character['背包']['金钱']['银币'] || 0 }}</span>
              <span class="coin copper">铜 {{ character['背包']['金钱']['铜币'] || 0 }}</span>
            </div>
          </div>

          <div class="profile-block" v-if="character['资源快照']">
            <h3 class="sub-title">状态快照</h3>
            <ul class="desc-list">
              <li v-for="(val, key) in character['资源快照']" :key="key">
                <strong>{{ key }}：</strong>
                <span v-if="typeof val === 'string'">{{ val }}</span>
                <span v-else>效果 {{ val['效果'] }} ({{ val['时间'] }})</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- ================= 第五页：驱动相关 ================= -->
        <div v-else-if="activeTab === 'drive'" class="page-section" key="drive">
          <h2 class="section-title">行事驱动</h2>

          <div class="profile-block" v-if="character['公会信息']">
            <h3 class="sub-title">公会从属</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">所属公会：</span>
                <span class="value highlight">{{ character['公会信息']['所属公会'] || '无' }}</span>
              </div>
              <div class="info-item">
                <span class="label">公会阶级：</span>
                <span class="value" :class="getRankClass(character['公会信息']['公会阶级'])">
                  {{ formatRank(character['公会信息']['公会阶级']) }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">贡献度：</span>
                <span class="value">{{ character['公会信息']['贡献度'] || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="profile-block">
            <h3 class="sub-title">当前行踪</h3>
            <div class="info-item">
              <span class="label">所处地点：</span>
              <span class="value">{{ character['所处地点'] || '未知领域' }}</span>
            </div>
          </div>

          <div class="profile-block">
            <h3 class="sub-title">相关委托/动机</h3>
            <p class="desc-text text-muted">暂无进行中的专属委托记录...</p>
          </div>
        </div>

      </transition>
    </div>
  </div>
  <div v-else class="empty-state">
    <p>迷雾笼罩，无法看清此人的命运轨迹...</p>
  </div>
</template>

<script setup lang="ts">
import AbilityScoresDisplay from '@/哥杀/UI/components/role/AbilityScoresDisplay.vue';
import { useStatStore } from '@/哥杀/UI/store/StatStore';
import { computed, ref, onMounted, watch } from 'vue';
import { PortraitManager } from '@/哥杀/UI/composables/role/PortraitManager';

// 仅需传入角色的键名（如："精灵弓手"）
const props = defineProps<{
  characterId: string
}>();

const statStore = useStatStore();

// 动态从 Store 中获取角色数据
const character = computed(() => {
  const relationList = statStore.stat_data?.['关系列表'];
  if (!relationList) return null;
  return relationList[props.characterId];
});

// 定义标签页
const tabs = [
  { id: 'basic', label: '基础' },
  { id: 'profile', label: '档案' },
  { id: 'ability', label: '能力' },
  { id: 'resource', label: '资源' },
  { id: 'drive', label: '驱动' }
];

const activeTab = ref('basic');

// ================= 立绘管理 =================
const portraitManager = new PortraitManager();
const portraitUrl = ref<string | null>(null);

const updatePortrait = () => {
  if (!character.value) {
    portraitUrl.value = null;
    return;
  }
  const name = character.value['姓名'] || props.characterId;
  const profession = getPrimaryClass(character.value['职业']);
  const race = character.value['种族'];
  const location = character.value['所处地点'];

  const portrait = portraitManager.getMatchPortrait(name, profession, race, location);
  portraitUrl.value = portrait?.url || null;
};

onMounted(async () => {
  await portraitManager.loadPortraitDatabase();
  updatePortrait();
});

watch(() => character.value, () => {
  updatePortrait();
}, { deep: true });

// 辅助函数：获取主要职业名称
const getPrimaryClass = (classesObj: Record<string, any>) => {
  if (!classesObj) return '平民';
  const keys = Object.keys(classesObj);
  return keys.length > 0 ? keys[0] : '平民';
};

// 辅助函数：获取装备槽位的第一件物品名称
const getFirstItemName = (itemsObj: Record<string, any>) => {
  if (!itemsObj) return '空';
  const keys = Object.keys(itemsObj);
  if (keys.length === 0) return '空';
  const firstItem = itemsObj[keys[0]];
  return typeof firstItem === 'object' && firstItem.name ? firstItem.name : keys[0];
};

// 辅助函数：格式化等级（去掉 lv 前缀）
const formatRank = (rank: string) => {
  if (!rank) return '无';
  return String(rank).replace(/^lv\s*/i, '');
};

// 辅助函数：获取等级对应的颜色类名
const getRankClass = (rank: string) => {
  const cleanRank = formatRank(rank);
  if (['白瓷', '黑曜', '钢铁'].includes(cleanRank)) return 'rank-novice';
  if (['青玉', '翠玉', '红玉'].includes(cleanRank)) return 'rank-veteran';
  if (cleanRank === '青铜') return 'rank-bronze';
  if (cleanRank === '白银') return 'rank-silver';
  if (cleanRank === '黄金') return 'rank-gold';
  if (cleanRank === '白金') return 'rank-platinum';
  return '';
};
</script>

<style scoped>
/* 容器布局：左侧书签 + 右侧内容 */
.relation-profile-container {
  display: flex;
  align-items: stretch;
  min-height: 500px;
  width: 100%;
  color: var(--text-main);
  font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif;
}

/* ================= 左侧书签 ================= */
.bookmarks-sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 45px;
  margin-top: 30px;
  z-index: 2;
}

.bookmark-tab {
  writing-mode: vertical-rl;
  text-orientation: upright;
  padding: 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--scroll-border);
  color: var(--text-muted);
  border-radius: 10px 0 0 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: -2px 2px 5px rgba(0,0,0,0.1);
  border: 1px solid rgba(0,0,0,0.05);
  border-right: none;
  letter-spacing: 4px;
  font-weight: bold;
}

.bookmark-tab:hover {
  background-color: var(--accent-gold-hover);
  color: var(--bg-base);
  transform: translateX(-5px);
}

.bookmark-tab.is-active {
  background-color: var(--accent-gold);
  color: var(--bg-base);
  transform: translateX(-2px);
  box-shadow: -4px 4px 8px rgba(0,0,0,0.2);
  width: 50px; /* 激活时稍微突出 */
}

/* ================= 右侧书页内容 ================= */
.page-content {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.4);
  border: 2px solid var(--scroll-border);
  border-radius: 0 12px 12px 12px;
  padding: 30px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.02);
  position: relative;
  z-index: 1;
  margin-left: -2px;
  overflow-y: auto;
}

.dark-mode .page-content {
  background-color: rgba(0, 0, 0, 0.2);
}

.dark-mode .page-content {
  background-color: rgba(255, 255, 255, 0.03);
  box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 1.6rem;
  color: var(--accent-gold);
  border-bottom: 1px dashed var(--scroll-border);
  padding-bottom: 10px;
  margin-top: 0;
  margin-bottom: 20px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.sub-title {
  font-size: 1.1rem;
  color: var(--text-main);
  margin-bottom: 10px;
  border-left: 3px solid var(--accent-gold);
  padding-left: 10px;
}

/* ================= 基础页分栏布局 ================= */
.basic-layout {
  display: flex;
  gap: 25px;
  align-items: flex-start;
}

.basic-info-grid {
  flex: 1;
  align-content: flex-start;
}

/* ================= 通用排版 ================= */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0,0,0,0.03);
  padding: 10px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.05);
}

.dark-mode .info-item { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05); }

.dark-mode .info-item {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
}

.info-item .label { font-size: 0.85rem; color: var(--text-muted); }
.info-item .value { font-size: 1.05rem; font-weight: bold; }
.info-item .value.highlight { color: var(--accent-gold); }

.profile-block { margin-bottom: 25px; }
.desc-text { line-height: 1.6; color: var(--text-main); text-indent: 2em; }
.desc-list { list-style: none; padding: 0; margin: 0; line-height: 1.8; }
.desc-list li { border-bottom: 1px solid rgba(0,0,0,0.05); padding: 4px 0; }

.text-muted { color: var(--text-muted); font-style: italic; }
.mb-4 { margin-bottom: 20px; }
.mt-4 { margin-top: 20px; }

/* ================= 立绘显示 ================= */
.portrait-container {
  flex: 0 0 35%; /* 占据右侧约35%的宽度 */
  max-width: 280px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
  border: 1px dashed var(--scroll-border);
}

.dark-mode .portrait-container {
  background: rgba(255,255,255,0.02);
}

.character-portrait {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* ================= 等级颜色 ================= */
.rank-novice { color: #71797E; font-weight: bold; }
.rank-veteran { color: #00a86b; font-weight: bold; }
.rank-bronze { color: #cd7f32; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.2); }
.rank-silver { color: #c0c0c0; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
.rank-gold { color: #ffd700; font-weight: bold; text-shadow: 1px 1px 3px rgba(0,0,0,0.3); }
.rank-platinum { color: #e5e4e2; font-weight: bold; text-shadow: 0 0 5px rgba(255,255,255,0.8), 1px 1px 2px rgba(0,0,0,0.3); }

.rank-novice { color: #a8b0b7; }
.rank-veteran { color: #2ecc71; }
.rank-bronze { color: #e8a84c; }
.rank-silver { color: #e0e0e0; text-shadow: 0 0 8px rgba(192, 192, 192, 0.5); }
.rank-gold { color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.6); }
.rank-platinum { color: #f5f5f5; text-shadow: 0 0 12px rgba(255, 255, 255, 0.8); }

/* ================= 标签与胶囊 ================= */
.tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
.trait-tag, .skill-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  background: var(--scroll-border);
  color: var(--text-main);
}
.skill-tag { background: transparent; border: 1px solid var(--accent-gold); color: var(--accent-gold); }

/* ================= 属性条 ================= */
.stats-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.stat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; }
.stat-name { width: 60px; color: var(--text-muted); }
.stat-val { width: 30px; text-align: right; font-weight: bold; }

/* ================= 资源与装备 ================= */
.res-row { display: flex; justify-content: space-between; padding: 8px 10px; border-bottom: 1px dashed var(--scroll-border); }
.res-name { color: var(--text-muted); }
.res-val { font-weight: bold; font-family: monospace; font-size: 1.1rem; }

.equip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.equip-item { display: flex; flex-direction: column; padding: 8px; border: 1px solid var(--scroll-border); border-radius: 4px; text-align: center; }
.equip-slot { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
.equip-name { font-weight: bold; color: var(--accent-gold); }

.money-container { display: flex; gap: 15px; font-weight: bold; }
.coin { display: flex; align-items: center; gap: 5px; }
.coin::before { content: '●'; font-size: 1.2rem; }
.coin.gold::before { color: #ffd700; }
.coin.silver::before { color: #c0c0c0; }
.coin.copper::before { color: #b87333; }

/* ================= 动画 ================= */
.page-fade-enter-active, .page-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.page-fade-enter-from, .page-fade-leave-to { opacity: 0; transform: translateY(5px); }

.empty-state { text-align: center; padding: 50px; color: var(--text-muted); font-style: italic; }

/* 响应式 */
@media (max-width: 768px) {
  .relation-profile-container { flex-direction: column; }
  .bookmarks-sidebar { flex-direction: row; width: 100%; margin-top: 0; overflow-x: auto; border-radius: 8px 8px 0 0; }
  .bookmark-tab { writing-mode: horizontal-tb; text-orientation: mixed; padding: 10px 15px; border-radius: 8px 8px 0 0; border-right: 1px solid rgba(0,0,0,0.05); border-bottom: none; }
  .bookmark-tab.is-active { width: auto; transform: translateY(-2px); }
  .page-content { border-radius: 0 0 12px 12px; margin-left: 0; margin-top: -2px; padding: 15px; }
  .stats-container { grid-template-columns: 1fr; }

  /* 移动端立绘布局调整为上下排列 */
  .basic-layout { flex-direction: column-reverse; }
  .portrait-container { flex: 1; max-width: 100%; width: 100%; }
}
</style>
