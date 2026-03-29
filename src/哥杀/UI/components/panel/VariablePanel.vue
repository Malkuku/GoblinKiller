<template>
  <transition name="slide-down-edit">
    <div class="edit-panel variable-panel">
      <div class="edit-header">
        <span>变量监控 (VARIABLE_DEBUGGER)</span>
        <button class="close-edit" @click="$emit('close')">✕</button>
      </div>

      <div class="edit-body ac-content">
        <div v-if="parsedLogs.length === 0" class="ac-empty">
          <span class="blink">SEARCHING MEMORY BLOCKS...</span>
          <div class="sub-text">No variable modifications detected.</div>
        </div>

        <div v-for="(log, index) in parsedLogs" :key="index" class="ac-log-entry" :class="{ 'is-think': log.type === 'variablethink' }">
          <div class="ac-log-header" :class="log.type">
            <span class="log-index">0x{{ String(index).padStart(4, '0') }}</span>
            <span class="log-action">{{ formatType(log.type) }}</span>
          </div>
          <div class="ac-log-body">
            <div v-if="log.type === 'variablethink'" class="ac-think-text">
              {{ log.data }}
            </div>
            <div v-else class="ac-json-wrapper">
              <JsonNode :value="log.data" :name="''" :is-last="true" :depth="0" :force-open="false" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, h, defineComponent, computed, onMounted, watch } from 'vue';
import { useMessageStore } from '@/尘史使徒/UI/store/MessageStore';

const emit = defineEmits<{ (e: 'close'): void; }>();
const messageStore = useMessageStore();
const parsedLogs = ref<Array<{ type: string, data: any }>>([]);

const formatType = (type: string) => {
  const map: Record<string, string> = {
    'variableinsert': 'ALLOCATE',
    'variableedit': 'OVERWRITE',
    'variabledelete': 'DEALLOCATE',
    'variablethink': '>> SYNAPTIC PROCESS'
  };
  return map[type] || type.toUpperCase();
};

// ... (此处保留原有的 parsePath, ensureParent, setAtPath, removeAtPath, deltaAtPath, applyJSONPatch, parseMessageContent 逻辑，与原文件完全一致) ...
// 为节省篇幅，此处省略 JSONPatch 工具函数，请直接复用原文件中的逻辑。

onMounted(() => { /* parseMessageContent(); */ });
watch(() => messageStore.message, () => { /* parseMessageContent(); */ });

const JsonNode = defineComponent({
  // ... (保留原有的 JsonNode 渲染逻辑) ...
});
</script>

<style scoped>
.edit-panel {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 80%; height: 80%; background: var(--scroll-paper);
  border: 1px solid var(--scroll-border); border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 10000;
  display: flex; flex-direction: column; color: var(--text-main);
}
.edit-header {
  padding: 12px 20px; background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid var(--scroll-border);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--accent-gold); font-weight: bold; font-size: 1rem; flex-shrink: 0;
}
.close-edit { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; transition: color 0.3s; }
.close-edit:hover { color: var(--accent-gold); }
.edit-body { flex: 1; padding: 15px; overflow-y: auto; scrollbar-width: thin; }

.ac-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); }
.blink { animation: blinker 2s linear infinite; font-size: 1.2em; }
@keyframes blinker { 50% { opacity: 0.3; } }
.sub-text { font-family: monospace; font-size: 0.9em; margin-top: 10px; opacity: 0.7; }

.ac-log-entry {
  margin-bottom: 12px; border-left: 3px solid var(--scroll-border);
  background: rgba(0, 0, 0, 0.02); transition: border-color 0.3s;
}
.ac-log-entry:hover { border-left-color: var(--accent-gold); background: rgba(0, 0, 0, 0.04); }
.ac-log-entry.is-think { border-left-color: var(--text-muted); }

.ac-log-header {
  display: flex; justify-content: space-between; padding: 6px 12px; font-size: 12px; font-weight: bold;
  background: rgba(0, 0, 0, 0.03); border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.ac-log-header.variableinsert { color: #2e7d32; }
.ac-log-header.variableedit { color: #0277bd; }
.ac-log-header.variabledelete { color: #c62828; }
.ac-log-header.variablethink { color: var(--text-muted); font-style: italic; }

.log-index { font-family: monospace; opacity: 0.7; }
.log-action { letter-spacing: 1px; }
.ac-log-body { padding: 12px; font-size: 13px; overflow-x: auto; }
.ac-think-text { font-family: 'Courier New', Courier, monospace; color: var(--text-muted); white-space: pre-wrap; line-height: 1.5; font-size: 13px; }

/* JSON Tree 适配明亮主题 */
:deep(.jv-node) { position: relative; font-family: 'Consolas', monospace; }
:deep(.jv-line) { display: flex; align-items: flex-start; flex-wrap: wrap; white-space: pre-wrap; }
:deep(.jv-clickable) { cursor: pointer; }
:deep(.jv-clickable:hover) { background-color: rgba(0, 0, 0, 0.05); }
:deep(.jv-toggle) { display: inline-block; width: 16px; text-align: center; margin-right: 4px; color: var(--accent-gold); transition: transform 0.2s; }
:deep(.jv-toggle.open) { transform: rotate(90deg); }
:deep(.jv-key) { color: #0277bd; }
:deep(.jv-string) { color: #c62828; }
:deep(.jv-number) { color: #2e7d32; }
:deep(.jv-boolean) { color: #1565c0; }
:deep(.jv-null) { color: #7f8c8d; }
:deep(.jv-bracket), :deep(.jv-comma) { color: var(--text-main); }
:deep(.jv-ellipsis) { background: rgba(0,0,0,0.1); padding: 0 4px; border-radius: 2px; color: var(--text-muted); }
:deep(.jv-count) { color: var(--text-muted); font-style: italic; margin-left: 8px; }

.slide-down-edit-enter-active, .slide-down-edit-leave-active { transition: all 0.3s ease; }
.slide-down-edit-enter-from, .slide-down-edit-leave-to { opacity: 0; transform: translate(-50%, -55%); }

@media (max-width: 1000px) {
  .edit-panel { top: 0; left: 0; transform: none; width: 100%; height: 100dvh; border-radius: 0; border: none; }
  .slide-down-edit-enter-from, .slide-down-edit-leave-to { opacity: 0; transform: translateY(-10px); }
}
</style>
