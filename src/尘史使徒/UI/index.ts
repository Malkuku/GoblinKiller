import { createPinia } from 'pinia';
import { App as VueApp, createApp } from 'vue';
import App from './App.vue';
import { createMountPoint, destroyMountPoint, deteleportStyle, teleportStyle } from '../utils/dom';
import { router } from './router/router';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useMessageStore } from '@/尘史使徒/UI/store/MessageStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';
import { useAudioStore } from '@/尘史使徒/UI/store/AudioStore';

let vueApp: VueApp | null = null;
let mountPoint: JQuery<HTMLDivElement> | null = null;

function unmountVueApp() {
  if (vueApp) {
    console.debug('unmountVueApp', '卸载 Vue 实例');
    vueApp.unmount();
    vueApp = null;
  }
}

function unloadUI() {
  console.debug('unloadUI', 'UI 脚本开始卸载');
  unmountVueApp();
  deteleportStyle();
  if (mountPoint) {
    console.debug('unloadUI', '销毁挂载点');
    destroyMountPoint();
    mountPoint = null;
  }
  // 卸载时自我清理，防止内存泄漏
  window.removeEventListener('pagehide', unloadUI);
  console.debug('unloadUI', 'UI 脚本卸载完成');

  // 取消监听事件
  eventClearAll();
}

// 在加载时执行
$(() => {
  console.log('initialize', 'UI 脚本开始初始化');
  // 创建挂载点
  mountPoint = createMountPoint();
  console.debug('$(document).ready', '创建挂载点', mountPoint);

  // 将挂载点添加到 body
  $('body').append(mountPoint);
  console.debug('$(document).ready', '挂载点已添加到 body');

  // 创建并挂载 Vue 实例
  vueApp = createApp(App);
  const pinia = createPinia();
  vueApp.use(pinia);
  vueApp.use(router);
  vueApp.mount(mountPoint[0]);

  // 获取 store 实例并暴露到 window，以便外部函数调用
  console.debug('initialize', '正在初始化 store 实例');
  (window as any).UiStore = useUiStore(pinia);

  // 传送样式，也只执行一次
  teleportStyle();
  console.debug('initialize', 'Vue App 已挂载，样式已传送');

  // 监听路由变化，重新传输样式
  router.afterEach(() => {
    setTimeout(() => {
      teleportStyle();
    }, 50);
  });

  // 在卸载时执行，并确保只绑定一次
  window.removeEventListener('pagehide', unloadUI); // 先移除旧的
  window.addEventListener('pagehide', unloadUI); // 再添加新的

  // 注册事件监听器
  useUiStore().getModeSetting();
  useStatStore().registerListener()
  useStatStore().initData()
  useMessageStore().getMessage();
  useAudioStore().preloadAll();
});

