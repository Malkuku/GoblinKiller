<template>
  <div class="summary-view">
    <header class="summary-header">
      <div class="header-top">
        <h1 class="page-title">忆库 <span class="subtitle">CHRONICLES</span></h1>
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input v-model="searchQuery" type="text" placeholder="搜索事件名或概括内容..." />
        </div>
      </div>
      <div class="header-line"></div>
    </header>

    <nav class="summary-actions">
      <transition name="fade">
        <button
          v-if="isEditMode && (selectedOverviews.size > 0 || selectedEvents.size > 0)"
          class="batch-delete-btn"
          @click="handleBatchDelete"
        >
          <span class="icon">🗑</span>
          <span class="text">批量删除 ({{ selectedOverviews.size + selectedEvents.size }})</span>
        </button>
      </transition>
      <transition name="fade">
        <button
          v-if="hasData"
          class="edit-mode-btn"
          :class="{ 'is-editing': isEditMode }"
          @click="toggleEditMode"
        >
          <span class="icon">{{ isEditMode ? '✓' : '✎' }}</span>
          <span class="text">{{ isEditMode ? '完成' : '编辑' }}</span>
        </button>
      </transition>
    </nav>

    <div class="summary-content">
      <div v-if="filteredList.length === 0" class="empty-state">暂无记录</div>

      <div class="chronicle-list">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="chronicle-card"
        >
          <!-- 概括部分 -->
          <div class="overview-section" :class="{ 'shake-anim': isEditMode, 'is-editing': editingItem === item.id }">
            <transition name="scale-in">
              <!-- 批量删除复选框 -->
              <div v-if="isEditMode && editingItem !== item.id" class="checkbox-wrapper" @click.stop="toggleSelectOverview(item.id)">
                <input type="checkbox" :checked="selectedOverviews.has(item.id)" @click.stop="toggleSelectOverview(item.id)" />
              </div>
            </transition>

            <div class="card-header">
              <div class="header-row">
                <h3 class="card-id">{{ item.id }}</h3>
                <div class="importance-badge" :class="getImportanceClass(item.重要度)">
                  {{ getImportanceLabel(item.重要度) }}
                </div>
              </div>
              <div class="time-range">
                <span class="icon">◷</span>
                <span class="text">{{ item.时间范围 || '暂无时间范围' }}</span>
              </div>
            </div>

            <div class="card-body">
              <div class="tag-row" v-if="item.标签">
                <span class="tag">{{ item.标签 }}</span>
              </div>
              <p class="summary-text">{{ item.概括 || '暂无概括内容' }}</p>
            </div>

            <!-- 展开/收起详情按钮 -->
            <div class="expand-toggle" v-if="item.events && item.events.length > 0" @click.stop="toggleExpand(item.id)">
              {{ expandedItems.has(item.id) ? '▲ 收起详情' : `▼ 展开详情 (${item.events.length})` }}
            </div>

            <transition name="slide-down">
              <div v-if="editingItem === item.id" class="edit-panel">
                <div class="edit-field">
                  <label>时间范围</label>
                  <input v-model="editForm.时间范围" type="text" />
                </div>
                <div class="edit-field">
                  <label>标签</label>
                  <input v-model="editForm.标签" type="text" />
                </div>
                <div class="edit-field">
                  <label>概括</label>
                  <textarea v-model="editForm.概括" rows="2"></textarea>
                </div>
                <div class="edit-field">
                  <label>重要度 (0-1)</label>
                  <input v-model.number="editForm.重要度" type="number" min="0" max="1" step="0.1" />
                </div>
                <div class="edit-actions">
                  <button class="btn-cancel" @click="cancelEdit">取消</button>
                  <button class="btn-save" @click="saveOverviewEdit(item.id)">保存</button>
                </div>
              </div>
            </transition>

            <div v-if="isEditMode && editingItem !== item.id" class="card-edit-overlay" @click="startEditOverview(item)">
              <span class="edit-hint">点击编辑概括</span>
            </div>
          </div>

          <!-- 详情部分 (默认收起) -->
          <transition name="slide-down">
            <div class="details-section" v-if="item.events && item.events.length > 0 && expandedItems.has(item.id)">
              <h4 class="details-title">详细事件</h4>
              <div class="events-container">
                <div
                  v-for="event in item.events"
                  :key="event.name"
                  class="event-card"
                  :class="{ 'shake-anim': isEditMode, 'is-editing': editingEvent?.sectionId === item.id && editingEvent?.eventName === event.name }"
                >
                  <transition name="scale-in">
                    <!-- 事件批量删除复选框 -->
                    <div v-if="isEditMode && !(editingEvent?.sectionId === item.id && editingEvent?.eventName === event.name)" class="checkbox-wrapper" @click.stop="toggleSelectEvent(item.id, event.name)">
                      <input type="checkbox" :checked="selectedEvents.has(`${item.id}|${event.name}`)" @click.stop="toggleSelectEvent(item.id, event.name)" />
                    </div>
                  </transition>

                  <div class="event-header">
                    <h5 class="event-name">{{ event.name }}</h5>
                    <div class="event-meta">
                      <span class="meta-item"><span class="icon">⏣</span>{{ event.时间 }}</span>
                      <span class="meta-item"><span class="icon">⌖</span>{{ event.地点 }}</span>
                    </div>
                  </div>

                  <div class="event-body">
                    <div class="event-row">
                      <span class="label">人物:</span>
                      <span class="value">{{ event.人物 }}</span>
                    </div>
                    <div class="event-row">
                      <span class="label">经过:</span>
                      <p class="value">{{ event.事件经过 }}</p>
                    </div>
                  </div>

                  <transition name="slide-down">
                    <div v-if="editingEvent?.sectionId === item.id && editingEvent?.eventName === event.name" class="edit-panel">
                      <div class="edit-field">
                        <label>时间</label>
                        <input v-model="eventEditForm.时间" type="text" />
                      </div>
                      <div class="edit-field">
                        <label>地点</label>
                        <input v-model="eventEditForm.地点" type="text" />
                      </div>
                      <div class="edit-field">
                        <label>人物</label>
                        <input v-model="eventEditForm.人物" type="text" />
                      </div>
                      <div class="edit-field">
                        <label>事件经过</label>
                        <textarea v-model="eventEditForm.事件经过" rows="2"></textarea>
                      </div>
                      <div class="edit-actions">
                        <button class="btn-cancel" @click="cancelEventEdit">取消</button>
                        <button class="btn-save" @click="saveEventEdit(item.id, event.name)">保存</button>
                      </div>
                    </div>
                  </transition>

                  <div v-if="isEditMode && !(editingEvent?.sectionId === item.id && editingEvent?.eventName === event.name)" class="card-edit-overlay" @click="startEditEvent(item.id, event)">
                    <span class="edit-hint">点击编辑事件</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { SummaryOverview, SummaryEvent } from '../types/StatData';
