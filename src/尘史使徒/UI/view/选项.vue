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

          <!-- 打字机光标 -->
          <span v-if="isStreaming" class="typing-cursor">_</span>
        </div>
      </div>
    </div>

    <!-- 跳转按钮组 (任务 & 商店) -->
    <transition-group name="slide-up" tag="div" class="link-btn-group">
      <!-- 任务跳转按钮 -->
      <button v-if="showQuestLink" key="quest" class="jump-btn quest-btn" @click="navigateToQuest">
        <span class="icon">📜</span>
        <span class="text">检测到新的委托契约</span>
        <span class="arrow">➔</span>
      </button>

      <!-- 商店跳转按钮 -->
      <button v-if="showShopLink" key="shop" class="jump-btn shop-btn" @click="navigateToShop">
        <span class="icon">⚖</span>
        <span class="text">检测到交易契机</span>
        <span class="arrow">➔</span>
      </button>
    </transition-group>

    <!-- 底部交互区域 -->
    <div v-show="!isInitializing" class="interaction-panel">

      <!-- 移动端工具栏切换按钮 -->
      <div v-show="!isTavernBusy" class="mobile-toolbar-toggle" @click="showMobileToolbar = !showMobileToolbar">
        <span class="toggle-line"></span>
        <span class="toggle-text">{{ showMobileToolbar ? '▲ 收起控制台' : '▼ 展开控制台' }}</span>
        <span class="toggle-line"></span>
      </div>

      <!-- 控制台区域 (包含状态栏和工具按钮) -->
      <transition name="fade-toolbar">
        <div v-show="!isTavernBusy" class="dashboard-console" :class="{ 'mobile-hidden': !showMobileToolbar }">
          <!-- 左侧：用户状态与策略 -->
          <UserShortcutBar
            :life-status="userLifeStatus"
            :strategy="combatStrategy"
            :custom-content="combatStrategyCustom"
            @update:strategy="handleStrategyChange"
            @update:custom-content="handleCustomContentChange"
          />

          <!-- 右侧：附加工具栏 (变量重算 / 重roll) -->
          <div class="extra-toolbar">
            <button class="toolbar-btn" @click="recalculateVariables" title="重新计算当前变量">
              <span class="icon">⟳</span> 变量重算
            </button>
            <button class="toolbar-btn" @click="rerollCurrent" title="重新生成当前回复">
              <span class="icon">🎲</span> 重塑命运
            </button>
          </div>
        </div>
      </transition>

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
            <span class="toggle-icon">{{ isTavernBusy ? '۞' : '❖' }}</span>
            <span v-if="cachedOptions.length > 0 && !isTavernBusy" class="options-badge">{{ cachedOptions.length }}</span>
          </button>
        </div>

        <!-- 输入框区域：使用 mode="out-in" 实现平滑切换 -->
        <div class="input-area-stack">
          <transition name="fade-input" mode="out-in">

            <!-- 状态A: 等待回复动画 (替代输入框) -->
            <div v-if="isTavernBusy" class="story-input busy-state" key="busy">
              <span class="busy-icon">✒</span>
              <span class="busy-text">历史正在等候命运回应...</span>
            </div>

            <!-- 状态B: 正常输入框 -->
            <textarea
              v-else
              key="input"
              v-model="userInput"
              class="story-input normal-state"
              placeholder="书写你的命运..."
              @keydown.enter.exact.prevent="handleSendOrStop"
            ></textarea>

          </transition>
        </div>

        <!-- 发送/停止按钮 -->
        <button class="send-btn" :class="{'is-busy': isTavernBusy}" @click="handleSendOrStop">
          <span v-if="!isTavernBusy" class="send-icon">➤</span>
          <div v-else class="stop-icon">■</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMessageStore } from '@/尘史使徒/UI/store/MessageStore';
import { useQuestStore } from '@/尘史使徒/UI/store/QuestStore';
import { useShopStore } from '@/尘史使徒/UI/store/ShopStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';
import * as toastr from 'toastr';
import { KatEvents } from '@/Constants/KatEvent';
import { MvuUtil } from '@/Utils/MvuUtil';
import UserShortcutBar from '@/尘史使徒/UI/components/tool/UserShortcutBar.vue';

