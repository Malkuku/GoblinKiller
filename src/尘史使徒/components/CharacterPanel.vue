<template>
  <div class="character-panel">
    <h2 class="character-name">{{ characterName }}</h2>

    <!-- Pagination Controls -->
    <div class="pagination-controls">
      <button
        v-for="(page, index) in pages"
        :key="page"
        :class="{ active: currentPageIndex === index }"
        @click="changePage(index)"
      >
        {{ page }}
      </button>
    </div>

    <!-- Paginated Content -->
    <div class="paginated-content">
      <!-- Page: 生命状态 -->
      <div v-if="currentPage === '生命状态' && (isOmniscient || isCurrentUser)" class="data-section">
        <div class="stat-grid-percentage">
          <!-- 生命力 -->
          <div class="progress-bar-block">
            <div class="progress-label-container">
              <span class="label">生命力</span>
              <span class="value">{{ characterData.生命状态.生命力 }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill vitality" :style="{ width: characterData.生命状态.生命力 + '%' }"></div>
            </div>
          </div>
          <!-- 体力 -->
          <div class="progress-bar-block">
            <div class="progress-label-container">
              <span class="label">体力</span>
              <span class="value">{{ characterData.生命状态.体力 }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill stamina" :style="{ width: characterData.生命状态.体力 + '%' }"></div>
            </div>
          </div>
          <!-- 精神力 -->
          <div class="progress-bar-block">
            <div class="progress-label-container">
              <span class="label">精神力</span>
              <span class="value">{{ characterData.生命状态.精神力 }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill mental" :style="{ width: characterData.生命状态.精神力 + '%' }"></div>
            </div>
          </div>
        </div>
        <br>
        <!-- Section: 当前想法 (保持不变) -->
        <div v-if="isOmniscient || isCurrentUser" class="data-section">
          <h3 class="section-title">当前想法</h3>
          <p class="current-thought">"{{ characterData.当前想法 }}"</p>
        </div>
      </div>

      <!-- Page: 特殊状态 -->
      <div v-if="currentPage === '特殊状态'" class="data-section">
        <ul class="status-list">
          <template v-if="Object.keys(characterData.特殊状态).length > 0">
            <template v-for="(status, name) in characterData.特殊状态" :key="name">
              <li v-if="isOmniscient || isCurrentUser || name.toString().includes('魂质')">
                <strong class="status-name" :class="{ 'soul-quality': name.toString().includes('魂质') }">
                  {{ name }}
                  <span v-if="status.不可移除" class="unremovable-tag" title="此状态不可移除">[不可移除]</span>
                </strong>
                <p class="status-description">{{ status.描述 }}</p>
                <p class="status-effect">效果：{{ status.效果 }}</p>
              </li>
            </template>
          </template>
          <li v-else class="empty-state">
            <p>无特殊状态</p>
          </li>
        </ul>
      </div>

      <!-- Page: 术之等级 -->
      <div v-if="currentPage === '术之等级'" class="data-section">
        <div class="arcana-grid">
          <div v-for="(level, name) in characterData.术之等级" :key="name" class="arcana-item">
            <span class="label">{{ name }}</span>
            <span class="value">{{ level.当前等级 }}</span>
            <div v-if="isOmniscient" class="arcana-xp">
              (EXP: {{ level.累计经验值 }} / {{ level.下一级需求经验 }})
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: 人物关系  -->
    <div v-if="currentPage === '人物关系'" class="data-section">
      <h3 class="section-title">人物关系</h3>
      <ul class="relation-list">
        <li v-for="(relation, targetName) in characterData.人物关系" :key="targetName">
          <div class="relation-summary">
            对 <strong class="relation-target">{{ targetName }}</strong>: {{ relation.关系总结 }}
          </div>
          <div v-if="isOmniscient" class="relation-details">
            <div class="detail-group">情感纽带: 信{{ relation.情感纽带.信任度 }} 好{{ relation.情感纽带.好感度 }} 欲{{ relation.情感纽带.情欲 }} 依{{ relation.情感纽带.依赖度 }}</div>
            <div class="detail-group">认知了解: 熟{{ relation.认知与了解.熟悉度 }} 洞{{ relation.认知与了解.洞察度 }} 预{{ relation.认知与了解.可预测度 }}</div>
            <div class="detail-group">社交功利: 影{{ relation.社交与功利链接.影响力 }} 责{{ relation.社交与功利链接.责任义务 }} 利{{ relation.社交与功利链接.利用价值 }}</div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  characterName: { type: String, required: true },
  characterData: { type: Object, required: true },
  isOmniscient: { type: Boolean, default: false },
  isCurrentUser: { type: Boolean, default: false },
});

// --- Pagination Logic ---
const pages = ['生命状态', '特殊状态', '术之等级','人物关系'];
const currentPageIndex = ref(0);
const currentPage = computed(() => pages[currentPageIndex.value]);

function changePage(index) {
  currentPageIndex.value = index;
}

// 初始化时，如果“生命状态”不可见，则默认显示“特殊状态”
onMounted(() => {
  if (!(props.isOmniscient || props.isCurrentUser)) {
    currentPageIndex.value = 1; // '特殊状态' is at index 1
  }
});

</script>

<style scoped>
/* --- 现有样式 (保持不变) --- */
.character-panel {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--shadow-color);
}
.character-panel:hover {
  border-color: var(--accent-primary);
}

