// src/尘史使徒/UI/composables/panel/useEventLogger.ts

import { ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useLogStore } from '@/尘史使徒/UI/store/LogStore';
import {
  StatData,
  UserCharacterData,
  MainCharacterData,
  MinorCharacterData,
  LifeStatus,
  ArtLevelData
} from '@/尘史使徒/UI/types/StatData';

// 声明外部全局函数 (SillyTavern/TavernAI 环境)
declare function substitudeMacros(text: string): string;

// 定义通用角色接口用于对比
type GenericCharacter = UserCharacterData | MainCharacterData | MinorCharacterData;

export function useEventLogger() {
  const statStore = useStatStore();
  const logStore = useLogStore();

  const { logMessages, unreadLogCount, lastProcessedMessageId, logLevel } = storeToRefs(logStore);
  const { markAllAsRead, clearLogs, setLastProcessedMessageId } = logStore;

  const showLogPanel = ref(false);
  const logListRef = ref<HTMLElement | null>(null);

  const addLogMessage = (text: string) => {
    logStore.addLogMessage(text, showLogPanel.value);
    nextTick(() => {
      if (logListRef.value) {
        logListRef.value.scrollTop = 0;
      }
    });
  };

  const toggleLogPanel = () => {
    showLogPanel.value = !showLogPanel.value;
    if (showLogPanel.value) {
      markAllAsRead();
    }
  };

  // 格式化日志文本，处理颜色
  const formatLogText = (text: string) => {
    return text
      .replace(/\(\s*\+[0-9.]+\s*\)/g, '<span class="log-positive">$&</span>')
      .replace(/\(\s*-[0-9.]+\s*\)/g, '<span class="log-negative">$&</span>')
      // 处理角色名字颜色
      .replace(/\[user:(.*?)\]/g, '<span class="log-char-user">$1</span>')
      .replace(/\[main:(.*?)\]/g, '<span class="log-char-main">$1</span>')
      .replace(/\[minor:(.*?)\]/g, '<span class="log-char-minor">$1</span>')
      // 处理属性高亮
      .replace(/【(.*?)】/g, '<span class="log-attr">$1</span>');
  };

  // 获取显示用的名字
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

  // 对比单个角色的数据
  const compareCharacterData = (
    key: string,
    type: 'user' | 'main' | 'minor',
    oldChar: GenericCharacter,
    newChar: GenericCharacter,
    msgId: string | number
  ) => {
    const nameHtml = getDisplayName(key, type);

    // 1. 三态变化 (生命, 体力, 精神)
    const statuses: (keyof LifeStatus)[] = ['生命', '体力', '精神'];
    statuses.forEach(status => {
      const oldVal = oldChar.生命状态?.[status]?.当前;
      const newVal = newChar.生命状态?.[status]?.当前;

      if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
        const diff = newVal - oldVal;
        addLogMessage(`[ID:${msgId}] ${nameHtml} 【${status}】: ${oldVal} → ${newVal} (${diff > 0 ? '+' : ''}${diff})`);
      }
    });

    // 2. 术之等级 (经验值获取)
    const oldArts = oldChar.术之等级 || {};
    const newArts = newChar.术之等级 || {};

    // 遍历新的术列表
    for (const artKey in newArts) {
      const oldArt = oldArts[artKey];
      const newArt = newArts[artKey];

      if (!oldArt) {
        // 新习得
        addLogMessage(`[ID:${msgId}] ${nameHtml} 习得新术法 【${artKey}】 (Lv.${newArt.等级})`);
        continue;
      }

      if (oldArt.经验 !== newArt.经验) {
        const diff = newArt.经验 - oldArt.经验;
        const diffString = diff >= 0 ? `+${diff}` : `${diff}`;
        addLogMessage(`[ID:${msgId}] ${nameHtml} 【${artKey}】经验: ${oldArt.经验} → ${newArt.经验} (${diffString})`);
      }

      // 等级变化 (UNCHANGED - already logs level changes)
      if (oldArt.等级 !== newArt.等级) {
        addLogMessage(`[ID:${msgId}] ${nameHtml} 【${artKey}】等级提升! Lv.${oldArt.等级} → Lv.${newArt.等级}`);
      }
    }
  };

  watch(() => statStore.stat_data, (newData, oldData) => {
    if (!oldData || !newData || !oldData.角色 || !newData.角色) {
      return;
    }

    // 获取当前消息ID (假设外部有 getLastMessageId 函数，或者从 store 获取)
    // 这里为了代码完整性，假设存在一个获取ID的方法，如果没有则使用时间戳
    const currentMessageId = (window as any).getLastMessageId ? (window as any).getLastMessageId() : Date.now();

    if (lastProcessedMessageId.value !== currentMessageId) {
      clearLogs();
      setLastProcessedMessageId(currentMessageId);
    }

    const level = logLevel.value;

    // --- 1. User (Always check) ---
    if (oldData.角色.user && newData.角色.user) {
      compareCharacterData('user', 'user', oldData.角色.user, newData.角色.user, currentMessageId);

      // 金钱 (仅 User)
      if (oldData.角色.user.金钱 !== newData.角色.user.金钱) {
        const diff = newData.角色.user.金钱 - oldData.角色.user.金钱;
        addLogMessage(`[ID:${currentMessageId}] ${getDisplayName('user', 'user')} 【金钱】: ${oldData.角色.user.金钱} → ${newData.角色.user.金钱} (${diff > 0 ? '+' : ''}${diff})`);
      }
    }

    // --- 2. Main Characters (Level >= 1) ---
    if (level >= 1) {
      const oldMain = oldData.角色.主要角色 || {};
      const newMain = newData.角色.主要角色 || {};

      Object.keys(newMain).forEach(key => {
        if (oldMain[key]) {
          compareCharacterData(key, 'main', oldMain[key], newMain[key], currentMessageId);
        }
      });
    }

    // --- 3. Minor Characters (Level >= 2) ---
    if (level >= 2) {
      const oldMinor = oldData.角色.次要角色 || {};
      const newMinor = newData.角色.次要角色 || {};

      Object.keys(newMinor).forEach(key => {
        if (oldMinor[key]) {
          compareCharacterData(key, 'minor', oldMinor[key], newMinor[key], currentMessageId);
        }
      });
    }

    // --- 4. Global Tasks (Always check) ---
    const oldTasks = oldData.任务 || {};
    const newTasks = newData.任务 || {};
    const newTaskKeys = Object.keys(newTasks);
    const oldTaskKeys = Object.keys(oldTasks);

    newTaskKeys.forEach(key => {
      if (!oldTaskKeys.includes(key)) addLogMessage(`[ID:${currentMessageId}] 获得新任务: 【${key}】`);
    });
    oldTaskKeys.forEach(key => {
      if (!newTaskKeys.includes(key)) addLogMessage(`[ID:${currentMessageId}] 任务完成/移除: 【${key}】`);
    });
    newTaskKeys.forEach(key => {
      if (!oldTaskKeys.includes(key)) return;
      const oldTask = oldTasks[key];
      const newTask = newTasks[key];
      const oldProgressCount = oldTask.取得成果?.length || 0;
      const newProgressCount = newTask.取得成果?.length || 0;

      if (newProgressCount > oldProgressCount) {
        const latestProgress = newTask.取得成果[newTask.取得成果.length - 1];
        addLogMessage(`[ID:${currentMessageId}] 任务【${key}】取得新进展: ${latestProgress}`);
      }
    });

  }, { deep: true });

  return {
    logMessages,
    unreadLogCount,
    showLogPanel,
    logListRef,
    logLevel, // 导出 level
    toggleLogPanel,
    formatLogText,
    setLogLevel: logStore.setLogLevel // 导出 setter
  };
}
