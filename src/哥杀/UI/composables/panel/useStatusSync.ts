// src/views/story/composables/useStatusSync.ts

import { ref, onMounted, onUnmounted } from 'vue';

export function useStatusSync() {
  // --- 角色状态 ---
  const userLifeStatus = ref<any>({
    "生命值": { "最大值": 100, "当前值": 100 },
    "护甲值": { "最大值": 100, "当前值": 100 },
    "体力值": { "最大值": 100, "当前值": 100 },
    "魔力值": { "最大值": 100, "当前值": 100 },
    "信仰力值": { "最大值": 100, "当前值": 100 }
  });

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
          // 同步角色状态 (从 "主角" 节点获取)
          const player = mvuData.stat_data['主角'];
          if (player) {
            userLifeStatus.value = {
              "生命值": player['生命值'] || { "最大值": 100, "当前值": 100 },
              "护甲值": player['护甲值'] || { "最大值": 100, "当前值": 100 },
              "体力值": player['体力值'] || { "最大值": 100, "当前值": 100 },
              "魔力值": player['魔力值'] || { "最大值": 100, "当前值": 100 },
              "信仰力值": player['信仰力值'] || { "最大值": 100, "当前值": 100 }
            };

            // 同步所在地
            if (player['所在地']) {
              currentWorldLocation.value = player['所在地'];
            }
          }

          // 同步世界状态
          if (mvuData.stat_data['世界']) {
            currentWorldTime.value = mvuData.stat_data['世界']['当前时间'] || '';
          }
        }
      }
    } catch (e) {
      // 忽略错误，因为轮询可能在父窗口未准备好时执行
    }
  };

  onMounted(() => {
    // 状态同步也通过轮询完成
    syncData();
    // 使用与消息轮询相同的间隔
    syncInterval = setInterval(syncData, 200);
  });

  onUnmounted(() => {
    if (syncInterval) clearInterval(syncInterval);
  });

  return {
    userLifeStatus,
    currentWorldTime,
    currentWorldLocation,
  };
}
