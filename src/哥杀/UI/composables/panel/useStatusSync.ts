// src/views/story/composables/useStatusSync.ts

import { ref, onMounted, onUnmounted } from 'vue';
import { MvuUtil } from '@/Utils/MvuUtil';
import * as toastr from 'toastr';

export function useStatusSync() {
  // --- 角色状态 ---
  const userLifeStatus = ref<any>({
    "生命": { "最大值": 100, "当前": 100 },
    "体力": { "最大值": 100, "当前": 100 },
    "精神": { "最大值": 100, "当前": 100 }
  });
  const combatStrategy = ref('节省体力');
  const combatStrategyCustom = ref('');

  // --- 世界状态 ---
  const currentWorldTime = ref('');
  const currentWorldLocation = ref('');

  let syncInterval: any = null;

  const syncData = () => {
    try {
      const parentWin = window.parent as any;
      if (parentWin.Mvu) {
        const mvuData = parentWin.Mvu.getMvuData({ type: 'message', message_id: -1 });
        if (mvuData && mvuData.stat_data) {
          // 同步角色状态
          if (mvuData.stat_data['角色']?.['user']?.['生命状态']) {
            userLifeStatus.value = mvuData.stat_data['角色']['user']['生命状态'];
          }
          if (mvuData.stat_data['system']?.['战斗策略']) {
            combatStrategy.value = mvuData.stat_data['system']['战斗策略'];
          }
          if (mvuData.stat_data['system']?.['战斗策略自定义内容'] !== undefined) {
            combatStrategyCustom.value = mvuData.stat_data['system']['战斗策略自定义内容'];
          }
          // 同步世界状态
          if (mvuData.stat_data['世界']) {
            currentWorldTime.value = mvuData.stat_data['世界']['时间'];
            currentWorldLocation.value = mvuData.stat_data['世界']['地点'];
          }
        }
      }
    } catch (e) {
      // 忽略错误，因为轮询可能在父窗口未准备好时执行
    }
  };

  const handleStrategyChange = async (newStrategy: string) => {
    combatStrategy.value = newStrategy;
    try {
      await MvuUtil.updateMvuDataByDiff({ "system": { "战斗策略": newStrategy } });
      if (newStrategy !== '自定义') toastr.success(`战斗策略已切换为: ${newStrategy}`);
    } catch (e) {
      console.error("策略切换失败", e);
      toastr.error("策略切换失败");
    }
  };

  const handleCustomContentChange = async (newContent: string) => {
    combatStrategyCustom.value = newContent;
    try {
      await MvuUtil.updateMvuDataByDiff({ "system": { "战斗策略自定义内容": newContent } });
      toastr.success(`自定义策略已更新`);
    } catch (e) {
      console.error("自定义策略更新失败", e);
      toastr.error("自定义策略更新失败");
    }
  };

  onMounted(() => {
    // 状态同步也通过轮询完成，与原逻辑一致
    syncData();
    // 使用与消息轮询相同的间隔
    syncInterval = setInterval(syncData, 200);
  });

  onUnmounted(() => {
    if (syncInterval) clearInterval(syncInterval);
  });

  return {
    userLifeStatus,
    combatStrategy,
    combatStrategyCustom,
    currentWorldTime,
    currentWorldLocation,
    handleStrategyChange,
    handleCustomContentChange,
  };
}
