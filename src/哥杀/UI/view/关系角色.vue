<template>
  <div class="relations-layout">
    <header class="view-header">
      <h1 class="view-title">羁绊之卷</h1>
      <p class="view-subtitle">命运交织的丝线，记录着旅途中遇见的灵魂。</p>
    </header>

    <div v-if="hasCharacters" class="relations-content">
      <!-- 左侧：角色名册列表 -->
      <aside class="character-roster">
        <div
          v-for="(char, id) in validCharacters"
          :key="id"
          class="roster-item"
          :class="{ 'is-selected': selectedCharacterId === id }"
          @click="selectCharacter(id)"
        >
          <div class="roster-info">
            <div class="roster-name">{{ char['姓名'] }}</div>
            <div class="roster-relation">{{ char['与主角关系'] || '萍水相逢' }}</div>
          </div>
          <!-- 公会等级指示器 -->
          <div class="roster-tier" v-if="char['公会信息'] && char['公会信息']['公会阶级']">
            <span :class="getRankClass(char['公会信息']['公会阶级'])">
              {{ formatRank(char['公会信息']['公会阶级']) }}
            </span>
          </div>
        </div>
      </aside>

      <!-- 右侧：角色详细档案 -->
      <main class="character-detail-area">
        <transition name="fade-slide" mode="out-in">
          <RelationCharacterProfile
            v-if="selectedCharacterId"
            :key="selectedCharacterId"
            :characterId="selectedCharacterId"
          />
          <div v-else class="empty-selection">
            <div class="empty-icon" v-html="getSVG('decorative', { size: 48 })"></div>
            <p>请从左侧名册中选择一位角色，<br>以翻阅其命运的档案。</p>
          </div>
        </transition>
      </main>
    </div>

    <!-- 空数据状态 -->
    <div class="no-data-state" v-else>
      <p>旅途才刚刚开始，尚未结识任何羁绊...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStatStore } from '@/哥杀/UI/store/StatStore';
import { getSVG } from '@/哥杀/UI/composables/icon/icon';
import RelationCharacterProfile from '../components/role/RelationCharacterProfile.vue';

const statStore = useStatStore();

// 当前选中的角色 ID（键名）
const selectedCharacterId = ref<string | null>(null);

// 计算属性：过滤出有效的角色（排除 '待初始化' 和 '屏蔽' 为 true 的角色）
const validCharacters = computed(() => {
  const rawList = statStore.stat_data?.['关系列表'];
  if (!rawList) return {};

  const filtered: Record<string, any> = {};
  for (const [key, val] of Object.entries(rawList)) {
    if (val !== '待初始化' && typeof val === 'object' && !val['屏蔽']) {
      filtered[key] = val;
    }
  }
  return filtered;
});

// 是否有有效角色
const hasCharacters = computed(() => Object.keys(validCharacters.value).length > 0);

// 选择角色
const selectCharacter = (id: string | number) => {
  selectedCharacterId.value = String(id);
};

// 辅助函数：格式化等级（去掉 lv 前缀）
const formatRank = (rank: string) => {
  if (!rank) return '未知';
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

// 如果列表加载完毕且当前未选择角色，自动选中第一个
watch(validCharacters, (newVal) => {
  const keys = Object.keys(newVal);
  if (keys.length > 0 && !selectedCharacterId.value) {
    selectedCharacterId.value = keys[0];
  }
}, { immediate: true });
</script>

<style scoped>
.relations-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-main);
}

.view-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--scroll-border);
}

.view-title {
  font-size: 2rem;
  color: var(--accent-gold);
  margin: 0 0 5px 0;
  letter-spacing: 4px;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.1);
}

.view-subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
  font-style: italic;
}

.relations-content {
  display: flex;
  flex: 1;
  gap: 20px;
  overflow: hidden; /* 确保内部区域可以独立滚动 */
}

/* ================= 左侧名册列表 ================= */
.character-roster {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 10px;
  /* 自定义滚动条 */
  scrollbar-width: thin;
  scrollbar-color: var(--accent-gold) transparent;
}

.character-roster::-webkit-scrollbar { width: 4px; }
.character-roster::-webkit-scrollbar-thumb { background: var(--accent-gold); border-radius: 2px; }

.roster-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid var(--scroll-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.dark-mode .roster-item {
  background: rgba(255, 255, 255, 0.03);
}

.roster-item:hover {
  border-color: var(--accent-gold);
  background: rgba(198, 166, 100, 0.1);
  transform: translateX(4px);
}

.roster-item.is-selected {
  background: var(--flag-bg);
  border-color: var(--flag-bg);
  color: var(--flag-text);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.roster-item.is-selected .roster-relation {
  color: rgba(255, 255, 255, 0.7);
}

.roster-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.roster-name {
  font-weight: bold;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.roster-relation {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* ================= 等级与颜色 ================= */
.roster-tier {
  font-size: 0.9rem;
  background: rgba(0,0,0,0.05);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.05);
  flex-shrink: 0;
  margin-left: 10px;
}
.dark-mode .roster-tier { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.05); }
.roster-item.is-selected .roster-tier { background: rgba(0,0,0,0.2); border-color: transparent; }

.rank-novice { color: #71797E; font-weight: bold; }
.rank-veteran { color: #00a86b; font-weight: bold; }
.rank-bronze { color: #cd7f32; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.2); }
.rank-silver { color: #c0c0c0; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
.rank-gold { color: #ffd700; font-weight: bold; text-shadow: 1px 1px 3px rgba(0,0,0,0.3); }
.rank-platinum { color: #e5e4e2; font-weight: bold; text-shadow: 0 0 5px rgba(255,255,255,0.8), 1px 1px 2px rgba(0,0,0,0.3); }

/* ================= 右侧详情区域 ================= */
.character-detail-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-selection, .no-data-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  border: 2px dashed var(--scroll-border);
  border-radius: 12px;
  background: rgba(0,0,0,0.02);
}

.empty-icon {
  font-size: 3rem;
  color: var(--accent-gold);
  margin-bottom: 15px;
  opacity: 0.5;
}

/* ================= 动画 ================= */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }

/* ================= 响应式 (移动端) ================= */
@media (max-width: 768px) {
  .relations-content {
    flex-direction: column;
    overflow: visible;
  }

  .character-roster {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding-right: 0;
    padding-bottom: 10px;
    gap: 12px;
  }

  .roster-item {
    flex-direction: column;
    min-width: 130px;
    text-align: center;
    padding: 12px;
    justify-content: center;
  }

  .roster-item:hover { transform: translateY(-4px); }

  .roster-info {
    align-items: center;
    margin-bottom: 8px;
  }

  .roster-tier {
    margin-left: 0;
    font-size: 0.8rem;
    padding: 2px 8px;
  }

  .character-detail-area {
    overflow: visible;
  }
}
</style>
