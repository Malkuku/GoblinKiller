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

    <!-- 顶部状态栏 (已优化布局) -->
    <div class="world-status-bar" v-show="!isInitializing">
      <!-- 左侧：世界信息 (时间/地点) -->
      <div class="status-info">
        <div class="status-group">
          <svg class="status-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span class="status-text">{{ currentWorldLocation || '未知地点' }}</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-group">
          <svg class="status-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4z"/>
          </svg>
          <span class="status-text time-display" v-html="formattedWorldTime"></span>
        </div>
      </div>

      <!-- 右侧：工具控件 (日志/字体) -->
      <div class="top-bar-controls">
        <!-- 新增：事件日志按钮 -->
        <div class="log-control-group">
          <button class="control-icon log-btn" @click="toggleLogPanel" title="事件日志">
            <svg class="control-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 12H9V5h10v9z"/>
            </svg>
            <span v-if="unreadLogCount > 0" class="log-badge">{{ unreadLogCount }}</span>
          </button>
        </div>

        <!-- 字体控制 -->
        <div class="font-control-group">
          <button class="control-icon" @click="changeFontSize(-1)">A-</button>
          <span class="font-size-display">{{ fontSize }}</span>
          <button class="control-icon" @click="changeFontSize(1)">A+</button>
        </div>
      </div>
    </div>

    <!-- 新增：事件日志面板 -->
    <transition name="slide-down-log">
      <div v-if="showLogPanel" class="log-panel">
        <div class="log-header">
          <span>事件日志</span>
          <button class="close-log" @click="showLogPanel = false">×</button>
        </div>
        <ul class="log-list" ref="logListRef">
          <li v-for="log in logMessages" :key="log.id" class="log-item">
            <span class="log-timestamp">[{{ log.timestamp }}]</span>
            <span class="log-text" v-html="formatLogText(log.text)"></span>
          </li>
          <li v-if="logMessages.length === 0" class="log-empty">
            暂无事件记录
          </li>
        </ul>
      </div>
    </transition>

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
import { useStatStore } from '@/尘史使徒/UI/store/StatStore'; // 新增
import * as toastr from 'toastr';
import { KatEvents } from '@/Constants/KatEvent';
import { MvuUtil } from '@/Utils/MvuUtil';
import UserShortcutBar from '@/尘史使徒/UI/components/tool/UserShortcutBar.vue';

const router = useRouter();
const messageStore = useMessageStore();
const questStore = useQuestStore();
const shopStore = useShopStore();
const uiStore = useUiStore();
const statStore = useStatStore(); // 新增
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
const combatStrategyCustom = ref('');

// --- 世界状态 (时间/地点) ---
const currentWorldTime = ref('');
const currentWorldLocation = ref('');

// --- 新增：事件日志状态 ---
const logMessages = ref<{ id: number; text: string; timestamp: string; read: boolean }[]>([]);
const showLogPanel = ref(false);
const logListRef = ref<HTMLElement | null>(null);
let logIdCounter = 0;

// --- 正则 ---
const OPTIONS_BLOCK_REGEX = /<options>([\s\S]*?)<\/options>/i;
const OP_TAG_REGEX = /<op>([\s\S]*?)<\/op>/gi;
const QUEST_BLOCK_REGEX = /<questVariable>([\s\S]*?)<\/questVariable>/i;
const SHOP_BLOCK_REGEX = /<shopVariable>([\s\S]*?)<\/shopVariable>/i;

const displayHtml = computed(() => {
  if (!rawHtml.value) return '';
  let content = rawHtml.value.replace(OPTIONS_BLOCK_REGEX, '').replace(QUEST_BLOCK_REGEX, '').replace(SHOP_BLOCK_REGEX, '').trim();
  if (content.length >= 2 && content.startsWith('"') && content.endsWith('"')) {
    content = content.slice(1, -1);
  }
  return content;
});

