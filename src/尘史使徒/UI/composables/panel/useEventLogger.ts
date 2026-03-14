import { ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia'; // 1. 引入 storeToRefs
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useLogStore } from '@/尘史使徒/UI/store/LogStore';

export function useEventLogger() {
  const statStore = useStatStore();
  const logStore = useLogStore();

  // 2. 从 LogStore 中解构 state 和 actions
  // 使用 storeToRefs 保证解构出的 state 保持响应性
  const { logMessages, unreadLogCount, lastProcessedMessageId } = storeToRefs(logStore);
  const { markAllAsRead, clearLogs, setLastProcessedMessageId } = logStore;

  // UI相关的状态，保留在Composable内部是合适的
  const showLogPanel = ref(false);
  const logListRef = ref<HTMLElement | null>(null);

  // 这个函数封装了 "添加日志" 和 "滚动UI" 两个行为，保留它是合理的
  const addLogMessage = (text: string) => {
    // 直接调用 logStore 的 action
    logStore.addLogMessage(text, showLogPanel.value);
    nextTick(() => {
      if (logListRef.value) {
        // 新日志在顶部，所以滚动到顶部
        logListRef.value.scrollTop = 0;
      }
    });
  };

  const toggleLogPanel = () => {
    showLogPanel.value = !showLogPanel.value;
    if (showLogPanel.value) {
      // 打开面板时，将所有消息标记为已读
      markAllAsRead();
    }
  };

  const formatLogText = (text: string) => {
    return text.replace(/\(\s*\+[0-9.]+\s*\)/g, '<span class="log-positive">$&</span>')
      .replace(/\(\s*-[0-9.]+\s*\)/g, '<span class="log-negative">$&</span>');
  };

  watch(() => statStore.stat_data, (newData, oldData) => {
    if (!oldData || !newData || !oldData.角色?.user || !newData.角色?.user) {
      console.error('日志处理：数据不完整，无法处理日志');
      return; // 避免在数据不完整时触发
    }

    const currentMessageId = getLastMessageId();

    // 4. 使用从 Store 获取的状态和 Action
    if (lastProcessedMessageId.value !== currentMessageId) {
      // ID发生了变化，说明是新的一轮消息，清空旧日志
      clearLogs();
      // 更新我们记录在 Store 中的 ID
      setLastProcessedMessageId(currentMessageId);
    }

    const oldUser = oldData.角色.user;
    const newUser = newData.角色.user;

    // --- 日志生成逻辑 ---
    // 5. [优化] 在日志文本中统一使用 currentMessageId，确保一致性
    // 1. 金钱
    if (oldUser.金钱 !== newUser.金钱) {
      const diff = newUser.金钱 - oldUser.金钱;
      addLogMessage(`[ID:${currentMessageId}]金钱变化: ${oldUser.金钱} → ${newUser.金钱} (${diff > 0 ? '+' : ''}${diff})`);
    }
    // 2. 生命状态
    const statuses: ('生命' | '体力' | '精神')[] = ['生命', '体力', '精神'];
    statuses.forEach(status => {
      if (oldUser.生命状态[status].当前 !== newUser.生命状态[status].当前) {
        const diff = newUser.生命状态[status].当前 - oldUser.生命状态[status].当前;
        addLogMessage(`[ID:${currentMessageId}]${status}变化: ${oldUser.生命状态[status].当前} → ${newUser.生命状态[status].当前} (${diff > 0 ? '+' : ''}${diff})`);
      }
    });
    // 3. 任务
    const oldTasks = oldData.任务 || {};
    const newTasks = newData.任务 || {};
    const oldTaskKeys = Object.keys(oldTasks);
    const newTaskKeys = Object.keys(newTasks);
    newTaskKeys.forEach(key => {
      if (!oldTaskKeys.includes(key)) addLogMessage(`[ID:${currentMessageId}]获得新任务: ${key}`);
    });
    oldTaskKeys.forEach(key => {
      if (!newTaskKeys.includes(key)) addLogMessage(`[ID:${currentMessageId}]任务完成/移除: ${key}`);
    });
    newTaskKeys.forEach(key => {
      if (!oldTaskKeys.includes(key)) return;

      const oldTask = oldTasks[key];
      const newTask = newTasks[key];

      const oldProgressCount = oldTask.取得成果?.length || 0;
      const newProgressCount = newTask.取得成果?.length || 0;

      if (newProgressCount > oldProgressCount) {
        const latestProgress = newTask.取得成果[newTask.取得成果.length - 1];
        addLogMessage(`[ID:${currentMessageId}]任务'${key}'取得新进展: ${latestProgress}`);
      }
    });

  }, { deep: true });

  return {
    // 返回从 store 中解构出的响应式 state
    logMessages,
    unreadLogCount,
    showLogPanel,
    logListRef,
    toggleLogPanel,
    formatLogText,
  };
}
