<template>
  <div class="library-container">
    <!-- 顶部模式选择 -->
    <header class="library-header">
      <div class="header-content">
        <h2 class="title">漫宿书库</h2>
        <div class="mode-selector">
          <button
            v-for="mode in modes"
            :key="mode"
            :class="['mode-btn', { active: currentMode === mode }]"
            @click="switchMode(mode)"
          >
            {{ mode }}
            <!-- 红点提示 -->
            <span v-if="redDots[mode]" class="red-dot"></span>
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容展示区 -->
    <div class="main-content-area">

      <!-- 1. 聊天展示区 -->
      <div v-show="currentMode === '对话'" class="scroll-area chat-area" ref="chatAreaRef">
        <transition-group name="list" tag="div" class="message-list">
          <!-- 历史对话内容 -->
          <div v-for="(msg, index) in chatContents" :key="'content-'+index" class="message-item">
            <div class="avatar-area">
              <img class="npc-avatar" src="https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/爱丽丝/头像.png" alt="爱丽丝" />
            </div>
            <div class="message-content-area">
              <div class="chat-bubble">{{ msg }}</div>
            </div>
          </div>

          <!-- 欢迎语 (独立于 content 之外) -->
          <div v-if="welcomeContent" key="welcome" class="message-item">
            <div class="avatar-area">
              <img class="npc-avatar" src="https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/爱丽丝/头像.png" alt="爱丽丝" />
            </div>
            <div class="message-content-area">
              <div class="chat-bubble welcome-bubble">{{ welcomeContent }}</div>
            </div>
          </div>

          <!-- 思考中动画 -->
          <div v-if="isThinking" key="thinking" class="message-item thinking-item">
            <div class="avatar-area">
              <img class="npc-avatar pulse" src="https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/爱丽丝/头像.png" alt="爱丽丝" />
            </div>
            <div class="thinking-bubble">
              爱丽丝正在翻阅卷宗<span class="dots"></span>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 2. 物品出售区 -->
      <div v-show="currentMode === '物品出售'" class="scroll-area transaction-area">
        <div v-if="Object.keys(itemSells).length === 0" class="empty-state">暂无物品出售记录...</div>
        <div v-else class="card-container">
          <div v-for="(details, name) in itemSells" :key="name" class="info-card item-card">
            <div class="card-header">
              <span class="name">{{ name }}</span>
              <span class="price-tag">💰 {{ details.单价 }}</span>
            </div>
            <div class="card-body">
              <p class="meta-row"><span class="label">类型</span> <span class="value">{{ details.类型 }}</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 技能购买区 -->
      <div v-show="currentMode === '技能购买'" class="scroll-area transaction-area">
        <div v-if="Object.keys(skillBuys).length === 0" class="empty-state">暂无技能购买记录...</div>
        <div v-else class="card-container">
          <div v-for="(details, name) in skillBuys" :key="name" class="info-card skill-card">
            <div class="card-header">
              <span class="name">{{ name }}</span>
              <span class="level-badge">Lv.{{ details.技能等级 }}</span>
            </div>
            <div class="card-body">
              <div class="tags-row">
                <span :class="['aspect-tag', details.性相]">{{ details.性相 }}</span>
                <span class="cost-tag">消耗: {{ details.消耗 }}</span>
              </div>
              <div class="divider"></div>
              <p class="desc">"{{ details.描述 }}"</p>
              <p class="effect"><span class="label">效果</span> {{ details.作用 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. 密传购买区 -->
      <div v-show="currentMode === '密传购买'" class="scroll-area transaction-area">
        <div v-if="Object.keys(secretBuys).length === 0" class="empty-state">暂无密传购买记录...</div>
        <div v-else class="card-container">
          <div v-for="(details, name) in secretBuys" :key="name" class="info-card secret-card">
            <div class="card-header">
              <span class="name">{{ name }}</span>
              <span class="secret-icon">📜</span>
            </div>
            <div class="card-body">
              <p class="desc"><span class="label">线索</span> {{ details.描述 }}</p>
              <div class="divider"></div>
              <p class="effect"><span class="label">可能收获</span> {{ details.作用 }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 底部输入区 (统一为对话) -->
    <div class="input-area">
      <div class="input-wrapper">
        <textarea
          v-model="inputText"
          class="chat-input"
          placeholder="输入对话内容..."
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        <button class="send-btn" @click="sendMessage" :disabled="isSending || !inputText.trim()">
          <span class="btn-text">发送</span>
          <span class="btn-icon">✒️</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted, onUnmounted, nextTick } from 'vue';
import { MvuUtil } from '@/Utils/MvuUtil';
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil';

const showToast = inject('showToast', () => {});

const modes = ['对话', '物品出售', '技能购买', '密传购买'];
const currentMode = ref('对话');
const inputText = ref('');
const isSending = ref(false);
const isThinking = ref(false);

// 聊天数据
const chatContents = ref([]);
const welcomeContent = ref('');
const chatAreaRef = ref(null);

// 交易数据
const itemSells = ref({});
const skillBuys = ref({});
const secretBuys = ref({});

// 红点与文本变化追踪
const redDots = reactive({
  '物品出售': false,
  '技能购买': false,
  '密传购买': false
});
const lastRawRecords = {
  ItemSell: null,
  SkillBuy: null,
  SecretBuy: null
};

let pollingTimer = null;

const welcome1 = `你推开那扇沉重的橡木门，踏入这座巨大图书馆的寂静之中。阳光透过高窗落下，在数以万计的书脊上投下斑驳的光影。

角落里，特殊藏书区的柜台后，一抹蓝色的身影正安静地翻着书页。

她似乎感知到了你的目光，缓缓抬起头。浅色的瞳孔平静地望向你，绿色的长发随着动作微微晃动，发尾自然的卷曲垂落在蓝色连衣裙的裙摆上。她合上书，站起身，白色蕾丝围裙在柜台边缘轻轻擦过，动作轻缓得几乎没有发出任何声响。

“父亲大人。”她开口了，声音轻柔而平淡，仿佛只是在陈述一个既定的事实，“欢迎来到图书馆。我的名字是爱丽丝·利德尔，被设定为这个特殊藏书区的管理员。”

她将双手轻轻交叠在身前的白色围裙上，微微歪了歪头，额前的刘海随之轻颤。

“你可以用有价值的物品换取‘缥缈异质’，或者用‘缥缈异质’购买这里的技能书，密传。嗯，设定上是这样。”`;

const welcome2 = `图书馆的门再次被推开。

柜台后，那个穿着蓝色连衣裙的绿色长发少女又一次抬起头。她合上手中不知翻阅了多少遍的书，静静地注视着你走进，直到你在柜台前停下脚步。

“父亲大人，我们又见面了。”爱丽丝轻声说道，语气平淡得如同在朗读一本早已熟记于心的书，“或者说，对于‘我’而言，这是初次见面。”

她将一本书轻轻推回手边的书架，重新看向你，浅色的瞳孔里映出你的倒影。

“欢迎回来。今天想要交易什么？”`;

const scrollToBottom = async () => {
  await nextTick();
  if (chatAreaRef.value) {
    chatAreaRef.value.scrollTo({
      top: chatAreaRef.value.scrollHeight,
      behavior: 'smooth'
    });
  }
};

const switchMode = (mode) => {
  currentMode.value = mode;
  if (redDots[mode]) {
    redDots[mode] = false; // 点击后消除红点
  }
  if (mode === '对话') {
    scrollToBottom();
  }
};

// ================= 核心：同步聊天记录 =================
const syncChatRecord = async () => {
  try {
    const entryName = '<图书馆>聊天记录';
    const rawText = await WorldInfoUtil.getWorldBookContent([entryName]);

    let contents = [];
    const contentRegex = /<content>([\s\S]*?)<\/content>/g;
    let match;
    while ((match = contentRegex.exec(rawText)) !== null) {
      const text = match[1].trim();
      if (text) contents.push(text);
    }

    let currentWelcome = '';
    const welcomeRegex = /<welcome>([\s\S]*?)<\/welcome>/;
    const welcomeMatch = rawText.match(welcomeRegex);
    if (welcomeMatch) {
      currentWelcome = welcomeMatch[1].trim();
    }

    let needsUpdate = false;

    // 规则1：保留最多20条 content
    if (contents.length > 20) {
      contents = contents.slice(contents.length - 20);
      needsUpdate = true;
    }

    // 规则2：没有 content 时，使用 welcome1
    if (contents.length === 0 && currentWelcome !== welcome1) {
      currentWelcome = welcome1;
      needsUpdate = true;
    }
    // 规则3：有 content 时，确保 welcome 是 welcome2
    else if (contents.length > 0 && currentWelcome !== welcome2) {
      currentWelcome = welcome2;
      needsUpdate = true;
    }

    // 如果需要更新，重组文本并写回世界书
    if (needsUpdate) {
      let newRaw = contents.map(c => `<content>\n${c}\n</content>`).join('\n');
      if (currentWelcome) {
        newRaw += `\n<welcome>\n${currentWelcome}\n</welcome>`;
      }
      await WorldInfoUtil.updateEntryContent(entryName, newRaw);
    }

    // 更新前端响应式数据
    const isNewMessage = chatContents.value.length !== contents.length;
    chatContents.value = contents;
    welcomeContent.value = currentWelcome;

    if (isNewMessage || isThinking.value) {
      isThinking.value = false;
      if (currentMode.value === '对话') scrollToBottom();
    }

  } catch (error) {
    console.error("同步聊天记录失败:", error);
  }
};

// ================= 核心：同步交易记录 =================
const syncTransactionRecord = async () => {
  try {
    const rawText = await WorldInfoUtil.getWorldBookContent(['<图书馆>交易记录']);

    const extractTag = (tag) => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
      const match = rawText.match(regex);
      return match ? match[1].trim() : '';
    };

    const parseJsonSafe = (str) => {
      if (!str) return {};
      try { return JSON.parse(str); } catch (e) { return {}; }
    };

    const checkAndUpdate = (tag, modeName, dataRef) => {
      const rawStr = extractTag(tag);
      // 如果是首次加载，只赋值不触发红点
      if (lastRawRecords[tag] === null) {
        lastRawRecords[tag] = rawStr;
        dataRef.value = parseJsonSafe(rawStr);
      }
      // 如果文本发生变化
      else if (lastRawRecords[tag] !== rawStr) {
        lastRawRecords[tag] = rawStr;
        dataRef.value = parseJsonSafe(rawStr);
        // 如果当前不在该页面，亮起红点
        if (currentMode.value !== modeName) {
          redDots[modeName] = true;
        }
      }
    };

    checkAndUpdate('ItemSell', '物品出售', itemSells);
    checkAndUpdate('SkillBuy', '技能购买', skillBuys);
    checkAndUpdate('SecretBuy', '密传购买', secretBuys);

  } catch (error) {
    console.error("同步交易记录失败:", error);
  }
};

const fetchAllRecords = async () => {
  await syncChatRecord();
  await syncTransactionRecord();
};

const sendMessage = async () => {
  if (!inputText.value.trim() || isSending.value) return;
  isSending.value = true;

  try {
    // 统一为对话输入，移除其他变量
    const diffObj = {
      "图书馆": {
        "玩家输入": inputText.value.trim()
      }
    };

    await MvuUtil.updateMvuDataByDiff(diffObj);
    eventEmit("图书馆对话");

    isThinking.value = true;
    inputText.value = '';

    // 发送消息后自动切回对话模式并滚动
    if (currentMode.value !== '对话') {
      switchMode('对话');
    }

  } catch (error) {
    console.error("发送失败:", error);
    showToast("发送失败，请查看控制台");
  } finally {
    isSending.value = false;
  }
};

onMounted(async () => {
  await fetchAllRecords();
  pollingTimer = setInterval(fetchAllRecords, 5000); // 每5秒轮询一次
});

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }
});
</script>

