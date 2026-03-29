import { ref, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useLogStore } from '@/哥杀/UI/store/LogStore';

export function useEventLogger() {
  const logStore = useLogStore();

  const { logMessages, unreadLogCount, logLevel, showLogPanel } = storeToRefs(logStore);
  const { toggleLogPanel, setLogLevel } = logStore;

  const logListRef = ref<HTMLElement | null>(null);

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
    showLogPanel,
    logListRef,
    logLevel,
    toggleLogPanel,
    formatLogText,
    setLogLevel,
  };
}
