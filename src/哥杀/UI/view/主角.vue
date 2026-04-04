<template>
  <div class="player-profile-module">
    <!-- 侧向书签导航 -->
    <aside class="side-bookmarks">
      <div
        v-for="(tab, index) in tabs"
        :key="index"
        class="bookmark"
        :class="{ active: activeTab === index }"
        @click="activeTab = index"
      >
        <span class="bookmark-icon" v-html="getSVG(tab.icon, { size: 24 })"></span>
        <span class="bookmark-text">{{ tab.name }}</span>
        <div class="bookmark-connector" v-if="activeTab === index"></div>
      </div>
    </aside>

    <!-- 内容展示区 -->
    <section class="profile-content-area">
      <!-- ================= 第1页：基础概览 ================= -->
      <div v-if="activeTab === 0" class="page-content" key="page0">
        <h2 class="page-title"><span v-html="getSVG('decorative', { size: 16 })"></span> 灵魂印记 <span v-html="getSVG('decorative', { size: 16 })"></span></h2>

        <div class="info-grid">
          <div class="info-card">
            <div class="card-label">姓名</div>
            <div class="card-value highlight">{{ player.姓名 }}</div>
          </div>
          <div class="info-card">
            <div class="card-label">种族</div>
            <div class="card-value">{{ player.种族 || '未知' }}</div>
          </div>
          <div class="info-card">
            <div class="card-label">经验等级</div>
            <div class="card-value" :class="getRankClass(player.经验等级)">
              {{ formatRank(player.经验等级) }}
            </div>
          </div>
          <div class="info-card">
            <div class="card-label">所在地</div>
            <div class="card-value">{{ player.所在地 || '漂泊中' }}</div>
          </div>
        </div>

        <div class="section-divider"></div>

        <h3 class="section-title">状态源泉</h3>
        <div class="resource-bars">
          <div class="res-bar-container" v-for="(res, key) in resources" :key="key">
            <div class="res-label">{{ key }}</div>
            <div class="res-track">
              <div class="res-fill" :style="{ width: getPercentage(res) + '%', backgroundColor: res.color }"></div>
              <div class="res-text">{{ res.data.当前值 }} / {{ res.data.最大值 }}</div>
            </div>
          </div>
        </div>

        <div class="section-divider"></div>

        <h3 class="section-title">基础能力</h3>
        <AbilityScoresDisplay :abilities="player.能力" mode="radar" />
      </div>

      <!-- ================= 第2页：能力相关 ================= -->
      <div v-if="activeTab === 1" class="page-content" key="page1">
        <h2 class="page-title"><span v-html="getSVG('decorative', { size: 16 })"></span> 力量具象 <span v-html="getSVG('decorative', { size: 16 })"></span></h2>

        <div class="two-col-layout">
          <!-- 左列：职业与历练 -->
          <div class="col-left">
            <h3 class="section-title">职业道途</h3>
            <div class="class-progress-list">
              <div v-for="(val, key) in player.职业" :key="key" class="class-item">
                <div class="class-header">
                  <span class="class-name">{{ key }}</span>
                  <span class="class-level">Lv.{{ val.当前等级 }} / {{ val.最大等级 }}</span>
                </div>
                <div class="class-exp-bar">
                  <div class="exp-fill" :style="{ width: getExpPercentage(val) + '%' }"></div>
                  <span class="exp-text">{{ val.当前经验 }} / {{ val.升级所需 }}</span>
                </div>
              </div>
            </div>

            <h3 class="section-title mt-4">历练进度</h3>
            <div class="progress-grid">
              <div class="prog-item" v-for="(val, key) in player.历练进度" :key="key">
                <div class="prog-header">
                  <span>{{ key }}</span>
                  <span>{{ val }}%</span>
                </div>
                <div class="prog-track">
                  <div class="prog-fill" :style="{ width: val + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右列：装备与技能 -->
          <div class="col-right">
            <h3 class="section-title">武装配备</h3>
            <div class="equip-slots">
              <div class="equip-slot" v-for="(items, type) in player.装备" :key="type">
                <div class="slot-type">{{ type }}</div>
                <div class="slot-item" v-for="(item, itemName) in items" :key="itemName">
                  {{ itemName }} <span v-if="item !== '待初始化'" class="tier-tag">{{ item.tier }}</span>
                </div>
                <div class="slot-empty" v-if="Object.keys(items).length === 0">空无一物</div>
              </div>
            </div>

            <h3 class="section-title mt-4">掌握技能 <span class="sub-text">(点数: {{ player.技能点 }})</span></h3>
            <SkillList />
          </div>
        </div>
      </div>

      <!-- ================= 第3页：资源相关 ================= -->
      <div v-if="activeTab === 2" class="page-content" key="page2">
        <h2 class="page-title"><span v-html="getSVG('decorative', { size: 16 })"></span> 物质沉淀 <span v-html="getSVG('decorative', { size: 16 })"></span></h2>

        <!-- 财富 -->
        <div class="wealth-container">
          <div class="coin gold"><span v-html="getSVG('coin', { size: 20, color: '#d4af37' })"></span> {{ player.背包.金钱.金币 }} 金</div>
          <div class="coin silver"><span v-html="getSVG('coin', { size: 20, color: '#c0c0c0' })"></span> {{ player.背包.金钱.银币 }} 银</div>
          <div class="coin copper"><span v-html="getSVG('coin', { size: 20, color: '#cd7f32' })"></span> {{ player.背包.金钱.铜币 }} 铜</div>
        </div>

        <div class="two-col-layout mt-4">
          <div class="col-left">
            <h3 class="section-title">行囊背包</h3>
            <div class="inventory-accordion">
              <template v-for="(category, catName) in player.背包" :key="catName">
                <div class="inv-category" v-if="catName !== '金钱'">
                  <div class="cat-header">{{ catName }} ({{ Object.keys(category).length }})</div>
                  <div class="cat-body">
                    <div class="inv-item" v-for="(item, itemName) in category" :key="itemName">
                      <span class="item-name">{{ itemName }}</span>
                      <span class="item-qty" v-if="item.quantity">x{{ item.quantity }}</span>
                    </div>
                    <div class="empty-text" v-if="Object.keys(category).length === 0">空</div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div class="col-right">
            <h3 class="section-title">固定资产</h3>
            <ul class="list-container">
              <li v-for="(val, key) in player.资产" :key="key" class="list-item">
                <span class="item-name">{{ key }}</span>
                <span class="item-desc">{{ val }}</span>
              </li>
              <li v-if="Object.keys(player.资产).length === 0" class="empty-text">暂无资产</li>
            </ul>

            <h3 class="section-title mt-4">资源快照</h3>
            <ul class="list-container snapshot-list">
              <li v-for="(val, key) in player.资源快照" :key="key" class="list-item">
                <span class="item-name">{{ key }}</span>
                <span class="item-desc">{{ typeof val === 'string' ? val : val.效果 }}</span>
              </li>
              <li v-if="Object.keys(player.资源快照).length === 0" class="empty-text">无特殊状态</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ================= 第4页：驱动相关 ================= -->
      <div v-if="activeTab === 3" class="page-content" key="page3">
        <h2 class="page-title"><span v-html="getSVG('decorative', { size: 16 })"></span> 命运轨迹 <span v-html="getSVG('decorative', { size: 16 })"></span></h2>

        <h3 class="section-title">公会铭牌</h3>
        <div class="guild-card">
          <div class="guild-emblem" v-html="getSVG('shield', { size: 48 })"></div>
          <div class="guild-info">
            <div class="g-name">{{ player.公会信息.所属公会 || '无所属' }}</div>
            <div class="g-rank">阶级:
              <span :class="getRankClass(player.公会信息.公会阶级)">
                  {{ formatRank(player.公会信息.公会阶级) || '平民' }}
                </span>
            </div>
            <div class="g-contrib">贡献度: {{ player.公会信息.贡献度 || 0 }}</div>
          </div>
        </div>

        <div class="section-divider"></div>

        <h3 class="section-title">任务日志</h3>
        <div class="quest-container">
          <div class="quest-col">
            <h4 class="quest-status-title active-quests">进行中</h4>
            <div class="quest-card" v-for="(val, key) in player.任务日志.进行中" :key="key">
              <div class="q-header" @click="toggleQuest('进行中', key)">
                <span class="q-type-tag" v-if="val.类型">{{ val.类型 }}</span>
                <div class="q-title">{{ key }}</div>
                <div class="q-spacer"></div>
                <button class="delete-btn" @click.stop="deleteQuest('进行中', key)" title="删除任务">✖</button>
                <span class="expand-icon" :class="{ expanded: isQuestExpanded('进行中', key) }">▼</span>
              </div>
              <div class="q-details" v-show="isQuestExpanded('进行中', key)" v-if="val.当前目标 || val.进度说明 || val.奖励预览">
                <div class="q-detail-item" v-if="val.当前目标">
                  <span class="q-detail-label">当前目标</span>
                  <span class="q-detail-value">{{ val.当前目标 }}</span>
                </div>
                <div class="q-detail-item" v-if="val.进度说明">
                  <span class="q-detail-label">进度说明</span>
                  <span class="q-detail-value">{{ val.进度说明 }}</span>
                </div>
                <div class="q-detail-item" v-if="val.奖励预览">
                  <span class="q-detail-label">奖励预览</span>
                  <span class="q-detail-value reward">{{ val.奖励预览 }}</span>
                </div>
              </div>
            </div>
            <div class="empty-text" v-if="Object.keys(player.任务日志.进行中).length === 0">暂无进行中的任务</div>
          </div>

          <div class="quest-col">
            <h4 class="quest-status-title completed-quests">已完成</h4>
            <div class="quest-card completed" v-for="(val, key) in player.任务日志.已完成" :key="key">
              <div class="q-header" @click="toggleQuest('已完成', key)">
                <div class="q-title">{{ key }}</div>
                <div class="q-spacer"></div>
                <button class="delete-btn" @click.stop="deleteQuest('已完成', key)" title="删除任务">✖</button>
                <span class="expand-icon" :class="{ expanded: isQuestExpanded('已完成', key) }">▼</span>
              </div>
              <div class="q-details" v-show="isQuestExpanded('已完成', key)" v-if="val.完成评价 || val.获得奖励">
                <div class="q-detail-item" v-if="val.完成评价">
                  <span class="q-detail-label">完成评价</span>
                  <span class="q-detail-value rating">{{ val.完成评价 }}</span>
                </div>
                <div class="q-detail-item" v-if="val.获得奖励">
                  <span class="q-detail-label">获得奖励</span>
                  <span class="q-detail-value reward">{{ val.获得奖励 }}</span>
                </div>
              </div>
            </div>
            <div class="empty-text" v-if="Object.keys(player.任务日志.已完成).length === 0">暂无已完成的任务</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { MvuUtil } from '@/Utils/MvuUtil';
