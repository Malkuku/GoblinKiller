<template>
  <div class="library-container">
    <!-- 入场动画 -->
    <BurnIntro v-if="showIntro" @complete="showIntro = false" />

    <!-- 顶部 Header -->
    <LibraryHeader
      :currentMode="currentMode"
      :modes="modes"
      :redDots="redDots"
      :userHeterogeneity="userHeterogeneity"
      @switchMode="switchMode"
    />

    <!-- 主内容展示区 -->
    <div class="main-content-area">
      <ChatArea
        v-show="currentMode === '对话'"
        ref="chatAreaRef"
        :chatContents="chatContents"
        :welcomeContent="welcomeContent"
        :isThinking="isThinking"
        :isDeleteMode="isDeleteMode"
        :selectedMessages="selectedMessages"
        @toggleSelect="toggleSelect"
      />

      <ItemSellArea
        v-show="currentMode === '物品出售'"
        :itemSells="itemSells"
      />

      <SkillBuyArea
        v-show="currentMode === '技能购买'"
        :skillBuys="skillBuys"
      />

      <SecretBuyArea
        v-show="currentMode === '密传购买'"
        :secretBuys="secretBuys"
      />

      <ExpBuyArea
        v-show="currentMode === '经验兑换'"
      />

    </div>

    <!-- 底部输入区 -->
    <InputArea
      :isSending="isSending"
      :isDeleteMode="isDeleteMode"
      :selectedCount="selectedMessages.length"
      @sendMessage="sendMessage"
      @toggleDeleteMode="toggleDeleteMode"
      @deleteSelected="deleteSelected"
    />
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted, onUnmounted, computed } from 'vue';
import { MvuUtil } from '@/Utils/MvuUtil';
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { welcomeMessage } from '@/尘史使徒/UI/components/start/开场白';
import LibraryHeader from '@/尘史使徒/UI/components/library/LibraryHeader.vue';
import BurnIntro from '@/尘史使徒/UI/components/library/BurnIntro.vue';
import ChatArea from '@/尘史使徒/UI/components/library/ChatArea.vue';
import ItemSellArea from '@/尘史使徒/UI/components/library/ItemSellArea.vue';
import SkillBuyArea from '@/尘史使徒/UI/components/library/SkillBuyArea.vue';
import SecretBuyArea from '@/尘史使徒/UI/components/library/SecretBuyArea.vue';
import InputArea from '@/尘史使徒/UI/components/library/InputArea.vue';
import ExpBuyArea from '@/尘史使徒/UI/components/library/ExpBuyArea.vue';

const showToast = inject('showToast', (msg) => console.log(msg));
const statStore = useStatStore();

// 状态管理
const modes = ['对话', '物品出售', '技能购买', '密传购买', '经验兑换'];
const currentMode = ref('对话');
const isSending = ref(false);
const isThinking = ref(false);
const showIntro = ref(true);

// 删除模式状态管理 (新增)
const isDeleteMode = ref(false);
const selectedMessages = ref([]);

// 聊天数据
const chatContents = ref([]);
const welcomeContent = ref('');
const chatAreaRef = ref(null);

// 交易数据
const itemSells = ref({});
const skillBuys = ref({});
const secretBuys = ref({});

// 红点与缓存
const redDots = reactive({ '物品出售': false, '技能购买': false, '密传购买': false });
const lastRawRecords = { ItemSell: null, SkillBuy: null, SecretBuy: null };

let pollingTimer = null;
let bgmTimer = null; // 新增：用于记录 BGM 的定时器

const userHeterogeneity = computed(() => statStore.stat_data?.角色?.user?.缥缈异质 || 0);

const switchMode = (mode) => {
  currentMode.value = mode;
  if (redDots[mode]) redDots[mode] = false;
  if (mode === '对话' && chatAreaRef.value) {
    chatAreaRef.value.scrollToBottom();
  }
};

// ================= 核心逻辑：删除模式控制 (新增) =================
const toggleDeleteMode = () => {
  isDeleteMode.value = !isDeleteMode.value;
  if (!isDeleteMode.value) selectedMessages.value = [];
};

const toggleSelect = (id) => {
  const pos = selectedMessages.value.indexOf(id);
  if (pos === -1) selectedMessages.value.push(id);
  else selectedMessages.value.splice(pos, 1);
};

