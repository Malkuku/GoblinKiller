<template>
  <div class="library-container">
    <BurnIntro v-if="showIntro" @complete="handleIntroComplete" />
    <LibraryHeader
      :currentMode="currentMode"
      :modes="modes"
      :redDots="redDots"
      :userHeterogeneity="userHeterogeneity"
      :aliceSetting="aliceSetting"
      @switchMode="switchMode"
      @changeSetting="handleAliceChange"
    />

    <div class="main-content-area">
      <ChatArea
        v-show="currentMode === '对话'"
        ref="chatAreaRef"
        :chatContents="chatContents"
        :welcomeContent="welcomeContent"
        :isThinking="isThinking"
        :isDeleteMode="isDeleteMode"
        :selectedMessages="selectedMessages"
        :aliceSetting="aliceSetting"
        @toggleSelect="toggleSelect"
      />

      <ItemSellArea
        v-show="currentMode === '物品出售'"
        :itemSells="itemSells"
      />

      <!-- 监听 transaction-complete 事件，触发立即刷新 -->
      <SkillBuyArea
        v-show="currentMode === '技能购买'"
        :skillBuys="skillBuys"
        @transaction-complete="fetchAll"
      />

      <SecretBuyArea
        v-show="currentMode === '秘传购买'"
        :secretBuys="secretBuys"
      />

      <ExpBuyArea v-show="currentMode === '经验兑换'" />
    </div>

    <InputArea
      :isDeleteMode="isDeleteMode"
      :selectedCount="selectedMessages.length"
      @sendMessage="sendMessage"
      @toggleDeleteMode="toggleDeleteMode"
      @deleteSelected="deleteSelected"
      @truncate="truncateChat"
    />
  </div>
</template>


<script setup>
import { ref, reactive, inject, onMounted, onUnmounted, computed, watch } from 'vue';
import { MvuUtil } from '@/Utils/MvuUtil';
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { welcomeMessage } from '@/尘史使徒/UI/components/library/开场白';
import LibraryHeader from '@/尘史使徒/UI/components/library/LibraryHeader.vue';
import BurnIntro from '@/尘史使徒/UI/components/library/BurnIntro.vue';
import ChatArea from '@/尘史使徒/UI/components/library/ChatArea.vue';
import ItemSellArea from '@/尘史使徒/UI/components/library/ItemSellArea.vue';
import SkillBuyArea from '@/尘史使徒/UI/components/library/SkillBuyArea.vue';
import SecretBuyArea from '@/尘史使徒/UI/components/library/SecretBuyArea.vue';
import InputArea from '@/尘史使徒/UI/components/library/InputArea.vue';
import ExpBuyArea from '@/尘史使徒/UI/components/library/ExpBuyArea.vue';
import { useAudioStore } from '@/尘史使徒/UI/store/AudioStore';

const showToast = inject('showToast', (msg) => console.log(msg));
const statStore = useStatStore();
const audioStore = useAudioStore();

// 1. 初始化音频资源（将列表注入底层 API）
audioStore.initAudioResources();

const modes = ['对话', '物品出售', '技能购买', '秘传购买', '经验兑换'];
const currentMode = ref('对话');
const isSending = ref(false);
const isThinking = ref(false);
const showIntro = ref(true);
const isDeleteMode = ref(false);
const selectedMessages = ref([]);
const chatContents = ref([]);
const welcomeContent = ref('');
const chatAreaRef = ref(null);
const itemSells = ref({});
const skillBuys = ref({});
const secretBuys = ref({});
const redDots = reactive({ '物品出售': false, '技能购买': false, '秘传购买': false });
const lastRawRecords = { ItemSell: null, SkillBuy: null, SecretBuy: null };
let pollingTimer = null;

const userHeterogeneity = computed(() => statStore.stat_data?.角色?.user?.缥缈异质 || 0);

// 爱丽丝设定状态
const aliceSetting = ref('女儿爱丽丝');
let isSettingInitialized = false;

// 监听并初始化爱丽丝设定
watch(() => statStore.stat_data?.['图书馆']?.['爱丽丝设定'], (newVal) => {
  if (newVal && !isSettingInitialized) {
    aliceSetting.value = newVal;
    isSettingInitialized = true;
  }
}, { immediate: true });

// 切换爱丽丝设定

