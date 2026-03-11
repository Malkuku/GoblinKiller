<template>
  <div class="library-container">
    <BurnIntro v-if="showIntro" @complete="handleIntroComplete" />
    <LibraryHeader
      :currentMode="currentMode"
      :modes="modes"
      :redDots="redDots"
      :userHeterogeneity="userHeterogeneity"
      @switchMode="switchMode"
    />

    <div class="main-content-area">
      <!-- 设定切换下拉框 -->
      <div v-show="currentMode === '对话'" class="alice-selector-container">
        <label>设定：</label>
        <select v-model="aliceSetting" @change="handleAliceChange">
          <option value="女儿爱丽丝">女儿爱丽丝</option>
          <option value="妹妹爱丽丝">妹妹爱丽丝</option>
          <option value="妈妈爱丽丝">妈妈爱丽丝</option>
        </select>
      </div>

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
        v-show="currentMode === '密传购买'"
        :secretBuys="secretBuys"
      />

      <ExpBuyArea v-show="currentMode === '经验兑换'" />
    </div>

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

const modes = ['对话', '物品出售', '技能购买', '密传购买', '经验兑换'];
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
const redDots = reactive({ '物品出售': false, '技能购买': false, '密传购买': false });
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
const handleAliceChange = async () => {
  const newSetting = aliceSetting.value;
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
    const regex = /<(content|user_say)>([\s\S]*?)<\/\1>/g;
    let match;
    const parsedMessages = [];
    while ((match = regex.exec(rawText)) !== null) {
      parsedMessages.push({ type: match[1] === 'user_say' ? 'user' : 'npc', text: match[2].trim() });
    }
    let currentWelcome = '';
    const welcomeMatch = rawText.match(/<welcome>([\s\S]*?)<\/welcome>/);
    if (welcomeMatch) currentWelcome = welcomeMatch[1].trim();
    let needsUpdate = false;
    let newMessages = [...parsedMessages];
    if (newMessages.length > 10) { newMessages = newMessages.slice(newMessages.length - 10); needsUpdate = true; }

    // 根据当前设定匹配开场白
    let w1, w2;
    if (aliceSetting.value === '妹妹爱丽丝') {
      w1 = welcomeMessage.sisterWelcome1;
      w2 = welcomeMessage.sisterWelcome2;
    } else if (aliceSetting.value === '妈妈爱丽丝') {
      w1 = welcomeMessage.motherWelcome1;
      w2 = welcomeMessage.motherWelcome2;
    } else {
      w1 = welcomeMessage.daughterWelcome1;
      w2 = welcomeMessage.daughterWelcome2;
    }

    if (newMessages.length === 0 && currentWelcome !== w1) { currentWelcome = w1; needsUpdate = true; }
    else if (newMessages.length > 0 && currentWelcome !== w2) { currentWelcome = w2; needsUpdate = true; }

    if (needsUpdate) {
      let newRaw = newMessages.map(m => `<${m.type === 'user' ? 'user_say' : 'content'}>\n${m.text}\n</${m.type === 'user' ? 'user_say' : 'content'}>`).join('\n');
      if (currentWelcome) newRaw += `\n<welcome>\n${currentWelcome}\n</welcome>`;
      await WorldInfoUtil.updateEntryContent(entryName, newRaw);
    }
    newMessages.forEach((m) => {
      const oldMsg = chatContents.value.find(old => old.text === m.text && old.type === m.type && !old._used);
      if (oldMsg) { m.id = oldMsg.id; oldMsg._used = true; }
      else { m.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5); }
    });
    chatContents.value.forEach(old => delete old._used);
    const isNewMessage = chatContents.value.length !== newMessages.length;
    chatContents.value = newMessages;
    welcomeContent.value = currentWelcome;
    if (isNewMessage) {
      const lastMsg = newMessages[newMessages.length - 1];
      if (lastMsg && lastMsg.type === 'npc') isThinking.value = false;
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
    update('SecretBuy', '密传购买', secretBuys);
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

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer);
  // 3. 退出时暂停音乐
  pauseAudio('bgm');
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

/* 设定切换下拉框样式 */
.alice-selector-container {
  position: absolute;
  top: 10px;
  right: 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(20, 20, 20, 0.8);
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--c-gold-dim);
  font-size: 0.9rem;
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
