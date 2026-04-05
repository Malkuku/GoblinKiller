// src/哥杀/UI/composables/panel/useStoryProcessor.ts
import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';

// 暴露全局状态供 StatusBar 使用
export const globalDestinyText = ref('');
export const globalDestinyUnread = ref(false);

// 正则表达式常量
const OPTIONS_BLOCK_REGEX = /<options>([\s\S]*?)<\/options>/i;
const OP_TAG_REGEX = /<op>([\s\S]*?)<\/op>/gi;
const DESTINY_BLOCK_REGEX = /<宿命>([\s\S]*?)<\/宿命>/i;

export function useStoryProcessor(
  rawHtml: Ref<string>,
  messageStore: any,
) {
  const cachedOptions = ref<string[]>([]);

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
      .replace(DESTINY_BLOCK_REGEX, '') // 剔除宿命标签，避免在正文中显示
      .trim();
    // 严格复刻去除最外层双引号的逻辑
    if (content.length >= 2 && content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1);
    }
    return content;
  });

  // 严格复刻原代码：监听 Store 中的数据变化来解析选项和链接
  watch(
    [() => messageStore.message],
    ([rawText]) => {
      if (!rawText) return;

      // 1. 解析选项
      const foundOptions = parseOptions(rawText as string);
      if (JSON.stringify(foundOptions) !== JSON.stringify(cachedOptions.value)) {
        cachedOptions.value = foundOptions;
      }

      // 2. 解析宿命序列
      const destinyMatch = (rawText as string).match(DESTINY_BLOCK_REGEX);
      if (destinyMatch && destinyMatch[1]) {
        const newDestiny = destinyMatch[1].trim();
        if (globalDestinyText.value !== newDestiny) {
          globalDestinyText.value = newDestiny;
          globalDestinyUnread.value = true; // 触发红点动画
        }
      } else {
        globalDestinyText.value = '';
        globalDestinyUnread.value = false;
      }
    },
    { immediate: true }
  );

  return {
    displayHtml,
    cachedOptions,
    parseOptions // 暴露出去供 onMounted 初始化使用
  };
}
