<template>
  <transition name="slide-down-edit">
    <div class="edit-panel">
      <div class="edit-header">
        <span>编辑正文内容</span>
        <button class="close-edit" @click="$emit('close')">×</button>
      </div>
      <div class="edit-body">
        <textarea v-model="textContent" class="edit-textarea" placeholder="在此编辑正文内容..."></textarea>
      </div>
      <div class="edit-footer">
        <button class="confirm-btn" @click="handleConfirm">确认修正</button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useMessageStore } from '@/尘史使徒/UI/store/MessageStore';
import { MessageUtil } from '@/Utils/MessageUtil';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const messageStore = useMessageStore();
const textContent = ref('');
const CONTENT_REGEX = /<content>([\s\S]*?)<\/content>/i;

// 提取 <content> 标签内的内容
const extractContent = () => {
  const msg = messageStore.message || '';
  const match = msg.match(CONTENT_REGEX);
  if (match && match[1]) {
    textContent.value = match[1].trim();
  } else {
    textContent.value = '';
  }
};

onMounted(() => {
  extractContent();
});

watch(() => messageStore.message, () => {
  extractContent();
});

const handleConfirm = async () => {
  const messageId = getLastMessageId();
  if (messageId === null) {
    console.error("无法获取当前消息ID");
    return;
  }

  // 包装回 <content> 标签
  const newContent = `<content>\n${textContent.value}\n</content>`;

  // 如果原文本中存在 <content> 标签则替换，否则追加到末尾
  const targetRegex = CONTENT_REGEX.test(messageStore.message) ? CONTENT_REGEX : /$/;

  await MessageUtil.mergeContentToMessage(messageId, newContent, 'affected', targetRegex);
  messageStore.getMessage(); // 重刷消息
  toastr.success('正文修改成功');
  emit('close');
};
</script>

<style scoped>
.edit-panel {
  /* 改为 fixed 居中定位，适应百分比宽高 */
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background: rgba(20, 22, 28, 0.95);
  border: 1px solid var(--c-gold);
  border-radius: 4px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  z-index: 15;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
}
.edit-header {
  padding: 8px 15px; background: rgba(164, 139, 87, 0.1);
  border-bottom: 1px solid rgba(164, 139, 87, 0.3);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 0.9rem; flex-shrink: 0;
}
.close-edit { background: none; border: none; color: var(--c-text-dim); cursor: pointer; font-size: 1.2rem; }
.edit-body {
  flex: 1; padding: 10px; display: flex; flex-direction: column;
}
.edit-textarea {
  flex: 1; width: 100%; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(164, 139, 87, 0.5);
  color: var(--c-text-main); padding: 10px; font-size: 0.9rem; resize: none; outline: none;
  border-radius: 4px; font-family: inherit; scrollbar-width: thin; scrollbar-color: var(--c-gold) transparent;
}
.edit-textarea:focus { border-color: var(--c-gold); }
.edit-footer {
  padding: 10px; border-top: 1px solid rgba(164, 139, 87, 0.3); display: flex; justify-content: flex-end;
}
.confirm-btn {
  background: rgba(164, 139, 87, 0.2); border: 1px solid var(--c-gold); color: var(--c-gold);
  padding: 5px 15px; border-radius: 3px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
}
.confirm-btn:hover { background: rgba(164, 139, 87, 0.4); }

.slide-down-edit-enter-active, .slide-down-edit-leave-active { transition: all 0.3s ease; }
/* 配合居中定位修改动画的 transform */
.slide-down-edit-enter-from, .slide-down-edit-leave-to { opacity: 0; transform: translate(-50%, -55%); }

@media (max-width: 1000px) {
  .edit-panel {
    top: 0;
    left: 0;
    transform: none;
    width: 100%;
    height: 100vh; /* 兼容老浏览器 */
    height: 100dvh; /* 优先使用 dvh 解决手机浏览器地址栏遮挡问题 */
    border-radius: 0; /* 手机端全屏取消圆角 */
    border: none;
  }
  /* 手机端动画恢复为普通的上下滑动 */
  .slide-down-edit-enter-from, .slide-down-edit-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
