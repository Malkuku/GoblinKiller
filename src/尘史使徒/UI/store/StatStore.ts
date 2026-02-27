// stores/statStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { StatData } from '../types/StatData';
import { KatEvents } from '@/Constants/KatEvent';

export const useStatStore = defineStore('stat', () => {
  // 状态数据
  const stat_data = ref<StatData>();

  // 用于存储轮询定时器的ID
  let pollingTimer: any = null;

  // 核心逻辑：从当前消息变量中获取 stat_data
  // 增加 silent 参数，用于在轮询时避免频繁弹出错误提示（可选）
  const updateFromVariables = async (silent = false) => {
    try {
      // 获取变量集合
      await waitGlobalInitialized('Mvu');
      const variables = getVariables({ type: 'message', message_id: -1 });

      // 如果变量中包含 stat_data，则更新状态
      if (variables && variables.stat_data) {
        stat_data.value = variables.stat_data;
        console.log('Stat data updated from variables:', stat_data.value);
        if (!silent) toastr.success('已获取变量更新');
        return true; // 返回成功标志
      }
      return false;
    } catch (error) {
      console.error('Failed to update stat data:', error);
      if (!silent) toastr.error('获取变量更新失败');
      return false;
    }
  };

  const clearAndBuildVariables = async () => {
    try {
      // 获取变量集合
      stat_data.value = {} as any;
      await waitGlobalInitialized('Mvu');
      const variables = getVariables({ type: 'message', message_id: -1 });
      // 如果变量中包含 stat_data，则更新状态
      if (variables && variables.stat_data) {
        stat_data.value = variables.stat_data;
        console.log('Stat data updated from variables:', stat_data.value);
        toastr.success('已获取变量更新');
      }
    } catch (error) {
      console.error('Failed to update stat data:', error);
      toastr.error('获取变量更新失败');
    }
  };

  // 初始化数据 (包含轮询逻辑)
  const initData = () => {
    // 1. 立即尝试获取一次
    updateFromVariables();

    // 2. 如果定时器已存在，先清除，防止重复
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }

    // 3. 启动轮询：每1秒执行一次
    pollingTimer = setInterval(async () => {
      // 如果数据已经获取到了，停止轮询
      if (stat_data.value && Object.keys(stat_data.value).length > 0) {
        clearInterval(pollingTimer);
        pollingTimer = null;
        return;
      }

      // 尝试获取数据，传入 true 开启静默模式（防止轮询时一直弹窗，可根据需求去掉）
      const success = await updateFromVariables(true);

      // 如果本次获取成功，清除定时器
      if (success) {
        clearInterval(pollingTimer);
        pollingTimer = null;
        console.log('Polling finished: Data acquired.');
      }
    }, 1000);
  };

  // 注册事件监听器
  const registerListener = () => {
    eventOn('mag_variable_update_ended'
      , () => updateFromVariables());
    eventOn(KatEvents.kat_mvu_update_finished, () => updateFromVariables());
    eventOn(tavern_events.MESSAGE_DELETED, () => updateFromVariables());
    eventOn(tavern_events.CHAT_CHANGED, clearAndBuildVariables);
  };

  return {
    stat_data,
    initData,
    registerListener,
  };
});
