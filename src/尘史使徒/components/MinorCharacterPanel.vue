<template>
  <div class="minor-character-panel">
    <h2 class="character-name">{{ characterName }}</h2>

    <!-- Section: 简介 -->
    <div v-if="characterData.简介" class="data-section introduction-section">
      <p class="character-introduction">{{ characterData.简介 }}</p>
    </div>

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
      <div v-if="currentPage === '生命状态'" class="data-section">
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
      </div>

      <!-- Page: 特殊状态 -->
      <div v-if="currentPage === '特殊状态'" class="data-section">
        <ul class="status-list">
          <template v-for="(status, name) in characterData.特殊状态" :key="name">
            <li>
              <strong 
                :class="{
                  'status-name': true,
                  'status-soul-quality': name.toString().includes('魂质'),
                  'status-pact': name.toString().includes('印记') || name.toString().includes('契约'),
                  'status-blessing': name.toString().includes('祝福'),
                  'status-curse': name.toString().includes('诅咒') || name.toString().includes('侵染'),
                  'status-injury': name.toString().includes('伤病')
                }"
              >
                {{ name }}
                <span v-if="status.不可移除" class="unremovable-tag" title="此状态不可移除">[不可移除]</span>
              </strong>
              <p class="status-description">{{ status.描述 }}</p>
              <p class="status-effect">效果：{{ status.效果 }}</p>
            </li>
          </template>
        </ul>
      </div>

      <!-- Page: 术之等级 -->
      <div v-if="currentPage === '术之等级'" class="data-section">
        <div v-if="Object.keys(characterData.术之等级).length > 0" class="arcana-grid">
          <div v-for="(level, name) in characterData.术之等级" :key="name" class="arcana-item">
            <span class="label">{{ name }}</span>
            <span class="value">{{ level.当前等级 }}</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>无术之等级信息</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

defineProps({
  characterName: { type: String, required: true },
  characterData: { type: Object, required: true },
});

// --- Pagination Logic ---
const pages = ['生命状态', '特殊状态', '术之等级'];
const currentPageIndex = ref(0);
const currentPage = computed(() => pages[currentPageIndex.value]);

function changePage(index) {
  currentPageIndex.value = index;
}
</script>

<style scoped>
/* 样式与 CharacterPanel.vue 保持高度一致，以确保视觉统一 */
.minor-character-panel {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.character-name {
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  color: var(--accent-primary);
  margin: 0 0 1rem 0; /* Reduced margin */
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

/* --- 新增简介样式 --- */
.introduction-section {
  margin-bottom: 1.5rem;
}
.character-introduction {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}


.data-section { margin-bottom: 1.5rem; }
.data-section:last-child { margin-bottom: 0; }

.section-title {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.label { font-size: 0.85rem; color: var(--text-secondary); }
.value { font-size: 1.2rem; font-weight: 500; color: var(--text-primary); }

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

.status-list { list-style: none; padding: 0; margin: 0; }
.status-list li {
  background: var(--bg-primary);
  padding: 0.75rem 1rem;
  border-radius: 4px;
}
.status-name { color: var(--accent-primary); }

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
.progress-bar-fill.vitality { background-color: #4CAF50; } /* 绿色 */
.progress-bar-fill.stamina { background-color: #2196F3; } /* 蓝色 */
.progress-bar-fill.mental { background-color: #9C27B0; } /* 紫色 */

/* Empty state for status list */
.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 1rem;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
}

/* [ADDED] Special Status Effects */
@keyframes streaming-light {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 魂质 - 蓝色流光 */
.status-soul-quality {
  color: #0096FF;
  border-left-color: #0096FF;
  background-image: linear-gradient(90deg, transparent, rgba(0, 150, 255, 0.3), transparent);
  background-size: 200% 100%;
  background-position: 0 0;
  animation: streaming-light 4s ease-in-out infinite;
}

/* 印记, 契约 - 金色流光 */
.status-pact {
  color: #FFD700;
  border-left-color: #FFD700;
  background-image: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent);
  background-size: 200% 100%;
  background-position: 0 0;
  animation: streaming-light 3.5s linear infinite;
}

/* 祝福 - 绿色 */
.status-blessing {
  color: #4CAF50;
  border-left-color: #4CAF50;
  background-image: linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.25), transparent);
  background-size: 200% 100%;
  background-position: 0 0;
  animation: streaming-light 6s ease-in-out infinite;
}

/* 诅咒, 侵染 - 黑紫色 */
.status-curse {
  color: #673AB7;
  border-left-color: #673AB7;
  background-image: linear-gradient(90deg, transparent, rgba(103, 58, 183, 0.35), transparent);
  background-size: 200% 100%;
  background-position: 0 0;
  animation: streaming-light 5s ease-in infinite;
}

/* 伤病 - 深绿色 */
.status-injury {
  color: #144a16;
  border-left-color: #144a16;
  background-image: linear-gradient(90deg, transparent, rgba(46, 125, 50, 0.3), transparent);
  background-size: 200% 100%;
  background-position: 0 0;
  animation: streaming-light 4.5s linear infinite;
}
</style>
