<template>
  <div class="input-area">
    <!-- 快捷回复 -->
    <div class="quick-replies">
      <button
        v-for="(reply, index) in quickReplies"
        :key="index"
        class="rune-chip"
        @click="sendQuickReply(reply)"
        :disabled="isTavernBusy"
      >
        {{ reply }}
      </button>
    </div>

    <div class="input-wrapper">
      <!-- 工具栏 -->
      <div class="toolbar">
        <button
          class="tool-btn"
          :class="{ active: isDeleteMode }"
          @click="$emit('toggleDeleteMode')"
          title="批量删除"
        >
          <!-- 垃圾桶 SVG -->
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>

        <!-- 手动截断按钮 -->
        <button
          class="tool-btn"
          @click="$emit('truncate')"
          title="清理旧记录(保留最近30条)"
        >
          <!-- 扫帚 SVG -->
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path>
            <path d="M13 19l6-6"></path>
            <path d="M16 16l4 4"></path>
            <path d="M19 21l2-2"></path>
          </svg>
        </button>

        <Transition name="scale">
          <button
            v-if="isDeleteMode"
            class="tool-btn danger"
            @click="$emit('deleteSelected')"
            :disabled="selectedCount === 0"
            title="确认删除"
          >
            <!-- 对勾 SVG -->
            <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </Transition>
      </div>

      <textarea
        v-model="inputText"
        class="magic-input"
        placeholder="铭刻你的话语..."
        @keydown.enter.prevent="handleSendOrStop"
        rows="1"
      ></textarea>

      <button
        class="send-btn"
        :class="{ 'is-busy': isTavernBusy }"
        @click="handleSendOrStop"
        :disabled="!isTavernBusy && !inputText.trim()"
        :title="isTavernBusy ? '停止生成' : '发送'"
      >
        <!-- 停止 SVG -->
        <svg v-if="isTavernBusy" class="svg-icon stop-icon" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
        </svg>

        <!-- 羽毛笔 SVG -->
        <svg v-else class="svg-icon quill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
          <line x1="16" y1="8" x2="2" y2="22"></line>
          <line x1="17.5" y1="15" x2="9" y2="15"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isDeleteMode: Boolean,
  selectedCount: { type: Number, default: 0 }
});
const emit = defineEmits(['sendMessage', 'toggleDeleteMode', 'deleteSelected', 'truncate']);

const inputText = ref('');
const isTavernBusy = ref(false);
let sendButtonObserver = null;
let pollingInterval = null;

const quickReplies = [
  "请爱丽丝锐评最近发生的事情",
  "希望出售有价值的物品/技能",
  "希望购买适合的技能",
  "希望购买适合的秘传"
];

// --- 监听酒馆状态逻辑 ---
const checkTavernBusy = (btn) => {
  if (!btn) return;
  const style = window.getComputedStyle(btn);
  const isHidden = style.display === 'none' || style.visibility === 'hidden';
  const isDisabled = btn.hasAttribute('disabled');
  // 兼容 ST 的停止图标状态 (fa-circle-stop 或 fa-stop)
  const isStopIcon = btn.classList.contains('fa-circle-stop') || btn.classList.contains('fa-stop');

  const busy = isHidden || isDisabled || isStopIcon;

  if (isTavernBusy.value !== busy) {
    isTavernBusy.value = busy;
  }
};

