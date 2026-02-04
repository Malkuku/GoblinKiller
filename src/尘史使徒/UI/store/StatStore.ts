// stores/statStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { StatData } from '../types/StatData';
import { getOldStatData } from '@/尘史使徒/UI/util/messageUtil';

export const useStatStore = defineStore('stat', () => {
  // 状态数据
  const stat_data = ref<StatData>();

  const initData = ()=>{
      getOldStatData(getLastMessageId());
  }

  // 处理统计数据的函数
  const processStatData = (detail:{ result:{message_id:number,stat: StatData }}) => {
      console.log(`Stat data updated at ${detail.result.message_id}`);
      stat_data.value = detail.result.stat;
      console.log(`Stat data loaded at :`, stat_data.value);
  };

  const loadedStatData = (detail:{ stat: StatData })=>{
      stat_data.value = detail.stat;
      console.log(`Stat data loaded:`, stat_data.value);
      toastr.success('已获取最新数据');
  }

  // 注册事件监听器
  const registerListener = () => {
    eventOn('era:queryResult', processStatData);
    eventOn('era:writeDone', loadedStatData);
  };

  return {
    stat_data,
    initData,
    processStatData,
    registerListener,
  };
});