const formattedWorldTime = computed(() => {
  if (!currentWorldTime.value) return '??-??-??T??:??[?]';
  try {
    const date = new Date(currentWorldTime.value);
    if (isNaN(date.getTime())) return currentWorldTime.value;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear().toString().padStart(4, '0');
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    let weekDay = date.getDay();
    if (weekDay === 0) weekDay = 7;
    const dSep = `<span class="d-sep">-</span>`;
    const dtSep = `<span class="dt-sep">♦</span>`;
    const tSep = `<span class="t-sep">:</span>`;
    const wOpen = `<span class="w-sep">[</span>`;
    const wClose = `<span class="w-sep">]</span>`;
    return `${year}${dSep}${month}${dSep}${day} ${dtSep} ${hours}${tSep}${minutes} ${wOpen}${weekDay}${wClose}`;
  } catch (e) {
    return currentWorldTime.value;
  }
});

// --- 新增：日志相关计算属性 ---
const unreadLogCount = computed(() => logMessages.value.filter(m => !m.read).length);

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

const navigateToQuest = () => router.push('/任务');
const navigateToShop = () => router.push('/商店');

const syncStatData = () => {
  try {
    const parentWin = window.parent as any;
    if (parentWin.Mvu) {
      const mvuData = parentWin.Mvu.getMvuData({ type: 'message', message_id: -1 });
      if (mvuData && mvuData.stat_data) {
        if (mvuData.stat_data['角色']?.['user']?.['生命状态']) {
          userLifeStatus.value = mvuData.stat_data['角色']['user']['生命状态'];
        }
        if (mvuData.stat_data['system']?.['战斗策略']) {
          combatStrategy.value = mvuData.stat_data['system']['战斗策略'];
        }
        if (mvuData.stat_data['system']?.['战斗策略自定义内容'] !== undefined) {
          combatStrategyCustom.value = mvuData.stat_data['system']['战斗策略自定义内容'];
        }
        if (mvuData.stat_data['世界']) {
          currentWorldTime.value = mvuData.stat_data['世界']['时间'];
          currentWorldLocation.value = mvuData.stat_data['世界']['地点'];
        }
      }
    }
  } catch (e) { /* 忽略错误 */ }
};

const handleStrategyChange = async (newStrategy: string) => {
  combatStrategy.value = newStrategy;
  try {
    await MvuUtil.updateMvuDataByDiff({ "system": { "战斗策略": newStrategy } });
    if (newStrategy !== '自定义') toastr.success(`战斗策略已切换为: ${newStrategy}`);
  } catch (e) { console.error("策略切换失败", e); toastr.error("策略切换失败"); }
};

const handleCustomContentChange = async (newContent: string) => {
  combatStrategyCustom.value = newContent;
  try {
    await MvuUtil.updateMvuDataByDiff({ "system": { "战斗策略自定义内容": newContent } });
    toastr.success(`自定义策略已更新`);
  } catch (e) { console.error("自定义策略更新失败", e); toastr.error("自定义策略更新失败"); }
};

const fetchLatestMessage = () => {
  try {
    const parentDoc = window.parent.document;
    const tavernSendBtn = parentDoc.getElementById('send_but');
    if (tavernSendBtn) checkTavernBusy(tavernSendBtn);
    messageStore.getMessage();
    syncStatData();
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
  } catch (e) { console.warn('轮询父窗口失败', e); }
};

const parseOptions = (content: string): string[] => {
  if (!content) return [];
  const match = content.match(OPTIONS_BLOCK_REGEX);
  if (!match || !match[1]) return [];
  return Array.from(match[1].matchAll(OP_TAG_REGEX), m => m[1].trim().replace(/^["']|["']$/g, ''));
};

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTo({ top: scrollContainer.value.scrollHeight, behavior: 'smooth' });
    }
  });
};

const handleSendOrStop = async () => {
  if (isTavernBusy.value) {
    const parentWin = window.parent as any;
    const stopBtn = parentWin.document.querySelector('#form_sheld .mes_stop');
    if (stopBtn) {
      const eventOpts = { bubbles: true, cancelable: true, view: parentWin };
      stopBtn.dispatchEvent(new MouseEvent('mousedown', eventOpts));
      stopBtn.dispatchEvent(new MouseEvent('click', eventOpts));
    }
    return;
  }
  await sendMessage();
};