const router = useRouter();
const messageStore = useMessageStore();
const questStore = useQuestStore();
const shopStore = useShopStore();
const uiStore = useUiStore();
const scrollContainer = ref<HTMLElement | null>(null);

// --- 状态管理 ---
const rawHtml = ref(''); // 用于显示的渲染后HTML
const cachedOptions = ref<string[]>([]);
const userInput = ref('');
const isStreaming = ref(false);
const isInitializing = ref(true);
const pollingInterval = ref<any>(null);
const fontSize = ref(18);
const showOptionsPanel = ref(false);
const showMobileToolbar = ref(false); // 移动端控制台展开状态

// 跳转按钮控制
const showQuestLink = ref(false);
const showShopLink = ref(false);

const isTavernBusy = ref(false);
let sendButtonObserver: MutationObserver | null = null;

// --- 快捷栏状态 ---
const userLifeStatus = ref<any>({
  "生命": { "最大值": 100, "当前": 100 },
  "体力": { "最大值": 100, "当前": 100 },
  "精神": { "最大值": 100, "当前": 100 }
});
const combatStrategy = ref('节省体力');
const combatStrategyCustom = ref(''); // 新增：自定义策略内容

// --- 正则 ---
const OPTIONS_BLOCK_REGEX = /<options>([\s\S]*?)<\/options>/i;
const OP_TAG_REGEX = /<op>([\s\S]*?)<\/op>/gi;

// 任务和商店的正则定义
const QUEST_BLOCK_REGEX = /<questVariable>([\s\S]*?)<\/questVariable>/i;
const SHOP_BLOCK_REGEX = /<shopVariable>([\s\S]*?)<\/shopVariable>/i;

