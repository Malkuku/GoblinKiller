// stores/questStore.js
import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';

export const useQuestStore = defineStore('quest', () => {
  const statStore = useStatStore();

  // 辅助函数：将 Record<string, T> 转换为 Array<T & { title: string }>
  const transformData = (record) => {
    if (!record) return [];
    return Object.entries(record).map(([key, value]) => ({
      title: key,
      ...value,
    }));
  };

  // 1. 主线任务 (Main Quest)
  const mainQuests = computed(() => {
    return transformData(statStore.stat_data?.主线);
  });

  // 2. 支线/委托任务 (Tasks)
  const tasks = computed(() => {
    return transformData(statStore.stat_data?.任务);
  });

  // 3. 世界事件 (Events)
  const events = computed(() => {
    return transformData(statStore.stat_data?.事件);
  });

  // 判断是否有任何任务数据（用于 Layout 导航栏显示）
  const hasQuestData = computed(() => {
    return (
      mainQuests.value.length > 0 ||
      tasks.value.length > 0 ||
      events.value.length > 0
    );
  });

  // 统计当前活跃任务数量（用于角标等）
  const activeCount = computed(() => {
    return mainQuests.value.length + tasks.value.length;
  });

  return {
    mainQuests,
    tasks,
    events,
    hasQuestData,
    activeCount
  };
});