const sendMessage = async () => {
  const textToSend = userInput.value;
  isTavernBusy.value = true;
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

const recalculateVariables = async () => {
  try {
    await eventEmit(KatEvents.kat_resend_mvu_update);
    toastr.success("已发送变量重算");
  } catch (e) { console.error('变量重算错误:', e); toastr.error("变量重算失败"); }
};

const rerollCurrent = () => {
  const parentWin = window.parent as any;
  const swipeButtons = parentWin.document.querySelectorAll('.swipe_right');
  if (swipeButtons.length > 0) {
    const lastSwipeBtn = swipeButtons[swipeButtons.length - 1] as HTMLElement;
    if (parentWin.jQuery) parentWin.jQuery(lastSwipeBtn).trigger('click');
    else lastSwipeBtn.click();
  } else {
    console.error('未找到任何 .swipe_right 按钮');
  }
};

const setupTavernObserver = () => {
  const parentDoc = window.parent.document;
  const tavernSendBtn = parentDoc.getElementById('send_but');
  if (tavernSendBtn) {
    checkTavernBusy(tavernSendBtn);
    if (sendButtonObserver) sendButtonObserver.disconnect();
    sendButtonObserver = new MutationObserver(() => {
      const currentBtn = parentDoc.getElementById('send_but');
      if (currentBtn) checkTavernBusy(currentBtn);
    });
    sendButtonObserver.observe(tavernSendBtn, { attributes: true, attributeFilter: ['style', 'class', 'disabled'] });
  }
};

const checkTavernBusy = (btn: HTMLElement) => {
  const style = window.getComputedStyle(btn);
  const isHidden = style.display === 'none' || style.visibility === 'hidden';
  const isDisabled = btn.hasAttribute('disabled');
  const isStopIcon = btn.classList.contains('fa-circle-stop');
  const busy = isHidden || isDisabled || isStopIcon;
  if (isTavernBusy.value !== busy) isTavernBusy.value = busy;
};

// --- 新增：日志相关方法 ---
const addLogMessage = (text: string, timestamp: string) => {
  logMessages.value.unshift({
    id: logIdCounter++,
    text,
    timestamp,
    read: showLogPanel.value, // 如果面板已打开，则新消息标记为已读
  });
  if (logMessages.value.length > 100) logMessages.value.pop(); // 限制日志数量
  nextTick(() => {
    if (logListRef.value) logListRef.value.scrollTop = 0; // 滚动到顶部
  });
};

const toggleLogPanel = () => {
  showLogPanel.value = !showLogPanel.value;
  if (showLogPanel.value) {
    logMessages.value.forEach(m => m.read = true); // 打开时全部标记为已读
  }
};

const formatLogText = (text: string) => {
  return text.replace(/\(\s*\+[0-9.]+\s*\)/g, '<span class="log-positive">$&</span>')
    .replace(/\(\s*-[0-9.]+\s*\)/g, '<span class="log-negative">$&</span>');
};

watch(userInput, (newVal) => uiStore.setPendingInput(newVal));

watch(
  [() => messageStore.message, () => questStore.hasBoardData, () => shopStore.shopData],
  ([rawText, hasQuestData, shopData]) => {
    if (!rawText) return;
    const foundOptions = parseOptions(rawText);
    if (JSON.stringify(foundOptions) !== JSON.stringify(cachedOptions.value)) {
      cachedOptions.value = foundOptions;
      console.log('📜 检测到选项更新:', foundOptions);
    }
    const questMatch = rawText.match(QUEST_BLOCK_REGEX);
    showQuestLink.value = !!(questMatch && hasQuestData);
    const shopMatch = rawText.match(SHOP_BLOCK_REGEX);
    const hasShopData = shopData && Object.keys(shopData).length > 0;
    showShopLink.value = !!(shopMatch && hasShopData);
  },
  { immediate: true }
);

// --- 新增：监听 StatStore 数据变化以生成日志 ---
watch(() => statStore.stat_data, (newData, oldData) => {
  if (!oldData || !newData || !oldData.角色?.user || !newData.角色?.user) {
    return; // 避免在数据不完整时触发
  }

  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const oldUser = oldData.角色.user;
  const newUser = newData.角色.user;

  // 1. 金钱
  if (oldUser.金钱 !== newUser.金钱) {
    const diff = newUser.金钱 - oldUser.金钱;
    addLogMessage(`金钱变化: ${oldUser.金钱} → ${newUser.金钱} (${diff > 0 ? '+' : ''}${diff})`, timestamp);
  }
  // 2. 缥缈异质
  if (oldUser.缥缈异质 !== newUser.缥缈异质) {
    const diff = newUser.缥缈异质 - oldUser.缥缈异质;
    addLogMessage(`缥缈异质变化: ${oldUser.缥缈异质} → ${newUser.缥缈异质} (${diff > 0 ? '+' : ''}${diff})`, timestamp);
  }
  // 3. 生命状态
  const statuses: ('生命' | '体力' | '精神')[] = ['生命', '体力', '精神'];
  statuses.forEach(status => {
    if (oldUser.生命状态[status].当前 !== newUser.生命状态[status].当前) {
      const diff = newUser.生命状态[status].当前 - oldUser.生命状态[status].当前;
      addLogMessage(`${status}变化: ${oldUser.生命状态[status].当前} → ${newUser.生命状态[status].当前} (${diff > 0 ? '+' : ''}${diff})`, timestamp);
    }
  });
  // 4. 任务
  const oldTasks = oldData.任务 || {};
  const newTasks = newData.任务 || {};
  const oldTaskKeys = Object.keys(oldTasks);
  const newTaskKeys = Object.keys(newTasks);
  newTaskKeys.forEach(key => {
    if (!oldTaskKeys.includes(key)) addLogMessage(`获得新任务: ${key}`, timestamp);
  });
  oldTaskKeys.forEach(key => {
    if (!newTaskKeys.includes(key)) addLogMessage(`任务完成/移除: ${key}`, timestamp);
  });

}, { deep: true });

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

  // 新增：初始化 StatStore
  statStore.initData();
  statStore.registerListener();

  setTimeout(() => {
    isInitializing.value = false;
    if (scrollContainer.value) scrollContainer.value.scrollTop = 0;
  }, 800);

  const pendingText = uiStore.consumePendingInput();
  if (pendingText) userInput.value = pendingText;
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

/* --- World Status Bar (优化后) --- */
.world-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(164, 139, 87, 0.2);
  font-family: 'Cinzel', serif;
  color: var(--c-gold);
  font-size: 0.9rem;
  z-index: 15; /* 提高层级 */
  flex-shrink: 0;
  position: relative;
}
.status-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 1;
  min-width: 0;
}
.status-group {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}
.status-svg {
  width: 18px; height: 18px; color: var(--c-gold); opacity: 0.9;
  filter: drop-shadow(0 0 2px rgba(164, 139, 87, 0.5));
  flex-shrink: 0;
}
.status-text {
  letter-spacing: 0.5px; text-shadow: 0 0 5px rgba(0,0,0,0.5);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.status-divider {
  width: 1px; height: 14px; background: rgba(164, 139, 87, 0.4);
}

/* --- Top Bar Controls (日志/字体) --- */
.top-bar-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.font-control-group, .log-control-group {
  display: flex; align-items: center; background: rgba(0,0,0,0.6);
  padding: 4px; border-radius: 20px; border: 1px solid var(--c-border);
}
.log-control-group { padding: 0; }
.control-icon {
  background: none; border: none; color: var(--c-text-main); cursor: pointer;
  font-family: var(--font-title); padding: 0 5px;
  height: 28px; display: flex; align-items: center; justify-content: center;
  transition: color 0.3s;
}
.control-icon:hover { color: var(--c-gold); }
.font-size-display { font-size: 0.85rem; color: var(--c-gold); min-width: 28px; text-align: center; }

/* 新增：日志按钮样式 */
.log-btn {
  position: relative;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  color: var(--c-text-dim);
}
.log-btn:hover { color: var(--c-gold); }
.control-svg { width: 20px; height: 20px; }
.log-badge {
  position: absolute; top: 0; right: 0;
  background: #8b0000; color: #fff; font-size: 0.7rem; font-weight: bold;
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.5);
  border: 1px solid #1a1a1a;
}