import SkillList from '@/哥杀/UI/components/item/SkillList.vue';
import AbilityScoresDisplay from '@/哥杀/UI/components/role/AbilityScoresDisplay.vue';
import { getSVG } from '@/哥杀/UI/composables/icon/icon';
import { useStatStore } from '@/哥杀/UI/store/StatStore';
import { computed, ref } from 'vue';

const tabs = [
  { name: '概览', icon: 'user' },
  { name: '能力', icon: 'swords' },
  { name: '资源', icon: 'nav_bag' },
  { name: '驱动', icon: 'scroll' }
];

const activeTab = ref(0);

const statStore = useStatStore();

const player = computed(() => statStore.stat_data.主角);

// 资源条配置
const resources = computed(() => ({
  "生命": { data: player.value.生命值, color: '#b33939' },
  "魔力": { data: player.value.魔力值, color: '#3b5998' },
  "体力": { data: player.value.体力值, color: '#218c74' },
  "护甲": { data: player.value.护甲值, color: '#84817a' },
  "信仰": { data: player.value.信仰力值, color: '#ccae62' }
}));

const getPercentage = (res) => {
  if (!res.data.最大值) return 0;
  return Math.min(100, Math.max(0, (res.data.当前值 / res.data.最大值) * 100));
};

const getExpPercentage = (classData) => {
  if (!classData.升级所需) return 0;
  return Math.min(100, Math.max(0, (classData.当前经验 / classData.升级所需) * 100));
};

