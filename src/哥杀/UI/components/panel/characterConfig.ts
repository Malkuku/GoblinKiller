// characterConfig.ts

export interface CharacterConfig {
  fixedName: string;    // 显示的固定名称
  keywords: string[];   // 匹配关键词
  avatarUrl?: string;   // 头像文件名（拼接到基础URL）
  color: string;        // 基础主题色
  cssClass: string;     // 专属CSS特效类名
}

export const characterList: CharacterConfig[] = [
  // {
  //   fixedName: '“阿莉娅”',
  //   keywords: ['阿莉娅', '987'],
  //   avatarUrl: '头像/987.webp',
  //   color: '#E0E0E0',
  //   cssClass: 'char-aliya' // 机械银+血肉红辉光
  // },
  // {
  //   fixedName: '莉莉丝·维尔薇拉',
  //   keywords: ['莉莉丝', '维尔薇拉'],
  //   avatarUrl: '头像/莉莉丝.webp',
  //   color: '#D32F2F', // 血红色 (提升了明度以适应暗背景)
  //   cssClass: 'char-lilith'
  // },
  // {
  //   fixedName: '“白尘女士”',
  //   keywords: ['白尘'],
  //   avatarUrl: '头像/白尘女士.webp',
  //   color: '#F4F4FA',
  //   cssClass: 'char-whitedust' // 空灵幽白
  // },
  // {
  //   fixedName: '露娜·菲诺尔',
  //   keywords: ['露娜', '菲诺尔'],
  //   avatarUrl: '头像/露娜.webp',
  //   color: '#FFD700',
  //   cssClass: 'char-luna' // 灯相耀金
  // },
  // {
  //   fixedName: '希尔·菲诺尔',
  //   keywords: ['希尔'],
  //   avatarUrl: '头像/希尔.webp',
  //   color: '#A8B9CC', // 清冷银蓝 (第二人格的冷酷感)
  //   cssClass: 'char-hill'
  // },
  // {
  //   fixedName: '风信子',
  //   keywords: ['风信子'],
  //   avatarUrl: '头像/风信子.webp',
  //   color: '#AEEEEE',
  //   cssClass: 'char-hyacinth' // 冬相冰蓝
  // },
  // {
  //   fixedName: '芙洛拉·菲尼克斯',
  //   keywords: ['芙洛拉'],
  //   avatarUrl: '头像/芙洛拉.webp',
  //   color: '#FFB6C1',
  //   cssClass: 'char-flora' // 旺盛生命粉
  // },
  // {
  //   fixedName: '赫卡蒂娅·布雷肯',
  //   keywords: ['赫卡蒂娅'],
  //   avatarUrl: '头像/赫卡蒂娅.webp',
  //   color: '#FF4500',
  //   cssClass: 'char-hecate' // 锻炉炽红
  // },
  // {
  //   fixedName: '琪拉·多多',
  //   keywords: ['琪拉'],
  //   avatarUrl: '头像/琪拉.webp',
  //   color: '#A9B0B3', // 刀刃黑灰色 (使用亮灰保证可读性)
  //   cssClass: 'char-kira'
  // },
  // {
  //   fixedName: '伊莲娜·维斯',
  //   keywords: ['伊莲娜'],
  //   avatarUrl: '头像/伊莲娜.webp',
  //   color: '#AB47BC', // 纯粹的紫色
  //   cssClass: 'char-elena'
  // },
  // {
  //   fixedName: '艾希莉娅·冯·卡尔米拉',
  //   keywords: ['艾希莉娅'],
  //   avatarUrl: '头像/艾希莉娅.webp',
  //   color: '#8E24AA', // 深邃的黑紫色 (通过发光补偿亮度)
  //   cssClass: 'char-ashlia'
  // },
  // {
  //   fixedName: '奥萝拉·德·布埃尔',
  //   keywords: ['奥萝拉'],
  //   avatarUrl: '头像/奥萝拉.webp',
  //   color: '#DAA520',
  //   cssClass: 'char-aurora' // 王权暗金
  // },
  // {
  //   fixedName: '苏璃',
  //   keywords: ['苏璃'],
  //   avatarUrl: '头像/苏璃.webp',
  //   color: '#FF7043', // 赤金/火红色
  //   cssClass: 'char-suri'
  // },
  // {
  //   fixedName: '“颂歌”',
  //   keywords: ['颂歌'],
  //   avatarUrl: '头像/颂歌.webp',
  //   color: '#B08D6A', // 咖啡棕色 (拿铁色调，保证暗背景下清晰)
  //   cssClass: 'char-ode'
  // }
];

const BASE_URL = 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/';

export function getCharacterInfo(name: string) {
  for (const char of characterList) {
    if (char.keywords.some(kw => name.includes(kw))) {
      return {
        fixedName: char.fixedName,
        avatarUrl: char.avatarUrl ? `${BASE_URL}${char.avatarUrl}` : null,
        color: char.color,
        cssClass: char.cssClass
      };
    }
  }
  return {
    fixedName: name,
    avatarUrl: null,
    color: '#C9B485',
    cssClass: 'char-default'
  };
}