const handleAliceChange = async (newSetting) => {
  if (aliceSetting.value === newSetting) return; // 防止重复触发

  aliceSetting.value = newSetting;
  chatContents.value = [];
  welcomeContent.value = '';
  try {
    await WorldInfoUtil.updateEntryContent('<图书馆>聊天记录', '');
    await MvuUtil.updateMvuDataByDiff({ "图书馆": { "爱丽丝设定": newSetting } });
    showToast(`已切换为：${newSetting}，聊天记录已清空`);
    await syncChatRecord();
  } catch (error) {
    console.error("切换设定失败:", error);
    showToast("切换设定失败");
  }
};

const switchMode = (mode) => {
  currentMode.value = mode;
  if (redDots[mode]) redDots[mode] = false;
  if (mode === '对话' && chatAreaRef.value) chatAreaRef.value.scrollToBottom();
};

const toggleDeleteMode = () => {
  isDeleteMode.value = !isDeleteMode.value;
  if (!isDeleteMode.value) selectedMessages.value = [];
};

const toggleSelect = (id) => {
  const pos = selectedMessages.value.indexOf(id);
  if (pos === -1) selectedMessages.value.push(id);
  else selectedMessages.value.splice(pos, 1);
};

// 手动截断聊天记录 (带 Alert 提示)
const truncateChat = async () => {
  try {
    const entryName = '<图书馆>聊天记录';
    const rawText = await WorldInfoUtil.getWorldBookContent([entryName]);

    // 提取外层区块
    const outerRegex = /<(content|user_say)>([\s\S]*?)<\/\1>/g;
    const outerBlocks = [];
    let match;
    while ((match = outerRegex.exec(rawText)) !== null) {
      outerBlocks.push({
        tag: match[1],
        innerRaw: match[2].trim(),
        fullRaw: match[0]
      });
    }

    const MAX_TURNS = 30;
    if (outerBlocks.length <= MAX_TURNS) {
      window.alert(`当前记录共 ${outerBlocks.length} 条，未超过 ${MAX_TURNS} 条，无需清理。`);
      return;
    }

    // 弹出确认框防止误触
    const isConfirm = window.confirm(`当前记录共 ${outerBlocks.length} 条，确定要清理旧记录吗？\n（清理后将仅保留最近 ${MAX_TURNS} 条）`);
    if (!isConfirm) return;

    // 执行截断：保留最后 MAX_TURNS 条
    outerBlocks.splice(0, outerBlocks.length - MAX_TURNS);

    // 重组内容
    let newRaw = outerBlocks.map(b => b.fullRaw).join('\n');

    // 保留开场白
    const welcomeMatch = rawText.match(/<welcome>([\s\S]*?)<\/welcome>/);
    if (welcomeMatch) {
      newRaw += `\n${welcomeMatch[0]}`;
    }

    await WorldInfoUtil.updateEntryContent(entryName, newRaw);
    window.alert(`清理成功！已保留最近 ${MAX_TURNS} 条记录。`);
    await syncChatRecord(); // 刷新界面
  } catch (error) {
    console.error("清理记录失败:", error);
    window.alert("清理失败，请查看控制台报错。");
  }
};

const deleteSelected = async () => {
  const selectedIds = selectedMessages.value;
  if (!selectedIds || selectedIds.length === 0) return;

  // 过滤掉被选中的消息
  const newMessages = chatContents.value.filter(msg => !selectedIds.includes(msg.id));
  chatContents.value = newMessages;

  const entryName = '<图书馆>聊天记录';
  let newRaw = '';
  let currentContentBlock = []; // 用于收集连续的 npc/aside

  // 辅助函数：将收集到的 npc/aside 打包成一个 <content>
  const flushContentBlock = () => {
    if (currentContentBlock.length > 0) {
      newRaw += `<content>\n${currentContentBlock.join('\n')}\n</content>\n`;
      currentContentBlock = [];
    }
  };

  // 遍历剩余消息，重组 XML
  for (const m of newMessages) {
    if (m.type === 'user') {
      flushContentBlock(); // 遇到玩家发言，先结算之前的 content 块
      newRaw += `<user_say>\n${m.text}\n</user_say>\n`;
    } else if (m.type === 'aside') {
      currentContentBlock.push(`<旁白>${m.text}</旁白>`);
    } else if (m.type === 'npc') {
      currentContentBlock.push(`<对话>${m.text}</对话>`);
    }
  }
  flushContentBlock(); // 循环结束，结算最后剩余的 content 块

  newRaw = newRaw.trim();
  if (welcomeContent.value) newRaw += `\n<welcome>\n${welcomeContent.value}\n</welcome>`;

  try {
    await WorldInfoUtil.updateEntryContent(entryName, newRaw);
    showToast("删除成功");
  } catch (e) {
    console.error(e);
    showToast("删除失败");
  } finally {
    selectedMessages.value = [];
    isDeleteMode.value = false;
  }
};

