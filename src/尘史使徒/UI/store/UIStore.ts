import { defineStore } from 'pinia';

export const useUiStore = defineStore('KatDustUI', () => {
  //是否显示UI
  const showUI = ref(false);

  // 黑夜模式
  const darkMode = ref(false);

  // --- 新增：待处理的输入框内容 ---
  const pendingInput = ref('');

  /**
   * 设置待处理输入（用于跨页面传递输入框内容）
   */
  const setPendingInput = (text: string) => {
    pendingInput.value = text;
  };

  /**
   * 消费待处理输入（读取并清空）
   */
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
    pendingInput, // 导出
    setPendingInput, // 导出
    consumePendingInput, // 导出
    getModeSetting,
    saveModeSetting,
  };
});
