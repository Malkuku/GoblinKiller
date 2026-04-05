<template>
  <div class="start-container" :class="{ 'dark-mode': uiStore.darkMode }">
    <div class="start-header">
      <h1>开局选择</h1>
      <p class="start-subtitle">请选择您的冒险起点</p>
    </div>

    <StartSelector
      v-model="selectedType"
      :modules="modules"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <StartPreview
      :module="selectedModule"
      @preview="handlePreview"
      @select="handleSelect"
    />
  </div>
</template>

<script setup lang="ts">
import StartPreview from '@/哥杀/UI/components/start/StartPreview.vue';
import StartSelector from '@/哥杀/UI/components/start/StartSelector.vue';
import { getAllStartModules } from '@/哥杀/UI/composables/start/constants';
import { StartModuleMeta } from '@/哥杀/UI/composables/start/types';
import { useUiStore } from '@/哥杀/UI/store/UIStore';
import { computed, ref } from 'vue';

const uiStore = useUiStore();
const selectedType = ref('');
const modules = ref(getAllStartModules());

const selectedModule = computed(() => 
  modules.value.find(m => m.type === selectedType.value)
);

function handleConfirm(module: StartModuleMeta) {
  console.log('Confirm selection:', module);
  // TODO: 实现确认逻辑
}

function handleCancel() {
  console.log('Cancel selection');
  // TODO: 实现取消逻辑
}

function handlePreview(module: StartModuleMeta) {
  console.log('Preview module:', module);
  // TODO: 实现预览逻辑
}

function handleSelect(module: StartModuleMeta) {
  console.log('Select module:', module);
  // TODO: 实现选择逻辑
}
</script>

<style scoped>
.start-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.start-header {
  text-align: center;
  margin-bottom: 40px;
}

.start-header h1 {
  font-size: 32px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.start-subtitle {
  font-size: 16px;
  color: var(--text-muted);
}

.start-container.dark-mode {
  --text-dark: #dce4ee;
  --text-muted: #829ab1;
  --card-base: #1f293d;
  --border-color: #3a4b6b;
  --paper-bg: #111827;
}
</style>
