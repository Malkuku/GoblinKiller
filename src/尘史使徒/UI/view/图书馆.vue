<template>
  <div class="library-container">
    <!-- 顶部 Header -->
    <header class="library-header">
      <div class="header-content">
        <h2 class="title">
          <span class="icon">🏛️</span> 漫宿书库
        </h2>

        <!-- 玩家资产显示 (仅在交易模式显示) -->
        <div v-if="currentMode !== '对话'" class="asset-display">
          <span class="asset-label">持有异质:</span>
          <span class="asset-value">{{ userHeterogeneity }}</span>
        </div>

        <!-- 导航栏 -->
        <div class="nav-tabs">
          <div
            v-for="mode in modes"
            :key="mode"
            :class="['nav-item', { active: currentMode === mode }]"
            @click="switchMode(mode)"
          >
            {{ mode }}
            <span v-if="redDots[mode]" class="notification-dot"></span>
          </div>
          <!-- 滑动指示条 -->
          <div class="nav-indicator" :style="indicatorStyle"></div>
        </div>
      </div>
    </header>

    <!-- 主内容展示区 -->
    <div class="main-content-area">

      <!-- 1. 聊天展示区 -->
      <div v-show="currentMode === '对话'" class="scroll-area chat-area" ref="chatAreaRef">

        <!-- 聊天工具栏 (批量删除) -->
        <div class="chat-toolbar" v-if="chatContents.length > 0">
          <button class="toolbar-btn" @click="toggleDeleteMode">
            {{ isDeleteMode ? '取消选择' : '批量删除' }}
          </button>
          <button
            v-if="isDeleteMode"
            class="toolbar-btn danger-btn"
            @click="deleteSelected"
            :disabled="selectedMessages.length === 0"
          >
            删除选中 ({{ selectedMessages.length }})
          </button>
        </div>

        <transition-group name="list" tag="div" class="message-list">

          <!-- 欢迎语 -->
          <div v-if="welcomeContent" key="welcome" class="message-wrapper">
            <div class="message-row npc-row">
              <div class="avatar-wrapper">
                <img class="avatar" src="https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/爱丽丝/头像.png" alt="爱丽丝" />
              </div>
              <div class="bubble npc-bubble welcome-bubble">{{ welcomeContent }}</div>
            </div>
          </div>

          <!-- 历史对话内容 (混合了 User 和 NPC) -->
          <div
            v-for="msg in chatContents"
            :key="msg.id"
            class="message-wrapper"
            :class="{ 'is-selectable': isDeleteMode }"
            @click="isDeleteMode && toggleSelect(msg.id)"
          >
            <!-- 选择框 -->
            <div v-if="isDeleteMode" class="checkbox-wrapper">
              <input type="checkbox" :checked="selectedMessages.includes(msg.id)" readonly />
            </div>

            <div :class="['message-row', msg.type === 'user' ? 'user-row' : 'npc-row']">
              <!-- NPC 头像 -->
              <div v-if="msg.type === 'npc'" class="avatar-wrapper">
                <img class="avatar" src="https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/爱丽丝/头像.png" alt="爱丽丝" />
              </div>

              <!-- 气泡 -->
              <div :class="['bubble', msg.type === 'user' ? 'user-bubble' : 'npc-bubble']">
                {{ msg.text }}
              </div>

              <!-- 玩家头像 (可选，这里用占位符或不显示) -->
              <div v-if="msg.type === 'user'" class="avatar-wrapper user-avatar-wrapper">
                <span class="user-avatar-placeholder">👤</span>
              </div>
            </div>
          </div>

          <!-- 思考中动画 -->
          <div v-if="isThinking" key="thinking" class="message-wrapper">
            <div class="message-row npc-row thinking-row">
              <div class="avatar-wrapper">
                <img class="avatar pulse" src="https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/爱丽丝/头像.png" alt="爱丽丝" />
              </div>
              <div class="thinking-text">
                爱丽丝正在翻阅卷宗<span class="dots"></span>
              </div>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 2. 物品出售区 -->
      <div v-show="currentMode === '物品出售'" class="scroll-area transaction-area">
        <div v-if="Object.keys(itemSells).length === 0" class="empty-state">暂无物品收购需求...</div>
        <div v-else class="card-grid">
          <div v-for="(details, name) in itemSells" :key="name" class="trade-card item-card">
            <div class="card-top">
              <span class="card-title">{{ name }}</span>
              <span class="price-badge">💰 {{ details.单价 }}</span>
            </div>
            <div class="card-mid">
              <p class="meta">类型: {{ details.类型 }}</p>
              <p class="inventory-check" :class="{ 'has-item': getUserItemCount(name) > 0 }">
                背包持有: {{ getUserItemCount(name) }}
              </p>
            </div>
            <div class="card-action">
              <button
                class="action-btn sell-btn"
                :disabled="getUserItemCount(name) <= 0"
                @click="sellItem(name, details)"
              >
                {{ getUserItemCount(name) > 0 ? '出售' : '未持有' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 技能购买区 -->
      <div v-show="currentMode === '技能购买'" class="scroll-area transaction-area">
        <div v-if="Object.keys(skillBuys).length === 0" class="empty-state">暂无技能典籍...</div>
        <div v-else class="card-grid">
          <div v-for="(details, name) in skillBuys" :key="name" class="trade-card skill-card">
            <div class="card-top">
              <span class="card-title">{{ name }}</span>
              <span class="level-badge">Lv.{{ details.技能等级 }}</span>
            </div>
            <div class="card-mid">
              <div class="tags">
                <span class="tag aspect">{{ details.性相 }}</span>
                <span class="tag cost">消耗: {{ details.消耗 }}</span>
              </div>
              <p class="desc">"{{ details.描述 }}"</p>
              <p class="effect">效果: {{ details.作用 }}</p>
            </div>
            <div class="card-action">
              <div class="price-display">需 {{ details.价格 || 100 }} 异质</div>
              <button
                class="action-btn buy-btn"
                :disabled="hasSkill(name) || !canAfford(details.价格 || 100)"
                @click="buySkill(name, details)"
              >
                {{ hasSkill(name) ? '已习得' : '购买' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. 密传购买区 -->
      <div v-show="currentMode === '密传购买'" class="scroll-area transaction-area">
        <div v-if="Object.keys(secretBuys).length === 0" class="empty-state">暂无密传线索...</div>
        <div v-else class="card-grid">
          <div v-for="(details, name) in secretBuys" :key="name" class="trade-card secret-card">
            <div class="card-top">
              <span class="card-title">{{ name }}</span>
              <span class="icon-badge">📜</span>
            </div>
            <div class="card-mid">
              <p class="desc">线索: {{ details.描述 }}</p>
              <p class="effect">可能收获: {{ details.作用 }}</p>
            </div>
            <div class="card-action">
              <div class="price-display">需 {{ details.价格 || 50 }} 异质</div>
              <button
                class="action-btn buy-btn"
                :disabled="!canAfford(details.价格 || 50)"
                @click="buySecret(name, details)"
              >
                购买
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 底部输入区 -->
    <div class="input-area">
      <!-- 快捷回复栏 -->
      <div class="quick-replies">
        <button
          v-for="(reply, index) in quickReplies"
          :key="index"
          class="quick-reply-btn"
          @click="sendQuickReply(reply)"
          :disabled="isSending"
        >
          {{ reply }}
        </button>
      </div>

      <div class="input-wrapper">
        <textarea
          v-model="inputText"
          class="chat-input"
          placeholder="与爱丽丝交谈..."
          @keydown.enter.prevent="sendMessage"
          rows="1"
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
import { ref, reactive, inject, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { MvuUtil } from '@/Utils/MvuUtil';
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { welcomeMessage } from '@/尘史使徒/UI/components/start/开场白';

const showToast = inject('showToast', (msg) => console.log(msg));

// Store 集成
const statStore = useStatStore();
const { stat_data } = storeToRefs(statStore);

// 状态管理
const modes = ['对话', '物品出售', '技能购买', '密传购买'];
const currentMode = ref('对话');
const inputText = ref('');
const isSending = ref(false);
const isThinking = ref(false);

// 批量删除状态管理
const isDeleteMode = ref(false);
const selectedMessages = ref([]);

// 快捷回复
const quickReplies = [
  "请爱丽丝锐评最近发生的事情",
  "希望出售有价值的物品/技能",
  "希望购买适合的技能",
  "希望购买适合的密传"
];

const sendQuickReply = (text) => {
  inputText.value = text;
  sendMessage();
};

// 聊天数据
const chatContents = ref([]); // 结构: { id: string, type: 'user'|'npc', text: string }
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

// ================= 计算属性与辅助函数 =================

// 计算导航条指示器的位置
const indicatorStyle = computed(() => {
  const index = modes.indexOf(currentMode.value);
  return {
    transform: `translateX(${index * 100}%)`,
    width: `${100 / modes.length}%`
  };
});

// 获取玩家当前的缥缈异质
const userHeterogeneity = computed(() => {
  return statStore.stat_data?.角色?.user?.缥缈异质 || 0;
});

// 获取玩家背包中某物品的数量
const getUserItemCount = (itemName) => {
  const items = statStore.stat_data?.角色?.user?.物品 || {};
  return items[itemName]?.数量 || 0;
};

// 检查玩家是否拥有某技能
const hasSkill = (skillName) => {
  const skills = statStore.stat_data?.角色?.user?.技能 || {};
  return !!skills[skillName];
};

// 检查是否买得起
const canAfford = (price) => {
  return userHeterogeneity.value >= (price || 0);
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (chatAreaRef.value) {
    chatAreaRef.value.scrollTo({ top: chatAreaRef.value.scrollHeight, behavior: 'smooth' });
  }
};

// 切换模式
const switchMode = (mode) => {
  currentMode.value = mode;
  if (redDots[mode]) redDots[mode] = false;
  if (mode === '对话') scrollToBottom();
};

// ================= 核心逻辑：批量删除 =================

const toggleDeleteMode = () => {
  isDeleteMode.value = !isDeleteMode.value;
  if (!isDeleteMode.value) {
    selectedMessages.value = [];
  }
};

const toggleSelect = (id) => {
  const pos = selectedMessages.value.indexOf(id);
  if (pos === -1) {
    selectedMessages.value.push(id);
  } else {
    selectedMessages.value.splice(pos, 1);
  }
};

const deleteSelected = async () => {
  if (selectedMessages.value.length === 0) return;

  // 过滤掉选中的消息
  const newMessages = chatContents.value.filter(msg => !selectedMessages.value.includes(msg.id));

  // 更新前端状态
  chatContents.value = newMessages;
  selectedMessages.value = [];
  isDeleteMode.value = false;

  // 更新世界书
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
  }
};

// ================= 核心逻辑：聊天同步 =================

const welcome1 = welcomeMessage.welcome1;
const welcome2 = welcomeMessage.welcome2;

const syncChatRecord = async () => {
  if (isDeleteMode.value) return; // 删除模式下暂停同步，防止选中状态错乱

  try {
    const entryName = '<图书馆>聊天记录';
    const rawText = await WorldInfoUtil.getWorldBookContent([entryName]);

    // 解析逻辑：按顺序提取 <content> 和 <user_say>
    const regex = /<(content|user_say)>([\s\S]*?)<\/\1>/g;
    let match;
    const parsedMessages = [];

    while ((match = regex.exec(rawText)) !== null) {
      const tag = match[1];
      const text = match[2].trim();
      if (text) {
        parsedMessages.push({
          type: tag === 'user_say' ? 'user' : 'npc',
          text: text
        });
      }
    }

    // 欢迎语逻辑
    let currentWelcome = '';
    const welcomeMatch = rawText.match(/<welcome>([\s\S]*?)<\/welcome>/);
    if (welcomeMatch) currentWelcome = welcomeMatch[1].trim();

    // 自动维护逻辑 (如果太长则截断，如果没有欢迎语则添加)
    let needsUpdate = false;
    let newMessages = [...parsedMessages];

    // 限制历史记录长度 (例如保留最近20条交互)
    if (newMessages.length > 20) {
      newMessages = newMessages.slice(newMessages.length - 20);
      needsUpdate = true;
    }

    // 欢迎语初始化
    if (newMessages.length === 0 && currentWelcome !== welcome1) {
      currentWelcome = welcome1;
      needsUpdate = true;
    } else if (newMessages.length > 0 && currentWelcome !== welcome2) {
      currentWelcome = welcome2;
      needsUpdate = true;
    }

    // 如果需要修剪或初始化，写回世界书
    if (needsUpdate) {
      let newRaw = newMessages.map(m => {
        const tag = m.type === 'user' ? 'user_say' : 'content';
        return `<${tag}>\n${m.text}\n</${tag}>`;
      }).join('\n');

      if (currentWelcome) {
        newRaw += `\n<welcome>\n${currentWelcome}\n</welcome>`;
      }
      await WorldInfoUtil.updateEntryContent(entryName, newRaw);
    }

    // 给 newMessages 分配稳定的 ID，保证 Vue 动画平滑
    newMessages.forEach((m) => {
      const oldMsg = chatContents.value.find(old => old.text === m.text && old.type === m.type && !old._used);
      if (oldMsg) {
        m.id = oldMsg.id;
        oldMsg._used = true;
      } else {
        m.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      }
    });
    // 清理 _used 标记
    chatContents.value.forEach(old => delete old._used);

    // 更新前端
    const isNewMessage = chatContents.value.length !== newMessages.length;
    chatContents.value = newMessages;
    welcomeContent.value = currentWelcome;

    // 如果有新消息，停止思考动画并滚动
    if (isNewMessage) {
      const lastMsg = newMessages[newMessages.length - 1];
      if (lastMsg && lastMsg.type === 'npc') {
        isThinking.value = false;
      }
    }

  } catch (error) {
    console.error("同步聊天记录失败:", error);
  }
};

// ================= 核心逻辑：发送消息 =================

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || isSending.value) return;

  if (isDeleteMode.value) {
    toggleDeleteMode(); // 发送消息时自动退出删除模式
  }

  isSending.value = true;
  // 立即在前端显示（提升体验）
  chatContents.value.push({
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    type: 'user',
    text: text
  });
  scrollToBottom();
  inputText.value = '';
  isThinking.value = true;

  try {
    const entryName = '<图书馆>聊天记录';
    let rawText = await WorldInfoUtil.getWorldBookContent([entryName]);

    // 构造新的 user_say 标签
    const newUserTag = `<user_say>\n${text}\n</user_say>`;

    // 检查最后是否已经是 user_say
    const lastUserSayRegex = /<user_say>[\s\S]*?<\/user_say>\s*$/;

    if (lastUserSayRegex.test(rawText)) {
      rawText = rawText.replace(lastUserSayRegex, newUserTag);
    } else {
      rawText += `\n${newUserTag}`;
    }

    // 1. 更新世界书
    await WorldInfoUtil.updateEntryContent(entryName, rawText);

    // 2. 更新 MVU 变量 (触发 AI 响应)
    const diffObj = {
      "图书馆": {
        "玩家输入": text
      }
    };
    await MvuUtil.updateMvuDataByDiff(diffObj);

    // 3. 发送事件
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

// ================= 核心逻辑：交易系统 =================

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
        // 判断是否为首次加载，首次加载不挂红点
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

// 1. 卖出物品
const sellItem = async (itemName, details) => {
  if (!statStore.stat_data) { showToast("数据未加载"); return; }

  const user = statStore.stat_data.角色.user;
  const userItems = user.物品 || {};

  if (!userItems[itemName] || userItems[itemName].数量 < 1) {
    showToast("你没有该物品");
    return;
  }

  const price = details.单价 || 0;

  // 构造 Diff
  const diff = {};
  const itemPath = `角色.user.物品.${itemName}`;

  if (userItems[itemName].数量 > 1) {
    diff[itemPath] = { ...userItems[itemName], 数量: userItems[itemName].数量 - 1 };
  } else {
    diff[itemPath] = null;
  }

  const currentHetero = user.缥缈异质 || 0;
  diff["角色.user.缥缈异质"] = currentHetero + price;

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`出售成功！获得 ${price} 异质`);
    setTimeout(() => statStore.initData(), 200);
  } catch (e) {
    showToast("交易失败");
    console.error(e);
  }
};

// 2. 购买技能
const buySkill = async (skillName, details) => {
  if (!statStore.stat_data) return;
  const user = statStore.stat_data.角色.user;
  const price = details.价格 || 100;

  if ((user.缥缈异质 || 0) < price) {
    showToast("异质不足");
    return;
  }

  const diff = {};
  diff["角色.user.缥缈异质"] = user.缥缈异质 - price;
  diff[`角色.user.技能.${skillName}`] = {
    性相: details.性相 || "无",
    技能等级: 1,
    描述: details.描述 || "",
    消耗: details.消耗 || "",
    作用: details.作用 || ""
  };

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`习得技能：${skillName}`);
    setTimeout(() => statStore.initData(), 200);
  } catch (e) {
    showToast("购买失败");
  }
};