// 辅助函数：格式化等级（去掉 lv 前缀）
const formatRank = (rank) => {
  if (!rank) return '未知';
  return String(rank).replace(/^lv\s*/i, '');
};

// 辅助函数：获取等级对应的颜色类名
const getRankClass = (rank) => {
  const cleanRank = formatRank(rank);
  if (['白瓷', '黑曜', '钢铁'].includes(cleanRank)) return 'rank-novice';
  if (['青玉', '翠玉', '红玉'].includes(cleanRank)) return 'rank-veteran';
  if (cleanRank === '青铜') return 'rank-bronze';
  if (cleanRank === '白银') return 'rank-silver';
  if (cleanRank === '黄金') return 'rank-gold';
  if (cleanRank === '白金') return 'rank-platinum';
  return '';
};

// 任务折叠与删除逻辑
const expandedQuests = ref({});

const isQuestExpanded = (status, key) => {
  return !!expandedQuests.value[`${status}-${key}`];
};

const toggleQuest = (status, key) => {
  const id = `${status}-${key}`;
  expandedQuests.value[id] = !expandedQuests.value[id];
};

const deleteQuest = (status, key) => {
  if (!confirm(`确定要删除任务「${key}」吗？`)) return;

  const diff = {
    主角: {
      任务日志: {
        [status]: {
          [key]: null
        }
      }
    }
  };
  MvuUtil.updateMvuDataByDiff(diff);
};
</script>

