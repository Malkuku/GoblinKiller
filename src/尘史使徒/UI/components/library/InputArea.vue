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
        <!-- 整合后的工具按钮 -->
        <div class="tools-container">
          <button
            class="tool-btn"
            :class="{ active: showMenu }"
            @click="showMenu = !showMenu"
            title="工具箱"
          >
            <!-- 齿轮/设置 SVG -->
            <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>

          <!-- 弹出菜单 -->
          <Transition name="fade">
            <div v-if="showMenu" class="tools-menu">
              <div class="menu-item" @click="handleMenuAction('triggerSummary')">
                总结记录
              </div>
              <div class="menu-item" @click="handleMenuAction('clearAll')">
                清空记录
              </div>
              <div class="menu-item" @click="handleMenuAction('toggleDeleteMode')">
                {{ isDeleteMode ? '退出删除模式' : '批量删除' }}
              </div>
            </div>
          </Transition>
        </div>

        <!-- 确认删除按钮 (仅在删除模式下显示在外面) -->
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
const emit = defineEmits(['sendMessage', 'toggleDeleteMode', 'deleteSelected', 'clearAll', 'triggerSummary']);

const inputText = ref('');
const isTavernBusy = ref(false);
const showMenu = ref(false); // 控制菜单显示
let sendButtonObserver = null;
let pollingInterval = null;

const quickReplies = [
  "请爱丽丝锐评最近发生的事情",
  "希望出售有价值的物品/技能",
  "希望购买适合的技能",
  "希望购买适合的秘传"
];

const handleMenuAction = (action) => {
  emit(action);
  showMenu.value = false;
};

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
  // 点击外部关闭菜单的简单实现
  document.addEventListener('click', closeMenuOnClickOutside);
});

onUnmounted(() => {
  if (sendButtonObserver) sendButtonObserver.disconnect();
  if (pollingInterval) clearInterval(pollingInterval);
  document.removeEventListener('click', closeMenuOnClickOutside);
});

const closeMenuOnClickOutside = (e) => {
  const container = document.querySelector('.tools-container');
  if (showMenu.value && container && !container.contains(e.target)) {
    showMenu.value = false;
  }
};

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

.toolbar { display: flex; gap: 5px; align-items: flex-end; }

.tools-container {
  position: relative;
}

.tool-btn {
  width: 40px; height: 40px; background: #1a1a1a; border: 1px solid #333;
  color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; border-radius: 2px;
}
.tool-btn:hover { background: #222; color: #ccc; }
.tool-btn.active { border-color: var(--c-gold); color: var(--c-gold); background: rgba(212, 175, 55, 0.1); }
.tool-btn.danger { border-color: #e57373; color: #e57373; }
.tool-btn.danger:hover { background: rgba(229, 115, 115, 0.1); }

/* 弹出菜单样式 */
.tools-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: #1a1a1a;
  border: 1px solid var(--c-gold-dim);
  border-radius: 4px;
  width: 140px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  overflow: hidden;
  z-index: 100;
}

.menu-item {
  padding: 10px 15px;
  color: #ccc;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #222;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: rgba(212, 175, 55, 0.1);
  color: var(--c-gold);
}

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

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