import { MvuUtil } from '@/Utils/MvuUtil'; // 引入 MvuUtil 同步数据

const statStore = useStatStore();

const searchQuery = ref('');

// 展开/收起状态
const expandedItems = ref<Set<string>>(new Set());

const toggleExpand = (id: string) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
};

// 合并概括和详情数据
const combinedList = computed(() => {
  const data = statStore.stat_data as any;
  const overviews = data?.['总结概括'] || {};
  const details = data?.['总结详细'] || {};

  const list = [];
  const allKeys = new Set([...Object.keys(overviews), ...Object.keys(details)]);

  for (const key of allKeys) {
    const overview = overviews[key] || { 时间范围: '', 标签: '', 概括: '', 重要度: 0 };
    const sectionDetails = details[key] || {};

    const events = Object.keys(sectionDetails).map(eventName => ({
      name: eventName,
      ...sectionDetails[eventName]
    }));

    list.push({
      id: key,
      ...overview,
      events
    });
  }

  return list.sort((a, b) => a.id.localeCompare(b.id));
});

const filteredList = computed(() => {
  if (!searchQuery.value.trim()) return combinedList.value;
  const q = searchQuery.value.trim().toLowerCase();

  return combinedList.value.filter(item => {
    const matchOverview = item.概括 && item.概括.toLowerCase().includes(q);
    const matchEvent = item.events && item.events.some((event: any) => event.name.toLowerCase().includes(q));
    return matchOverview || matchEvent;
  });
});

