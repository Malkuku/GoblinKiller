export const ScenariosMetadata = [
  {
    id: 'satiated',
    name: '餮足之人',
    worldBookEntry: '<剧本>餮足之人',
    isReady: true,
    theme: 'theme-cup',
    desc: `扮演一位“多情”的兄长，用谎言与真实喂养妹妹。\n然而饥饿永无餮止，迷雾中的困惑尚未解开。\n行走于城市之间，要当心阴影中狩猎异类的眼睛......`,
    iconPath: `
      <path fill="currentColor" d="M18 8 C18 8, 16 32, 32 32 C48 32, 46 8, 46 8 H18 Z" opacity="0.8"/>
      <path fill="none" stroke="currentColor" stroke-width="3" d="M32 32 V 52 M20 52 H44"/>
      <ellipse cx="32" cy="12" rx="12" ry="3" fill="rgba(255,0,0,0.3)"/>
    `
  },
  {
    id: 'lantern',
    name: '辉光学徒',
    worldBookEntry: '<剧本>辉光学徒',
    isReady: true,
    theme: 'theme-lamp',
    desc: '真理往往伴随着灼烧双目的光芒。你提着灯笼，行走在理智与疯狂的边缘。',
    iconPath: `
      <path fill="none" stroke="currentColor" stroke-width="3" d="M22 16 L18 48 L46 48 L42 16 Z"/>
      <path fill="none" stroke="currentColor" stroke-width="3" d="M22 16 L32 6 L42 16"/>
      <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.8"/>
      <line x1="32" y1="6" x2="32" y2="2" stroke="currentColor" stroke-width="3"/>
    `
  },
  {
    id: 'folly',
    name: '虚妄愚行',
    worldBookEntry: '<剧本>虚妄愚行',
    isReady: true,
    theme: 'theme-moth',
    desc: '如同飞蛾扑火，我们在混乱中寻求某种不存在的答案。你被困在命运的网中。',
    iconPath: `
      <path fill="none" stroke="currentColor" stroke-width="2" d="M32 32 L32 2 M32 32 L60 18 M32 32 L54 56 M32 32 L10 56 M32 32 L4 18"/>
      <path fill="none" stroke="currentColor" stroke-width="1.5" d="M26 12 Q32 16 38 12 M48 24 Q42 32 46 42 M20 48 Q32 40 44 48 M12 30 Q20 32 26 12" opacity="0.6"/>
      <circle cx="32" cy="32" r="4" fill="currentColor"/>
    `
  },
  {
    id: 'forgotten',
    name: '被遗忘者',
    worldBookEntry: '<剧本>被遗忘者',
    isReady: true,
    theme: 'theme-forgotten',
    desc: '镜中映出的不再是完整的面容。你已被世界遗忘，唯有破碎的记忆指引前路。',
    iconPath: `
      <path fill="none" stroke="currentColor" stroke-width="3" d="M16 8 H48 V56 H16 Z"/>
      <path fill="currentColor" d="M16 8 L30 20 L25 35 L40 30 L48 56 L48 8 Z" opacity="0.3"/>
      <path fill="none" stroke="currentColor" stroke-width="1" d="M20 12 L35 28 L28 40 L44 36"/>
    `
  },
  {
    id: 'homecoming',
    name: '长路归乡',
    worldBookEntry: '<剧本>长路归乡',
    isReady: false,
    theme: 'theme-winter',
    desc: '寒风呼啸，背包里装着仅剩的温暖。这是一场漫长的告别，也是归乡的旅途。',
    iconPath: `
      <rect x="18" y="14" width="28" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
      <path fill="none" stroke="currentColor" stroke-width="3" d="M18 24 H46 M28 14 V10 C28 8 36 8 36 10 V14"/>
      <rect x="22" y="32" width="8" height="10" fill="currentColor" opacity="0.5"/>
      <rect x="34" y="32" width="8" height="10" fill="currentColor" opacity="0.5"/>
    `
  }
];
