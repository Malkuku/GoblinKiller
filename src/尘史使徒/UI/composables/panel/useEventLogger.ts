import { ref, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useLogStore } from '@/尘史使徒/UI/store/LogStore';

export function useEventLogger() {
  const logStore = useLogStore();

  // 【修改】从 store 中获取所有需要的状态和方法
  const { logMessages, unreadLogCount, logLevel, showLogPanel } = storeToRefs(logStore);
  const { toggleLogPanel, setLogLevel } = logStore; // 【修改】直接使用 store 中的 toggleLogPanel

  const logListRef = ref<HTMLElement | null>(null);

  // 【修改】监听从 Store 中来的 showLogPanel 状态变化，来处理滚动逻辑
  watch(showLogPanel, (isShown) => {
    if (isShown) {
      // 打开时滚动到列表顶部（即最新日志的位置）
      nextTick(() => {
        if (logListRef.value) {
          logListRef.value.scrollTop = 0;
        }
      });
    }
  });

  // 格式化日志文本的逻辑保留，因为它和UI显示紧密相关
  const formatLogText = (text: string) => {
    return text
      .replace(/\(\s*\+[0-9.]+\s*\)/g, '<span class="log-positive">$&</span>')
      .replace(/\(\s*-[0-9.]+\s*\)/g, '<span class="log-negative">$&</span>')
      .replace(/\[user:(.*?)\]/g, '<span class="log-char-user">$1</span>')
      .replace(/\[main:(.*?)\]/g, '<span class="log-char-main">$1</span>')
      .replace(/\[minor:(.*?)\]/g, '<span class="log-char-minor">$1</span>')
      .replace(/【(.*?)】/g, '<span class="log-attr">$1</span>');
  };

  return {
    logMessages,
    unreadLogCount,
    showLogPanel, // 【修改】从 store 获取
    logListRef,
    logLevel,
    toggleLogPanel, // 【修改】从 store 获取
    formatLogText,
    setLogLevel,
  };
}
