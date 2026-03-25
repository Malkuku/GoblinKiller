<template>
  <div class="summary-view">
    <header class="summary-header">
      <h1 class="page-title">残卷 <span class="subtitle">CHRONICLES</span></h1>
      <div class="header-line"></div>
    </header>

    <nav class="summary-tabs">
      <div class="tabs-group">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-name">{{ tab.name }}</span>
          <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

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
      <transition name="fade-slide" mode="out-in">

        <div v-if="currentTab === 'overview'" class="panel-overview" key="overview">
          <div v-if="overviewList.length === 0" class="empty-state">暂无概括记录</div>
          <div class="overview-grid">
            <div
              v-for="item in overviewList"
              :key="item.id"
              class="overview-card"
              :class="{ 'shake-anim': isEditMode, 'is-editing': editingItem === item.id }"
            >
              <transition name="scale-in">
                <button
                  v-if="isEditMode && editingItem !== item.id"
                  class="card-delete-btn"
                  @click.stop="handleDeleteOverview(item.id)"
                  title="删除此记录"
                >
                  ×
                </button>
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
                  <span class="text">{{ item.时间范围 }}</span>
                </div>
              </div>

              <div class="card-body">
                <div class="tag-row" v-if="item.标签">
                  <span class="tag">{{ item.标签 }}</span>
                </div>
                <p class="summary-text">{{ item.概括 }}</p>
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
                    <textarea v-model="editForm.概括" rows="3"></textarea>
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
                <span class="edit-hint">点击编辑</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="currentTab === 'details'" class="panel-details" key="details">
          <div v-if="detailsList.length === 0" class="empty-state">暂无详细记录</div>
          <div class="details-list">
            <div
              v-for="section in detailsList"
              :key="section.id"
              class="detail-section"
            >
              <div class="section-header">
                <h3 class="section-title">{{ section.id }}</h3>
                <transition name="scale-in">
                  <button
                    v-if="isEditMode"
                    class="section-delete-btn"
                    @click="handleDeleteSection(section.id)"
                    title="删除整个章节"
                  >
                    删除章节
                  </button>
                </transition>
              </div>

              <div class="events-container">
                <div
                  v-for="event in section.events"
                  :key="event.name"
                  class="event-card"
                  :class="{ 'shake-anim': isEditMode, 'is-editing': editingEvent?.sectionId === section.id && editingEvent?.eventName === event.name }"
                >
                  <transition name="scale-in">
                    <button
                      v-if="isEditMode && !(editingEvent?.sectionId === section.id && editingEvent?.eventName === event.name)"
                      class="card-delete-btn"
                      @click.stop="handleDeleteEvent(section.id, event.name)"
                      title="删除此事件"
                    >
                      ×
                    </button>
                  </transition>

                  <div class="event-header">
                    <h4 class="event-name">{{ event.name }}</h4>
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
                    <div v-if="editingEvent?.sectionId === section.id && editingEvent?.eventName === event.name" class="edit-panel">
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
                        <textarea v-model="eventEditForm.事件经过" rows="3"></textarea>
                      </div>
                      <div class="edit-actions">
                        <button class="btn-cancel" @click="cancelEventEdit">取消</button>
                        <button class="btn-save" @click="saveEventEdit(section.id, event.name)">保存</button>
                      </div>
                    </div>
                  </transition>

                  <div v-if="isEditMode && !(editingEvent?.sectionId === section.id && editingEvent?.eventName === event.name)" class="card-edit-overlay" @click="startEditEvent(section.id, event)">
                    <span class="edit-hint">点击编辑</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSummaryStore } from '@/尘史使徒/UI/store/SummaryStore';
import { SummaryOverview, SummaryEvent } from '../types/StatData';

const summaryStore = useSummaryStore();

const overviewList = computed(() => summaryStore.overviewList);
const detailsList = computed(() => summaryStore.detailsList);
const hasData = computed(() => summaryStore.hasSummaryData);

const currentTab = ref('overview');

watch(currentTab, () => {
  isEditMode.value = false;
  editingItem.value = null;
  editingEvent.value = null;
});

const tabs = computed(() => [
  { id: 'overview', name: '概括', icon: '▣', count: overviewList.value.length },
  { id: 'details', name: '详述', icon: '◌', count: detailsList.value.length },
]);

const isEditMode = ref(false);
const editingItem = ref<string | null>(null);
const editingEvent = ref<{ sectionId: string; eventName: string } | null>(null);

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
    时间范围: item.时间范围,
    标签: item.标签,
    概括: item.概括,
    重要度: item.重要度
  };
};

const cancelEdit = () => {
  editingItem.value = null;
};

const saveOverviewEdit = async (id: string) => {
  await summaryStore.updateOverview(id, editForm.value);
  editingItem.value = null;
};

const handleDeleteOverview = async (id: string) => {
  if (!window.confirm(`确定要删除 "${id}" 吗？`)) return;
  await summaryStore.deleteOverview(id);
};

const startEditEvent = (sectionId: string, event: any) => {
  editingEvent.value = { sectionId, eventName: event.name };
  eventEditForm.value = {
    时间: event.时间,
    地点: event.地点,
    人物: event.人物,
    事件经过: event.事件经过
  };
};

const cancelEventEdit = () => {
  editingEvent.value = null;
};