const hasData = computed(() => combinedList.value.length > 0);

const isEditMode = ref(false);
const editingItem = ref<string | null>(null);
const editingEvent = ref<{ sectionId: string; eventName: string } | null>(null);

// 批量删除状态
const selectedOverviews = ref<Set<string>>(new Set());
const selectedEvents = ref<Set<string>>(new Set()); // 格式: "sectionId|eventName"

const toggleSelectOverview = (id: string) => {
  if (selectedOverviews.value.has(id)) {
    selectedOverviews.value.delete(id);
  } else {
    selectedOverviews.value.add(id);
  }
};

const toggleSelectEvent = (sectionId: string, eventName: string) => {
  const key = `${sectionId}|${eventName}`;
  if (selectedEvents.value.has(key)) {
    selectedEvents.value.delete(key);
  } else {
    selectedEvents.value.add(key);
  }
};

const handleBatchDelete = async () => {
  const total = selectedOverviews.value.size + selectedEvents.value.size;
  if (total === 0) return;
  if (!window.confirm(`确定要删除选中的 ${total} 项内容吗？\n(删除概括将同时删除其下所有事件)`)) return;

  const data = statStore.stat_data as any;
  if (!data) return;

  // 删除概括
  selectedOverviews.value.forEach(id => {
    if (data['总结概括'] && data['总结概括'][id]) delete data['总结概括'][id];
    if (data['总结详细'] && data['总结详细'][id]) delete data['总结详细'][id];
  });

  // 删除事件
  selectedEvents.value.forEach(key => {
    const [sectionId, eventName] = key.split('|');
    if (!selectedOverviews.value.has(sectionId)) {
      if (data['总结详细'] && data['总结详细'][sectionId] && data['总结详细'][sectionId][eventName]) {
        delete data['总结详细'][sectionId][eventName];
      }
    }
  });

  selectedOverviews.value.clear();
  selectedEvents.value.clear();

  // 同步数据变化到 Mvu
  await MvuUtil.updateMvuDataByObj(data);
};

const editForm = ref<SummaryOverview>({
  时间范围: '',
  标签: '',
  概括: '',
  重要度: 0.5
});

const eventEditForm = ref<SummaryEvent>({
  时间: '',
  地点: '',
  人物: '',
  事件经过: ''
});

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) {
    editingItem.value = null;
    editingEvent.value = null;
    selectedOverviews.value.clear();
    selectedEvents.value.clear();
  }
};

const getImportanceClass = (value: number) => {
  if (value >= 0.8) return 'critical';
  if (value >= 0.5) return 'important';
  return 'normal';
};

const getImportanceLabel = (value: number) => {
  if (value >= 0.8) return '关键';
  if (value >= 0.5) return '重要';
  return '一般';
};

const startEditOverview = (item: any) => {
  editingItem.value = item.id;
  editForm.value = {
    时间范围: item.时间范围 || '',
    标签: item.标签 || '',
    概括: item.概括 || '',
    重要度: item.重要度 || 0
  };
};

const cancelEdit = () => {
  editingItem.value = null;
};

const saveOverviewEdit = async (id: string) => {
  const data = statStore.stat_data as any;
  if (!data) return;
  if (!data['总结概括']) data['总结概括'] = {};

  data['总结概括'][id] = { ...editForm.value };
  editingItem.value = null;

  // 同步数据变化到 Mvu
  await MvuUtil.updateMvuDataByObj(data);
};

