import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('KatDustUI', () => {
  // 是否显示UI
  const showUI = ref(false);
  // 是否直接发送
  const autoSend = ref(false);

  return {
    showUI,
    autoSend
  };
});