<style scoped>
/* ================= 基础变量与容器 ================= */
.library-container {
  --c-gold: var(--c-gold, #d4af37);
  --c-gold-dim: var(--c-gold-dim, rgba(212, 175, 55, 0.3));
  --c-border: var(--c-border, #4a4a4a);
  --c-bg-dark: var(--c-bg-dark, #121212);
  --c-bg-panel: var(--c-bg-panel, rgba(30, 30, 30, 0.8));
  --c-text-main: var(--c-text-main, #e0e0e0);
  --c-text-dim: var(--c-text-dim, #9e9e9e);

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--c-bg-dark);
  color: var(--c-text-main);
  font-family: 'Georgia', serif;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

/* ================= 顶部 Header ================= */
.library-header {
  padding: 20px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.2));
  border-bottom: 1px solid var(--c-gold-dim);
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  z-index: 10;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.title {
  color: var(--c-gold);
  margin: 0;
  font-size: 1.6rem;
  letter-spacing: 4px;
  text-shadow: 0 0 10px var(--c-gold-dim);
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  padding: 6px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.05);
}

.mode-btn {
  background: transparent;
  border: none;
  color: var(--c-text-dim);
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  letter-spacing: 1px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.mode-btn:hover {
  color: var(--c-text-main);
  background: rgba(255,255,255,0.05);
}

.mode-btn.active {
  color: #000;
  background: var(--c-gold);
  font-weight: bold;
  box-shadow: 0 0 15px var(--c-gold-dim);
}

.red-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background-color: #ff4757;
  border-radius: 50%;
  box-shadow: 0 0 5px #ff4757;
  animation: pulseDot 1.5s infinite;
}

/* ================= 主内容区域 ================= */
.main-content-area {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 30px 20px;
  scroll-behavior: smooth;
}

.scroll-area::-webkit-scrollbar {
  width: 6px;
}
.scroll-area::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.2);
}
.scroll-area::-webkit-scrollbar-thumb {
  background: var(--c-border);
  border-radius: 3px;
}
.scroll-area::-webkit-scrollbar-thumb:hover {
  background: var(--c-gold-dim);
}

.empty-state {
  text-align: center;
  color: var(--c-text-dim);
  font-style: italic;
  margin-top: 50px;
}

/* ================= 聊天列表 ================= */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.message-item {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.avatar-area {
  flex-shrink: 0;
}

.npc-avatar {
  width: 42px;
  height: 42px;
  border: 1px solid var(--c-gold);
  border-radius: 50%;
  object-fit: cover;
  background-color: #1a1a1a;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  display: block;
}

.message-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.chat-bubble {
  background: var(--c-bg-panel);
  backdrop-filter: blur(10px);
  padding: 16px 20px;
  border-radius: 2px 16px 16px 16px;
  border: 1px solid rgba(255,255,255,0.05);
  border-left: 3px solid var(--c-gold);
  color: var(--c-text-main);
  line-height: 1.6;
  white-space: pre-wrap;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  display: inline-block;
  max-width: fit-content;
}

.welcome-bubble {
  border-left: 3px solid #81d4fa;
  background: rgba(20, 30, 40, 0.8);
}

.thinking-item {
  opacity: 0.7;
}

.thinking-bubble {
  background: transparent;
  padding: 12px 0;
  color: var(--c-text-dim);
  font-style: italic;
  display: flex;
  align-items: center;
}

/* ================= 交易卡片 ================= */
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.info-card {
  background: linear-gradient(145deg, rgba(40,40,40,0.9), rgba(20,20,20,0.9));
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 6px 12px rgba(0,0,0,0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--c-gold), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.info-card:hover {
  transform: translateY(-4px);
  border-color: var(--c-gold-dim);
  box-shadow: 0 10px 20px rgba(0,0,0,0.6);
}

.info-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header .name {
  font-size: 1.15rem;
  color: var(--c-gold);
  font-weight: bold;
  letter-spacing: 1px;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, var(--c-border), transparent);
  margin: 12px 0;
}

.label {
  color: var(--c-text-dim);
  font-size: 0.85rem;
  margin-right: 6px;
}

.price-tag {
  color: #ffd700;
  font-weight: bold;
  background: rgba(255, 215, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.9rem;
}

.level-badge {
  background: var(--c-gold);
  color: #000;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.tags-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.aspect-tag {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #fff;
}

.cost-tag {
  color: #e57373;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
}

.skill-card .desc, .secret-card .desc {
  font-style: italic;
  color: #b0bec5;
  font-size: 0.95rem;
  line-height: 1.5;
}

.skill-card .effect, .secret-card .effect {
  color: #81d4fa;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-top: 8px;
}

/* ================= 底部输入区 ================= */
.input-area {
  padding: 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4));
  border-top: 1px solid var(--c-border);
  z-index: 10;
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid var(--c-border);
  color: var(--c-text-main);
  padding: 14px 16px;
  border-radius: 8px;
  resize: none;
  height: 24px;
  min-height: 50px;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.chat-input:focus {
  outline: none;
  border-color: var(--c-gold);
  background: rgba(30, 30, 30, 0.9);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 0 10px var(--c-gold-dim);
}

.chat-input::placeholder {
  color: #666;
  font-style: italic;
}

.send-btn {
  background: linear-gradient(135deg, var(--c-gold), #b8860b);
  border: none;
  color: #000;
  padding: 0 24px;
  height: 50px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px var(--c-gold-dim);
  filter: brightness(1.1);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
  box-shadow: none;
}

/* ================= 动画 Keyframes ================= */
@keyframes dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

@keyframes pulseBorder {
  from { box-shadow: 0 0 0 0 var(--c-gold-dim); }
  to { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
}

@keyframes pulseDot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 71, 87, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* ================= 移动端适配 ================= */
@media (max-width: 768px) {
  .input-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  .send-btn {
    justify-content: center;
  }
  .chat-bubble {
    max-width: 100%;
  }
  .card-container {
    grid-template-columns: 1fr;
  }
}
</style>
