import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useMessageStore } from '@/尘史使徒/store/MessageStore';

// 定义接口
export interface ShopItem {
  "描述": string;
  "作用": string;
  '价格': number;
  '最大数量': number;
  '最大耐久': number;
  '方向': "购买"|"出售";
}

export interface ShopData {
  [key: string]: ShopItem;
}

export const useShopStore = defineStore('shop', () => {
  const messageStore = useMessageStore();
  const shopData = ref<ShopData>({});
  const rawJsonString = ref<string>("");

  // 解析逻辑
  const parseShopData = (msg: string | null | undefined) => {
    if (!msg) {
      shopData.value = {};
      return;
    }
    try {
      // 提取 <shopVariable>...</shopVariable> 之间的内容
      const match = msg.match(/<shopVariable>((?:(?!<shopVariable>)[\s\S])*?)<\/shopVariable>(?![\s\S]*<shopVariable>[\s\S]*<\/shopVariable>)/);
      if (match && match[1]) {
        const jsonStr = match[1].trim();
        // 只有当内容发生变化时才重新解析，避免重复渲染
        if (jsonStr !== rawJsonString.value) {
          rawJsonString.value = jsonStr;
          // 处理可能的转义字符或格式问题
          shopData.value = JSON.parse(jsonStr);
        }
      } else {
        // 如果消息中没有商店标签，清空数据
        shopData.value = {};
        rawJsonString.value = "";
      }
    } catch (error) {
      console.error("解析商店数据失败:", error);
      shopData.value = {};
    }
  };

  // 监听消息变化
  watch(
    () => messageStore.message,
    (newMsg) => {
      parseShopData(newMsg);
    },
    { immediate: true }
  );

  // 是否有有效的商店数据
  const hasShopData = computed(() => Object.keys(shopData.value).length > 0);

  return {
    shopData,
    hasShopData
  };
});
