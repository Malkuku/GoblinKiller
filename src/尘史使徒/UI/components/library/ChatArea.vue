<template>
  <div class="scroll-area chat-area" ref="chatAreaRef">
    <TransitionGroup name="list" tag="div" class="message-list">
      <!-- 欢迎语 -->
      <div v-if="welcomeContent" key="welcome" class="message-wrapper">
        <div class="message-row npc-row">
          <div class="avatar-frame">
            <img class="avatar" :src="avatarUrl" alt="Alice" />
          </div>
          <div class="bubble npc-bubble welcome-bubble">
            <div class="bubble-content">{{ welcomeContent }}</div>
          </div>
        </div>
      </div>

      <!-- 聊天记录 -->
      <div
        v-for="msg in chatContents"
        :key="msg.id"
        class="message-wrapper"
        :class="{ 'is-selectable': isDeleteMode, 'is-selected': selectedMessages.includes(msg.id) }"
        @click="isDeleteMode && $emit('toggleSelect', msg.id)"
      >
        <div v-if="isDeleteMode" class="checkbox-indicator">
          <span v-if="selectedMessages.includes(msg.id)">✦</span>
        </div>

        <div :class="['message-row', msg.type === 'user' ? 'user-row' : 'npc-row']">
          <div v-if="msg.type === 'npc'" class="avatar-frame">
            <img class="avatar" :src="avatarUrl" alt="Alice" />
          </div>

          <div :class="['bubble', msg.type === 'user' ? 'user-bubble' : 'npc-bubble']">
            <div class="bubble-content">{{ msg.text }}</div>
          </div>

          <div v-if="msg.type === 'user'" class="avatar-frame user-frame">
            <span class="user-icon">👤</span>
          </div>
        </div>
      </div>

      <!-- 思考状态 -->
      <div v-if="isThinking" key="thinking" class="message-wrapper">
        <div class="message-row npc-row">
          <div class="avatar-frame">
            <img class="avatar" :src="avatarUrl" alt="Alice" />
          </div>
          <div class="thinking-bubble">
            爱丽丝正在翻阅卷宗<span class="dots">...</span>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';

const props = defineProps({
  chatContents: Array,
  welcomeContent: String,
  isThinking: Boolean,
  isDeleteMode: Boolean,
  selectedMessages: { type: Array, default: () => [] }
});

const emit = defineEmits(['toggleSelect']);
const chatAreaRef = ref(null);
const avatarUrl = "https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/爱丽丝/头像.png";

onMounted(() => { const img = new Image(); img.src = avatarUrl; });

const scrollToBottom = async () => {
  await nextTick();
  if (chatAreaRef.value) {
    chatAreaRef.value.scrollTo({ top: chatAreaRef.value.scrollHeight, behavior: 'smooth' });
  }
};
defineExpose({ scrollToBottom });
</script>

<style scoped>
.chat-area { padding: 20px; }
.message-list { display: flex; flex-direction: column; gap: 16px; max-width: 900px; margin: 0 auto; padding-bottom: 20px; }

.message-wrapper { display: flex; align-items: flex-start; gap: 10px; transition: all 0.2s; padding: 4px 8px; border-radius: 6px; }
.message-wrapper.is-selectable { cursor: pointer; border: 1px dashed #333; }
.message-wrapper.is-selectable:hover { background: rgba(255,255,255,0.03); }
.message-wrapper.is-selected { background: rgba(212, 175, 55, 0.1); border-color: var(--c-gold-dim); }

.checkbox-indicator {
  width: 24px; height: 24px; border: 1px solid var(--c-gold);
  display: flex; align-items: center; justify-content: center;
  color: var(--c-gold); margin-top: 10px; flex-shrink: 0;
}

.message-row { display: flex; gap: 15px; width: 100%; }
.npc-row { justify-content: flex-start; }
.user-row { justify-content: flex-end; }

.avatar-frame {
  width: 42px; height: 42px; flex-shrink: 0;
  border: 1px solid var(--c-gold-dim); padding: 2px;
  border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);
}
.avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; filter: sepia(0.2); }
.user-frame { display: flex; align-items: center; justify-content: center; background: #1a1a1a; color: #555; }

.bubble {
  max-width: 75%; padding: 12px 18px; border-radius: 4px;
  font-size: 0.95rem; line-height: 1.6; position: relative;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}
.npc-bubble {
  background: linear-gradient(145deg, #1a1a1a, #111);
  border: 1px solid #333; color: #d0d0d0;
  border-top-left-radius: 0;
}
.welcome-bubble { border-left: 2px solid var(--c-gold); background: rgba(20, 20, 20, 0.9); }

.user-bubble {
  background: linear-gradient(145deg, #2a2a2a, #222);
  border: 1px solid var(--c-gold-dim); color: var(--c-gold-light);
  border-top-right-radius: 0;
}

.thinking-bubble {
  color: #666; font-style: italic; font-size: 0.9rem;
  display: flex; align-items: center; gap: 8px; margin-top: 10px;
}
.dots { animation: blink 1.5s infinite; }
@keyframes blink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateY(10px); }
</style>