// ================= 核心逻辑：批量删除 (修改) =================
const deleteSelected = async () => {
  const selectedIds = selectedMessages.value;
  if (!selectedIds || selectedIds.length === 0) return;

  const newMessages = chatContents.value.filter(msg => !selectedIds.includes(msg.id));
  chatContents.value = newMessages;

  const entryName = '<图书馆>聊天记录';
  let newRaw = newMessages.map(m => {
    const tag = m.type === 'user' ? 'user_say' : 'content';
    return `<${tag}>\n${m.text}\n</${tag}>`;
  }).join('\n');

  if (welcomeContent.value) {
    newRaw += `\n<welcome>\n${welcomeContent.value}\n</welcome>`;
  }

  try {
    await WorldInfoUtil.updateEntryContent(entryName, newRaw);
    showToast("删除成功");
  } catch (e) {
    console.error(e);
    showToast("删除失败");
  } finally {
    // 删除完成后退出删除模式并清空选择
    selectedMessages.value = [];
    isDeleteMode.value = false;
  }
};

// ================= 核心逻辑：发送消息 (修改) =================
const sendMessage = async (text) => {
  // 发送消息时，如果处于删除模式，则退出
  if (isDeleteMode.value) {
    isDeleteMode.value = false;
    selectedMessages.value = [];
  }

  isSending.value = true;
  chatContents.value.push({
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    type: 'user',
    text: text
  });

  if (chatAreaRef.value) chatAreaRef.value.scrollToBottom();
  isThinking.value = true;

  try {
    const entryName = '<图书馆>聊天记录';
    let rawText = await WorldInfoUtil.getWorldBookContent([entryName]);
    const newUserTag = `<user_say>\n${text}\n</user_say>`;
    const lastUserSayRegex = /<user_say>[\s\S]*?<\/user_say>\s*$/;

    if (lastUserSayRegex.test(rawText)) {
      rawText = rawText.replace(lastUserSayRegex, newUserTag);
    } else {
      rawText += `\n${newUserTag}`;
    }

    await WorldInfoUtil.updateEntryContent(entryName, rawText);
    await MvuUtil.updateMvuDataByDiff({ "图书馆": { "玩家输入": text } });

    eventEmit("图书馆对话");

    if (currentMode.value !== '对话') switchMode('对话');
  } catch (error) {
    console.error("发送失败:", error);
    showToast("发送失败");
    isThinking.value = false;
  } finally {
    isSending.value = false;
  }
};

// ================= 核心逻辑：数据同步 (修改) =================
const welcome1 = welcomeMessage.welcome1;
const welcome2 = welcomeMessage.welcome2;

const syncChatRecord = async () => {
  // 如果处于删除模式，暂停同步以防干扰用户选择
  if (isDeleteMode.value) return;

  try {
    const entryName = '<图书馆>聊天记录';
    const rawText = await WorldInfoUtil.getWorldBookContent([entryName]);
    const regex = /<(content|user_say)>([\s\S]*?)<\/\1>/g;
    let match;
    const parsedMessages = [];

    while ((match = regex.exec(rawText)) !== null) {
      const tag = match[1];
      const text = match[2].trim();
      if (text) {
        parsedMessages.push({ type: tag === 'user_say' ? 'user' : 'npc', text: text });
      }
    }

    let currentWelcome = '';
    const welcomeMatch = rawText.match(/<welcome>([\s\S]*?)<\/welcome>/);
    if (welcomeMatch) currentWelcome = welcomeMatch[1].trim();

    let needsUpdate = false;
    let newMessages = [...parsedMessages];

    if (newMessages.length > 10) {
      newMessages = newMessages.slice(newMessages.length - 10);
      needsUpdate = true;
    }

    if (newMessages.length === 0 && currentWelcome !== welcome1) {
      currentWelcome = welcome1;
      needsUpdate = true;
    } else if (newMessages.length > 0 && currentWelcome !== welcome2) {
      currentWelcome = welcome2;
      needsUpdate = true;
    }

    if (needsUpdate) {
      let newRaw = newMessages.map(m => {
        const tag = m.type === 'user' ? 'user_say' : 'content';
        return `<${tag}>\n${m.text}\n</${tag}>`;
      }).join('\n');
      if (currentWelcome) newRaw += `\n<welcome>\n${currentWelcome}\n</welcome>`;
      await WorldInfoUtil.updateEntryContent(entryName, newRaw);
    }

    newMessages.forEach((m) => {
      const oldMsg = chatContents.value.find(old => old.text === m.text && old.type === m.type && !old._used);
      if (oldMsg) {
        m.id = oldMsg.id;
        oldMsg._used = true;
      } else {
        m.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      }
    });
    chatContents.value.forEach(old => delete old._used);

    const isNewMessage = chatContents.value.length !== newMessages.length;
    chatContents.value = newMessages;
    welcomeContent.value = currentWelcome;

    if (isNewMessage) {
      const lastMsg = newMessages[newMessages.length - 1];
      if (lastMsg && lastMsg.type === 'npc') isThinking.value = false;
    }
  } catch (error) {
    console.error("同步聊天记录失败:", error);
  }
};