// 3. 购买密传 (物品)
const buySecret = async (secretName, details) => {
  if (!statStore.stat_data) return;
  const user = statStore.stat_data.角色.user;
  const price = details.价格 || 50;

  if ((user.缥缈异质 || 0) < price) {
    showToast("异质不足");
    return;
  }

  let finalName = secretName;
  let counter = 1;
  const userItems = user.物品 || {};

  while (userItems[finalName]) {
    finalName = `${secretName}${counter}`;
    counter++;
  }

  const diff = {};
  diff["角色.user.缥缈异质"] = user.缥缈异质 - price;
  diff[`角色.user.物品.${finalName}`] = {
    类型: "密传",
    数量: 1,
    耐久: 100,
    描述: details.描述 || "一份神秘的记录",
    作用: details.作用 || "阅读以获取知识"
  };

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`获得密传：${finalName}`);
    setTimeout(() => statStore.initData(), 200);
  } catch (e) {
    showToast("购买失败");
  }
};

// ================= 生命周期 =================

const fetchAll = async () => {
  await syncChatRecord();
  await syncTransactionRecord();
};

onMounted(async () => {
  await fetchAll();
  pollingTimer = setInterval(fetchAll, 3000); // 轮询聊天记录
});

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer);
});
</script>

<style scoped>
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

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--c-bg-dark);
  color: var(--c-text);
  font-family: 'Lato', sans-serif;
  overflow: hidden;
}

