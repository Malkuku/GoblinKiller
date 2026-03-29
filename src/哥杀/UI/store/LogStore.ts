import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLogStore = defineStore('log', () => {
  // --- State ---
  const logMessages = ref<{ id: number; text: string; read: boolean }[]>([]);
  let logIdCounter = 0;

  const lastProcessedMessageId = ref<string | number | null>(null);
  const logLevel = ref<0 | 1 | 2>(1); // 0=仅自己, 1=主要角色, 2=全部角色

  // 将面板显示状态移入 Store，作为唯一数据源
  const showLogPanel = ref(false);

  // --- Getters (Computed) ---
  const unreadLogCount = ref(0); // 使用 ref 替代 computed 以便手动控制

  // --- Actions ---

  /**
   * 添加日志的核心方法
   * 不再需要外部传入 isPanelOpen，而是直接使用 Store 内部的 showLogPanel 状态。
   */
  function addLogMessage(text: string) {
    const isRead = showLogPanel.value; // 如果面板是打开的，则消息默认为已读

    logMessages.value.unshift({
      id: logIdCounter++,
      text,
      read: isRead,
    });

    // 只有当消息是未读时，才增加未读计数
    if (!isRead) {
      unreadLogCount.value++;
    }

    // 限制日志最大数量
    if (logMessages.value.length > 100) {
      logMessages.value.pop();
    }
  }

  /**
   * 标记所有为已读，并手动重置未读计数
   */
  function markAllAsRead() {
    logMessages.value.forEach(m => {
      if (!m.read) {
        m.read = true;
      }
    });
    unreadLogCount.value = 0; // 直接清零计数
  }

  /**
   * 控制面板显示的 Action
   * 将打开面板和标记已读的逻辑封装在一起
   */
  function toggleLogPanel() {
    showLogPanel.value = !showLogPanel.value;
    // 如果是打开面板，则立即标记所有消息为已读
    if (showLogPanel.value) {
      markAllAsRead();
    }
  }

  function clearLogs() {
    logMessages.value = [];
    logIdCounter = 0;
    markAllAsRead(); // 清空日志时也清空未读计数
  }

  function setLastProcessedMessageId(id: string | number) {
    lastProcessedMessageId.value = id;
  }

  function setLogLevel(level: 0 | 1 | 2) {
    logLevel.value = level;
  }

  return {
    // State
    logMessages,
    lastProcessedMessageId,
    logLevel,
    showLogPanel, // 导出状态
    unreadLogCount, // 导出未读计数

    // Actions
    addLogMessage,
    markAllAsRead,
    clearLogs,
    setLastProcessedMessageId,
    setLogLevel,
    toggleLogPanel, // 导出新的 Action
  };
});
