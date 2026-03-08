<template>
  <div class="scroll-area chat-area" ref="chatAreaRef">
    <TransitionGroup name="list" tag="div" class="message-list">
      <!-- 欢迎语 -->
      <div v-if="welcomeContent" key="welcome" class="message-wrapper">
        <div class="message-row npc-row">
          <div class="avatar-frame npc-frame" :class="{ 'is-loaded': isAvatarLoaded }">
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
          <div v-if="msg.type === 'npc'" class="avatar-frame npc-frame" :class="{ 'is-loaded': isAvatarLoaded }">
            <img class="avatar" :src="avatarUrl" alt="Alice" />
          </div>

          <div :class="['bubble', msg.type === 'user' ? 'user-bubble' : 'npc-bubble']">
            <div class="bubble-content">{{ msg.text }}</div>
          </div>

          <div v-if="msg.type === 'user'" class="avatar-frame user-frame">
            <!-- 优化后的羽毛笔 SVG 图标 (更简洁，适合小尺寸) -->
            <svg class="user-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
              <line x1="16" y1="8" x2="2" y2="22" />
              <line x1="17.5" y1="15" x2="9" y2="15" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 思考状态 -->
      <div v-if="isThinking" key="thinking" class="message-wrapper">
        <div class="message-row npc-row">
          <div class="avatar-frame npc-frame" :class="{ 'is-loaded': isAvatarLoaded }">
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
import { ref, nextTick, computed, watch } from 'vue';

const props = defineProps({
  chatContents: Array,
  welcomeContent: String,
  isThinking: Boolean,
  isDeleteMode: Boolean,
  selectedMessages: { type: Array, default: () => [] },
  aliceSetting: { type: String, default: '女儿爱丽丝' }
});

const emit = defineEmits(['toggleSelect']);
const chatAreaRef = ref(null);

// 记录头像是否加载完成
const isAvatarLoaded = ref(false);

// 根据当前设定动态计算头像 URL
const avatarUrl = computed(() => `https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/${props.aliceSetting}/头像.webp`);

// 预加载图片并控制动画状态
watch(() => avatarUrl.value, (newUrl) => {
  isAvatarLoaded.value = false; // URL 变化时重置加载状态
  const img = new Image();
  img.onload = () => {
    isAvatarLoaded.value = true; // 图片加载完成后解除骨架屏
  };
  img.src = newUrl;
}, { immediate: true });

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

/* 基础头像框样式 - 尺寸缩小 */
.avatar-frame {
  width: 48px; /* 从 64px 缩小到 48px */
  height: 48px; /* 从 64px 缩小到 48px */
  flex-shrink: 0;
  border: 1px solid var(--c-gold-dim); padding: 2px;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0,0,0,0.4); /* 阴影稍微减弱以适应小尺寸 */
}

/* NPC 头像框及骨架屏动画 */
.npc-frame {
  position: relative;
  overflow: hidden;
  background: #1a1a1a;
}

.npc-frame::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, #222 25%, #3a3a3a 50%, #222 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 50%;
  z-index: 1;
  opacity: 1;
  transition: opacity 0.4s ease;
}

.npc-frame.is-loaded::before {
  opacity: 0;
  pointer-events: none;
}

.avatar {
  width: 100%; height: 100%; border-radius: 50%;
  object-fit: cover; filter: sepia(0.2);
  position: relative;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.npc-frame.is-loaded .avatar {
  opacity: 1;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* User 头像框及 SVG 样式 */
.user-frame {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(145deg, #2a2a2a, #151515);
}

.user-svg {
  width: 24px; /* 从 34px 缩小，适应 48px 的外框 */
  height: 24px;
  color: var(--c-gold-light, #d4af37);
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.6));
  transition: transform 0.3s ease;
}
.user-frame:hover .user-svg {
  transform: scale(1.1); /* 悬浮放大效果稍微增强一点点 */
}

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