const displayHtml = computed(() => {
  if (!rawHtml.value) return '';

  let content = rawHtml.value;

  // 1. 移除选项块 (视觉上移除)
  content = content.replace(OPTIONS_BLOCK_REGEX, '');

  // 2. 移除任务块 (防止显示在正文)
  content = content.replace(QUEST_BLOCK_REGEX, '');

  // 3. 移除商店块 (防止显示在正文)
  content = content.replace(SHOP_BLOCK_REGEX, '');

  content = content.trim();

  // 去除首尾可能的引号
  if (content.length >= 2 && content.startsWith('"') && content.endsWith('"')) {
    content = content.slice(1, -1);
  }
  return content;
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
  if (isTavernBusy.value) return;
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

// 跳转逻辑
const navigateToQuest = () => {
  router.push('/任务');
};

const navigateToShop = () => {
  router.push('/商店');
};

// --- 同步 Mvu 状态数据 ---
const syncStatData = () => {
  try {
    const parentWin = window.parent as any;
    if (parentWin.Mvu) {
      const mvuData = parentWin.Mvu.getMvuData({ type: 'message', message_id: -1 });
      if (mvuData && mvuData.stat_data) {
        // 同步生命状态
        if (mvuData.stat_data['角色']?.['user']?.['生命状态']) {
          userLifeStatus.value = mvuData.stat_data['角色']['user']['生命状态'];
        }
        // 同步战斗策略
        if (mvuData.stat_data['system']?.['战斗策略']) {
          combatStrategy.value = mvuData.stat_data['system']['战斗策略'];
        }
        // 同步自定义内容
        if (mvuData.stat_data['system']?.['战斗策略自定义内容'] !== undefined) {
          combatStrategyCustom.value = mvuData.stat_data['system']['战斗策略自定义内容'];
        }
      }
    }
  } catch (e) {
    // 忽略错误，避免频繁报错
  }
};

// --- 处理策略切换 ---
const handleStrategyChange = async (newStrategy: string) => {
  combatStrategy.value = newStrategy;
  try {
    await MvuUtil.updateMvuDataByDiff({
      "system": {
        "战斗策略": newStrategy
      }
    });
    if (newStrategy !== '自定义') {
      toastr.success(`战斗策略已切换为: ${newStrategy}`);
    }
  } catch (e) {
    console.error("策略切换失败", e);
    toastr.error("策略切换失败");
  }
};

// --- 处理自定义策略内容更新 ---
const handleCustomContentChange = async (newContent: string) => {
  combatStrategyCustom.value = newContent;
  try {
    await MvuUtil.updateMvuDataByDiff({
      "system": {
        "战斗策略自定义内容": newContent
      }
    });
    toastr.success(`自定义策略已更新`);
  } catch (e) {
    console.error("自定义策略更新失败", e);
    toastr.error("自定义策略更新失败");
  }
};

// 轮询核心：同时检查消息和按钮状态
const fetchLatestMessage = () => {
  try {
    const parentDoc = window.parent.document;

    // 1. 检查按钮状态
    const tavernSendBtn = parentDoc.getElementById('send_but');
    if (tavernSendBtn) {
      checkTavernBusy(tavernSendBtn);
    }

    // 2. 同步原始消息
    messageStore.getMessage();

    // 3. 同步状态数据 (生命值/策略)
    syncStatData();

    // 4. 检查消息内容
    const chatContainer = parentDoc.getElementById('chat');
    if (!chatContainer) return;

    const lastMessageDiv = chatContainer.querySelector('.last_mes .mes_text');

    if (lastMessageDiv) {
      const currentHtml = lastMessageDiv.innerHTML;

      if (currentHtml !== rawHtml.value) {
        rawHtml.value = currentHtml;
        isStreaming.value = true;
      } else {
        isStreaming.value = false;
      }
    }
  } catch (e) {
    console.warn('轮询父窗口失败', e);
  }
};

const parseOptions = (content: string): string[] => {
  if (!content) return [];
  const match = content.match(OPTIONS_BLOCK_REGEX);
  if (!match || !match[1]) return [];

  return Array.from(match[1].matchAll(OP_TAG_REGEX), m => {
    let text = m[1].trim();
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

// --- 核心修改：处理发送或停止 ---
const handleSendOrStop = async () => {
  const parentWin = window.parent as any;

  if (isTavernBusy.value) {
    // 模拟点击
    const stopBtn = parentWin.document.querySelector('#form_sheld .mes_stop');
    if (stopBtn) {
      const eventOpts = { bubbles: true, cancelable: true, view: parentWin };
      stopBtn.dispatchEvent(new MouseEvent('mousedown', eventOpts));
      stopBtn.dispatchEvent(new MouseEvent('click', eventOpts));
    }
    return;
  }

  // ➤ 发送消息逻辑
  await sendMessage();
};

const sendMessage = async () => {
  const textToSend = userInput.value;

  isTavernBusy.value = true; // 立即触发动画

  cachedOptions.value = [];
  showOptionsPanel.value = false;
  userInput.value = '';

  try {
    const parentDoc = window.parent.document;
    const stInput = parentDoc.querySelector('#send_textarea') as HTMLTextAreaElement;
    const stSendBtn = parentDoc.querySelector('#send_but') as HTMLElement;
    if (stInput && stSendBtn) {
      stInput.value = textToSend;
      stInput.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 50));
      stSendBtn.click();
    } else {
      console.warn("未找到酒馆发送按钮");
      isTavernBusy.value = false;
    }
  } catch (e) {
    console.error('发送消息错误:', e);
    isTavernBusy.value = false;
  } finally {
    scrollToBottom();
  }
};

// --- 变量重算 ---
const recalculateVariables = async () => {
  try {
    await eventEmit(KatEvents.kat_resend_mvu_update);
    toastr.success("已发送变量重算");
  } catch (e) {
    console.error('变量重算错误:', e);
    toastr.error("变量重算失败");
  }
};

// --- 重roll本楼 (Swipe) ---
const rerollCurrent = () => {
  const parentWin = window.parent as any;
  const parentDoc = parentWin.document;

  // 尝试 DOM 操作 (选中最后一个按钮)
  const swipeButtons = parentDoc.querySelectorAll('.swipe_right');

  if (swipeButtons.length > 0) {
    // 选中最后一个 (最新消息的)
    const lastSwipeBtn = swipeButtons[swipeButtons.length - 1] as HTMLElement;

    // 使用 jQuery 触发 (最稳妥)
    if (parentWin.jQuery) {
      parentWin.jQuery(lastSwipeBtn).trigger('click');
    } else {
      // 原生触发
      lastSwipeBtn.click();
      lastSwipeBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, view: parentWin }));
    }
  } else {
    console.error('未找到任何 .swipe_right 按钮');
  }
};