const syncTransactionRecord = async () => {
  try {
    const rawText = await WorldInfoUtil.getWorldBookContent(['<图书馆>交易记录']);
    const extractTag = (tag) => {
      const m = rawText.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : '';
    };
    const parse = (str) => { try { return JSON.parse(str); } catch { return {}; } };

    const update = (tag, mode, refVal) => {
      const str = extractTag(tag);
      if (lastRawRecords[tag] !== str) {
        const isInitial = lastRawRecords[tag] === null;
        lastRawRecords[tag] = str;
        refVal.value = parse(str);
        if (!isInitial && currentMode.value !== mode) redDots[mode] = true;
      }
    };

    update('ItemSell', '物品出售', itemSells);
    update('SkillBuy', '技能购买', skillBuys);
    update('SecretBuy', '密传购买', secretBuys);
  } catch (e) { console.error(e); }
};

const fetchAll = async () => {
  await syncChatRecord();
  await syncTransactionRecord();
};

onMounted(async () => {
  await fetchAll();
  pollingTimer = setInterval(fetchAll, 3000);

  // 新增：延迟 5 秒后播放 BGM 并设置为单曲循环
  bgmTimer = setTimeout(() => {
    // 1. 设置背景音乐为单曲循环
    setAudioSettings('bgm', { mode: 'repeat_one' });

    // 2. 播放指定的 BGM
    playAudio('bgm', {
      title: '图书馆之梦',
      url: 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/bgm/图书馆之梦.wav'
    });
  }, 4000);
});

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer);

  // 新增：如果组件在 5 秒内被销毁，清除定时器，防止在其他页面突然播放音乐
  if (bgmTimer) clearTimeout(bgmTimer);

  pauseAudio('bgm');
});
</script>

<style>
/* 提取出的全局通用样式，供子组件使用 */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@400;700&display=swap');

.library-container {
  --c-gold: #d4af37;
  --c-gold-light: #f9e79f;
  --c-gold-dim: rgba(212, 175, 55, 0.2);
  --c-bg-dark: #1a1a1a;
  --c-bg-card: #252525;
  --c-text: #e0e0e0;
  --c-accent: #81d4fa;
  --c-danger: #e57373;

  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--c-bg-dark);
  color: var(--c-text);
  font-family: 'Lato', sans-serif;
  overflow: hidden;
}

.main-content-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: url('https://www.transparenttextures.com/patterns/dark-matter.png');
}

/* 交易卡片通用样式 */
.scroll-area { height: 100%; overflow-y: auto; padding: 20px; scroll-behavior: smooth; }
.empty-state { text-align: center; color: #666; margin-top: 50px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; max-width: 1000px; margin: 0 auto; }
.trade-card { background: var(--c-bg-card); border: 1px solid #333; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
.trade-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); border-color: var(--c-gold-dim); }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
.card-title { font-weight: bold; color: var(--c-gold); font-size: 1.1rem; }
.card-mid { flex: 1; font-size: 0.9rem; color: #aaa; margin-bottom: 15px; }
.card-mid p { margin: 5px 0; }
.tags { display: flex; gap: 5px; margin-bottom: 8px; }
.tag { padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.1); }
.tag.aspect { color: #a5d6a7; border-color: #a5d6a7; }
.tag.cost { color: #ef9a9a; border-color: #ef9a9a; }
.inventory-check { font-size: 0.8rem; color: #666; }
.inventory-check.has-item { color: #81c784; }
.card-action { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.price-display { font-size: 0.85rem; color: var(--c-gold-light); }
.action-btn { padding: 6px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
.sell-btn { background: #388e3c; color: white; width: 100%; }
.sell-btn:disabled { background: #2e352f; color: #555; cursor: not-allowed; }
.buy-btn { background: var(--c-gold); color: #1a1a1a; }
.buy-btn:disabled { background: #444; color: #777; cursor: not-allowed; }

/* 滚动条样式 */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #1a1a1a; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--c-gold); }
</style>
