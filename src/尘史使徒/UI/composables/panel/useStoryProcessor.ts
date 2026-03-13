import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';

// 正则表达式常量
const OPTIONS_BLOCK_REGEX = /<options>([\s\S]*?)<\/options>/i;
const OP_TAG_REGEX = /<op>([\s\S]*?)<\/op>/gi;
const QUEST_BLOCK_REGEX = /<questVariable>([\s\S]*?)<\/questVariable>/i;
const SHOP_BLOCK_REGEX = /<shopVariable>([\s\S]*?)<\/shopVariable>/i;

export function useStoryProcessor(
  rawHtml: Ref<string>,
  messageStore: any,
  questStore: any,
  shopStore: any
) {
  const cachedOptions = ref<string[]>([]);
  const showQuestLink = ref(false);
  const showShopLink = ref(false);

  const parseOptions = (content: string): string[] => {
    if (!content) return [];
    const match = content.match(OPTIONS_BLOCK_REGEX);
    if (!match || !match[1]) return [];
    // 严格复刻 trim 和去除首尾引号的逻辑
    return Array.from(match[1].matchAll(OP_TAG_REGEX), m => m[1].trim().replace(/^["']|["']$/g, ''));
  };

  // displayHtml 依然依赖从 DOM 抓取的 rawHtml 进行渲染
  const displayHtml = computed(() => {
    if (!rawHtml.value) return '';
    let content = rawHtml.value
      .replace(OPTIONS_BLOCK_REGEX, '')
      .replace(QUEST_BLOCK_REGEX, '')
      .replace(SHOP_BLOCK_REGEX, '')
      .trim();
    // 严格复刻去除最外层双引号的逻辑
    if (content.length >= 2 && content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1);
    }
    return content;
  });

  // 严格复刻原代码：监听 Store 中的数据变化来解析选项和链接
  watch(
    [() => messageStore.message, () => questStore.hasBoardData, () => shopStore.shopData],
    ([rawText, hasQuestData, shopData]) => {
      if (!rawText) return;

      // 1. 解析选项
      const foundOptions = parseOptions(rawText as string);
      if (JSON.stringify(foundOptions) !== JSON.stringify(cachedOptions.value)) {
        cachedOptions.value = foundOptions;
        console.log('📜 检测到选项更新:', foundOptions);
      }

      // 2. 解析任务链接
      const questMatch = (rawText as string).match(QUEST_BLOCK_REGEX);
      showQuestLink.value = !!(questMatch && hasQuestData);

      // 3. 解析商店链接
      const shopMatch = (rawText as string).match(SHOP_BLOCK_REGEX);
      const hasShopData = shopData && Object.keys(shopData).length > 0;
      showShopLink.value = !!(shopMatch && hasShopData);
    },
    { immediate: true }
  );

  return {
    displayHtml,
    cachedOptions,
    showQuestLink,
    showShopLink,
    parseOptions // 暴露出去供 onMounted 初始化使用
  };
}
