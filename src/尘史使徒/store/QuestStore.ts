import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useMessageStore } from '@/尘史使徒/store/MessageStore';

export interface QuestItem {
  "描述": string;
  "要求": string;
  "报酬": string;
}

export interface QuestData {
  [key: string]: QuestItem;
}

export const useQuestStore = defineStore('quest', () => {
  const messageStore = useMessageStore();
  const questData = ref<QuestData>({});
  const rawJsonString = ref<string>("");

  const parseQuestData = (msg: string | null | undefined) => {
    if (!msg) {
      questData.value = {};
      return;
    }
    try {
      // 匹配 <questVariable>...</questVariable>
      const match = msg.match(/<questVariable>((?:(?!<questVariable>)[\s\S])*?)<\/questVariable>(?![\s\S]*<questVariable>[\s\S]*<\/questVariable>)/);
      if (match && match[1]) {
        const jsonStr = match[1].trim();
        if (jsonStr !== rawJsonString.value) {
          rawJsonString.value = jsonStr;
          questData.value = JSON.parse(jsonStr);
        }
      } else {
        questData.value = {};
        rawJsonString.value = "";
      }
    } catch (error) {
      console.error("解析委托数据失败:", error);
      questData.value = {};
    }
  };

  watch(
    () => messageStore.message,
    (newMsg) => parseQuestData(newMsg),
    { immediate: true }
  );

  const hasQuestData = computed(() => Object.keys(questData.value).length > 0);

  return { questData, hasQuestData };
});
