import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useLogStore } from '@/尘史使徒/UI/store/LogStore';
import { PlayerCharacter, RelationCharacter, StatData } from '@/哥杀/UI/types/StatData';


// 定义通用角色接口
type GenericCharacter = PlayerCharacter | RelationCharacter;

// 这个函数只应该在应用的根组件被调用一次
export function useStatWatcher() {
  const statStore = useStatStore();
  const logStore = useLogStore();
  const { lastProcessedMessageId, logLevel } = storeToRefs(logStore);

  // --- 辅助函数 ---

  const getDisplayName = (key: string, type: 'player' | 'relation'): string => {
    let name = key;
    if (type === 'player') {
      try {
        name = typeof substitudeMacros === 'function' ? substitudeMacros('{{user}}') : key;
      } catch (e) {
        name = '主角';
      }
      return `[主角:${name}]`;
    } else {
      return `[关系:${name}]`;
    }
  };

  const compareCharacterData = (
    key: string,
    type: 'player' | 'relation',
    oldChar: GenericCharacter,
    newChar: GenericCharacter,
    msgId: string | number
  ) => {
    const nameHtml = getDisplayName(key, type);

    // 比较资源状态 (兼容主角和关系角色的不同键名)
    const resourceKeys = ['生命值', '护甲值', '魔力值', '信仰力体', '体力资', '护甲魔', '魔力信'];
    resourceKeys.forEach(resKey => {
      const oldRes = (oldChar as any)[resKey];
      const newRes = (newChar as any)[resKey];
      const oldVal = oldRes?.当前值;
      const newVal = newRes?.当前值;
      if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
        const diff = newVal - oldVal;
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${resKey}】: ${oldVal} → ${newVal} (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`);
      }
    });

    // 比较技能列表
    const oldSkills = oldChar.技能列表 || {};
    const newSkills = newChar.技能列表 || {};
    for (const skillKey in newSkills) {
      const oldSkill = oldSkills[skillKey];
      const newSkill = newSkills[skillKey];

      if (!oldSkill) {
        const levelText = newSkill?.等级 !== undefined ? ` (Lv.${newSkill.等级})` : '';
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 习得新技能 【${skillKey}】${levelText}`);
        continue;
      }

      // 如果技能对象包含经验或等级字段，则进行比较
      if (typeof oldSkill === 'object' && typeof newSkill === 'object') {
        if (oldSkill.经验 !== undefined && newSkill.经验 !== undefined && oldSkill.经验 !== newSkill.经验) {
          const diff = newSkill.经验 - oldSkill.经验;
          logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${skillKey}】经验: ${oldSkill.经验} → ${newSkill.经验} (${diff >= 0 ? `+${diff}` : diff})`);
        }
        if (oldSkill.等级 !== undefined && newSkill.等级 !== undefined && oldSkill.等级 !== newSkill.等级) {
          logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${skillKey}】等级提升! Lv.${oldSkill.等级} → Lv.${newSkill.等级}`);
        }
      }
    }
  };

  // --- 核心监听逻辑 ---

  watch(() => statStore.stat_data as unknown as StatData, (newData, oldData) => {
    if (!oldData || !newData || !oldData.主角 || !newData.主角) {
      return;
    }

    const currentMessageId = (window as any).getLastMessageId ? (window as any).getLastMessageId() : Date.now();

    if (lastProcessedMessageId.value !== currentMessageId) {
      logStore.clearLogs();
      logStore.setLastProcessedMessageId(currentMessageId);
    }

    const level = logLevel.value;

    // 主角 (Player)
    if (oldData.主角 && newData.主角) {
      compareCharacterData(newData.主角.姓名 || '主角', 'player', oldData.主角, newData.主角, currentMessageId);

      // 比较金钱
      const oldMoney = oldData.主角.背包?.金钱;
      const newMoney = newData.主角.背包?.金钱;
      if (oldMoney && newMoney) {
        ['金币', '银币', '铜币'].forEach(coin => {
          const oldCoin = (oldMoney as any)[coin] || 0;
          const newCoin = (newMoney as any)[coin] || 0;
          if (oldCoin !== newCoin) {
            const diff = newCoin - oldCoin;
            logStore.addLogMessage(`[ID:${currentMessageId}] ${getDisplayName(newData.主角.姓名 || '主角', 'player')} 【${coin}】: ${oldCoin} → ${newCoin} (${diff > 0 ? '+' : ''}${diff})`);
          }
        });
      }
    }

    // 关系角色 (Relations)
    if (level >= 1 && oldData.关系列表 && newData.关系列表) {
      const oldRels = oldData.关系列表;
      const newRels = newData.关系列表;
      Object.keys(newRels).forEach(key => {
        const oldRel = oldRels[key];
        const newRel = newRels[key];
        if (oldRel && newRel && oldRel !== '待初始化' && newRel !== '待初始化') {
          compareCharacterData(key, 'relation', oldRel, newRel, currentMessageId);
        }
      });
    }

    // 任务日志 (Tasks)
    const oldTasksInProgress = oldData.主角.任务日志?.进行中 || {};
    const newTasksInProgress = newData.主角.任务日志?.进行中 || {};
    const oldTasksCompleted = oldData.主角.任务日志?.已完成 || {};
    const newTasksCompleted = newData.主角.任务日志?.已完成 || {};

    const newInProgressKeys = Object.keys(newTasksInProgress);
    const oldInProgressKeys = Object.keys(oldTasksInProgress);
    const newCompletedKeys = Object.keys(newTasksCompleted);
    const oldCompletedKeys = Object.keys(oldTasksCompleted);

    // 新增进行中任务
    newInProgressKeys.forEach(key => {
      if (!oldInProgressKeys.includes(key)) {
        logStore.addLogMessage(`[ID:${currentMessageId}] 获得新任务: 【${key}】`);
      }
    });

    // 任务完成
    newCompletedKeys.forEach(key => {
      if (!oldCompletedKeys.includes(key)) {
        logStore.addLogMessage(`[ID:${currentMessageId}] 任务完成: 【${key}】`);
      }
    });

    // 任务进度 (兼容可能存在的进度字段)
    newInProgressKeys.forEach(key => {
      if (!oldInProgressKeys.includes(key)) return;
      const oldTask = oldTasksInProgress[key];
      const newTask = newTasksInProgress[key];
      const oldProgressCount = oldTask?.取得成果?.length || 0;
      const newProgressCount = newTask?.取得成果?.length || 0;
      if (newProgressCount > oldProgressCount) {
        const latestProgress = newTask.取得成果[newTask.取得成果.length - 1];
        logStore.addLogMessage(`[ID:${currentMessageId}] 任务【${key}】取得新进展: ${latestProgress}`);
      }
    });

  }, { deep: true });

  console.log('Global Stat Watcher Initialized.');
}
