/**
 * 图标配置选项
 */
export interface IconOptions {
  size?: number | string;
  color?: string;
  style?: string;
}

/**
 * 物品/实体数据接口
 */
export interface ItemData {
  type?: string;
  name?: string;
  类型?: string;
  名称?: string;
  [key: string]: any;
}

/**
 * 动态加载 Iconify CDN 脚本
 * 如果你的项目没有在 index.html 中直接写 <script> 标签，可以在入口文件调用此方法
 */
export function initIconifyCDN() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 检查是否已经加载过
  if (
    window.customElements?.get('iconify-icon') ||
    document.querySelector('script[src*="iconify-icon"]')
  ) {
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js';
  script.async = true;
  document.head.appendChild(script);
}

/**
 * SVG 图标库 (Centralized SVG Library)
 */
export const SVG_LIB = {
  // --- 图标映射库 (优先使用 Iconify CDN 图标) ---
  _icons: {
    trash: 'mdi:trash-can-outline',
    nav_mgmt: 'mdi:cog-outline',
    sword: 'game-icons:broadsword',
    spear: 'mdi:spear',
    lance: 'game-icons:spear-head',
    axe: 'game-icons:battle-axe',
    mace: 'game-icons:mace-head',
    dagger: 'game-icons:dagger-rose',
    bow: 'mdi:bow-arrow',
    staff: 'game-icons:wizard-staff',
    firearm: 'game-icons:sawed-off-shotgun',
    shield: 'game-icons:layered-armor',
    helmet: 'mdi:helmet',
    armor: 'game-icons:chest-armor',
    shoulder: 'game-icons:spiked-shoulder-armor',
    bracer: 'game-icons:armor-cuisses',
    pants: 'game-icons:armored-pants',
    boots: 'game-icons:boots',
    nav_quests: 'mdi:script-text-outline',
    nav_social: 'mdi:account-group-outline',
    heart: 'mdi:heart',
    swords: 'mdi:sword-cross',
    check: 'mdi:check-bold',
    star: 'mdi:star',
    seal: 'mdi:seal',
    gloves: 'game-icons:gauntlet',
    cloak: 'game-icons:cloak',
    potion: 'mdi:flask-outline',
    medicine: 'medical-icon:health-services',
    food: 'mdi:food-apple',
    fish: 'fluent:food-fish-20-filled',
    meat: 'mdi:meat',
    drink: 'mdi:glass-wine',
    herb: 'mdi:flower-outline',
    material: 'mdi:cube-outline',
    gem: 'lets-icons:dimond-alt',
    ore: 'game-icons:crystal-growth',
    intel: 'mdi:information-outline',
    tool: 'mdi:tools',
    key: 'mdi:key-variant',
    asset: 'mdi:domain',
    acc: 'mdi:ring',
    skill: 'mdi:auto-fix',
    status: 'mdi:bell-outline',
    scroll: 'game-icons:tied-scroll',
    misc: 'mdi:dots-horizontal-circle-outline',
    quest: 'mdi:help-circle-outline',
    trophy: 'mdi:trophy-outline',
    clock: 'mdi:clock-outline',
    map: 'heroicons-solid:map',
    wallet: 'mdi:wallet-outline',
    list: 'mdi:format-list-bulleted',
    grid: 'mdi:view-grid-outline',
    arrow: 'mdi:chevron-right',
    nav_protagonist: 'mdi:account-circle-outline',
    nav_ability: 'mdi:shield-star-outline',
    nav_bag: 'mdi:bag-personal-outline',
    paw: 'mdi:paw',
    coin: 'mingcute:coin-fill',
    blood: 'openmoji:drop-of-blood'
  } as Record<string, string>,

  // --- 本地 SVG Path 回退库 ---
  trash: '<path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/>',
  sword: '<path d="M21 3l-4 1-9 9-2-2-2 2 3 3-3 3-1 1-1 1 2 2 1-1 1-1 3-3 3 3 2-2-2-2 9-9 1-4z"/>',
  spear: '<path d="M22 2l-9 5 1 1-3 3 1 1-10 10 3 3 10-10 1 1 3-3 1 1 5-11-2-2z"/>',
  axe: '<path d="M16 2l-4 4l4 4l4-4l-4-4zm-1 9h2v11h-2V11zM7 5L2 10l8 8l3-3l-6-10z"/>',
  mace: '<path d="M12 2l-2 3h4l-2-3zm-1 7h2v13h-2V9zm-4 1L5 12l4 4l2-2l-4-4zm10 0l2 2l-4 4l-2-2l4-4z"/>',
  dagger: '<path d="M18 6l-3 1-6 6-2-2-2 2 2 2-3 3-1 1 2 2 1-1 3-3 2 2 2-2-2-2 6-6 1-3z"/>',
  bow: '<path d="M19 4c-3-2-7-2-10 1L4 10l2 2l2-2c2-2 5-2 7 0l3 3c2 2 2 5 0 7l-2 2l2 2l5-5c2-4 2-10-1-13z"/>',
  staff: '<path d="M12 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6zm-1 7h2v15h-2V9z"/>',
  firearm: '<path d="M22 13h-4l-1-1H2v3h14l1 1h5v-3zM13 11h2v1h-2v-1z"/>',
  shield: '<path d="M12 2L4 5v7c0 5 3.5 10 8 11c4.5-1 8-6 8-11V5l-8-3zm5 10c0 3.5-2 7-5 8-3-1-5-4.5-5-8V6.5l5-2l5 2V12z"/>',
  helmet: '<path d="M12 2c-4.5 0-8 3.5-8 8v3h16v-3c0-4.5-3.5-8-8-8zm-5 13c0 3 2.5 5 5 5s5-2 5-5h-2c0 1.5-1.5 3-3 3s-3-1.5-3-3H7z"/>',
  armor: '<path d="M12 2L3 5v7c0 5.5 4 10.5 9 12 5-1.5 9-6.5 9-12V5l-9-3zm0 2.5V21c-3-1-6-5-6-9V6.5l6-2z"/>',
  boots: '<path d="M17 4H9v11l-4 4v2h12v-3l-2-2V4z"/>',
  heart: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  swords: '<path d="M11 3l1.17 1.17L3 13.34V15h1.66l9.17-9.17L15 7l-2 2 4 4 2-2 3 3-2 2-3-3-2 2 4 4 2-2 3 3-2 2-3-3-2 2 4 4-2 2-3-3-2 2 1.5 1.5L12 21l-9-9 3-3-3-3 2-2 3 3-2-2 3-3z"/>',
  star: '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
  seal: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
  gloves: '<path d="M18 11V8c0-1.1-.9-2-2-2s-2 .9-2 2v2h-1V8c0-1.1-.9-2-2-2s-2 .9-2 2v3h-1V9c0-1.1-.9-2-2-2s-2 .9-2 2v9c0 3.3 2.7 6 6 6h2c3.3 0 6-2.7 6-6v-4c0-1.1-.9-2-2-2z"/>',
  cloak: '<path d="M12 2L4 5v16l8-2 8 2V5l-8-3zm0 2.5l6 2.2V17l-6-1.5-6 1.5V6.7l6-2.2z"/>',
  potion: '<path d="M16 3H8v2h8V3zm3 6l-3-4H8L5 9v11c0 1 .9 2 2 2h10c1.1 0 2-.9 2-2V9zM15 13H9v2h6v-2z"/>',
  food: '<path d="M12 3c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm-2 11c-0.5 0-1-0.5-1-1s0.5-1 1-1 1 0.5 1 1-0.5 1-1 1zm4-4c-0.5 0-1-0.5-1-1s0.5-1 1-1 1 0.5 1 1-0.5 1-1 1z"/>',
  drink: '<path d="M7 2h10v2h2v14h-2v2H7v-2H5V4h2V2zm8 16V4H9v14h6z"/>',
  herb: '<path d="M17 8c-4 0-5 5-5 5s-1-5-5-5c-4 0-5 5-5 5s5 9 10 9 10-9 10-9-1-5-5-5zm-5 11s-3-3-3-6 3-1 3 0 3 1 3 0-3-3-3-6z"/>',
  intel: '<path d="M18 2H6c-1 0-2 1-2 2v16c0 1 1 2 2 2h12c1 0 2-1 2-2V4c0-1-1-2-2-2zM9 4h2v8l-1-1-1 1V4z"/>',
  tool: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.5 0-8-3.5-8-8s3.5-8 8-8 8 3.5 8 8-3.5 8-8 8zm1-13l-1 5-1-5 1-1 1 1zm-1 14l-1-5 1 5 1-1-1-1z"/>',
  key: '<path d="M12.5 10A6 6 0 1 0 7 18h10v-4h4v-4h2V6H12.6zM7 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>',
  acc: '<path d="M12 2c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0 4c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/>',
  skill: '<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>',
  status: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>',
  scroll: '<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm11 15H4V8h16v11z"/>',
  material: '<path d="M12 3L2 12h3v8h14v-8h3L12 3zM7 18v-7.81l5-4.5 5 4.5V18H7z"/>',
  misc: '<path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 13v9h9v-9H3zm7 7H5v-5h5v5z"/>',
  asset: '<path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm10 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2z"/>',
  quest: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>',
  trophy: '<path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 17.9V21H7v2h10v-2h-4v-3.1c2.08-.28 3.86-1.58 4.61-3.41C20.08 12.18 22 10.3 22 8V7c0-1.1-.9-2-2-2zM5 10V7h2v3c0 1.1-.9 2-2 2s-2-.9-2-2zm14 2c-1.1 0-2-.9-2-2V7h2v3s0 2-2 2z"/>',
  clock: '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.48 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>',
  map: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>',
  wallet: '<path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>',
  list: '<path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>',
  grid: '<path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>',
  arrow: '<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>',
  check: '<path d="M9 16.17L4.83 12l-1.41 1.41L9 19 21 7l-1.41-1.41z"/>',
  nav_protagonist: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>',
  nav_ability: '<path d="M14.59 16.59L13.17 18l-3.59-3.59L6 18l-1.41-1.41L8.17 13 4.59 9.41 6 8l3.59 3.59L13.17 8l1.41 1.41L11 13l3.59 3.59zm6.41-12.59L18 1L1 18l3 3 17-17z"/>',
  nav_bag: '<path d="M17 6V4c0-1.11-.89-2-2-2H9c-1.11 0-2 .89-2 2v2H2v13c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6h-5zM9 4h6v2H9V4zm11 15H4V8h16v11z"/>',
  nav_quests: '<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>',
  nav_mgmt: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.15-.12.2-.33.12-.51l-1.92-3.32c-.12-.17-.33-.24-.51-.18l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.18-.08-.39 0-.51.18L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.15.12-.2.33-.12.51l1.92 3.32c.12.22.33.29.51.18l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.18.08.39 0 .51-.18l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>',
  nav_social: '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>'
};

