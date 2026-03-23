<template>
  <div class="relationship-module">
    <div
      v-for="(rel, name) in (isEditing ? editableData : data)"
      :key="name"
      class="rel-card"
      :class="{ expanded: expandedState[name] || isEditing }"
    >
      <div class="rel-header" @click="!isEditing && toggleExpand(name)">
        <div class="header-main">
          <span class="rel-name">{{ formatName(name) }}</span>
          <span class="rel-summary" v-if="!isEditing">{{ getSummary(rel) }}</span>
        </div>
        <div class="toggle-icon" v-if="!isEditing">
          {{ expandedState[name] ? '−' : '+' }}
        </div>
      </div>

      <div v-show="expandedState[name] || isEditing" class="rel-details">
        <div class="details-grid">
          <div class="detail-item" v-if="rel['认知了解'] || isEditing">
            <h4 class="detail-title">认知了解</h4>
            <p class="detail-text" v-if="!isEditing">{{ rel['认知了解'] }}</p>
            <textarea v-else v-model="rel['认知了解']" @input="updateField" class="edit-textarea"></textarea>
          </div>

          <div class="detail-item" v-if="rel['情感羁绊'] || isEditing">
            <h4 class="detail-title">情感羁绊</h4>
            <p class="detail-text" v-if="!isEditing">{{ rel['情感羁绊'] }}</p>
            <textarea v-else v-model="rel['情感羁绊']" @input="updateField" class="edit-textarea"></textarea>
          </div>

          <div class="detail-item" v-if="rel['利益纽带'] || isEditing">
            <h4 class="detail-title">利益纽带</h4>
            <p class="detail-text" v-if="!isEditing">{{ rel['利益纽带'] }}</p>
            <textarea v-else v-model="rel['利益纽带']" @input="updateField" class="edit-textarea"></textarea>
          </div>

          <div class="detail-item" v-if="!isEditing && rel['近期影响'] && Object.keys(rel['近期影响']).length > 0">
            <h4 class="detail-title">近期影响</h4>
            <ul class="recent-impact-list">
              <li v-for="(val, key) in rel['近期影响']" :key="key">
                <span class="impact-key">{{ key }}:</span>
                <span class="impact-val">{{ val }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  isEditing: { type: Boolean, default: false }
});
const emit = defineEmits(['update:data']);

const expandedState = ref({});
const editableData = ref({});

watch(() => props.data, (newVal) => {
  editableData.value = JSON.parse(JSON.stringify(newVal || {}));
}, { deep: true, immediate: true });

const updateField = () => {
  emit('update:data', editableData.value);
};

const toggleExpand = (name) => {
  expandedState.value[name] = !expandedState.value[name];
};

const getSummary = (rel) => {
  if (rel['情感羁绊']) return rel['情感羁绊'].length > 25 ? rel['情感羁绊'].slice(0, 25) + '...' : rel['情感羁绊'];
  return '暂无详细描述';
};

const formatName = (name) => {
  if (name === 'user') {
    try { return typeof substitudeMacros === 'function' ? substitudeMacros('{{user}}') : '{{user}}'; }
    catch (e) { return '你'; }
  }
  return name;
};
</script>

<style scoped>
.relationship-module { display: flex; flex-direction: column; gap: 10px; }
.rel-card { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; transition: all 0.3s ease; }
.rel-card.expanded { border-color: var(--c-gold, #d4af37); background: rgba(0, 0, 0, 0.5); }

.rel-header { padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: rgba(255, 255, 255, 0.02); }
.rel-header:hover { background: rgba(255, 255, 255, 0.05); }
.header-main { display: flex; flex-direction: column; gap: 4px; }
.rel-name { font-family: var(--font-title, serif); color: var(--c-gold, #d4af37); font-size: 1.1rem; font-weight: bold; }
.rel-summary { font-size: 0.9rem; color: #ccc; font-style: italic; line-height: 1.4; }
.toggle-icon { color: var(--c-gold, #d4af37); font-size: 1.2rem; font-weight: bold; opacity: 0.7; }

.rel-details { padding: 15px; border-top: 1px solid rgba(255, 255, 255, 0.05); animation: slideDown 0.3s ease-out; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.details-grid { display: flex; flex-direction: column; gap: 16px; }
.detail-item { display: flex; flex-direction: column; gap: 6px; }
.detail-title { margin: 0; font-size: 0.95rem; color: var(--c-text-dim, #a0a0a0); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 5px; }
.detail-text { margin: 0; font-size: 0.85rem; color: #ddd; line-height: 1.6; white-space: pre-wrap; }

.edit-textarea {
  width: 100%; background: rgba(0, 0, 0, 0.5); border: 1px solid var(--c-gold, #d4af37); color: #e0e0e0;
  padding: 8px; font-family: 'EB Garamond', serif; border-radius: 4px; resize: vertical; min-height: 60px;
}

.recent-impact-list { margin: 0; padding: 0; list-style: none; font-size: 0.85rem; color: #ddd; line-height: 1.6; }
.recent-impact-list li { margin-bottom: 6px; display: flex; align-items: flex-start; }
.impact-key { color: var(--c-gold, #d4af37); margin-right: 8px; font-weight: bold; white-space: nowrap; }
.impact-val { color: #fff; flex: 1; }
</style>
