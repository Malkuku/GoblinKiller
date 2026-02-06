<template>
  <div class="story-view-container">
    <!-- 初始化加载遮罩 -->
    <transition name="fade-overlay">
      <div v-if="isInitializing" class="loading-overlay">
        <div class="animus-loader">
          <div class="loader-ring"></div>
          <div class="loader-core"></div>
        </div>
        <div class="loading-text">SYNCHRONIZING...</div>
      </div>
    </transition>

    <!-- 顶部工具栏 -->
    <div class="text-controls" v-show="!isInitializing">
      <div class="font-control-group">
        <button class="control-icon" @click="changeFontSize(-1)">A-</button>
        <span class="font-size-display">{{ fontSize }}</span>
        <button class="control-icon" @click="changeFontSize(1)">A+</button>
      </div>
    </div>

    <!-- 消息滚动显示区域 -->
    <div class="message-scroll-area" ref="scrollContainer" v-show="!isInitializing">
      <div class="message-paper">
        <div class="message-content" :style="{ fontSize: fontSize + 'px' }">
          <!-- 正文 -->
          <div class="text-body" v-html="displayHtml"></div>

          <!-- 打字机光标 (正在流式传输时显示) -->
          <span v-if="isStreaming" class="typing-cursor">_</span>

          <!-- 旧的等待动画已移除 -->
        </div>
      </div>
    </div>

    <!-- 底部交互区域 -->
    <div class="interaction-panel" v-show="!isInitializing">

      <div class="input-wrapper">
        <!-- 选项菜单按钮 -->
        <div class="options-container">
          <transition name="slide-up">
            <div v-if="showOptionsPanel && cachedOptions.length > 0 && !isTavernBusy" class="options-popup-menu">
              <div class="options-header">
                <span>命运分支 ({{ cachedOptions.length }})</span>
                <button class="close-options" @click="showOptionsPanel = false">×</button>
              </div>
              <div class="options-list">
                <button
                  v-for="(option, index) in cachedOptions"
                  :key="index"
                  class="option-item"
                  @click="handleOptionClick(option)"
                >
                  <span class="option-index">{{ index + 1 }}.</span>
                  <span class="option-text">{{ option }}</span>
                </button>
              </div>
            </div>
          </transition>

          <!-- 按钮本体：生成中会变成滚动动画 -->
          <button
            class="options-toggle-btn"
            :class="{
              'has-options': cachedOptions.length > 0 && !isTavernBusy,
              'active': showOptionsPanel,
              'is-rolling': isTavernBusy
            }"
            @click="toggleOptionsPanel"
            :disabled="isTavernBusy"
          >
            <!-- 生成中显示齿轮/罗盘图标，否则显示菜单图标 -->
            <span class="toggle-icon">{{ isTavernBusy ? '۞' : '❖' }}</span>

            <!-- 角标：仅在非忙碌且有选项时显示 -->
            <span v-if="cachedOptions.length > 0 && !isTavernBusy" class="options-badge">{{ cachedOptions.length }}</span>
          </button>
        </div>

        <!-- 输入框区域：使用 mode="out-in" 实现平滑切换 -->
        <div class="input-area-stack">
          <transition name="fade-input" mode="out-in">

            <!-- 状态A: 等待回复动画 (替代输入框) -->
            <div v-if="isTavernBusy" class="story-input busy-state" key="busy">
              <span class="busy-icon">✒</span>
              <span class="busy-text">历史正在等候命运回答...</span>
            </div>

            <!-- 状态B: 正常输入框 -->
            <textarea
              v-else
              key="input"
              v-model="userInput"
              class="story-input normal-state"
              placeholder="书写你的命运..."
              @keydown.enter.exact.prevent="sendMessage"
            ></textarea>

          </transition>
        </div>

        <!-- 发送按钮 -->
        <button class="send-btn" @click="sendMessage" :disabled="isTavernBusy">
          <span v-if="!isTavernBusy" class="send-icon">➤</span>
          <!-- 这里的 spinner 可以保留作为双重提示，或者隐藏 -->
          <div v-else class="mini-dot"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useMessageStore } from '@/尘史使徒/UI/store/MessageStore';

const messageStore = useMessageStore();
const scrollContainer = ref<HTMLElement | null>(null);

// --- 状态管理 ---
const rawHtml = ref('');
const cachedOptions = ref<string[]>([]);
const userInput = ref('');
const isStreaming = ref(false);
const isInitializing = ref(true);
const pollingInterval = ref<any>(null);
const fontSize = ref(18);
const showOptionsPanel = ref(false);

// isTavernBusy 直接控制界面状态
const isTavernBusy = ref(false);
let sendButtonObserver: MutationObserver | null = null;

