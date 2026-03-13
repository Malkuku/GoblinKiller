<template>
  <div class="story-view-container">
    <!-- 初始化加载遮罩 -->
    <LoadingOverlay v-if="isInitializing" />

    <!-- 顶部状态栏 -->
    <StatusBar
      v-show="!isInitializing"
      :location="currentWorldLocation"
      :time="currentWorldTime"
      :font-size="fontSize"
      :unread-log-count="unreadLogCount"
      @toggle-log-panel="toggleLogPanel"
      @change-font-size="changeFontSize"
    />

    <!-- 事件日志面板 -->
    <EventLogPanel
      v-if="showLogPanel"
      :log-messages="logMessages"
      :format-log-text="formatLogText"
      :log-list-ref="el => logListRef = el"
      @close="showLogPanel = false"
    />

    <!-- 消息滚动显示区域 -->
    <MessageDisplay
      v-show="!isInitializing"
      ref="messageDisplayRef"
      :display-html="displayHtml"
      :is-streaming="isStreaming"
      :font-size="fontSize"
    />

    <!-- 跳转按钮组 (任务 & 商店) -->
    <JumpLinks
      :show-quest-link="showQuestLink"
      :show-shop-link="showShopLink"
    />

    <!-- 底部交互区域 -->
    <InteractionPanel
      v-show="!isInitializing"
      v-model:userInput="userInput"
      :is-tavern-busy="isTavernBusy"
      :cached-options="cachedOptions"
      :user-life-status="userLifeStatus"
      :combat-strategy="combatStrategy"
      :combat-strategy-custom="combatStrategyCustom"
      @update:strategy="handleStrategyChange"
      @update:custom-content="handleCustomContentChange"
      @send-or-stop="handleSendOrStop"
      @recalculate-variables="recalculateVariables"
      @reroll-current="rerollCurrent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useMessageStore } from '@/尘史使徒/UI/store/MessageStore';
import { useQuestStore } from '@/尘史使徒/UI/store/QuestStore';
import { useShopStore } from '@/尘史使徒/UI/store/ShopStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';

// Import Composables
import { useTavernInteraction } from '@/尘史使徒/UI/composables/panel/useTavernInteraction';
import { useStoryProcessor } from '@/尘史使徒/UI/composables/panel/useStoryProcessor';
import { useStatusSync } from '@/尘史使徒/UI/composables/panel/useStatusSync';
import { useEventLogger } from '@/尘史使徒/UI/composables/panel/useEventLogger';

// Import Components
import LoadingOverlay from '@/尘史使徒/UI/components/panel/LoadingOverlay.vue';
import StatusBar from '@/尘史使徒/UI/components/panel/StatusBar.vue';
import EventLogPanel from '@/尘史使徒/UI/components/panel/EventLogPanel.vue';
import MessageDisplay from '@/尘史使徒/UI/components/panel/MessageDisplay.vue';
import JumpLinks from '@/尘史使徒/UI/components/panel/JumpLinks.vue';
import InteractionPanel from '@/尘史使徒/UI/components/panel/InteractionPanel.vue';

// --- Store Initialization ---
const messageStore = useMessageStore();
const questStore = useQuestStore();
const shopStore = useShopStore();
const uiStore = useUiStore();
const statStore = useStatStore();

// --- Composables Initialization ---
const {
  isTavernBusy,
  rawHtml,
  isStreaming,
  sendMessage,
  stopGeneration,
  rerollCurrent,
  recalculateVariables
} = useTavernInteraction();

// 修正：传入 messageStore, questStore, shopStore 进行监听
const {
  displayHtml,
  cachedOptions,
  showQuestLink,
  showShopLink,
  parseOptions
} = useStoryProcessor(rawHtml, messageStore, questStore, shopStore);

const {
  userLifeStatus,
  combatStrategy,
  combatStrategyCustom,
  currentWorldTime,
  currentWorldLocation,
  handleStrategyChange,
  handleCustomContentChange,
} = useStatusSync();

const {
  logMessages,
  showLogPanel,
  logListRef,
  unreadLogCount,
  toggleLogPanel,
  formatLogText,
} = useEventLogger();

// --- Component-specific State & Refs ---
const isInitializing = ref(true);
const userInput = ref('');
const fontSize = ref(18);
const messageDisplayRef = ref<InstanceType<typeof MessageDisplay> | null>(null);

// --- Event Handlers & Logic ---
const handleSendOrStop = async () => {
  if (isTavernBusy.value) {
    stopGeneration();
    return;
  }

  // 严格复刻原逻辑：清空选项，设置繁忙状态
  const textToSend = userInput.value;
  cachedOptions.value = [];
  userInput.value = '';

  await sendMessage(textToSend);
  messageDisplayRef.value?.scrollToBottom();
};

const changeFontSize = (delta: number) => {
  const newSize = fontSize.value + delta;
  if (newSize >= 12 && newSize <= 32) {
    fontSize.value = newSize;
    localStorage.setItem('animus_font_size', newSize.toString());
  }
};

// --- Watchers ---
watch(userInput, (newVal) => {
  uiStore.setPendingInput(newVal);
});

// --- Lifecycle Hooks ---
onMounted(() => {
  // 初始化字体大小
  const savedSize = localStorage.getItem('animus_font_size');
  if (savedSize) fontSize.value = parseInt(savedSize);

  // 严格复刻原逻辑：初始化获取 message 并解析选项
  messageStore.getMessage();
  if (messageStore.message) {
    const ops = parseOptions(messageStore.message);
    if (ops.length > 0) cachedOptions.value = ops;
  }

  // 初始化 StatStore 监听
  statStore.initData();
  statStore.registerListener();

  // 恢复上次未发送的输入
  const pendingText = uiStore.consumePendingInput();
  if (pendingText) userInput.value = pendingText;

  // 结束初始化状态
  setTimeout(() => {
    isInitializing.value = false;
  }, 800);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');

.story-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background: radial-gradient(circle at center, rgba(30, 35, 45, 0.8) 0%, rgba(15, 18, 24, 0.98) 100%);
}
</style>
