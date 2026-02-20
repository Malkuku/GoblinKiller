import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('KatDustUI', () => {
  //是否显示UI
  const showUI = ref(false);

  // 黑夜模式
  const darkMode = ref(false);

  // --- 新增：残页是否已读 ---
  const hasViewedDiary = ref(false);

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
    // 读取残页已读状态，默认为 false
    hasViewedDiary.value = variables.hasViewedDiary || false;
  };

  /**
   * 保存UI设置
   */
  const saveModeSetting = async () => {
    // 将需要保存的变量打包
    const saveVariables = {
      darkMode: darkMode.value,
      hasViewedDiary: hasViewedDiary.value
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

  /**
   * 标记残页为已读并保存
   */
  const markDiaryViewed = async () => {
    if (!hasViewedDiary.value) {
      hasViewedDiary.value = true;
      await saveModeSetting();
    }
  };

  return {
    showUI,
    darkMode,
    hasViewedDiary, // 导出
    pendingInput,
    setPendingInput,
    consumePendingInput,
    getModeSetting,
    saveModeSetting,
    markDiaryViewed // 导出
  };
});