/**
 * 获取图标 (优先 Iconify, 失败或未指定则回退到本地 SVG 库)
 * @param name 图标名 (若包含 ':' 则视为 Iconify 图标, 如 'mdi:home')
 * @param options 尺寸、颜色、样式等
 * @returns HTML 字符串
 */
export function getSVG(name: string, options: IconOptions = {}): string {
  const size = options.size || 14;
  const color = options.color || 'currentColor';
  const style = options.style || '';

  // 1. 检查是否存在 Iconify 映射
  const iconName = (name && name.includes(':')) ? name : SVG_LIB._icons[name];

  // 2. 如果有映射名且 CDN 可用，优先使用 Iconify
  const isBrowser = typeof window !== 'undefined';
  const hasIconify = isBrowser && (
    typeof (window as any).IconifyIcon !== 'undefined' ||
    (window.customElements && window.customElements.get('iconify-icon'))
  );

  // 自动尝试注入 CDN (如果尚未加载且需要使用 Iconify)
  if (iconName && !hasIconify) {
    initIconifyCDN();
  }

  // 如果已经加载了 Iconify，或者刚刚触发了异步加载，我们都先返回 <iconify-icon> 标签
  // (因为 iconify-icon 是 Web Component，即使脚本稍后加载完成，它也会自动渲染)
  if (iconName) {
    return `<iconify-icon icon="${iconName}" style="font-size:${size}px; color:${color}; ${style}" class="stb-icon"></iconify-icon>`;
  }

  // 3. 回退到本地 SVG 库
  const path = (SVG_LIB as Record<string, any>)[name] || SVG_LIB.misc;
  return `<svg viewBox="0 0 24 24" style="width:${size}px; height:${size}px; fill:${color}; ${style}">${path}</svg>`;
}

