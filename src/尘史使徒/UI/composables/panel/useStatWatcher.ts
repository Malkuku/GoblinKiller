import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useLogStore } from '@/尘史使徒/UI/store/LogStore';
import type { UserCharacterData, MainCharacterData, MinorCharacterData } from '@/尘史使徒/UI/types/StatData';

// 定义通用角色接口
type GenericCharacter = UserCharacterData | MainCharacterData | MinorCharacterData;

// 这个函数只应该在应用的根组件被调用一次
export function useStatWatcher() {
  const statStore = useStatStore();
  const logStore = useLogStore();
  const { lastProcessedMessageId, logLevel } = storeToRefs(logStore);

  // --- 从 useEventLogger 移动过来的辅助函数 ---

  const getDisplayName = (key: string, type: 'user' | 'main' | 'minor'): string => {
    let name = key;
    if (type === 'user') {
      try {
        name = substitudeMacros('{{user}}');
      } catch (e) {
        name = 'User';
      }
      return `[user:${name}]`;
    } else if (type === 'main') {
      return `[main:${name}]`;
    } else {
      return `[minor:${name}]`;
    }
  };

  const compareCharacterData = (
    key: string,
    type: 'user' | 'main' | 'minor',
    oldChar: GenericCharacter,
    newChar: GenericCharacter,
    msgId: string | number
  ) => {
    const nameHtml = getDisplayName(key, type);
    const statuses: (keyof typeof oldChar.生命状态)[] = ['生命', '体力', '精神'];
    statuses.forEach(status => {
      const oldVal = oldChar.生命状态?.[status]?.当前;
      const newVal = newChar.生命状态?.[status]?.当前;
      if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
        const diff = newVal - oldVal;
        // 【修改】简化调用，不再传递 isPanelOpen 参数
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${status}】: ${oldVal} → ${newVal} (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`);
      }
    });

    const oldArts = oldChar.术之等级 || {};
    const newArts = newChar.术之等级 || {};
    for (const artKey in newArts) {
      const oldArt = oldArts[artKey];
      const newArt = newArts[artKey];
      if (!oldArt) {
        // 【修改】简化调用
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 习得新术法 【${artKey}】 (Lv.${newArt.等级})`);
        continue;
      }
      if (oldArt.经验 !== newArt.经验) {
        const diff = newArt.经验 - oldArt.经验;
        // 【修改】简化调用
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${artKey}】经验: ${oldArt.经验} → ${newArt.经验} (${diff >= 0 ? `+${diff}` : diff})`);
      }
      if (oldArt.等级 !== newArt.等级) {
        // 【修改】简化调用
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${artKey}】等级提升! Lv.${oldArt.等级} → Lv.${newArt.等级}`);
      }
    }
  };

  // --- 核心监听逻辑 ---

  watch(() => statStore.stat_data, (newData, oldData) => {
    if (!oldData || !newData || !oldData.角色 || !newData.角色) {
      return;
    }

    const currentMessageId = (window as any).getLastMessageId ? (window as any).getLastMessageId() : Date.now();

    if (lastProcessedMessageId.value !== currentMessageId) {
      logStore.clearLogs();
      logStore.setLastProcessedMessageId(currentMessageId);
    }

    const level = logLevel.value;

    // User
    if (oldData.角色.user && newData.角色.user) {
      compareCharacterData('user', 'user', oldData.角色.user, newData.角色.user, currentMessageId);
      if (oldData.角色.user.金钱 !== newData.角色.user.金钱) {
        const diff = newData.角色.user.金钱 - oldData.角色.user.金钱;
        // 【修改】简化调用
        logStore.addLogMessage(`[ID:${currentMessageId}] ${getDisplayName('user', 'user')} 【金钱】: ${oldData.角色.user.金钱} → ${newData.角色.user.金钱} (${diff > 0 ? '+' : ''}${diff})`);
      }
    }

    // Main Characters
    if (level >= 1) {
      const oldMain = oldData.角色.主要角色 || {};
      const newMain = newData.角色.主要角色 || {};
      Object.keys(newMain).forEach(key => {
        if (oldMain[key]) {
          compareCharacterData(key, 'main', oldMain[key], newMain[key], currentMessageId);
        }
      });
    }

    // Minor Characters
    if (level >= 2) {
      const oldMinor = oldData.角色.次要角色 || {};
      const newMinor = newData.角色.次要角色 || {};
      Object.keys(newMinor).forEach(key => {
        if (oldMinor[key]) {
          compareCharacterData(key, 'minor', oldMinor[key], newMinor[key], currentMessageId);
        }
      });
    }

    // Tasks
    const oldTasks = oldData.任务 || {};
    const newTasks = newData.任务 || {};
    const newTaskKeys = Object.keys(newTasks);
    const oldTaskKeys = Object.keys(oldTasks);
    newTaskKeys.forEach(key => {
      if (!oldTaskKeys.includes(key)) {
        // 【修改】简化调用
        logStore.addLogMessage(`[ID:${currentMessageId}] 获得新任务: 【${key}】`);
      }
    });
    oldTaskKeys.forEach(key => {
      if (!newTaskKeys.includes(key)) {
        // 【修改】简化调用
        logStore.addLogMessage(`[ID:${currentMessageId}] 任务完成/移除: 【${key}】`);
      }
    });
    newTaskKeys.forEach(key => {
      if (!oldTaskKeys.includes(key)) return;
      const oldTask = oldTasks[key];
      const newTask = newTasks[key];
      const oldProgressCount = oldTask.取得成果?.length || 0;
      const newProgressCount = newTask.取得成果?.length || 0;
      if (newProgressCount > oldProgressCount) {
        const latestProgress = newTask.取得成果[newTask.取得成果.length - 1];
        // 【修改】简化调用
        logStore.addLogMessage(`[ID:${currentMessageId}] 任务【${key}】取得新进展: ${latestProgress}`);
      }
    });

  }, { deep: true });

  console.log('Global Stat Watcher Initialized.');
}