// --- 正则 ---
const OPTIONS_BLOCK_REGEX = /<options>([\s\S]*?)<\/options>/i;
const OP_TAG_REGEX = /<op>([\s\S]*?)<\/op>/gi;

const displayHtml = computed(() => {
  if (!rawHtml.value) return '';
  return rawHtml.value.replace(OPTIONS_BLOCK_REGEX, '');
});

// --- 监听器 ---
watch(cachedOptions, (newVal) => {
  if (newVal.length === 0) showOptionsPanel.value = false;
});

// --- 核心逻辑 ---

const changeFontSize = (delta: number) => {
  const newSize = fontSize.value + delta;
  if (newSize >= 12 && newSize <= 32) {
    fontSize.value = newSize;
    localStorage.setItem('animus_font_size', newSize.toString());
  }
};

const toggleOptionsPanel = () => {
  if (isTavernBusy.value) return; // 忙碌时禁止打开
  if (cachedOptions.value.length > 0) {
    showOptionsPanel.value = !showOptionsPanel.value;
  }
};

const handleOptionClick = (option: string) => {
  userInput.value = option;
  showOptionsPanel.value = false;
  setTimeout(() => {
    const textarea = document.querySelector('.story-input.normal-state') as HTMLTextAreaElement;
    if (textarea) textarea.focus();
  }, 50);
};

const fetchLatestMessage = () => {
  try {
    const chatContainer = window.parent.document.getElementById('chat');
    if (!chatContainer) return;

    const lastMessageDiv = chatContainer.querySelector('.last_mes .mes_text');

    if (lastMessageDiv) {
      const currentHtml = lastMessageDiv.innerHTML;

      const foundOptions = parseOptions(currentHtml);
      if (foundOptions.length > 0) {
        if (JSON.stringify(foundOptions) !== JSON.stringify(cachedOptions.value)) {
          cachedOptions.value = foundOptions;
        }
      }

      if (currentHtml !== rawHtml.value) {
        rawHtml.value = currentHtml;
        isStreaming.value = true;
        if (!isInitializing.value) scrollToBottom();
      } else {
        isStreaming.value = false;
      }
    }
  } catch (e) {
    console.warn('获取父窗口消息失败', e);
  }
};

