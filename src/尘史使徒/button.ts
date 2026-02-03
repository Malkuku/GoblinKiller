/**
 * 注册酒馆助手按钮
 */

import { useUiStore } from '@/尘史使徒/UI/store/UIStore';

$(() => {
  replaceScriptButtons([
    { name: '🐱ERA助手', visible: true },
    { name: '🍬重新分析变量', visible: true },
  ]);

  eventOn(getButtonEvent('打开状态栏'), () => {
    useUiStore().showUI = !useUiStore().showUI;
    useUiStore().getModeSetting();
  });
});
