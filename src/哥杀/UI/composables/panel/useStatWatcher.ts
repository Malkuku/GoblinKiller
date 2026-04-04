import { AbilityScores, Enemy, Money, Pet, PlayerCharacter, Progress, RelationCharacter, Resource, StatData } from '@/哥杀/UI/types/StatData';
import { useLogStore } from '@/哥杀/UI/store/LogStore';
import { useStatStore } from '@/哥杀/UI/store/StatStore';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';

export function useStatWatcher() {
  const statStore = useStatStore();
  const logStore = useLogStore();
  const { lastProcessedMessageId, logLevel } = storeToRefs(logStore);

  const getDisplayName = (key: string, type: 'player' | 'relation'): string => {
    let name = key;
    if (type === 'player') {
      try {
        name = typeof substitudeMacros === 'function' ? substitudeMacros('{{user}}') : key;
      } catch (e) {
        name = '主角';
      }
    }
    return `[${name}]`;
  };

  const compareResource = (
    nameHtml: string,
    resKey: string,
    oldRes: Resource | undefined,
    newRes: Resource | undefined,
    msgId: string | number
  ) => {
    if (!oldRes || !newRes) return;

    const oldVal = oldRes.当前值;
    const newVal = newRes.当前值;
    if (oldVal !== null && newVal !== null && oldVal !== newVal) {
      const diff = newVal - oldVal;
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${resKey}】: ${oldVal} → ${newVal} (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`);
    }

    const oldMax = oldRes.最大值;
    const newMax = newRes.最大值;
    if (oldMax !== null && newMax !== null && oldMax !== newMax) {
      const diff = newMax - oldMax;
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${resKey}最大值】: ${oldMax} → ${newMax} (${diff > 0 ? '+' : ''}${diff})`);
    }
  };

  const compareAbilityScores = (
    nameHtml: string,
    oldAbility: AbilityScores | undefined,
    newAbility: AbilityScores | undefined,
    msgId: string | number
  ) => {
    if (!oldAbility || !newAbility) return;

    const abilityKeys: (keyof AbilityScores)[] = ['力量', '敏捷', '感知', '知识', '魅力', '魔力', '信仰力'];
    abilityKeys.forEach(attr => {
      const oldVal = oldAbility[attr];
      const newVal = newAbility[attr];
      if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
        const diff = newVal - oldVal;
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 能力【${attr}】: ${oldVal} → ${newVal} (${diff > 0 ? '+' : ''}${diff})`);
      }
    });
  };

  const compareProgress = (
    nameHtml: string,
    oldProgress: Progress | undefined,
    newProgress: Progress | undefined,
    msgId: string | number
  ) => {
    if (!oldProgress || !newProgress) return;

    const progressKeys: (keyof Progress)[] = ['力量', '敏捷', '感知', '知识', '魅力', '魔力', '信仰力'];
    progressKeys.forEach(attr => {
      const oldVal = oldProgress[attr];
      const newVal = newProgress[attr];
      if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
        const diff = newVal - oldVal;
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 历练【${attr}】: ${oldVal} → ${newVal} (${diff > 0 ? '+' : ''}${diff})`);
      }
    });
  };

  const compareSkills = (
    nameHtml: string,
    oldSkills: Record<string, any> | undefined,
    newSkills: Record<string, any> | undefined,
    msgId: string | number
  ) => {
    if (!oldSkills || !newSkills) return;

    for (const skillKey in newSkills) {
      const oldSkill = oldSkills[skillKey];
      const newSkill = newSkills[skillKey];

      if (!oldSkill) {
        const levelText = newSkill?.等级 !== undefined ? ` (Lv.${newSkill.等级})` : '';
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 习得新技能 【${skillKey}】${levelText}`);
        continue;
      }

      if (typeof oldSkill === 'object' && typeof newSkill === 'object') {
        if (oldSkill.经验 !== undefined && newSkill.经验 !== undefined && oldSkill.经验 !== newSkill.经验) {
          const diff = newSkill.经验 - oldSkill.经验;
          logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${skillKey}】经验: ${oldSkill.经验} → ${newSkill.经验} (${diff >= 0 ? `+${diff}` : diff})`);
        }
        if (oldSkill.熟练度 !== undefined && newSkill.熟练度 !== undefined && oldSkill.熟练度 !== newSkill.熟练度) {
          const diff = newSkill.熟练度 - oldSkill.熟练度;
          logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${skillKey}】熟练度: ${oldSkill.熟练度} → ${newSkill.熟练度} (${diff >= 0 ? `+${diff}` : diff})`);
        }
        if (oldSkill.等级 !== undefined && newSkill.等级 !== undefined && oldSkill.等级 !== newSkill.等级) {
          logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${skillKey}】等级提升! Lv.${oldSkill.等级} → Lv.${newSkill.等级}`);
        }
      }
    }
  };

  const compareMoney = (
    nameHtml: string,
    oldMoney: Money | undefined,
    newMoney: Money | undefined,
    msgId: string | number
  ) => {
    if (!oldMoney || !newMoney) return;

    const coinKeys: (keyof Money)[] = ['金币', '银币', '铜币'];
    coinKeys.forEach(coin => {
      const oldCoin = oldMoney[coin] || 0;
      const newCoin = newMoney[coin] || 0;
      if (oldCoin !== newCoin) {
        const diff = newCoin - oldCoin;
        logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【${coin}】: ${oldCoin} → ${newCoin} (${diff > 0 ? '+' : ''}${diff})`);
      }
    });
  };

  const comparePlayerCharacter = (
    key: string,
    oldChar: PlayerCharacter,
    newChar: PlayerCharacter,
    msgId: string | number
  ) => {
    const nameHtml = getDisplayName(key, 'player');

    const resourceKeys: (keyof Pick<PlayerCharacter, '生命值' | '护甲值' | '魔力值' | '信仰力值' | '体力值'>)[] =
      ['生命值', '护甲值', '魔力值', '信仰力值', '体力值'];
    resourceKeys.forEach(resKey => {
      compareResource(nameHtml, resKey, oldChar[resKey] as Resource, newChar[resKey] as Resource, msgId);
    });

    compareAbilityScores(nameHtml, oldChar.能力, newChar.能力, msgId);
    compareProgress(nameHtml, oldChar.历练进度, newChar.历练进度, msgId);
    compareSkills(nameHtml, oldChar.技能列表, newChar.技能列表, msgId);
    compareMoney(nameHtml, oldChar.背包?.金钱, newChar.背包?.金钱, msgId);

    if (oldChar.经验等级 !== undefined && newChar.经验等级 !== undefined && oldChar.经验等级 !== newChar.经验等级) {
      const diff = newChar.经验等级 - oldChar.经验等级;
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【经验等级】: ${oldChar.经验等级} → ${newChar.经验等级} (${diff > 0 ? '+' : ''}${diff})`);
    }

    if (oldChar.技能点 !== undefined && newChar.技能点 !== undefined && oldChar.技能点 !== newChar.技能点) {
      const diff = newChar.技能点 - oldChar.技能点;
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【技能点】: ${oldChar.技能点} → ${newChar.技能点} (${diff > 0 ? '+' : ''}${diff})`);
    }

    if (oldChar.所在地 !== newChar.所在地) {
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【所在地】: ${oldChar.所在地} → ${newChar.所在地}`);
    }

    if (oldChar.层级 !== newChar.层级) {
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【层级】: ${oldChar.层级} → ${newChar.层级}`);
    }
  };

  const compareRelationCharacter = (
    key: string,
    oldChar: RelationCharacter,
    newChar: RelationCharacter,
    msgId: string | number
  ) => {
    const nameHtml = getDisplayName(key, 'relation');

    const resourceKeys: (keyof Pick<RelationCharacter, '生命值' | '护甲值' | '魔力值' | '信仰力值' | '体力值'>)[] =
      ['生命值', '护甲值', '魔力值', '信仰力值', '体力值'];
    resourceKeys.forEach(resKey => {
      compareResource(nameHtml, resKey, oldChar[resKey] as Resource, newChar[resKey] as Resource, msgId);
    });

    compareAbilityScores(nameHtml, oldChar.能力, newChar.能力, msgId);
    compareProgress(nameHtml, oldChar.历练进度, newChar.历练进度, msgId);
    compareSkills(nameHtml, oldChar.技能列表, newChar.技能列表, msgId);
    compareMoney(nameHtml, oldChar.背包?.金钱, newChar.背包?.金钱, msgId);

    if (oldChar.职业等级 !== newChar.职业等级) {
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【职业等级】: ${oldChar.职业等级} → ${newChar.职业等级}`);
    }

    if (oldChar.在场 !== newChar.在场) {
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【在场状态】: ${oldChar.在场 ? '在场' : '不在场'} → ${newChar.在场 ? '在场' : '不在场'}`);
    }

    if (oldChar.所处地点 !== newChar.所处地点) {
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【所处地点】: ${oldChar.所处地点} → ${newChar.所处地点}`);
    }

    if (oldChar.与主角关系 !== newChar.与主角关系) {
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【与主角关系】: ${oldChar.与主角关系} → ${newChar.与主角关系}`);
    }

    if (oldChar.层级 !== newChar.层级) {
      logStore.addLogMessage(`[ID:${msgId}] ${nameHtml} 【层级】: ${oldChar.层级} → ${newChar.层级}`);
    }
  };

  const comparePet = (
    key: string,
    oldPet: Pet,
    newPet: Pet,
    msgId: string | number
  ) => {
    if (oldPet.品类 !== newPet.品类) {
      logStore.addLogMessage(`[ID:${msgId}] [宠物:${key}] 品类变化: ${oldPet.品类} → ${newPet.品类}`);
    }
    if (oldPet.内在 !== newPet.内在) {
      logStore.addLogMessage(`[ID:${msgId}] [宠物:${key}] 内在变化: ${oldPet.内在} → ${newPet.内在}`);
    }
    if (oldPet.外在 !== newPet.外在) {
      logStore.addLogMessage(`[ID:${msgId}] [宠物:${key}] 外在变化: ${oldPet.外在} → ${newPet.外在}`);
    }
    if (oldPet.评价 !== newPet.评价) {
      logStore.addLogMessage(`[ID:${msgId}] [宠物:${key}] 评价变化: ${oldPet.评价} → ${newPet.评价}`);
    }
  };

  const compareEnemy = (
    key: string,
    oldEnemy: Enemy | undefined,
    newEnemy: Enemy,
    msgId: string | number
  ) => {
    if (!oldEnemy) {
      logStore.addLogMessage(`[ID:${msgId}] 发现新敌人: 【${key}】 (${newEnemy.类型})`);
      return;
    }

    compareResource(`[敌人:${key}]`, '生命值', oldEnemy.生命值, newEnemy.生命值, msgId);
    compareResource(`[敌人:${key}]`, '护甲值', oldEnemy.护甲值, newEnemy.护甲值, msgId);

    if (oldEnemy.类型 !== newEnemy.类型) {
      logStore.addLogMessage(`[ID:${msgId}] [敌人:${key}] 类型变化: ${oldEnemy.类型} → ${newEnemy.类型}`);
    }
    if (oldEnemy.备注 !== newEnemy.备注) {
      logStore.addLogMessage(`[ID:${msgId}] [敌人:${key}] 备注变化: ${oldEnemy.备注} → ${newEnemy.备注}`);
    }
  };

  const compareTasks = (
    oldTasks: PlayerCharacter['任务日志'],
    newTasks: PlayerCharacter['任务日志'],
    msgId: string | number
  ) => {
    const oldInProgress = oldTasks?.进行中 || {};
    const newInProgress = newTasks?.进行中 || {};
    const oldCompleted = oldTasks?.已完成 || {};
    const newCompleted = newTasks?.已完成 || {};

    const newInProgressKeys = Object.keys(newInProgress);
    const oldInProgressKeys = Object.keys(oldInProgress);
    const newCompletedKeys = Object.keys(newCompleted);
    const oldCompletedKeys = Object.keys(oldCompleted);

    newInProgressKeys.forEach(key => {
      if (!oldInProgressKeys.includes(key)) {
        logStore.addLogMessage(`[ID:${msgId}] 获得新任务: 【${key}】`);
      }
    });

    newCompletedKeys.forEach(key => {
      if (!oldCompletedKeys.includes(key)) {
        logStore.addLogMessage(`[ID:${msgId}] 任务完成: 【${key}】`);
      }
    });

    newInProgressKeys.forEach(key => {
      if (!oldInProgressKeys.includes(key)) return;
      const oldTask = oldInProgress[key];
      const newTask = newInProgress[key];
      const oldProgressCount = oldTask?.取得成果?.length || 0;
      const newProgressCount = newTask?.取得成果?.length || 0;
      if (newProgressCount > oldProgressCount) {
        const latestProgress = newTask.取得成果[newTask.取得成果.length - 1];
        logStore.addLogMessage(`[ID:${msgId}] 任务【${key}】取得新进展: ${latestProgress}`);
      }
    });
  };

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

    if (level >= 0 && oldData.主角 && newData.主角) {
      comparePlayerCharacter(newData.主角.姓名 || '主角', oldData.主角, newData.主角, currentMessageId);
      compareTasks(oldData.主角.任务日志, newData.主角.任务日志, currentMessageId);
    }

    if (level >= 1 && oldData.关系列表 && newData.关系列表) {
      const oldRels = oldData.关系列表;
      const newRels = newData.关系列表;
      Object.keys(newRels).forEach(key => {
        const oldRel = oldRels[key];
        const newRel = newRels[key];
        if (oldRel && newRel && oldRel !== '待初始化' && newRel !== '待初始化') {
          compareRelationCharacter(key, oldRel, newRel, currentMessageId);
        }
      });
    }

    if (level >= 2) {
      if (oldData.宠物 && newData.宠物) {
        const oldPets = oldData.宠物;
        const newPets = newData.宠物;
        Object.keys(newPets).forEach(key => {
          const oldPet = oldPets[key];
          const newPet = newPets[key];
          if (oldPet && newPet) {
            comparePet(key, oldPet, newPet, currentMessageId);
          }
        });
      }

      if (oldData.敌人列表 && newData.敌人列表) {
        const oldEnemies = oldData.敌人列表;
        const newEnemies = newData.敌人列表;
        Object.keys(newEnemies).forEach(key => {
          const oldEnemy = oldEnemies[key];
          const newEnemy = newEnemies[key];
          if (newEnemy !== '待初始化') {
            compareEnemy(key, oldEnemy === '待初始化' ? undefined : oldEnemy, newEnemy, currentMessageId);
          }
        });
      }
    }

  }, { deep: true });

  console.log('Global Stat Watcher Initialized.');
}
