<template>
  <div class="input-area">
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
        @keydown.enter.prevent="handleSend"
        rows="1"
      ></textarea>
      <button class="send-btn" @click="handleSend" :disabled="isSending || !inputText.trim()">
        <span class="btn-text">发送</span>
        <span class="btn-icon">✒️</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ isSending: Boolean });
const emit = defineEmits(['sendMessage']);

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
.input-area { padding: 15px 20px; background: linear-gradient(0deg, #111 0%, #1a1a1a 100%); border-top: 1px solid rgba(212, 175, 55, 0.3); box-shadow: 0 -4px 20px rgba(0,0,0,0.5); z-index: 10; }
.quick-replies { max-width: 800px; margin: 0 auto 12px auto; display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.quick-replies::-webkit-scrollbar { height: 4px; }
.quick-reply-btn { white-space: nowrap; background: rgba(212, 175, 55, 0.1); border: 1px solid var(--c-gold-dim); color: var(--c-gold-light); padding: 6px 12px; border-radius: 16px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; }
.quick-reply-btn:hover:not(:disabled) { background: rgba(212, 175, 55, 0.25); border-color: var(--c-gold); transform: translateY(-1px); }
.quick-reply-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.input-wrapper { max-width: 800px; margin: 0 auto; display: flex; gap: 12px; align-items: flex-end; }
.chat-input { flex: 1; background: rgba(0, 0, 0, 0.3); border: 1px solid #444; color: var(--c-text); padding: 12px 16px; border-radius: 12px; resize: none; height: 46px; font-family: inherit; font-size: 0.95rem; line-height: 1.5; transition: border-color 0.3s, box-shadow 0.3s; }
.chat-input:focus { outline: none; border-color: var(--c-gold); box-shadow: 0 0 8px var(--c-gold-dim); background: rgba(0, 0, 0, 0.5); }
.chat-input::placeholder { color: #666; }
.send-btn { background: linear-gradient(135deg, var(--c-gold) 0%, #b8860b 100%); border: none; border-radius: 12px; padding: 0 24px; height: 46px; cursor: pointer; font-weight: bold; color: #111; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3); }
.send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(212, 175, 55, 0.5); }
.send-btn:active:not(:disabled) { transform: translateY(0); }
.send-btn:disabled { background: #333; color: #666; box-shadow: none; cursor: not-allowed; transform: none; }
.btn-icon { font-size: 1.1rem; }
</style>
