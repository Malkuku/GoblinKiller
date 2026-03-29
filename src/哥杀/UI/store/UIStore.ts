import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('KatDustUI', () => {
  //是否显示UI
  const showUI = ref(false);

  // 黑夜模式
  const darkMode = ref(false);

  // 待处理的输入框内容
  const pendingInput = ref('');

  const setPendingInput = (text: string) => {
    pendingInput.value = text;
  };

  const consumePendingInput = () => {
    const text = pendingInput.value;
    pendingInput.value = '';
    return text;
  };

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
    // 将需要保存的变量打包
    const saveVariables = {
      darkMode: darkMode.value
    };
    const cleaned = JSON.parse(JSON.stringify(saveVariables));

    updateVariablesWith(
      vars => ({
        ...vars,
        ...cleaned, // 展开合并到游戏变量中
      }),
      { type: 'script', script_id: getScriptId() },
    );
  };


  return {
    showUI,
    darkMode,
    pendingInput,
    setPendingInput,
    consumePendingInput,
    getModeSetting,
    saveModeSetting,
  };
});
