<template>
  <div class="scroll-area chat-area" ref="chatAreaRef">
    <transition-group name="list" tag="div" class="message-list">
      <div v-if="welcomeContent" key="welcome" class="message-wrapper">
        <div class="message-row npc-row">
          <div class="avatar-wrapper">
            <img class="avatar" :src="avatarUrl" alt="爱丽丝" />
          </div>
          <div class="bubble npc-bubble welcome-bubble">{{ welcomeContent }}</div>
        </div>
      </div>

      <div
        v-for="msg in chatContents"
        :key="msg.id"
        class="message-wrapper"
        :class="{ 'is-selectable': isDeleteMode }"
        @click="isDeleteMode && $emit('toggleSelect', msg.id)"
      >
        <div v-if="isDeleteMode" class="checkbox-wrapper">
          <input type="checkbox" :checked="selectedMessages.includes(msg.id)" readonly />
        </div>
        <div :class="['message-row', msg.type === 'user' ? 'user-row' : 'npc-row']">
          <div v-if="msg.type === 'npc'" class="avatar-wrapper">
            <img class="avatar" :src="avatarUrl" alt="爱丽丝" />
          </div>
          <div :class="['bubble', msg.type === 'user' ? 'user-bubble' : 'npc-bubble']">
            {{ msg.text }}
          </div>
          <div v-if="msg.type === 'user'" class="avatar-wrapper user-avatar-wrapper">
            <span class="user-avatar-placeholder">👤</span>
          </div>
        </div>
      </div>

      <div v-if="isThinking" key="thinking" class="message-wrapper">
        <div class="message-row npc-row thinking-row">
          <div class="avatar-wrapper">
            <!-- 移除了 pulse 动画类 -->
            <img class="avatar" :src="avatarUrl" alt="爱丽丝" />
          </div>
          <div class="thinking-text">
            爱丽丝正在翻阅卷宗<span class="dots"></span>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';

const props = defineProps({
  chatContents: Array,
  welcomeContent: String,
  isThinking: Boolean,
  isDeleteMode: Boolean,
  selectedMessages: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['toggleSelect']);

const chatAreaRef = ref(null);
const avatarUrl = "https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/爱丽丝/头像.png";

// 提前预加载图片，避免重复加载和闪烁
onMounted(() => {
  const img = new Image();
  img.src = avatarUrl;
});

const scrollToBottom = async () => {
  await nextTick();
  if (chatAreaRef.value) {
    chatAreaRef.value.scrollTo({ top: chatAreaRef.value.scrollHeight, behavior: 'smooth' });
  }
};

defineExpose({ scrollToBottom });
</script>

<style scoped>
.scroll-area { height: 100%; overflow-y: auto; padding: 20px; scroll-behavior: smooth; }
.message-list { display: flex; flex-direction: column; gap: 12px; max-width: 800px; margin: 0 auto; padding-bottom: 20px; }
.message-wrapper { display: flex; align-items: center; gap: 10px; transition: background 0.2s; border-radius: 8px; padding: 4px; width: 100%; }
.message-wrapper.is-selectable { cursor: pointer; }
.message-wrapper.is-selectable:hover { background: rgba(255, 255, 255, 0.05); }
.checkbox-wrapper { display: flex; align-items: center; justify-content: center; padding-right: 5px; }
.checkbox-wrapper input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--c-gold); pointer-events: none; }
.message-row { flex: 1; width: 100%; display: flex; gap: 12px; align-items: flex-start; }
.npc-row { justify-content: flex-start; }
.user-row { justify-content: flex-end; }
.avatar { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--c-gold); object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
.bubble { max-width: 70%; padding: 12px 16px; border-radius: 12px; line-height: 1.5; font-size: 0.95rem; position: relative; word-wrap: break-word; }
.npc-bubble { background: rgba(40, 40, 40, 0.9); border: 1px solid rgba(255,255,255,0.1); border-bottom-left-radius: 2px; color: var(--c-text); }
.user-bubble { background: rgba(60, 50, 30, 0.9); border: 1px solid var(--c-gold-dim); border-bottom-right-radius: 2px; color: var(--c-gold-light); }
.welcome-bubble { border-left: 3px solid var(--c-gold); background: rgba(30, 30, 35, 0.95); }

/* 优化后的思考动画样式 */
.thinking-text { color: #888; font-style: italic; font-size: 0.9rem; padding: 10px; display: flex; align-items: center; }
.dots { display: inline-block; width: 20px; margin-left: 2px; }
.dots::after {
  content: '...';
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  animation: ellipsis 1.5s infinite steps(4, end);
}
@keyframes ellipsis {
  0% { max-width: 0; }
  100% { max-width: 20px; }
}

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateY(10px); }
.list-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