// 监听器逻辑
const setupTavernObserver = () => {
  const parentDoc = window.parent.document;
  const tavernSendBtn = parentDoc.getElementById('send_but');

  if (tavernSendBtn) {
    checkTavernBusy(tavernSendBtn);

    if (sendButtonObserver) sendButtonObserver.disconnect();

    sendButtonObserver = new MutationObserver((mutations) => {
      const currentBtn = parentDoc.getElementById('send_but');
      if (currentBtn) checkTavernBusy(currentBtn);
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
  const isStopIcon = btn.classList.contains('fa-circle-stop'); // 兼容 ST 的停止图标状态

  const busy = isHidden || isDisabled || isStopIcon;

  if (isTavernBusy.value !== busy) {
    isTavernBusy.value = busy;
  }
};

// --- 监听 messageStore.message ---
watch(
  [
    () => messageStore.message,
    () => questStore.hasBoardData,
    () => shopStore.shopData
  ],
  ([rawText, hasQuestData, shopData]) => {
    if (!rawText) return;

    // 1. 解析选项
    const foundOptions = parseOptions(rawText);
    if (JSON.stringify(foundOptions) !== JSON.stringify(cachedOptions.value)) {
      cachedOptions.value = foundOptions;
      console.log('📜 检测到选项更新:', foundOptions);
    }

    // 2. 检测任务
    const questMatch = rawText.match(QUEST_BLOCK_REGEX);
    if (questMatch && hasQuestData) {
      showQuestLink.value = true;
    } else {
      showQuestLink.value = false;
    }

    // 3. 检测商店
    const shopMatch = rawText.match(SHOP_BLOCK_REGEX);
    const hasShopData = shopData && Object.keys(shopData).length > 0;

    if (shopMatch && hasShopData) {
      showShopLink.value = true;
    } else {
      showShopLink.value = false;
    }
  },
  { immediate: true }
);

// --- 生命周期 ---
onMounted(() => {
  const savedSize = localStorage.getItem('animus_font_size');
  if (savedSize) fontSize.value = parseInt(savedSize);

  messageStore.getMessage();

  if (messageStore.message) {
    const ops = parseOptions(messageStore.message);
    if (ops.length > 0) cachedOptions.value = ops;
  }

  fetchLatestMessage();
  pollingInterval.value = setInterval(fetchLatestMessage, 200);

  setupTavernObserver();

  setTimeout(() => {
    isInitializing.value = false;
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0;
    }
  }, 800);

  const pendingText = uiStore.consumePendingInput();
  if (pendingText) {
    userInput.value = pendingText;
  }
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

/* === 对话特效 (记忆碎片风格) === */
.text-body :deep(q) {
  quotes: none;
  display: inline;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(164, 139, 87, 0.15);
  border-radius: 4px;
  padding: 2px 6px;
  margin: 0 2px;
  color: #fff5e6;
  font-family: 'EB Garamond', serif;
  font-style: italic;
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transition: all 0.3s ease;
}

.text-body :deep(q):hover {
  background: rgba(164, 139, 87, 0.15);
  border-color: rgba(164, 139, 87, 0.4);
  text-shadow: 0 0 5px rgba(164, 139, 87, 0.5);
  cursor: default;
}

.text-body :deep(q)::before {
  content: "『";
  color: var(--c-gold);
  margin-right: 3px;
  font-weight: bold;
  opacity: 0.8;
  text-shadow: none;
}

.text-body :deep(q)::after {
  content: "』";
  color: var(--c-gold);
  margin-left: 3px;
  font-weight: bold;
  opacity: 0.8;
  text-shadow: none;
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
  padding: 15px 30px 30px;
  display: flex; flex-direction: column; align-items: center;
  border-top: 1px solid rgba(164, 139, 87, 0.1);
  backdrop-filter: blur(5px);
}

/* --- Dashboard 控制台 (包含状态栏和工具栏) --- */
.dashboard-console {
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
  gap: 15px;
  flex-wrap: wrap;
  transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
  max-height: 500px;
  opacity: 1;
  overflow: hidden;
}

/* --- 移动端工具栏切换按钮 --- */
.mobile-toolbar-toggle {
  display: none;
}

/* --- Extra Toolbar --- */
.extra-toolbar {
  display: flex;
  gap: 10px;
}

.toolbar-btn {
  background: rgba(20, 22, 28, 0.8);
  border: 1px solid rgba(164, 139, 87, 0.3);
  color: var(--c-gold);
  padding: 6px 12px;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  height: 32px;
}

.toolbar-btn:hover {
  background: rgba(164, 139, 87, 0.15);
  border-color: var(--c-gold);
  box-shadow: 0 0 8px rgba(164, 139, 87, 0.3);
}

.fade-toolbar-enter-active, .fade-toolbar-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-toolbar-enter-from, .fade-toolbar-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* --- Input Wrapper --- */
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

.options-toggle-btn.is-rolling {
  border-color: var(--c-gold);
  color: var(--c-gold);
  cursor: default;
  animation: none;
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

/* --- 移动端适配 --- */
@media (max-width: 768px) {
  .options-popup-menu { width: calc(100vw - 30px); }
  .option-item { padding: 12px; font-size: 1.05rem; }

  .interaction-panel {
    padding: 10px 15px 20px;
  }

  /* 移动端显示折叠开关 */
  .mobile-toolbar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 5px 0 10px 0;
    color: var(--c-gold);
    font-family: 'Cinzel', serif;
    font-size: 0.8rem;
    cursor: pointer;
    opacity: 0.8;
    gap: 10px;
  }

  .toggle-line {
    flex: 1;
    height: 1px;
    background: rgba(164, 139, 87, 0.3);
  }

  /* 移动端控制台收起状态 */
  .dashboard-console.mobile-hidden {
    max-height: 0;
    opacity: 0;
    margin-bottom: 0;
  }

  /* 移动端控制台展开时的布局优化 */
  .dashboard-console {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .extra-toolbar {
    width: 100%;
    justify-content: space-between;
  }

  .toolbar-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .options-popup-menu { width: calc(100vw - 20px); }
  .options-header { padding: 8px 12px; font-size: 0.85rem; }
  .option-item { padding: 10px; font-size: 1rem; }
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

/* --- Input Area Stack --- */
.input-area-stack {
  flex: 1;
  position: relative;
  height: 56px;
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
.send-btn:hover {
  background: var(--c-gold); color: #1a1a1a; box-shadow: 0 0 15px var(--c-gold);
}

/* 发送按钮 - 停止状态 */
.send-btn.is-busy {
  border-color: #8b0000;
  color: #8b0000;
}
.send-btn.is-busy:hover {
  background: rgba(139, 0, 0, 0.2);
  color: #ff4d4d;
  box-shadow: 0 0 15px rgba(139, 0, 0, 0.5);
}
.stop-icon {
  font-size: 1.2rem;
  line-height: 1;
}

/* --- Jump Buttons (Quest & Shop) --- */
.link-btn-group {
  position: absolute;
  bottom: 100px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 10px;
  z-index: 20;
  pointer-events: none;
}

.jump-btn {
  pointer-events: auto;
  background: rgba(20, 22, 28, 0.95);
  border: 1px solid var(--c-gold);
  color: var(--c-gold);
  padding: 10px 25px;
  border-radius: 30px;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 0 15px rgba(164, 139, 87, 0.3);
  transition: all 0.3s ease;
  animation: float 3s ease-in-out infinite;
}

.jump-btn:hover {
  background: var(--c-gold);
  color: #1a1a1a;
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(164, 139, 87, 0.6);
}

.jump-btn .arrow {
  font-weight: bold;
}

.shop-btn {
  border-color: #ffd700;
  color: #ffd700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
}
.shop-btn:hover {
  background: #ffd700;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
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

.fade-input-enter-active, .fade-input-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-input-enter-from { opacity: 0; transform: translateY(5px); }
.fade-input-leave-to { opacity: 0; transform: translateY(-5px); }
</style>
