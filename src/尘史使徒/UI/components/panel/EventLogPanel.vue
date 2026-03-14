<template>
  <transition name="slide-down-log">
    <div class="log-panel">
      <div class="log-header">
        <span>事件日志</span>
        <button class="close-log" @click="$emit('close')">×</button>
      </div>
      <ul class="log-list" ref="logListRef">
        <li v-for="log in logMessages" :key="log.id" class="log-item">
          <span class="log-text" v-html="formatLogText(log.text)"></span>
        </li>
        <li v-if="logMessages.length === 0" class="log-empty">
          暂无事件记录
        </li>
      </ul>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  logMessages: { id: number; text: string }[];
  formatLogText: (text: string) => string;
  logListRef: (el: any) => void; // To connect ref from parent
}>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<style scoped>
.log-panel {
  position: absolute; top: 58px; right: 20px; width: 450px; max-height: 50vh;
  background: rgba(20, 22, 28, 0.95); border: 1px solid var(--c-gold);
  border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); z-index: 14;
  backdrop-filter: blur(10px); display: flex; flex-direction: column;
}
.log-header {
  padding: 8px 15px; background: rgba(164, 139, 87, 0.1);
  border-bottom: 1px solid rgba(164, 139, 87, 0.3);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 0.9rem; flex-shrink: 0;
}
.close-log { background: none; border: none; color: var(--c-text-dim); cursor: pointer; font-size: 1.2rem; }
.log-list { list-style: none; margin: 0; padding: 10px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--c-gold) transparent; }
.log-item { padding: 6px 4px; font-size: 0.9rem; color: var(--c-text-main); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; gap: 8px; }
.log-text :deep(.log-positive) { color: #4CAF50; font-weight: bold; }
.log-text :deep(.log-negative) { color: #F44336; font-weight: bold; }
.log-empty { text-align: center; padding: 20px; color: var(--c-text-dim); font-style: italic; }

.slide-down-log-enter-active, .slide-down-log-leave-active { transition: all 0.3s ease; }
.slide-down-log-enter-from, .slide-down-log-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 768px) {
  .log-panel { width: calc(100vw - 30px); right: 15px; top: 90px; }
}
@media (max-width: 480px) {
  .log-panel { width: calc(100vw - 20px); right: 10px; }
}
</style>
