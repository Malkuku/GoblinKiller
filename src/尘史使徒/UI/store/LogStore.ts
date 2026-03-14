// src/尘史使徒/UI/store/LogStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useLogStore = defineStore('log', () => {
  const logMessages = ref<{ id: number; text: string; read: boolean }[]>([]);
  let logIdCounter = 0;

  // 1. 将 lastProcessedMessageId 移动到这里
  const lastProcessedMessageId = ref<string | number | null>(null);

  const unreadLogCount = computed(() => logMessages.value.filter(m => !m.read).length);

  function addLogMessage(text: string, isPanelOpen: boolean) {
    // ... (不变)
  }

  function markAllAsRead() {
    // ... (不变)
  }

  function clearLogs() {
    logMessages.value = [];
    logIdCounter = 0;
  }

  // 2. 新增一个 action 用于更新 ID
  function setLastProcessedMessageId(id: string | number) {
    lastProcessedMessageId.value = id;
  }

  return {
    logMessages,
    unreadLogCount,
    lastProcessedMessageId, // 3. 导出状态
    addLogMessage,
    markAllAsRead,
    clearLogs,
    setLastProcessedMessageId, // 4. 导出 action
  };
});