<style scoped>
/* ==========================================
   布局与侧向书签
========================================== */
.player-profile-module {
  display: flex;
  min-height: 600px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--scroll-border);
  border-radius: 8px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
}

.side-bookmarks {
  width: 100px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px 0;
  border-right: 2px solid var(--scroll-border);
  background: rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
}

.bookmark {
  position: relative;
  padding: 15px 10px;
  text-align: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.3s ease;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
}

.bookmark:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.3);
}
.dark-mode .bookmark:hover {
  background: rgba(255, 255, 255, 0.08);
}

.bookmark.active {
  color: var(--accent-gold);
  background: var(--scroll-paper);
  border-top: 1px solid var(--scroll-border);
  border-bottom: 1px solid var(--scroll-border);
  font-weight: bold;
  box-shadow: -3px 0 10px rgba(0,0,0,0.02);
}

.bookmark-icon {
  display: block;
  font-size: 1.5rem;
  margin-bottom: 5px;
}

.bookmark-text {
  font-size: 0.9rem;
  letter-spacing: 2px;
  writing-mode: vertical-rl;
  margin: 0 auto;
}

/* 遮盖右侧边框，形成连通纸张的视觉效果 */
.bookmark-connector {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--scroll-paper);
}

.profile-content-area {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
  position: relative;
}

/* ==========================================
   通用排版与组件
========================================== */
.page-title {
  text-align: center;
  color: var(--accent-gold);
  font-size: 1.8rem;
  margin-bottom: 30px;
  letter-spacing: 4px;
  border-bottom: 1px dashed var(--scroll-border);
  padding-bottom: 15px;
}
.page-title span { opacity: 0.5; font-size: 1.2rem; }