// 1. 修改：解析选项时去除首尾引号
const parseOptions = (htmlContent: string): string[] => {
  if (!htmlContent) return [];
  const match = htmlContent.match(OPTIONS_BLOCK_REGEX);
  if (!match || !match[1]) return [];

  return Array.from(match[1].matchAll(OP_TAG_REGEX), m => {
    let text = m[1].trim();
    // 去除首尾的双引号或单引号
    text = text.replace(/^["']|["']$/g, '');
    return text;
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTo({
        top: scrollContainer.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  });
};

const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  const textToSend = userInput.value;

  // 清理 UI
  cachedOptions.value = [];
  showOptionsPanel.value = false;
  userInput.value = '';

  // 注意：这里不需要手动设置 isTavernBusy = true
  // 因为下面的 click() 会触发酒馆的生成状态，Observer 会自动捕获并更新 isTavernBusy

  try {
    const parentDoc = window.parent.document;
    const stInput = parentDoc.querySelector('#send_textarea') as HTMLTextAreaElement;
    const stSendBtn = parentDoc.querySelector('#send_but') as HTMLElement;

    if (stInput && stSendBtn) {
      stInput.value = textToSend;
      stInput.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 50));
      stSendBtn.click();
    }
  } catch (e) {
    console.error('发送消息错误:', e);
  } finally {
    scrollToBottom();
  }
};

// 2. 监听酒馆按钮状态 (核心驱动动画)
const setupTavernObserver = () => {
  const parentDoc = window.parent.document;
  const tavernSendBtn = parentDoc.getElementById('send_but');

  if (tavernSendBtn) {
    checkTavernBusy(tavernSendBtn);

    sendButtonObserver = new MutationObserver((mutations) => {
      checkTavernBusy(tavernSendBtn);
    });

    sendButtonObserver.observe(tavernSendBtn, {
      attributes: true,
      attributeFilter: ['style', 'class', 'disabled']
    });
  }
};

const checkTavernBusy = (btn: HTMLElement) => {
  const style = window.getComputedStyle(btn);
  const isHidden = style.display === 'none' || style.visibility === 'hidden';
  const isDisabled = btn.hasAttribute('disabled');

  // 只要按钮不可用或隐藏，就视为忙碌
  isTavernBusy.value = isHidden || isDisabled;
};

// --- 生命周期 ---
onMounted(() => {
  const savedSize = localStorage.getItem('animus_font_size');
  if (savedSize) fontSize.value = parseInt(savedSize);

  if (messageStore.message) {
    rawHtml.value = messageStore.message;
    const ops = parseOptions(messageStore.message);
    if (ops.length > 0) cachedOptions.value = ops;
  }

  fetchLatestMessage();
  pollingInterval.value = setInterval(fetchLatestMessage, 200);

  setupTavernObserver();

  setTimeout(() => {
    isInitializing.value = false;
    scrollToBottom();
  }, 800);
});

onUnmounted(() => {
  if (pollingInterval.value) clearInterval(pollingInterval.value);
  if (sendButtonObserver) sendButtonObserver.disconnect();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');

/* --- 基础布局 --- */
.story-view-container {
  display: flex; flex-direction: column; height: 100%; position: relative;
  background: radial-gradient(circle at center, rgba(30, 35, 45, 0.8) 0%, rgba(15, 18, 24, 0.98) 100%);
}

/* --- Loading Overlay --- */
.loading-overlay {
  position: absolute; inset: 0; background: rgba(15, 18, 24, 1); z-index: 100;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
}
.animus-loader { position: relative; width: 60px; height: 60px; }
.loader-ring {
  position: absolute; inset: 0; border: 2px solid transparent;
  border-top-color: var(--c-gold); border-right-color: var(--c-gold);
  border-radius: 50%; animation: spin 1.5s linear infinite;
}
.loader-core {
  position: absolute; inset: 15px; background: var(--c-gold); opacity: 0.2;
  border-radius: 50%; animation: pulse 1s ease-in-out infinite alternate;
}
.loading-text {
  font-family: 'Cinzel', serif; color: var(--c-gold); letter-spacing: 2px;
  font-size: 0.9rem; animation: blink 1s infinite;
}

/* --- Controls --- */
.text-controls {
  position: absolute; top: 10px; right: 20px; z-index: 10;
  opacity: 0.7; transition: opacity 0.3s;
}
.text-controls:hover { opacity: 1; }
.font-control-group {
  display: flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.6);
  padding: 4px 8px; border-radius: 20px; border: 1px solid var(--c-border);
}
.control-icon {
  background: none; border: none; color: var(--c-text-main); cursor: pointer;
  font-size: 0.9rem; font-family: var(--font-title); padding: 0 5px;
}
.font-size-display { font-size: 0.85rem; color: var(--c-gold); min-width: 28px; text-align: center; }

/* --- Message Area --- */
.message-scroll-area {
  flex: 1; overflow-y: auto; padding: 20px 0;
  scrollbar-width: thin; scrollbar-color: var(--c-gold) transparent;
}
.message-paper { max-width: 800px; margin: 0 auto; padding: 0 30px; }
.message-content {
  line-height: 1.8; color: var(--c-text-main);
  font-family: 'EB Garamond', serif; transition: font-size 0.2s ease;
}
.text-body :deep(p) { margin-bottom: 1em; text-align: justify; }
.text-body :deep(em) { color: var(--c-gold); font-style: italic; }
.text-body :deep(strong) { color: #fff; font-weight: 600; }
.typing-cursor {
  display: inline-block; color: var(--c-gold); font-weight: bold;
  animation: blink 1s step-end infinite;
}

/* --- Interaction Panel --- */
.interaction-panel {
  flex-shrink: 0;
  background: linear-gradient(to top, rgba(10, 12, 16, 1) 20%, rgba(10, 12, 16, 0.8) 80%, transparent);
  padding: 20px 30px 30px;
  display: flex; flex-direction: column; align-items: center;
  border-top: 1px solid rgba(164, 139, 87, 0.1);
  backdrop-filter: blur(5px);
}

.input-wrapper {
  position: relative; width: 100%; max-width: 800px;
  display: flex; align-items: flex-end; gap: 12px;
}

/* --- Options Button & Animation --- */
.options-container { position: relative; display: flex; align-items: flex-end; }

.options-toggle-btn {
  width: 56px; height: 56px;
  background: rgba(0, 0, 0, 0.3); border: 1px solid var(--c-border);
  border-radius: 4px; color: var(--c-text-dim); font-size: 1.5rem;
  cursor: pointer; transition: all 0.3s ease;
  display: flex; align-items: center; justify-content: center;
}
.options-toggle-btn.has-options {
  color: var(--c-gold); border-color: var(--c-gold);
  box-shadow: 0 0 10px rgba(164, 139, 87, 0.2);
  animation: pulse-border 2s infinite;
}
.options-toggle-btn.active { background: var(--c-gold); color: #1a1a1a; }

/* 2. 选项按钮滚动动画 */
.options-toggle-btn.is-rolling {
  border-color: var(--c-gold);
  color: var(--c-gold);
  cursor: default;
  animation: none; /* 移除呼吸灯，改为内部图标旋转 */
}
.options-toggle-btn.is-rolling .toggle-icon {
  display: inline-block;
  animation: spin 2s linear infinite;
}

.options-badge {
  position: absolute; top: -5px; right: -5px;
  background: #8b0000; color: #fff; font-size: 0.7rem; font-weight: bold;
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* Options Menu */
.options-popup-menu {
  position: absolute; bottom: 70px; left: 0; width: 600px; max-height: 400px;
  background: rgba(20, 22, 28, 0.95); border: 1px solid var(--c-gold);
  border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; z-index: 50;
  backdrop-filter: blur(10px); overflow: hidden;
}
.options-header {
  padding: 10px 15px; background: rgba(164, 139, 87, 0.1);
  border-bottom: 1px solid rgba(164, 139, 87, 0.3);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 0.9rem;
}
.close-options { background: none; border: none; color: var(--c-text-dim); cursor: pointer; font-size: 1.2rem; }
.options-list {
  overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px;
  scrollbar-width: thin; scrollbar-color: var(--c-gold) transparent;
}
.option-item {
  background: rgba(255, 255, 255, 0.03); border: 1px solid transparent;
  padding: 10px; color: var(--c-text-main); text-align: left;
  cursor: pointer; font-family: 'EB Garamond', serif; font-size: 1rem;
  transition: all 0.2s; display: flex; gap: 10px;
}
.option-index { color: var(--c-gold); font-weight: bold; opacity: 0.7; }
.option-item:hover {
  background: rgba(164, 139, 87, 0.15); border-color: rgba(164, 139, 87, 0.5);
  transform: translateX(5px);
}

/* --- Input Area Stack (Input vs Waiting Animation) --- */
.input-area-stack {
  flex: 1;
  position: relative;
  height: 56px; /* 固定高度防止切换时抖动 */
}

.story-input {
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255,255,255,0.1); border-bottom: 2px solid var(--c-border);
  color: var(--c-text-main); padding: 12px 15px;
  border-radius: 4px 4px 0 0; font-family: 'EB Garamond', serif; font-size: 1.1rem;
  resize: none; transition: all 0.3s;
  display: block;
}
.story-input:focus { outline: none; background: rgba(0, 0, 0, 0.4); border-bottom-color: var(--c-gold); }

/* 2. 忙碌状态下的输入框样式 */
.story-input.busy-state {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-color: transparent;
  border-bottom-color: rgba(164, 139, 87, 0.3);
  color: var(--c-gold);
  cursor: default;
  user-select: none;
}
.busy-icon {
  font-size: 1.2rem;
  animation: write 1s ease-in-out infinite alternate;
}
.busy-text {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  letter-spacing: 1px;
  animation: pulse-text 2s infinite;
}

/* --- Send Button --- */
.send-btn {
  width: 56px; height: 56px; background: transparent; border: 1px solid var(--c-border);
  border-radius: 50%; color: var(--c-gold); font-size: 1.4rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.3s;
}
.send-btn:hover:not(:disabled) {
  background: var(--c-gold); color: #1a1a1a; box-shadow: 0 0 15px var(--c-gold);
}
.send-btn:disabled { opacity: 0.7; cursor: not-allowed; border-color: rgba(164, 139, 87, 0.2); }
.mini-dot {
  width: 6px; height: 6px; background: var(--c-gold); border-radius: 50%;
  animation: pulse 0.5s infinite;
}

/* --- Animations --- */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { from { transform: scale(0.8); opacity: 0.5; } to { transform: scale(1.2); opacity: 1; } }
@keyframes blink { 50% { opacity: 0; } }
@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(164, 139, 87, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(164, 139, 87, 0); }
  100% { box-shadow: 0 0 0 0 rgba(164, 139, 87, 0); }
}
@keyframes write {
  from { transform: rotate(0deg) translateY(0); }
  to { transform: rotate(15deg) translateY(-3px); }
}
@keyframes pulse-text {
  0%, 100% { opacity: 0.6; text-shadow: 0 0 0 var(--c-gold); }
  50% { opacity: 1; text-shadow: 0 0 5px var(--c-gold); }
}

/* Vue Transitions */
.fade-overlay-enter-active, .fade-overlay-leave-active { transition: opacity 0.5s ease; }
.fade-overlay-enter-from, .fade-overlay-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

/* 输入框切换动画 */
.fade-input-enter-active, .fade-input-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-input-enter-from { opacity: 0; transform: translateY(5px); }
.fade-input-leave-to { opacity: 0; transform: translateY(-5px); }
</style>