const setupTavernObserver = () => {
  try {
    const parentDoc = window.parent.document;
    const tavernSendBtn = parentDoc.getElementById('send_but');

    if (tavernSendBtn) {
      // 初始检查
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

    // 增加轮询作为兜底，防止 MutationObserver 漏掉某些情况（如节点被替换）
    pollingInterval = setInterval(() => {
      const currentBtn = parentDoc.getElementById('send_but');
      if (currentBtn) checkTavernBusy(currentBtn);
    }, 500);

  } catch (e) {
    console.warn('InputArea: 无法连接到父窗口监听发送按钮', e);
  }
};

onMounted(() => {
  setupTavernObserver();
});

onUnmounted(() => {
  if (sendButtonObserver) sendButtonObserver.disconnect();
  if (pollingInterval) clearInterval(pollingInterval);
});

// --- 发送与停止逻辑 ---

const sendQuickReply = (text) => {
  inputText.value = text;
  handleSendOrStop();
};

const handleSendOrStop = (e) => {
  if (isTavernBusy.value) {
    // 如果是按回车触发的，且正在生成，忽略以防止误触停止
    if (e && e.type === 'keydown') return;

    // 触发停止逻辑
    try {
      const parentWin = window.parent;
      const stopBtn = parentWin.document.querySelector('#form_sheld .mes_stop');
      if (stopBtn) {
        const eventOpts = { bubbles: true, cancelable: true, view: parentWin };
        stopBtn.dispatchEvent(new MouseEvent('mousedown', eventOpts));
        stopBtn.dispatchEvent(new MouseEvent('click', eventOpts));
      }
    } catch (err) {
      console.warn('停止生成失败', err);
    }
    return;
  }

  // 发送逻辑
  const text = inputText.value.trim();
  if (!text) return;
  emit('sendMessage', text);
  inputText.value = '';
};
</script>

<style scoped>
.input-area {
  padding: 15px 20px;
  background: #0f0f0f;
  border-top: 1px solid #333;
  box-shadow: 0 -5px 20px rgba(0,0,0,0.5);
  z-index: 30;
}

.quick-replies {
  display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px;
  scrollbar-width: none; /* Firefox */
}
.quick-replies::-webkit-scrollbar { display: none; }

.rune-chip {
  white-space: nowrap; background: rgba(255,255,255,0.05);
  border: 1px solid #333; color: #888;
  padding: 4px 12px; border-radius: 2px; font-size: 0.8rem;
  cursor: pointer; transition: all 0.2s; font-family: 'Lato', sans-serif;
}
.rune-chip:hover:not(:disabled) {
  border-color: var(--c-gold-dim); color: var(--c-gold);
  background: rgba(212, 175, 55, 0.05);
}

.input-wrapper { display: flex; gap: 10px; align-items: flex-end; }

.toolbar { display: flex; gap: 5px; }
.tool-btn {
  width: 40px; height: 40px; background: #1a1a1a; border: 1px solid #333;
  color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; border-radius: 2px;
}
.tool-btn:hover { background: #222; color: #ccc; }
.tool-btn.active { border-color: var(--c-gold); color: var(--c-gold); background: rgba(212, 175, 55, 0.1); }
.tool-btn.danger { border-color: #e57373; color: #e57373; }
.tool-btn.danger:hover { background: rgba(229, 115, 115, 0.1); }

.magic-input {
  flex: 1; background: #050505; border: 1px solid #333;
  color: #e0e0e0; padding: 10px 15px; border-radius: 2px;
  resize: none; height: 42px; font-family: 'Lato', sans-serif;
  transition: all 0.3s;
}
.magic-input:focus {
  outline: none; border-color: var(--c-gold-dim);
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.1);
}

.send-btn {
  width: 50px; height: 42px; background: linear-gradient(135deg, var(--c-gold), #b8860b);
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: 2px; transition: all 0.2s;
  color: #000; /* 确保图标颜色为黑色 */
}
.send-btn:hover:not(:disabled) { box-shadow: 0 0 15px rgba(212, 175, 55, 0.4); }
.send-btn:disabled { background: #333; cursor: not-allowed; opacity: 0.5; color: #666; }

/* 正在回复中按钮样式（覆盖默认的 disabled 样式，变为停止按钮） */
.send-btn.is-busy {
  background: rgba(139, 0, 0, 0.2);
  border: 1px solid #8b0000;
  color: #ff4d4d;
  opacity: 1;
  cursor: pointer;
}
.send-btn.is-busy:hover {
  background: rgba(139, 0, 0, 0.4);
  box-shadow: 0 0 15px rgba(139, 0, 0, 0.5);
}

/* SVG 图标通用样式 */
.svg-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2; /* 线条粗细 */
}

/* 羽毛笔稍微调整一下位置，看起来更平衡 */
.quill-icon {
  width: 22px;
  height: 22px;
}

/* 停止图标 */
.stop-icon {
  width: 18px;
  height: 18px;
}

.scale-enter-active, .scale-leave-active { transition: all 0.2s; }
.scale-enter-from, .scale-leave-to { transform: scale(0); opacity: 0; }
</style>