/* Header Styles */
.library-header {
  background: linear-gradient(180deg, #111 0%, #1a1a1a 100%);
  border-bottom: 1px solid var(--c-gold);
  padding: 15px 20px 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  z-index: 10;
}

.header-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.title {
  color: var(--c-gold);
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  text-shadow: 0 0 10px var(--c-gold-dim);
}

.asset-display {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.4);
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid var(--c-gold-dim);
  font-size: 0.9rem;
}

.asset-value {
  color: var(--c-gold-light);
  font-weight: bold;
  margin-left: 5px;
}

/* Navigation Tabs */
.nav-tabs {
  display: flex;
  position: relative;
  border-bottom: 2px solid rgba(255,255,255,0.05);
}

.nav-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  cursor: pointer;
  color: #888;
  transition: color 0.3s;
  position: relative;
  font-weight: bold;
  font-size: 0.95rem;
}

.nav-item:hover {
  color: var(--c-text);
  background: rgba(255,255,255,0.02);
}

.nav-item.active {
  color: var(--c-gold);
}

.nav-indicator {
  position: absolute;
  bottom: -2px;
  left: 0;
  height: 2px;
  background: var(--c-gold);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -2px 10px var(--c-gold);
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 20%;
  width: 6px;
  height: 6px;
  background: var(--c-danger);
  border-radius: 50%;
  box-shadow: 0 0 5px var(--c-danger);
}