const startEditEvent = (sectionId: string, event: any) => {
  editingEvent.value = { sectionId, eventName: event.name };
  eventEditForm.value = {
    时间: event.时间 || '',
    地点: event.地点 || '',
    人物: event.人物 || '',
    事件经过: event.事件经过 || ''
  };
};

const cancelEventEdit = () => {
  editingEvent.value = null;
};

const saveEventEdit = async (sectionId: string, eventName: string) => {
  const data = statStore.stat_data as any;
  if (!data) return;
  if (!data['总结详细']) data['总结详细'] = {};
  if (!data['总结详细'][sectionId]) data['总结详细'][sectionId] = {};

  data['总结详细'][sectionId][eventName] = { ...eventEditForm.value };
  editingEvent.value = null;

  // 同步数据变化到 Mvu
  await MvuUtil.updateMvuDataByObj(data);
};
</script>

<style scoped>
.summary-view {
  --c-card-bg: rgba(20, 20, 20, 0.6);
  --c-card-border: rgba(164, 139, 87, 0.4);
  --c-accent-danger: #a83232;
  --c-gold: #d4af37;
  --c-gold-glow: rgba(212, 175, 55, 0.5);
  --c-text-main: #e0e0e0;
  --c-text-dim: #888;

  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 10px 20px; /* 压缩外边距 */
  overflow: hidden;
  font-family: var(--font-body);
  color: var(--c-text-main);
  position: relative;
}

.summary-header {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-family: var(--font-title);
  font-size: 1.5rem; /* 压缩字体 */
  color: var(--c-text-main);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--c-gold);
  margin-left: 8px;
  font-weight: 400;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 4px 12px;
  transition: border-color 0.3s;
}

.search-box:focus-within {
  border-color: var(--c-gold);
}

.search-icon {
  color: var(--c-text-dim);
  margin-right: 6px;
  font-size: 1rem;
}

.search-box input {
  background: transparent;
  border: none;
  color: var(--c-text-main);
  outline: none;
  font-family: var(--font-body);
  width: 180px;
  font-size: 0.85rem;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.header-line {
  height: 1px;
  background: linear-gradient(90deg, var(--c-gold), transparent);
  margin-top: 10px;
  width: 100%;
}

.summary-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  padding-right: 5px;
}

.batch-delete-btn {
  background: var(--c-accent-danger);
  border: 1px solid #ff4d4d;
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.batch-delete-btn:hover {
  background: #c0392b;
}

.edit-mode-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--c-text-dim);
  padding: 4px 12px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.edit-mode-btn:hover {
  border-color: var(--c-gold);
  color: var(--c-gold);
}

.edit-mode-btn.is-editing {
  background: var(--c-accent-danger);
  border-color: var(--c-accent-danger);
  color: white;
  box-shadow: 0 0 10px rgba(168, 50, 50, 0.4);
}

.summary-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
  padding-bottom: 40px;
  scrollbar-width: thin;
  scrollbar-color: var(--c-gold) transparent;
}

.summary-content::-webkit-scrollbar {
  width: 4px;
}

.summary-content::-webkit-scrollbar-thumb {
  background: var(--c-gold);
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--c-text-dim);
  font-style: italic;
  border: 1px dashed var(--c-border);
}

.chronicle-list {
  display: flex;
  flex-direction: column;
  gap: 15px; /* 压缩间距 */
}

