<template>
  <div class="message-scroll-area" ref="scrollContainer">
    <div class="message-paper">
      <div class="message-content" :style="{ fontSize: fontSize + 'px' }">
        <!-- 正文 -->
        <div class="text-body" v-html="displayHtml"></div>
        <!-- 打字机光标 -->
        <span v-if="isStreaming" class="typing-cursor">_</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  displayHtml: string;
  isStreaming: boolean;
  fontSize: number;
}>();

const scrollContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTo({ top: scrollContainer.value.scrollHeight, behavior: 'smooth' });
    }
  });
};

// 监听内容变化并滚动到底部
watch(() => props.displayHtml, scrollToBottom);
watch(() => props.isStreaming, (streaming) => {
  if (!streaming) {
    scrollToBottom();
  }
});

// Expose the ref for parent component if needed, or handle scrolling internally
defineExpose({
  scrollContainer,
  scrollToBottom
});
</script>

<style scoped>
.message-scroll-area {
  flex: 1; overflow-y: auto; padding: 20px 0;
  scrollbar-width: thin; scrollbar-color: var(--c-gold) transparent;
}
.message-paper { max-width: 1024px; margin: 0 auto; padding: 0 30px; }
.message-content {
  line-height: 1.8; color: var(--c-text-main);
  font-family: 'EB Garamond', serif; transition: font-size 0.2s ease;
}
.text-body :deep(q) {
  quotes: none; display: inline; background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(164, 139, 87, 0.15); border-radius: 4px;
  padding: 2px 6px; margin: 0 2px; color: #fff5e6;
  font-family: 'EB Garamond', serif; font-style: italic;
  text-shadow: 0 0 2px rgba(0,0,0,0.5); box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  box-decoration-break: clone; -webkit-box-decoration-break: clone;
  transition: all 0.3s ease;
}
.text-body :deep(q):hover {
  background: rgba(164, 139, 87, 0.15); border-color: rgba(164, 139, 87, 0.4);
  text-shadow: 0 0 5px rgba(164, 139, 87, 0.5); cursor: default;
}
.text-body :deep(q)::before { content: "『"; color: var(--c-gold); margin-right: 3px; font-weight: bold; opacity: 0.8; text-shadow: none; }
.text-body :deep(q)::after { content: "』"; color: var(--c-gold); margin-left: 3px; font-weight: bold; opacity: 0.8; text-shadow: none; }
.text-body :deep(p) { margin-bottom: 1em; text-align: justify; }
.text-body :deep(em) { color: var(--c-gold); font-style: italic; }
.text-body :deep(strong) { color: #fff; font-weight: 600; }
.typing-cursor { display: inline-block; color: var(--c-gold); font-weight: bold; animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
</style>