const saveEventEdit = async (sectionId: string, eventName: string) => {
  await summaryStore.updateDetailEvent(sectionId, eventName, eventEditForm.value);
  editingEvent.value = null;
};

const handleDeleteSection = async (sectionId: string) => {
  if (!window.confirm(`确定要删除整个章节 "${sectionId}" 吗？`)) return;
  await summaryStore.deleteDetailSection(sectionId);
};

const handleDeleteEvent = async (sectionId: string, eventName: string) => {
  if (!window.confirm(`确定要删除事件 "${eventName}" 吗？`)) return;
  await summaryStore.deleteDetailEvent(sectionId, eventName);
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
  padding: 20px 40px;
  overflow: hidden;
  font-family: var(--font-body);
  color: var(--c-text-main);
  position: relative;
}

.summary-header {
  flex-shrink: 0;
  margin-bottom: 20px;
}

.page-title {
  font-family: var(--font-title);
  font-size: 2rem;
  color: var(--c-text-main);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--c-gold);
  margin-left: 10px;
  font-weight: 400;
}

.header-line {
  height: 1px;
  background: linear-gradient(90deg, var(--c-gold), transparent);
  margin-top: 10px;
  width: 100%;
}

.summary-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-right: 10px;
}

.tabs-group {
  display: flex;
  gap: 20px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 10px 20px;
  color: var(--c-text-dim);
  font-family: var(--font-title);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: var(--c-text-main);
  background: rgba(255,255,255,0.05);
}

.tab-btn.active {
  color: var(--c-gold);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--c-gold);
  box-shadow: 0 0 10px var(--c-gold);
}

.tab-count {
  font-size: 0.8rem;
  background: rgba(0,0,0,0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: sans-serif;
}

.edit-mode-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--c-text-dim);
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
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
  padding-right: 10px;
  padding-bottom: 80px;
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
  padding: 50px;
  color: var(--c-text-dim);
  font-style: italic;
  border: 1px dashed var(--c-border);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.overview-card {
  position: relative;
  background: rgba(15, 15, 15, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 20px;
  transition: all 0.3s ease;
}

.overview-card:hover {
  border-color: rgba(212, 175, 55, 0.3);
  box-shadow: 0 5px 20px rgba(0,0,0,0.3);
}

.overview-card.is-editing {
  border-color: var(--c-gold);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
}

.card-delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--c-accent-danger);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.card-delete-btn:hover {
  background: #c0392b;
  transform: scale(1.1);
}

.card-header {
  margin-bottom: 15px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-id {
  font-family: var(--font-title);
  font-size: 1.1rem;
  color: var(--c-gold);
  margin: 0;
}

.importance-badge {
  font-size: 0.7rem;
  padding: 3px 10px;
  border-radius: 12px;
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
  gap: 6px;
  font-size: 0.85rem;
  color: var(--c-text-dim);
}

.time-range .icon {
  color: var(--c-gold);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-row {
  display: flex;
  gap: 8px;
}

.tag {
  background: rgba(212, 175, 55, 0.15);
  color: var(--c-gold);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.summary-text {
  color: var(--c-text-main);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.card-edit-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.overview-card:hover .card-edit-overlay,
.event-card:hover .card-edit-overlay {
  opacity: 1;
}

.edit-hint {
  color: var(--c-gold);
  font-family: var(--font-title);
  font-size: 0.9rem;
  padding: 8px 20px;
  border: 1px solid var(--c-gold);
  border-radius: 4px;
}

.edit-panel {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.edit-field {
  margin-bottom: 12px;
}

.edit-field label {
  display: block;
  font-size: 0.75rem;
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
  padding: 8px 12px;
  color: var(--c-text-main);
  font-family: var(--font-body);
  font-size: 0.9rem;
  transition: border-color 0.3s;
}

.edit-field input:focus,
.edit-field textarea:focus {
  outline: none;
  border-color: var(--c-gold);
}

.edit-field textarea {
  resize: vertical;
  min-height: 60px;
}

.edit-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 15px;
}

.btn-cancel,
.btn-save {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 0.85rem;
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

.details-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.detail-section {
  background: rgba(15, 15, 15, 0.5);
  border-radius: 8px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-family: var(--font-title);
  font-size: 1.3rem;
  color: var(--c-gold);
  margin: 0;
}

.section-delete-btn {
  background: rgba(168, 50, 50, 0.2);
  border: 1px solid rgba(168, 50, 50, 0.4);
  color: #ff6b6b;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
}

.section-delete-btn:hover {
  background: var(--c-accent-danger);
  color: white;
}

.events-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-card {
  position: relative;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 15px 20px;
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
  margin-bottom: 12px;
}

.event-name {
  font-family: var(--font-title);
  font-size: 1rem;
  color: var(--c-text-main);
  margin: 0;
}

.event-meta {
  display: flex;
  gap: 15px;
}

.meta-item {
  font-size: 0.8rem;
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
  gap: 8px;
}

.event-row {
  display: flex;
  gap: 8px;
}

.event-row .label {
  color: var(--c-text-dim);
  font-size: 0.85rem;
  flex-shrink: 0;
}

.event-row .value {
  color: var(--c-text-main);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.shake-anim {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
  max-height: 500px;
}
</style>