/* Main Content */
.main-content-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: url('https://www.transparenttextures.com/patterns/dark-matter.png');
}

.scroll-area {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

/* Chat Styles */
.chat-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: 0 auto 15px auto;
  max-width: 800px;
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--c-bg-dark);
  padding: 5px 0;
}

.toolbar-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--c-text);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.danger-btn {
  background: rgba(229, 115, 115, 0.15);
  border-color: rgba(229, 115, 115, 0.5);
  color: var(--c-danger);
}

.danger-btn:hover:not(:disabled) {
  background: rgba(229, 115, 115, 0.3);
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 20px;
}

.message-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.2s;
  border-radius: 8px;
  padding: 4px;
  width: 100%;
}

.message-wrapper.is-selectable {
  cursor: pointer;
}

.message-wrapper.is-selectable:hover {
  background: rgba(255, 255, 255, 0.05);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 5px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--c-gold);
  pointer-events: none; /* 让点击事件穿透到父元素 */
}

.message-row {
  flex: 1;
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.npc-row {
  justify-content: flex-start;
}

.user-row {
  justify-content: flex-end;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--c-gold);
  object-fit: cover;
  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
}

.bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
  font-size: 0.95rem;
  position: relative;
  word-wrap: break-word;
}

.npc-bubble {
  background: rgba(40, 40, 40, 0.9);
  border: 1px solid rgba(255,255,255,0.1);
  border-bottom-left-radius: 2px;
  color: var(--c-text);
}

