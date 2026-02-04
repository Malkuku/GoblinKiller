import { defineStore } from 'pinia';

export const useUiStore = defineStore('KatDustUI', () => {
  //是否显示UI
  const showUI = ref(false);

  // 黑夜模式
  const darkMode = ref(false);

  /**
   * 尝试从变量中获取UI设置
   */
  const getModeSetting = async () => {
    const variables = getVariables({ type: 'script', script_id: getScriptId() });
    darkMode.value = variables.darkMode || false;
  };

  /**
   * 保存UI设置
   */
  const saveModeSetting = async () => {
    const saveVariables = darkMode.value;
    const cleaned = JSON.parse(JSON.stringify(saveVariables));
    updateVariablesWith(
      vars => ({
        ...vars,
        darkMode: cleaned,
      }),
      { type: 'script', script_id: getScriptId() },
    );
  };

  return {
    showUI,
    darkMode,
    getModeSetting,
    saveModeSetting,
  };
});
