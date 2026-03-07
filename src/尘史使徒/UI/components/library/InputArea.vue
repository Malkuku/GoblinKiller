<template>
  <div class="input-area">
    <!-- 快捷回复 -->
    <div class="quick-replies">
      <button
        v-for="(reply, index) in quickReplies"
        :key="index"
        class="rune-chip"
        @click="sendQuickReply(reply)"
        :disabled="isSending"
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
        @keydown.enter.prevent="handleSend"
        rows="1"
      ></textarea>

      <button class="send-btn" @click="handleSend" :disabled="isSending || !inputText.trim()">
        <!-- 羽毛笔 SVG -->
        <svg class="svg-icon quill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
          <line x1="16" y1="8" x2="2" y2="22"></line>
          <line x1="17.5" y1="15" x2="9" y2="15"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isSending: Boolean,
  isDeleteMode: Boolean,
  selectedCount: { type: Number, default: 0 }
});
const emit = defineEmits(['sendMessage', 'toggleDeleteMode', 'deleteSelected']);

const inputText = ref('');
const quickReplies = [
  "请爱丽丝锐评最近发生的事情",
  "希望出售有价值的物品/技能",
  "希望购买适合的技能",
  "希望购买适合的密传"
];

const sendQuickReply = (text) => {
  inputText.value = text;
  handleSend();
};

const handleSend = () => {
  const text = inputText.value.trim();
  if (!text || props.isSending) return;
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

.scale-enter-active, .scale-leave-active { transition: all 0.2s; }
.scale-enter-from, .scale-leave-to { transform: scale(0); opacity: 0; }
</style>
