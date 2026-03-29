/**
 * 注册酒馆助手按钮
 */

import { useUiStore } from '@/尘史使徒/UI/store/UIStore';

$(() => {
  replaceScriptButtons([
    { name: '打开状态栏', visible: true },
  ]);

  eventOn(getButtonEvent('打开状态栏'), () => {
    useUiStore().showUI = !useUiStore().showUI;
    useUiStore().getModeSetting();
  });
});