.user-bubble {
  background: rgba(60, 50, 30, 0.9);
  border: 1px solid var(--c-gold-dim);
  border-bottom-right-radius: 2px;
  color: var(--c-gold-light);
}

.welcome-bubble {
  border-left: 3px solid var(--c-gold);
  background: rgba(30, 30, 35, 0.95);
}

.thinking-text {
  color: #888;
  font-style: italic;
  font-size: 0.9rem;
  padding: 10px;
}

/* Transaction Cards */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.trade-card {
  background: var(--c-bg-card);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.trade-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  border-color: var(--c-gold-dim);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 8px;
}

.card-title {
  font-weight: bold;
  color: var(--c-gold);
  font-size: 1.1rem;
}

.card-mid {
  flex: 1;
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 15px;
}

.card-mid p { margin: 5px 0; }

.tags { display: flex; gap: 5px; margin-bottom: 8px; }
.tag { padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.1); }
.tag.aspect { color: #a5d6a7; border-color: #a5d6a7; }
.tag.cost { color: #ef9a9a; border-color: #ef9a9a; }

.inventory-check { font-size: 0.8rem; color: #666; }
.inventory-check.has-item { color: #81c784; }

.card-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.price-display {
  font-size: 0.85rem;
  color: var(--c-gold-light);
}

.action-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.sell-btn {
  background: #388e3c;
  color: white;
  width: 100%;
}
.sell-btn:disabled { background: #2e352f; color: #555; cursor: not-allowed; }

.buy-btn {
  background: var(--c-gold);
  color: #1a1a1a;
}
.buy-btn:disabled { background: #444; color: #777; cursor: not-allowed; }

/* Input Area & Quick Replies */
.input-area {
  padding: 15px 20px;
  background: linear-gradient(0deg, #111 0%, #1a1a1a 100%);
  border-top: 1px solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
  z-index: 10;
}

.quick-replies {
  max-width: 800px;
  margin: 0 auto 12px auto;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.quick-replies::-webkit-scrollbar {
  height: 4px;
}

.quick-reply-btn {
  white-space: nowrap;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid var(--c-gold-dim);
  color: var(--c-gold-light);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-reply-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.25);
  border-color: var(--c-gold);
  transform: translateY(-1px);
}

.quick-reply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
  color: var(--c-text);
  padding: 12px 16px;
  border-radius: 12px;
  resize: none;
  height: 46px;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.chat-input:focus {
  outline: none;
  border-color: var(--c-gold);
  box-shadow: 0 0 8px var(--c-gold-dim);
  background: rgba(0, 0, 0, 0.5);
}

.chat-input::placeholder {
  color: #666;
}

.send-btn {
  background: linear-gradient(135deg, var(--c-gold) 0%, #b8860b 100%);
  border: none;
  border-radius: 12px;
  padding: 0 24px;
  height: 46px;
  cursor: pointer;
  font-weight: bold;
  color: #111;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.5);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  background: #333;
  color: #666;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1.1rem;
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
}

.pulse { animation: pulse 2s infinite; }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateY(10px); }
.list-leave-to { opacity: 0; transform: translateY(-10px); }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #1a1a1a; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--c-gold); }
</style>
