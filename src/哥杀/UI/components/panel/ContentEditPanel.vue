<template>
  <transition name="slide-down-edit">
    <div class="edit-panel">
      <div class="edit-header">
        <span>编辑正文内容</span>
        <button class="close-edit" @click="$emit('close')">✕</button>
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

const emit = defineEmits<{ (e: 'close'): void; }>();
const messageStore = useMessageStore();
const textContent = ref('');
const editAllContent = ref(false);
const CONTENT_REGEX = /<content>([\s\S]*?)<\/content>/i;

const textareaPlaceholder = computed(() => editAllContent.value ? '在此编辑整个消息内容...' : '在此编辑正文内容...');

const extractContent = () => {
  const msg = messageStore.message || '';
  if (editAllContent.value) {
    textContent.value = msg;
  } else {
    const match = msg.match(CONTENT_REGEX);
    textContent.value = match && match[1] ? match[1].trim() : '';
  }
};

onMounted(extractContent);
watch(() => messageStore.message, extractContent);
watch(editAllContent, extractContent);

const handleConfirm = async () => {
  const messageId = getLastMessageId(); // 需确保此方法在上下文中可用
  if (messageId === null) return;

  let newContent = '';
  let targetRegex: RegExp | string = '';

  if (editAllContent.value) {
    newContent = textContent.value;
    targetRegex = /^[\s\S]*$/;
  } else {
    newContent = `<content>\n${textContent.value}\n</content>`;
    targetRegex = CONTENT_REGEX.test(messageStore.message) ? CONTENT_REGEX : /$/;
  }

  await MessageUtil.mergeContentToMessage(messageId, newContent, 'affected', targetRegex);
  messageStore.getMessage();
  toastr.success(editAllContent.value ? '整个消息修改成功' : '正文修改成功');
  emit('close');
};
</script>

<style scoped>
.edit-panel {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 80%; height: 80%; background: var(--scroll-paper);
  border: 1px solid var(--scroll-border); border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 10000;
  display: flex; flex-direction: column; color: var(--text-main);
}
.edit-header {
  padding: 12px 20px; background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid var(--scroll-border);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--accent-gold); font-weight: bold; font-size: 1rem; flex-shrink: 0;
}
.close-edit { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; transition: color 0.3s; }
.close-edit:hover { color: var(--accent-gold); }
.edit-body { flex: 1; padding: 15px; display: flex; flex-direction: column; }
.edit-options {
  margin-bottom: 15px; padding: 10px 15px; background: rgba(0, 0, 0, 0.02);
  border-radius: 4px; border: 1px dashed var(--scroll-border);
}
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.95rem; margin-bottom: 5px; }
.checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent-gold); cursor: pointer; }
.option-hint { font-size: 0.85rem; color: var(--text-muted); padding-left: 24px; }
.edit-textarea {
  flex: 1; width: 100%; background: rgba(255, 255, 255, 0.5); border: 1px solid var(--scroll-border);
  color: var(--text-main); padding: 15px; font-size: 0.95rem; resize: none; outline: none;
  border-radius: 4px; font-family: inherit; scrollbar-width: thin;
}
.edit-textarea:focus { border-color: var(--accent-gold); box-shadow: 0 0 5px rgba(198, 166, 100, 0.2); }
.edit-footer { padding: 15px 20px; border-top: 1px solid var(--scroll-border); display: flex; justify-content: flex-end; background: rgba(0, 0, 0, 0.02); }
.confirm-btn {
  background: transparent; border: 1px solid var(--accent-gold); color: var(--accent-gold);
  padding: 8px 20px; border-radius: 4px; cursor: pointer; font-size: 0.95rem; transition: all 0.3s;
}
.confirm-btn:hover { background: var(--accent-gold); color: var(--scroll-paper); }

.slide-down-edit-enter-active, .slide-down-edit-leave-active { transition: all 0.3s ease; }
.slide-down-edit-enter-from, .slide-down-edit-leave-to { opacity: 0; transform: translate(-50%, -55%); }

@media (max-width: 1000px) {
  .edit-panel { top: 0; left: 0; transform: none; width: 100%; height: 100dvh; border-radius: 0; border: none; }
  .slide-down-edit-enter-from, .slide-down-edit-leave-to { opacity: 0; transform: translateY(-10px); }
}
</style>
