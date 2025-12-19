<template>
  <div class="options-view-container">
    <transition name="fade-options">
      <div v-if="optionsList.length > 0" class="options-panel">
        <h2 class="panel-title">下一幕历史会是？</h2>
        <ul class="options-list">
          <li v-for="(option, index) in optionsList" :key="index">
            <button class="option-button" @click="handleSelectOption(option)">
              {{ option }}
            </button>
          </li>
        </ul>
      </div>
    </transition>

    <div v-if="optionsList.length === 0" class="no-options-placeholder">
      <p>静待时机...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMessageStore } from '@/尘史使徒/store/MessageStore';

const messageStore = useMessageStore();
const optionsList = ref<string[]>([]);

/**
 * 解析消息字符串，从中提取 <options> 块内的所有 <op> 标签内容。
 * @param msg - 从 messageStore 获取的原始消息字符串。
 * @returns 解析出的选项字符串数组。
 */
function parseOptions(msg: string | null | undefined): string[] {
  if (!msg) return [];
  try {
    // 匹配 <options>...</options> 块
    const optionsBlock = msg.match(/<options>([\s\S]*?)<\/options>/);
    if (!optionsBlock?.[1]) return [];

    // 从块中匹配所有的 <op>...</op>，支持跨行内容
    const ops = Array.from(optionsBlock[1].matchAll(/<op>([\s\S]*?)<\/op>/g), m => m[1].trim());
    return ops.length ? ops : [];
  } catch (error) {
    console.error("解析选项时出错:", error);
    return [];
  }
}

/**
 * 当用户点击一个选项时触发。
 * @param option - 被选中的选项字符串。
 */
function handleSelectOption(option: string) {
  // 核心逻辑：与 SillyTavern 的父窗口交互
  try {
    const input = window.parent.document.querySelector('#send_textarea') as HTMLTextAreaElement;
    if (!input) {
      console.warn('未能在父窗口中找到 SillyTavern 输入框 #send_textarea');
      // 可以在这里添加一个 fallback，比如将选项复制到剪贴板
      // navigator.clipboard.writeText(option);
      // alert('输入框未找到，选项已复制到剪贴板。');
      return;
    }

    const currentValue = input.value.trim();
    // 将选项追加到现有文本后面，如果输入框不为空则加一个空格
    input.value = currentValue ? `${currentValue} ${option}` : option;

    // 派发 'input' 事件，以确保 SillyTavern 的 Vue 实例能检测到变化
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // 将焦点设置回输入框，方便用户继续输入或直接发送
    input.focus();

    // 选择后清空选项列表，避免重复选择
    optionsList.value = [];

  } catch (error) {
    console.error("与父窗口交互时出错:", error);
    alert("无法将选项发送到输入框。请检查是否在 iframe 中正常运行。");
  }
}

// 监听 messageStore 中的 message 变化
watch(
  () => messageStore.message,
  (newMessage) => {
    const ops = parseOptions(newMessage);
    optionsList.value = ops;
  },
  { immediate: true } // 立即执行一次，以处理初始消息
);
</script>

<style scoped>
.options-view-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  padding: 2rem;
  overflow-y: auto;
}

.options-panel {
  width: 100%;
  max-width: 600px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 12px var(--shadow-color);
}

.panel-title {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  color: var(--accent-primary);
  text-align: center;
  margin: 0 0 1.5rem 0;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-button {
  width: 100%;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.8rem 1.2rem;
  font-family: 'EB Garamond', serif;
  font-size: 1.1rem;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
}

.option-button:hover {
  border-color: var(--accent-primary);
}

.option-button:active {
  transform: translateY(1px);
}

.no-options-placeholder {
  text-align: center;
  margin-top: 10vh;
  font-family: 'EB Garamond', serif;
  font-size: 1.2rem;
  font-style: italic;
  color: var(--text-secondary);
}

/* 选项面板出现/消失的动画 */
.fade-options-enter-active,
.fade-options-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-options-enter-from,
.fade-options-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
