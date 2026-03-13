import { ref, computed, watch, nextTick } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';

export function useEventLogger() {
  const statStore = useStatStore();
  const logMessages = ref<{ id: number; text: string; timestamp: string; read: boolean }[]>([]);
  const showLogPanel = ref(false);
  const logListRef = ref<HTMLElement | null>(null);
  let logIdCounter = 0;

  const unreadLogCount = computed(() => logMessages.value.filter(m => !m.read).length);

  const addLogMessage = (text: string, timestamp: string) => {
    logMessages.value.unshift({
      id: logIdCounter++,
      text,
      timestamp,
      read: showLogPanel.value, // 如果面板已打开，则新消息标记为已读
    });
    if (logMessages.value.length > 100) { // 限制日志数量
      logMessages.value.pop();
    }
    nextTick(() => {
      if (logListRef.value) {
        logListRef.value.scrollTop = 0; // 新日志总是滚动到顶部
      }
    });
  };

  const toggleLogPanel = () => {
    showLogPanel.value = !showLogPanel.value;
    if (showLogPanel.value) {
      // 打开时全部标记为已读
      logMessages.value.forEach(m => m.read = true);
    }
  };

  const formatLogText = (text: string) => {
    // 严格复刻高亮正负数字的正则
    return text.replace(/\(\s*\+[0-9.]+\s*\)/g, '<span class="log-positive">$&</span>')
      .replace(/\(\s*-[0-9.]+\s*\)/g, '<span class="log-negative">$&</span>');
  };

  // 监听 StatStore 数据变化以生成日志
  watch(() => statStore.stat_data, (newData, oldData) => {
    if (!oldData || !newData || !oldData.角色?.user || !newData.角色?.user) {
      return; // 避免在数据不完整时触发
    }

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const oldUser = oldData.角色.user;
    const newUser = newData.角色.user;

    // 严格复刻所有日志生成逻辑
    // 1. 金钱
    if (oldUser.金钱 !== newUser.金钱) {
      const diff = newUser.金钱 - oldUser.金钱;
      addLogMessage(`金钱变化: ${oldUser.金钱} → ${newUser.金钱} (${diff > 0 ? '+' : ''}${diff})`, timestamp);
    }
    // 2. 缥缈异质
    if (oldUser.缥缈异质 !== newUser.缥缈异质) {
      const diff = newUser.缥缈异质 - oldUser.缥缈异质;
      addLogMessage(`缥缈异质变化: ${oldUser.缥缈异质} → ${newUser.缥缈异质} (${diff > 0 ? '+' : ''}${diff})`, timestamp);
    }
    // 3. 生命状态
    const statuses: ('生命' | '体力' | '精神')[] = ['生命', '体力', '精神'];
    statuses.forEach(status => {
      if (oldUser.生命状态[status].当前 !== newUser.生命状态[status].当前) {
        const diff = newUser.生命状态[status].当前 - oldUser.生命状态[status].当前;
        addLogMessage(`${status}变化: ${oldUser.生命状态[status].当前} → ${newUser.生命状态[status].当前} (${diff > 0 ? '+' : ''}${diff})`, timestamp);
      }
    });
    // 4. 任务
    const oldTasks = oldData.任务 || {};
    const newTasks = newData.任务 || {};
    const oldTaskKeys = Object.keys(oldTasks);
    const newTaskKeys = Object.keys(newTasks);
    newTaskKeys.forEach(key => {
      if (!oldTaskKeys.includes(key)) addLogMessage(`获得新任务: ${key}`, timestamp);
    });
    oldTaskKeys.forEach(key => {
      if (!newTaskKeys.includes(key)) addLogMessage(`任务完成/移除: ${key}`, timestamp);
    });

  }, { deep: true });

  return {
    logMessages,
    showLogPanel,
    logListRef,
    unreadLogCount,
    toggleLogPanel,
    formatLogText,
  };
}