/**
 * 根据物品的类型或名称自动匹配合适的图标 Key
 * @param item 物品数据对象
 * @returns 匹配到的图标名称 (key)
 */
export function getItemIcon(item: ItemData | null | undefined): string | null {
  if (!item) return null;
  const type = (item.type || item.类型 || '').toLowerCase();
  const name = (item.name || item.名称 || '').toLowerCase();

  // 1. 细分规则定义
  const rules = [
    { key: 'sword', keywords: ['剑', 'sword', 'katana', '太刀', '打刀', '大剑', '巨剑', '细剑', '刺剑', '弯刀', '佩刀'] },
    { key: 'spear', keywords: ['长枪', 'spear'] },
    { key: 'lance', keywords: ['矛', '枪', 'lance', '长矛', '戟'] },
    { key: 'axe', keywords: ['斧', 'axe', '战斧', '手斧'] },
    { key: 'mace', keywords: ['锤', '钝', 'mace', 'hammer', '棍', '棒'] },
    { key: 'dagger', keywords: ['匕首', '短刃', '刺刀', 'dagger', '短刀'] },
    { key: 'bow', keywords: ['弓', '弩', 'bow', 'crossbow', '弹弓', 'sling'] },
    { key: 'staff', keywords: ['杖', 'staff', 'wand', '魔杖', '法杖'] },
    { key: 'firearm', keywords: ['火枪', '火器', '枪械', '手枪', '步枪', '狙击', 'firearm', 'pistol', 'rifle', 'shotgun'] },
    { key: 'shield', keywords: ['盾', 'shield', '圆盾', '方盾'] },
    { key: 'helmet', keywords: ['头', '盔', '冠', 'helmet'] },
    { key: 'shoulder', keywords: ['肩', 'shoulder'] },
    { key: 'bracer', keywords: ['臂', '护臂', '腕', 'bracer'] },
    { key: 'pants', keywords: ['腿', '裤', '膝', 'pants', 'trousers'] },
    { key: 'armor', keywords: ['甲', '胸', 'armor', 'robe', '法袍', '衫', '衣', '袍'] },
    { key: 'boots', keywords: ['鞋', '靴', 'boots', '足'] },
    { key: 'gloves', keywords: ['手', 'gloves', '护手'] },
    { key: 'cloak', keywords: ['披风', '斗篷', 'cloak'] },
    { key: 'potion', keywords: ['药剂', '药水', 'potion', 'hp', 'mp', '瓶', '剂', '圣水'] },
    { key: 'medicine', keywords: ['药', 'medicine', 'health'] },
    { key: 'fish', keywords: ['鱼', 'fish'] },
    { key: 'meat', keywords: ['肉', 'meat'] },
    { key: 'food', keywords: ['面包', '粮', '饼', 'food', 'bread'] },
    { key: 'blood', keywords: ['血', 'blood'] },
    { key: 'drink', keywords: ['酒', '水', '饮', 'drink', 'ale', 'beer', 'tea', '茶'] },
    { key: 'herb', keywords: ['草', '花', 'herb', 'flower', '叶'] },
    { key: 'intel', keywords: ['书', '卷', '信', '笺', '函', '图', '情报', 'book', 'scroll', 'letter', '笔记', '典', '籍'] },
    { key: 'coin', keywords: ['硬币', '钱币', 'coin'] },
    { key: 'tool', keywords: ['罗盘', '灯', '地图', '时钟', 'compass', 'lantern', 'map', 'clock', '火把'] },
    { key: 'key', keywords: ['匙', '钥匙', 'key'] },
    { key: 'acc', keywords: ['饰', '戒', '项', '坠', '耳', 'acc', 'ring', '项链', '手镯', '戒指'] },
    { key: 'asset', keywords: ['房', '铺', '店', '地产', 'asset'] },
    { key: 'gem', keywords: ['宝石', '晶', '钻', 'gem', 'diamond', 'ruby', 'emerald', 'sapphire'] },
    { key: 'ore', keywords: ['矿', 'ore', 'crystal-growth'] },
    { key: 'material', keywords: ['石', '皮', '金', '银', '铜', '铁', '材料', 'material', 'leather'] }
  ];

  // Rule Step 1: 优先检查 type 字段中的关键词
  for (const rule of rules) {
    if (rule.keywords.some(k => type.includes(k))) return rule.key;
  }
  // Rule Step 2: 其次检查 name 字段中的关键词
  for (const rule of rules) {
    if (rule.keywords.some(k => name.includes(k))) return rule.key;
  }

  // 3. 最后作为保底，匹配 Schema 大类图标
  const schemaFallback: Record<string, string> = {
    '武器': 'sword', 'weapon': 'sword',
    '防具': 'armor', 'armor': 'armor',
    '饰品': 'acc', 'accessory': 'acc',
    '消耗品': 'potion', 'consumable': 'potion',
    '材料': 'material', 'material': 'material',
    '资产': 'asset', 'asset': 'asset',
    '火器': 'firearm', 'firearm': 'firearm',
    '杂物': 'misc', 'misc': 'misc',
    '金钱': 'coin', '货币': 'coin'
  };

  return schemaFallback[type] || null;
}
