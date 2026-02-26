// stores/statStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { StatData } from '../types/StatData';
import { KatEvents } from '@/Constants/KatEvent';

export const useStatStore = defineStore('stat', () => {
  // 状态数据
  const stat_data = ref<StatData>();

  // 核心逻辑：从当前消息变量中获取 stat_data
  const updateFromVariables = () => {
    try {
      // 获取变量集合
      const variables = getVariables({ type: 'message', message_id: -1});

      // 如果变量中包含 stat_data，则更新状态
      if (variables && variables.stat_data) {
        stat_data.value = variables.stat_data;
        console.log('Stat data updated from variables:', stat_data.value);
        toastr.success('已获取变量更新');
      }
    } catch (error) {
      console.error('Failed to update stat data:', error);
    }
  };

  // 初始化数据 (手动调用一次以获取当前状态)
  const initData = () => {
    updateFromVariables();
  };

  // 注册事件监听器
  const registerListener = () => {
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, updateFromVariables);
  };

  return {
    stat_data,
    initData,
    registerListener,
  };
});
