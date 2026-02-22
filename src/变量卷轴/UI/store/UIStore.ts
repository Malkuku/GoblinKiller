import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('KatDustUI', () => {
  //是否显示UI
  const showUI = ref(false);


  return {
    showUI
  };
});