.section-title {
  font-size: 1.2rem;
  color: var(--text-main);
  border-left: 4px solid var(--accent-gold);
  padding-left: 10px;
  margin-bottom: 15px;
}

.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--scroll-border), transparent);
  margin: 30px 0;
}

.mt-4 { margin-top: 30px; }
.sub-text { font-size: 0.8rem; color: var(--text-muted); font-weight: normal; }
.empty-text { color: var(--text-muted); font-style: italic; font-size: 0.9rem; }

.two-col-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

/* ==========================================
   第1页：概览样式
========================================== */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}
.info-card {
  background: rgba(255,255,255,0.4);
  border: 1px solid var(--scroll-border);
  padding: 15px;
  border-radius: 6px;
  text-align: center;
}
.dark-mode .info-card {
  background: rgba(255, 255, 255, 0.05);
}
.card-label { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px; }
.card-value { font-size: 1.1rem; font-weight: bold; }
.card-value.highlight { color: var(--accent-gold); font-size: 1.3rem; }

/* 等级颜色 */
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

.resource-bars { display: flex; flex-direction: column; gap: 12px; }
.res-bar-container { display: flex; align-items: center; gap: 15px; }
.res-label { width: 40px; font-weight: bold; font-size: 0.9rem; }
.res-track {
  flex: 1; height: 18px; background: rgba(0,0,0,0.1);
  border-radius: 9px; position: relative; overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
}
.res-fill { height: 100%; transition: width 0.5s ease; }
.res-text {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; color: #fff; text-shadow: 0 0 2px #000; font-weight: bold;
}

/* ==========================================
   第2页：能力样式
========================================== */
.class-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-item {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid var(--scroll-border);
  border-radius: 6px;
  padding: 12px;
}
.dark-mode .class-item {
  background: rgba(255, 255, 255, 0.05);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.class-name {
  font-weight: bold;
  font-size: 1rem;
  color: var(--text-main);
}

.class-level {
  color: var(--accent-gold);
  font-weight: bold;
  font-size: 0.9rem;
}

.class-exp-bar {
  height: 16px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-gold), #e6c200);
  transition: width 0.5s ease;
}

.exp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #fff;
  text-shadow: 0 0 2px #000;
  font-weight: bold;
}

.list-container { list-style: none; padding: 0; margin: 0; }
.list-item {
  display: flex; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px dashed rgba(0,0,0,0.1);
}
.item-name { font-weight: bold; }
.item-desc { color: var(--accent-gold); }

.progress-grid { display: flex; flex-direction: column; gap: 10px; }
.prog-item { font-size: 0.85rem; }
.prog-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.prog-track { height: 6px; background: rgba(0,0,0,0.1); border-radius: 3px; overflow: hidden; }
.prog-fill { height: 100%; background: var(--accent-gold); }