const sendMessage = async (text) => {
  if (isDeleteMode.value) { isDeleteMode.value = false; selectedMessages.value = []; }
  isSending.value = true;
  chatContents.value.push({ id: 'msg_' + Date.now(), type: 'user', text: text });
  if (chatAreaRef.value) chatAreaRef.value.scrollToBottom();
  isThinking.value = true;
  try {
    const entryName = '<图书馆>聊天记录';
    let rawText = await WorldInfoUtil.getWorldBookContent([entryName]);
    const newUserTag = `<user_say>\n${text}\n</user_say>`;
    const lastUserSayRegex = /<user_say>[\s\S]*?<\/user_say>\s*$/;
    if (lastUserSayRegex.test(rawText)) rawText = rawText.replace(lastUserSayRegex, newUserTag);
    else rawText += `\n${newUserTag}`;
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


const syncChatRecord = async () => {
  if (isDeleteMode.value) return;
  try {
    const entryName = '<图书馆>聊天记录';
    const rawText = await WorldInfoUtil.getWorldBookContent([entryName]);

    // 1. 提取外层区块 (保留原始结构)
    const outerRegex = /<(content|user_say)>([\s\S]*?)<\/\1>/g;
    const outerBlocks = [];
    let match;
    while ((match = outerRegex.exec(rawText)) !== null) {
      outerBlocks.push({
        tag: match[1],         // 'content' 或 'user_say'
        innerRaw: match[2].trim(), // 标签内部的文本
        fullRaw: match[0]      // 完整的标签字符串 (例如 <content>...</content>)
      });
    }

    // 2. 处理开场白逻辑
    let currentWelcome = '';
    const welcomeMatch = rawText.match(/<welcome>([\s\S]*?)<\/welcome>/);
    if (welcomeMatch) currentWelcome = welcomeMatch[1].trim();

    let w1, w2;
    if (aliceSetting.value === '妹妹爱丽丝') {
      w1 = welcomeMessage.sisterWelcome1; w2 = welcomeMessage.sisterWelcome2;
    } else if (aliceSetting.value === '妈妈爱丽丝') {
      w1 = welcomeMessage.motherWelcome1; w2 = welcomeMessage.motherWelcome2;
    } else {
      w1 = welcomeMessage.daughterWelcome1; w2 = welcomeMessage.daughterWelcome2;
    }

    let needsUpdate = false;

    // 检查开场白是否需要更新
    if (outerBlocks.length === 0 && currentWelcome !== w1) { currentWelcome = w1; needsUpdate = true; }
    else if (outerBlocks.length > 0 && currentWelcome !== w2) { currentWelcome = w2; needsUpdate = true; }

    // 4. 如果发生截断或开场白更新，按原格式写回 WorldInfo
    if (needsUpdate) {
      // 直接使用 fullRaw 拼接，完美保留原始的 <对话> 和 <旁白> 嵌套结构
      let newRaw = outerBlocks.map(b => b.fullRaw).join('\n');
      if (currentWelcome) newRaw += `\n<welcome>\n${currentWelcome}\n</welcome>`;
      await WorldInfoUtil.updateEntryContent(entryName, newRaw);
    }

    // 5. 将外层区块解析为 UI 需要的扁平消息数组
    const parsedMessages = [];
    for (const block of outerBlocks) {
      if (block.tag === 'user_say') {
        parsedMessages.push({ type: 'user', text: block.innerRaw });
      } else {
        // 解析 <content> 内部的 <对话> 和 <旁白>
        const innerRegex = /<(对话|旁白)>([\s\S]*?)<\/\1>/g;
        let innerMatch;
        let hasInnerTags = false;
        while ((innerMatch = innerRegex.exec(block.innerRaw)) !== null) {
          hasInnerTags = true;
          parsedMessages.push({
            type: innerMatch[1] === '对话' ? 'npc' : 'aside',
            text: innerMatch[2].trim()
          });
        }
        // 兼容旧格式：如果没有内部标签，整体视为对话
        if (!hasInnerTags && block.innerRaw) {
          parsedMessages.push({ type: 'npc', text: block.innerRaw });
        }
      }
    }

    // 6. ID 匹配与 UI 更新
    parsedMessages.forEach((m) => {
      const oldMsg = chatContents.value.find(old => old.text === m.text && old.type === m.type && !old._used);
      if (oldMsg) { m.id = oldMsg.id; oldMsg._used = true; }
      else { m.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5); }
    });

    chatContents.value.forEach(old => delete old._used);
    const isNewMessage = chatContents.value.length !== parsedMessages.length;
    chatContents.value = parsedMessages;
    welcomeContent.value = currentWelcome;

    if (isNewMessage) {
      const lastMsg = parsedMessages[parsedMessages.length - 1];
      if (lastMsg && (lastMsg.type === 'npc' || lastMsg.type === 'aside')) isThinking.value = false;
    }
  } catch (error) { console.error("同步聊天记录失败:", error); }
};


const syncTransactionRecord = async () => {
  try {
    const rawText = await WorldInfoUtil.getWorldBookContent(['<图书馆>交易记录']);
    const extractTag = (tag) => { const m = rawText.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`)); return m ? m[1].trim() : ''; };
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
    update('SecretBuy', '秘传购买', secretBuys);
  } catch (e) { console.error(e); }
};

const fetchAll = async () => { await syncChatRecord(); await syncTransactionRecord(); };

onMounted(async () => {
  if (typeof fetchAll === 'function') { await fetchAll(); pollingTimer = setInterval(fetchAll, 3000); }
});

// 2. 播放背景音乐逻辑极度简化
const handleIntroComplete = () => {
  showIntro.value = false;
  playLibraryBgm();
};

const playLibraryBgm = () => {
  // 直接从 Store 获取音频信息
  const track = audioStore.getTrack('libBgm');
  if (track && track.url) {
    // 设置单曲循环
    setAudioSettings('bgm', { mode: 'repeat_one' });
    // 直接调用 API 播放，底层会自动处理加载和缓冲
    playAudio('bgm', track);
  }
};

const recordExitTime = async () => {
  try {
    const entryName = '<图书馆>聊天记录';
    let rawText = await WorldInfoUtil.getWorldBookContent([entryName]);
    // 删除旧标签（包括前导空白）
    rawText = rawText.replace(/\s*<上次访问时间>[\s\S]*?<\/上次访问时间>/g, '');

    const now = new Date().toLocaleString();
    // 在最后插入
    rawText = rawText.trim() + `\n<上次访问时间>${now}</上次访问时间>`;

    await WorldInfoUtil.updateEntryContent(entryName, rawText);
  } catch (error) {
    console.error("记录退出时间失败:", error);
  }
};

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer);
  // 3. 退出时暂停音乐
  pauseAudio('bgm');
  recordExitTime();
});
</script>


<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@400;700&display=swap');

.library-container {
  /* 全局暗金主题变量 */
  --c-gold: #d4af37;
  --c-gold-light: #f9e79f;
  --c-gold-dim: rgba(212, 175, 55, 0.3);
  --c-bg-dark: #0a0a0a;
  --c-bg-card: #141414;
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
  /* 添加微弱的噪点或纹理背景 */
  background-image: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000 100%);
}

.alice-selector-container label {
  color: var(--c-gold-light);
}

.alice-selector-container select {
  background: transparent;
  color: var(--c-gold);
  border: none;
  outline: none;
  cursor: pointer;
  font-family: 'Lato', sans-serif;
}

.alice-selector-container select option {
  background: var(--c-bg-card);
  color: var(--c-text);
}

/* 滚动条样式 */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0a0a0a; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; border: 1px solid #222; }
::-webkit-scrollbar-thumb:hover { background: var(--c-gold); }

/* 通用卡片布局 */
.scroll-area { height: 100%; overflow-y: auto; padding: 20px; scroll-behavior: smooth; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; max-width: 1200px; margin: 0 auto; padding-bottom: 80px; }
.trade-card { border-radius: 4px; display: flex; flex-direction: column; transition: transform 0.3s ease, box-shadow 0.3s ease; }
.card-inner { padding: 20px; display: flex; flex-direction: column; height: 100%; }
</style>
