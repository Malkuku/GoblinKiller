// src/尘史使徒/UI/store/LogStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useLogStore = defineStore('log', () => {
  const logMessages = ref<{ id: number; text: string; read: boolean }[]>([]);
  let logIdCounter = 0;

  const lastProcessedMessageId = ref<string | number | null>(null);

  // 新增：日志记录等级 0=仅自己, 1=主要角色, 2=全部角色
  const logLevel = ref<0 | 1 | 2>(1);

  const unreadLogCount = computed(() => logMessages.value.filter(m => !m.read).length);

  function addLogMessage(text: string, isPanelOpen: boolean) {
    logMessages.value.unshift({
      id: logIdCounter++,
      text,
      read: isPanelOpen,
    });
    if (logMessages.value.length > 100) {
      logMessages.value.pop();
    }
  }

  function markAllAsRead() {
    logMessages.value.forEach(m => m.read = true);
  }

  function clearLogs() {
    logMessages.value = [];
    logIdCounter = 0;
  }

  function setLastProcessedMessageId(id: string | number) {
    lastProcessedMessageId.value = id;
  }

  // 新增：设置日志等级
  function setLogLevel(level: 0 | 1 | 2) {
    logLevel.value = level;
  }

  return {
    logMessages,
    unreadLogCount,
    lastProcessedMessageId,
    logLevel, // 导出
    addLogMessage,
    markAllAsRead,
    clearLogs,
    setLastProcessedMessageId,
    setLogLevel // 导出
  };
});