.chronicle-card {
  display: flex;
  flex-direction: column;
  gap: 10px; /* 压缩间距 */
  background: rgba(15, 15, 15, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 12px; /* 压缩内边距 */
}

.overview-section {
  position: relative;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 6px;
  padding: 12px; /* 压缩内边距 */
  transition: all 0.3s ease;
}

.overview-section:hover {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 3px 10px rgba(0,0,0,0.3);
}

.overview-section.is-editing {
  border-color: var(--c-gold);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
}

.details-section {
  padding-left: 15px;
  border-left: 2px dashed rgba(255, 255, 255, 0.1);
  margin-top: 5px;
}

.details-title {
  font-family: var(--font-title);
  color: var(--c-text-dim);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

/* 替换原有的删除按钮为复选框 */
.checkbox-wrapper {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  transform: scale(1.2);
  cursor: pointer;
}

.card-header {
  margin-bottom: 8px; /* 压缩间距 */
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-id {
  font-family: var(--font-title);
  font-size: 1.1rem; /* 压缩字体 */
  color: var(--c-gold);
  margin: 0;
}

.importance-badge {
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.importance-badge.critical {
  background: rgba(168, 50, 50, 0.3);
  color: #ff6b6b;
}

.importance-badge.important {
  background: rgba(212, 175, 55, 0.3);
  color: var(--c-gold);
}

.importance-badge.normal {
  background: rgba(100, 100, 100, 0.3);
  color: var(--c-text-dim);
}

.time-range {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--c-text-dim);
}

.time-range .icon {
  color: var(--c-gold);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 6px; /* 压缩间距 */
}

.tag-row {
  display: flex;
  gap: 6px;
}

.tag {
  background: rgba(212, 175, 55, 0.15);
  color: var(--c-gold);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.summary-text {
  color: var(--c-text-main);
  font-size: 0.85rem; /* 压缩字体 */
  line-height: 1.4;
  margin: 0;
}

.expand-toggle {
  margin-top: 10px;
  font-size: 0.75rem;
  color: var(--c-gold);
  cursor: pointer;
  text-align: center;
  padding: 4px;
  background: rgba(212, 175, 55, 0.08);
  border-radius: 4px;
  transition: background 0.3s;
}

.expand-toggle:hover {
  background: rgba(212, 175, 55, 0.2);
}

.card-edit-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10;
}

.overview-section:hover .card-edit-overlay,
.event-card:hover .card-edit-overlay {
  opacity: 1;
}

.edit-hint {
  color: var(--c-gold);
  font-family: var(--font-title);
  font-size: 0.85rem;
  padding: 6px 15px;
  border: 1px solid var(--c-gold);
  border-radius: 4px;
  background: rgba(0,0,0,0.5);
}

.edit-panel {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 15;
}

.edit-field {
  margin-bottom: 8px;
}

.edit-field label {
  display: block;
  font-size: 0.7rem;
  color: var(--c-text-dim);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.edit-field input,
.edit-field textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 6px 8px; /* 压缩内边距 */
  color: var(--c-text-main);
  font-family: var(--font-body);
  font-size: 0.85rem;
  transition: border-color 0.3s;
}

.edit-field input:focus,
.edit-field textarea:focus {
  outline: none;
  border-color: var(--c-gold);
}

.edit-field textarea {
  resize: vertical;
  min-height: 40px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn-cancel,
.btn-save {
  padding: 6px 15px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--c-text-dim);
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: var(--c-text-main);
}

.btn-save {
  background: var(--c-gold);
  border: none;
  color: #111;
  font-weight: 600;
}

.btn-save:hover {
  background: #e5c04b;
}

.events-container {
  display: flex;
  flex-direction: column;
  gap: 10px; /* 压缩间距 */
}

.event-card {
  position: relative;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 10px 12px; /* 压缩内边距 */
  transition: all 0.3s ease;
}

.event-card:hover {
  border-color: rgba(212, 175, 55, 0.2);
}

.event-card.is-editing {
  border-color: var(--c-gold);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}

.event-name {
  font-family: var(--font-title);
  font-size: 0.9rem; /* 压缩字体 */
  color: var(--c-text-main);
  margin: 0;
}

.event-meta {
  display: flex;
  gap: 10px;
}

.meta-item {
  font-size: 0.75rem;
  color: var(--c-text-dim);
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item .icon {
  color: var(--c-gold);
}

.event-body {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 压缩间距 */
}

.event-row {
  display: flex;
  gap: 6px;
}

.event-row .label {
  color: var(--c-text-dim);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.event-row .value {
  color: var(--c-text-main);
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
}

.shake-anim {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.scale-in-enter-active { animation: scale-in 0.2s; }
@keyframes scale-in {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  margin-top: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 800px;
}
</style>