/* --- 新增：事件日志面板 --- */
.log-panel {
  position: absolute;
  top: 58px; /* 顶栏高度 + 间距 */
  right: 20px;
  width: 450px;
  max-height: 50vh;
  background: rgba(20, 22, 28, 0.95);
  border: 1px solid var(--c-gold);
  border-radius: 4px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  z-index: 14;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
}
.log-header {
  padding: 8px 15px; background: rgba(164, 139, 87, 0.1);
  border-bottom: 1px solid rgba(164, 139, 87, 0.3);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 0.9rem;
  flex-shrink: 0;
}
.close-log { background: none; border: none; color: var(--c-text-dim); cursor: pointer; font-size: 1.2rem; }
.log-list {
  list-style: none; margin: 0; padding: 10px;
  overflow-y: auto;
  scrollbar-width: thin; scrollbar-color: var(--c-gold) transparent;
}
.log-item {
  padding: 6px 4px;
  font-size: 0.9rem;
  color: var(--c-text-main);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  gap: 8px;
}
.log-timestamp { color: var(--c-text-dim); }
.log-text :deep(.log-positive) { color: #4CAF50; font-weight: bold; }
.log-text :deep(.log-negative) { color: #F44336; font-weight: bold; }
.log-empty {
  text-align: center;
  padding: 20px;
  color: var(--c-text-dim);
  font-style: italic;
}

/* --- Message Area --- */
.message-scroll-area {
  flex: 1; overflow-y: auto; padding: 20px 0;
  scrollbar-width: thin; scrollbar-color: var(--c-gold) transparent;
}
.message-paper { max-width: 1024px; margin: 0 auto; padding: 0 30px; }
.message-content {
  line-height: 1.8; color: var(--c-text-main);
  font-family: 'EB Garamond', serif; transition: font-size 0.2s ease;
}

/* === 对话特效 (记忆碎片风格) === */
.text-body :deep(q) {
  quotes: none; display: inline; background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(164, 139, 87, 0.15); border-radius: 4px;
  padding: 2px 6px; margin: 0 2px; color: #fff5e6;
  font-family: 'EB Garamond', serif; font-style: italic;
  text-shadow: 0 0 2px rgba(0,0,0,0.5); box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  box-decoration-break: clone; -webkit-box-decoration-break: clone;
  transition: all 0.3s ease;
}
.text-body :deep(q):hover {
  background: rgba(164, 139, 87, 0.15); border-color: rgba(164, 139, 87, 0.4);
  text-shadow: 0 0 5px rgba(164, 139, 87, 0.5); cursor: default;
}
.text-body :deep(q)::before { content: "『"; color: var(--c-gold); margin-right: 3px; font-weight: bold; opacity: 0.8; text-shadow: none; }
.text-body :deep(q)::after { content: "』"; color: var(--c-gold); margin-left: 3px; font-weight: bold; opacity: 0.8; text-shadow: none; }
.text-body :deep(p) { margin-bottom: 1em; text-align: justify; }
.text-body :deep(em) { color: var(--c-gold); font-style: italic; }
.text-body :deep(strong) { color: #fff; font-weight: 600; }
.typing-cursor { display: inline-block; color: var(--c-gold); font-weight: bold; animation: blink 1s step-end infinite; }

/* --- Interaction Panel --- */
.interaction-panel {
  flex-shrink: 0;
  background: linear-gradient(to top, rgba(10, 12, 16, 1) 20%, rgba(10, 12, 16, 0.8) 80%, transparent);
  padding: 15px 30px 30px;
  display: flex; flex-direction: column; align-items: center;
  border-top: 1px solid rgba(164, 139, 87, 0.1);
  backdrop-filter: blur(5px);
}

/* --- Dashboard 控制台 --- */
.dashboard-console {
  width: 100%; max-width: 1024px; display: flex; justify-content: space-between;
  align-items: flex-end; margin-bottom: 12px; gap: 15px; flex-wrap: wrap;
  transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
  max-height: 500px; opacity: 1; overflow: hidden;
}

/* --- 移动端工具栏切换按钮 --- */
.mobile-toolbar-toggle { display: none; }

/* --- Extra Toolbar --- */
.extra-toolbar { display: flex; gap: 10px; }
.toolbar-btn {
  background: rgba(20, 22, 28, 0.8); border: 1px solid rgba(164, 139, 87, 0.3);
  color: var(--c-gold); padding: 6px 12px; border-radius: 4px;
  font-family: 'Cinzel', serif; font-size: 0.85rem; cursor: pointer;
  display: flex; align-items: center; gap: 6px; transition: all 0.3s ease; height: 32px;
}
.toolbar-btn:hover {
  background: rgba(164, 139, 87, 0.15); border-color: var(--c-gold);
  box-shadow: 0 0 8px rgba(164, 139, 87, 0.3);
}
.fade-toolbar-enter-active, .fade-toolbar-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-toolbar-enter-from, .fade-toolbar-leave-to { opacity: 0; transform: translateY(10px); }

/* --- Input Wrapper --- */
.input-wrapper {
  position: relative; width: 100%; max-width: 1024px;
  display: flex; align-items: flex-end; gap: 12px;
}

/* --- Options Button & Animation --- */
.options-container { position: relative; display: flex; align-items: flex-end; }
.options-toggle-btn {
  width: 56px; height: 56px; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--c-border);
  border-radius: 4px; color: var(--c-text-dim); font-size: 1.5rem;
  cursor: pointer; transition: all 0.3s ease;
  display: flex; align-items: center; justify-content: center;
}
.options-toggle-btn.has-options {
  color: var(--c-gold); border-color: var(--c-gold);
  box-shadow: 0 0 10px rgba(164, 139, 87, 0.2); animation: pulse-border 2s infinite;
}
.options-toggle-btn.active { background: var(--c-gold); color: #1a1a1a; }
.options-toggle-btn.is-rolling {
  border-color: var(--c-gold); color: var(--c-gold); cursor: default; animation: none;
}
.options-toggle-btn.is-rolling .toggle-icon { display: inline-block; animation: spin 2s linear infinite; }
.options-badge {
  position: absolute; top: -5px; right: -5px; background: #8b0000; color: #fff; font-size: 0.7rem; font-weight: bold;
  width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
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
  /* 顶栏适配 */
  .world-status-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 8px 15px;
  }
  .status-info {
    justify-content: space-between;
    width: 100%;
  }
  .top-bar-controls {
    background: rgba(0,0,0,0.2);
    padding: 4px;
    border-radius: 25px;
    justify-content: space-around;
  }
  .log-panel {
    width: calc(100vw - 30px);
    right: 15px;
    top: 90px; /* 移动端顶栏高度增加 */
  }

  .options-popup-menu { width: calc(100vw - 30px); }
  .option-item { padding: 12px; font-size: 1.05rem; }
  .interaction-panel { padding: 10px 15px 20px; }

  /* 移动端显示折叠开关 */
  .mobile-toolbar-toggle {
    display: flex; align-items: center; justify-content: center; width: 100%;
    padding: 5px 0 10px 0; color: var(--c-gold); font-family: 'Cinzel', serif;
    font-size: 0.8rem; cursor: pointer; opacity: 0.8; gap: 10px;
  }
  .toggle-line { flex: 1; height: 1px; background: rgba(164, 139, 87, 0.3); }

  /* 移动端控制台收起状态 */
  .dashboard-console.mobile-hidden { max-height: 0; opacity: 0; margin-bottom: 0; }
  .dashboard-console { flex-direction: column; align-items: stretch; gap: 10px; }
  .extra-toolbar { width: 100%; justify-content: space-between; }
  .toolbar-btn { flex: 1; justify-content: center; }
}

@media (max-width: 480px) {
  .options-popup-menu { width: calc(100vw - 20px); }
  .options-header { padding: 8px 12px; font-size: 0.85rem; }
  .option-item { padding: 10px; font-size: 1rem; }
  .log-panel { width: calc(100vw - 20px); right: 10px; }
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
.input-area-stack { flex: 1; position: relative; height: 56px; }
.story-input {
  width: 100%; height: 100%; background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255,255,255,0.1); border-bottom: 2px solid var(--c-border);
  color: var(--c-text-main); padding: 12px 15px;
  border-radius: 4px 4px 0 0; font-family: 'EB Garamond', serif; font-size: 1.1rem;
  resize: none; transition: all 0.3s; display: block;
}
.story-input:focus { outline: none; background: rgba(0, 0, 0, 0.4); border-bottom-color: var(--c-gold); }
.story-input.busy-state {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: rgba(0, 0, 0, 0.1); border-color: transparent;
  border-bottom-color: rgba(164, 139, 87, 0.3); color: var(--c-gold);
  cursor: default; user-select: none;
}
.busy-icon { font-size: 1.2rem; animation: write 1s ease-in-out infinite alternate; }
.busy-text {
  font-family: 'Cinzel', serif; font-size: 0.95rem;
  letter-spacing: 1px; animation: pulse-text 2s infinite;
}

/* --- Send Button --- */
.send-btn {
  width: 56px; height: 56px; background: transparent; border: 1px solid var(--c-border);
  border-radius: 50%; color: var(--c-gold); font-size: 1.4rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.3s;
}
.send-btn:hover { background: var(--c-gold); color: #1a1a1a; box-shadow: 0 0 15px var(--c-gold); }
.send-btn.is-busy { border-color: #8b0000; color: #8b0000; }
.send-btn.is-busy:hover { background: rgba(139, 0, 0, 0.2); color: #ff4d4d; box-shadow: 0 0 15px rgba(139, 0, 0, 0.5); }
.stop-icon { font-size: 1.2rem; line-height: 1; }

/* --- Jump Buttons (Quest & Shop) --- */
.link-btn-group {
  position: absolute; bottom: 100px; left: 0; right: 0;
  display: flex; flex-direction: column-reverse; align-items: center;
  gap: 10px; z-index: 20; pointer-events: none;
}
.jump-btn {
  pointer-events: auto; background: rgba(20, 22, 28, 0.95);
  border: 1px solid var(--c-gold); color: var(--c-gold); padding: 10px 25px;
  border-radius: 30px; font-family: 'Cinzel', serif; font-size: 1rem;
  cursor: pointer; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 0 15px rgba(164, 139, 87, 0.3);
  transition: all 0.3s ease; animation: float 3s ease-in-out infinite;
}
.jump-btn:hover {
  background: var(--c-gold); color: #1a1a1a;
  transform: translateY(-2px); box-shadow: 0 0 25px rgba(164, 139, 87, 0.6);
}
.jump-btn .arrow { font-weight: bold; }
.shop-btn {
  border-color: #ffd700; color: #ffd700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
}
.shop-btn:hover { background: #ffd700; box-shadow: 0 0 25px rgba(255, 215, 0, 0.5); }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

/* --- Animations --- */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { from { transform: scale(0.8); opacity: 0.5; } to { transform: scale(1.2); opacity: 1; } }
@keyframes blink { 50% { opacity: 0; } }
@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(164, 139, 87, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(164, 139, 87, 0); }
  100% { box-shadow: 0 0 0 0 rgba(164, 139, 87, 0); }
}
@keyframes write { from { transform: rotate(0deg) translateY(0); } to { transform: rotate(15deg) translateY(-3px); } }
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

/* 新增：日志面板过渡 */
.slide-down-log-enter-active, .slide-down-log-leave-active { transition: all 0.3s ease; }
.slide-down-log-enter-from, .slide-down-log-leave-to { opacity: 0; transform: translateY(-10px); }

/* --- 时间格式化样式 --- */
.time-display :deep(.d-sep),
.time-display :deep(.t-sep),
.time-display :deep(.w-sep) {
  color: rgba(164, 139, 87, 0.6); margin: 0 1px; font-weight: normal;
}
.time-display :deep(.dt-sep) {
  color: var(--c-gold); margin: 0 6px; font-size: 0.7em;
  vertical-align: middle; opacity: 0.8;
}
</style>