.equip-slots { display: flex; flex-direction: column; gap: 10px; }
.equip-slot {
  border: 1px solid var(--scroll-border); border-radius: 4px; padding: 10px;
  background: rgba(255,255,255,0.2);
}
.dark-mode .equip-slot {
  background: rgba(255, 255, 255, 0.03);
}
.slot-type { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px; }
.slot-item { font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
.tier-tag { font-size: 0.7rem; background: var(--accent-gold); color: var(--bg-base); padding: 2px 6px; border-radius: 10px; }

.tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag {
  padding: 5px 12px; background: var(--flag-bg); color: var(--flag-text);
  border-radius: 15px; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* ==========================================
   第3页：资源样式
========================================== */
.wealth-container {
  display: flex; justify-content: center; gap: 30px;
  background: rgba(0,0,0,0.03); padding: 15px; border-radius: 8px; border: 1px solid var(--scroll-border);
}
.coin { font-size: 1.2rem; font-weight: bold; display: flex; align-items: center; gap: 5px; }
.coin.gold { color: #d4af37; }
.coin.silver { color: #c0c0c0; }
.coin.copper { color: #cd7f32; }

.inventory-accordion { display: flex; flex-direction: column; gap: 10px; }
.inv-category { border: 1px solid var(--scroll-border); border-radius: 4px; }
.cat-header { background: rgba(0,0,0,0.05); padding: 8px 12px; font-weight: bold; font-size: 0.9rem; }
.cat-body { padding: 10px; display: flex; flex-direction: column; gap: 5px; }
.inv-item { display: flex; justify-content: space-between; font-size: 0.9rem; }
.item-qty { color: var(--text-muted); }

/* ==========================================
   第4页：驱动样式
========================================== */
.guild-card {
  display: flex; align-items: center; gap: 20px;
  background: linear-gradient(135deg, rgba(198, 166, 100, 0.1), transparent);
  border: 1px solid var(--accent-gold); padding: 20px; border-radius: 8px;
}
.guild-emblem { font-size: 3rem; }
.g-name { font-size: 1.4rem; font-weight: bold; color: var(--accent-gold); margin-bottom: 5px; }
.g-rank span { color: var(--flag-bg); font-weight: bold; }

.quest-container { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
.quest-status-title { text-align: center; padding-bottom: 10px; border-bottom: 2px solid; margin-bottom: 15px; }
.active-quests { color: #b33939; border-color: #b33939; }
.completed-quests { color: #218c74; border-color: #218c74; }
.dark-mode .active-quests { color: #e74c3c; border-color: #e74c3c; }
.dark-mode .completed-quests { color: #2ecc71; border-color: #2ecc71; }

.quest-card {
  background: rgba(255,255,255,0.5); border: 1px solid var(--scroll-border);
  padding: 12px; border-radius: 6px; margin-bottom: 10px;
  border-left: 4px solid #b33939;
}
.dark-mode .quest-card {
  background: rgba(255, 255, 255, 0.05);
}
.quest-card.completed { border-left-color: #218c74; opacity: 0.85; }
.dark-mode .quest-card.completed { border-left-color: #2ecc71; }
.q-header { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.q-spacer { flex: 1; }
.delete-btn {
  background: none; border: none; color: var(--text-muted); cursor: pointer;
  padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.delete-btn:hover { color: #b33939; background: rgba(179, 57, 57, 0.1); }
.expand-icon {
  font-size: 0.7rem; color: var(--text-muted); transition: transform 0.3s ease;
}
.expand-icon.expanded { transform: rotate(180deg); }
.q-type-tag {
  background: #b33939;
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}
.q-title { font-weight: bold; }
.q-details { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.1); }
.q-detail-item { display: flex; flex-direction: column; gap: 2px; }
.q-detail-label { font-size: 0.75rem; color: var(--text-muted); }
.q-detail-value { font-size: 0.85rem; color: var(--text-main); }
.q-detail-value.reward { color: var(--accent-gold); font-weight: 500; }
.q-detail-value.rating { color: #218c74; font-weight: bold; }

/* ==========================================
   动画与响应式
========================================== */
.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }

@media (max-width: 768px) {
  .player-profile-module { flex-direction: column; }
  .side-bookmarks {
    width: 100%; flex-direction: row; padding: 0;
    border-right: none; border-bottom: 2px solid var(--scroll-border);
    overflow-x: auto;
  }
  .bookmark {
    flex: 1; padding: 10px; border-radius: 8px 8px 0 0;
    border-top: 1px solid transparent; border-bottom: none;
  }
  .bookmark.active {
    border-top: 2px solid var(--accent-gold); border-bottom: none;
    box-shadow: 0 -3px 10px rgba(0,0,0,0.02);
  }
  .bookmark-text { writing-mode: horizontal-tb; margin-top: 5px; }
  .bookmark-connector {
    top: auto; bottom: -2px; left: 0; right: 0; width: 100%; height: 4px;
  }
  .two-col-layout, .quest-container { grid-template-columns: 1fr; gap: 20px; }
  .profile-content-area { padding: 20px; }
}
</style>
