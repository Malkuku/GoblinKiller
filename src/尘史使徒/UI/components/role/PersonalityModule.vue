<template>
  <div class="personality-module">
    <div class="trait-list">
      <div v-for="key in coreTraits" :key="key" class="trait-row">
        <div class="trait-header">
          <span class="trait-name">{{ key }}</span>
        </div>
        <div class="trait-description" v-if="!isEditing">
          {{ data[key] || '暂无描述' }}
        </div>
        <textarea
          v-else
          v-model="editableData[key]"
          @input="updateField"
          class="edit-textarea"
        ></textarea>
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

const coreTraits = ['社交表现', '行动逻辑', '思维习惯', '人际距离', '道德底色'];

const editableData = ref({});
watch(() => props.data, (newVal) => {
  editableData.value = JSON.parse(JSON.stringify(newVal || {}));
}, { deep: true, immediate: true });

const updateField = () => {
  emit('update:data', editableData.value);
};


</script>

<style scoped>
.personality-module { display: flex; flex-direction: column; gap: 20px; font-family: 'EB Garamond', serif; }
.trait-list { display: flex; flex-direction: column; gap: 16px; }
.trait-row { display: flex; flex-direction: column; gap: 8px; padding-bottom: 16px; border-bottom: 1px dashed rgba(255, 255, 255, 0.1); }
.trait-row:last-child { border-bottom: none; padding-bottom: 0; }
.trait-header { display: flex; align-items: center; }
.trait-name { font-family: 'Cinzel', serif; color: #d4af37; font-weight: bold; font-size: 1.1rem; letter-spacing: 1px; position: relative; padding-left: 14px; }
.trait-name::before { content: '♦'; position: absolute; left: 0; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: #a0c4ff; }
.trait-description { color: #e0e0e0; font-size: 0.95rem; line-height: 1.6; text-align: justify; padding-left: 14px; }

.edit-textarea {
  width: 100%; background: rgba(0, 0, 0, 0.5); border: 1px solid #d4af37; color: #e0e0e0;
  padding: 8px; font-family: 'EB Garamond', serif; border-radius: 4px; resize: vertical; min-height: 60px;
}


</style>
