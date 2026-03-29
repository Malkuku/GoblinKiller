<template>
  <transition name="slide-down-log">
    <div class="log-panel">
      <div class="log-header">
        <div class="header-left">
          <span>事件日志</span>
          <select :value="logLevel" @change="handleLevelChange" class="log-level-select">
            <option :value="0">仅自己</option>
            <option :value="1">主要角色</option>
            <option :value="2">全部角色</option>
          </select>
        </div>
        <button class="close-log" @click="$emit('close')">✕</button>
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
import { useEventLogger } from '@/哥杀/UI/composables/panel/useEventLogger';

defineEmits<{ (e: 'close'): void; }>();

const { logMessages, logLevel, setLogLevel, formatLogText, logListRef } = useEventLogger();

const handleLevelChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  setLogLevel(Number(target.value) as 0 | 1 | 2);
};
</script>

<style scoped>
.log-panel {
  position: absolute; top: 58px; right: 20px; width: 450px; max-height: 50vh;
  background: var(--scroll-paper); border: 1px solid var(--scroll-border);
  border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 10000;
  display: flex; flex-direction: column; color: var(--text-main);
}
.log-header {
  padding: 10px 15px; background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid var(--scroll-border);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--accent-gold); font-weight: bold; font-size: 0.95rem; flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.log-level-select {
  background: rgba(255, 255, 255, 0.5); border: 1px solid var(--scroll-border);
  color: var(--text-main); font-size: 0.85rem; padding: 2px 5px;
  border-radius: 3px; cursor: pointer; outline: none;
}
.log-level-select:focus, .log-level-select:hover { border-color: var(--accent-gold); }

.close-log { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; transition: color 0.3s; }
.close-log:hover { color: var(--accent-gold); }

.log-list { list-style: none; margin: 0; padding: 10px; overflow-y: auto; scrollbar-width: thin; }
.log-item { padding: 8px 6px; font-size: 0.9rem; border-bottom: 1px dashed var(--scroll-border); display: flex; gap: 8px; }
.log-item:last-child { border-bottom: none; }

.log-text :deep(.log-positive) { color: #2e7d32; font-weight: bold; }
.log-text :deep(.log-negative) { color: #c62828; font-weight: bold; }
.log-text :deep(.log-attr) { color: #d84315; font-weight: bold; }

.log-text :deep(.log-char-user) { color: #0277bd; font-weight: bold; }
.log-text :deep(.log-char-main) { color: #6a1b9a; font-weight: bold; }
.log-text :deep(.log-char-minor) { color: var(--text-muted); font-style: italic; }

.log-empty { text-align: center; padding: 20px; color: var(--text-muted); font-style: italic; }

.slide-down-log-enter-active, .slide-down-log-leave-active { transition: all 0.3s ease; }
.slide-down-log-enter-from, .slide-down-log-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 768px) {
  .log-panel { width: calc(100vw - 30px); right: 15px; top: 90px; }
}
@media (max-width: 480px) {
  .log-panel { width: calc(100vw - 20px); right: 10px; }
}
</style>