.character-name {
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  color: var(--accent-primary);
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.data-section {
  margin-bottom: 1.5rem;
}
.data-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  letter-spacing: 0.05em;
}

.label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}
.value {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--text-primary);
}

.arcana-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}
.arcana-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: var(--bg-primary);
  padding: 0.75rem;
  border-radius: 4px;
}
.arcana-xp {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.status-list, .relation-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.status-list li, .relation-list li {
  background: var(--bg-primary);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  border-left: 3px solid var(--border-color);
}
.status-name { color: var(--accent-primary); }
.soul-quality { color: var(--accent-danger); }
.unremovable-tag { font-size: 0.8rem; color: var(--text-secondary); cursor: help; }
.status-description { font-size: 0.9rem; color: var(--text-primary); margin: 0.5rem 0 0 0; }
.status-effect { font-size: 0.8rem; font-style: italic; color: var(--text-secondary); margin: 0.25rem 0 0 0; }

.relation-summary { font-size: 0.95rem; }
.relation-target { color: var(--accent-primary); }
.relation-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border-color);
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.current-thought {
  font-style: italic;
  color: var(--text-secondary);
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 4px;
  border-left: 3px solid var(--accent-primary);
}

/* --- 新增/修改的样式 --- */

/* Pagination Controls */
.pagination-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.pagination-controls button {
  font-family: 'Cinzel', serif;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  padding: 0.5rem 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 600;
}
.pagination-controls button:hover {
  color: var(--text-primary);
}
.pagination-controls button.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}
.pagination-controls button:disabled {
  color: var(--border-color);
  cursor: not-allowed;
}

/* Paginated Content Area */
.paginated-content {
  min-height: 150px; /* 根据内容调整，防止切换时高度突变 */
}

/* Percentage Bar Styles for Life Status */
.stat-grid-percentage {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
}
.progress-bar-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.progress-label-container {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.progress-bar-block .label {
  font-size: 0.9rem;
}
.progress-bar-block .value {
  font-size: 1rem;
  font-weight: 700;
}
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
}
/* Different colors for different stats */
.progress-bar-fill.vitality { background-color: #4CAF50; } /* 绿色 */
.progress-bar-fill.stamina { background-color: #2196F3; } /* 蓝色 */
.progress-bar-fill.mental { background-color: #9C27B0; } /* 紫色 */

/* Empty state for status list */
.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 1rem;
  border-style: dashed;
}
</style>
