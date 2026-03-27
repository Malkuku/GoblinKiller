<template>
  <transition name="slide-down-edit">
    <div class="edit-panel">
      <div class="edit-header">
        <span>编辑正文内容</span>
        <button class="close-edit" @click="$emit('close')">×</button>
      </div>
      <div class="edit-body">
        <div class="edit-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="editAllContent" />
            <span>修改整个消息内容</span>
          </label>
          <div class="option-hint" v-if="editAllContent">
            将修改整个消息内容，包括所有标签和文本
          </div>
          <div class="option-hint" v-else>
            只修改 &lt;content&gt; 标签内的内容
          </div>
        </div>
        <textarea v-model="textContent" class="edit-textarea" :placeholder="textareaPlaceholder"></textarea>
      </div>
      <div class="edit-footer">
        <button class="confirm-btn" @click="handleConfirm">确认修正</button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useMessageStore } from '@/尘史使徒/UI/store/MessageStore';
import { MessageUtil } from '@/Utils/MessageUtil';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const messageStore = useMessageStore();
const textContent = ref('');
const editAllContent = ref(false);
const CONTENT_REGEX = /<content>([\s\S]*?)<\/content>/i;

// 计算文本框的占位符文本
const textareaPlaceholder = computed(() => {
  return editAllContent.value
    ? '在此编辑整个消息内容...'
    : '在此编辑正文内容...';
});

// 提取内容：根据勾选状态决定提取整个消息还是只提取<content>标签内的内容
const extractContent = () => {
  const msg = messageStore.message || '';

  if (editAllContent.value) {
    // 编辑整个消息内容
    textContent.value = msg;
  } else {
    // 只编辑<content>标签内的内容
    const match = msg.match(CONTENT_REGEX);
    if (match && match[1]) {
      textContent.value = match[1].trim();
    } else {
      textContent.value = '';
    }
  }
};

onMounted(() => {
  extractContent();
});

// 监听消息变化
watch(() => messageStore.message, () => {
  extractContent();
});

// 监听勾选框变化
watch(editAllContent, () => {
  extractContent();
});

const handleConfirm = async () => {
  const messageId = getLastMessageId();
  if (messageId === null) {
    console.error("无法获取当前消息ID");
    return;
  }

  let newContent = '';
  let targetRegex: RegExp | string = '';

  if (editAllContent.value) {
    // 修改整个消息内容
    newContent = textContent.value;
    targetRegex = /^[\s\S]*$/; // 匹配整个字符串
  } else {
    // 只修改<content>标签内的内容
    newContent = `<content>\n${textContent.value}\n</content>`;

    // 如果原文本中存在<content>标签则替换，否则追加到末尾
    targetRegex = CONTENT_REGEX.test(messageStore.message) ? CONTENT_REGEX : /$/;
  }

  await MessageUtil.mergeContentToMessage(messageId, newContent, 'affected', targetRegex);
  messageStore.getMessage(); // 重刷消息
  toastr.success(editAllContent.value ? '整个消息修改成功' : '正文修改成功');
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
.edit-options {
  margin-bottom: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 1px solid rgba(164, 139, 87, 0.3);
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--c-text-main);
  font-size: 0.9rem;
  margin-bottom: 5px;
}
.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--c-gold);
  cursor: pointer;
}
.option-hint {
  font-size: 0.8rem;
  color: var(--c-text-dim);
  padding-left: 24px;
  margin-top: 2px;
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
