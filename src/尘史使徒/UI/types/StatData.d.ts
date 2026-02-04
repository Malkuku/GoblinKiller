export interface StatData {
  "世界": WorldData;
  "角色": RolesData;
  "仓库": Record<string, ItemData>;
  "地图": Record<string, MapNodeData>;
  "世界经济": Record<string, EconomyData>;
  "季节与节日": Record<string, TimeEventData>;
  "势力": Record<string, FactionData>;
  "种族": Record<string, Record<string, string[]>>;
  "主线": Record<string, MainQuestData>;
  "任务": Record<string, TaskData>;
  "事件": Record<string, EventData>;
  "术": Record<string, Record<string, string>>;
  "system": SystemSettings;
}

/**
 * 世界环境数据
 */
export interface WorldData {
  "时间": string;
  "地点": string;
  "季节": string;
  "天气": string;
  "地图索引": string;
  "危险场景": boolean;
}

/**
 * 角色总览
 */
export interface RolesData {
  "user": CharacterData;
  "主要角色": Record<string, CharacterData>;
  "次要角色": Record<string, CharacterData>;
}

/**
 * 角色详细数据
 * 包含玩家(user)和NPC的通用字段，部分字段设为可选以兼容不同角色类型
 */
export interface CharacterData {
  "姓名"?: string;
  "名称检索词"?: string[];
  "区域检索词"?: string[];
  "在场"?: boolean;
  "年龄": string;
  "当前身份": string;
  "当前行动"?: string;
  "当前想法"?: string;
  "当前位置": Coordinates3D;
  "外貌": string[];
  "背景": string[];
  "性格"?: PersonalityData; // 部分次要角色可能只有性格标签
  "性格标签"?: string[]; // 次要角色使用
  "语料"?: Record<string, string[]>;
  "爱好"?: Record<string, string[]>; // 爱好可以是数组，也可以是特定描述
  "人际关系"?: Record<string, RelationshipData>;
  "性经验"?: Record<string, number | string>; // 可能是数字次数，也可能是"与xx共享"的字符串
  "生命状态": LifeStatus;
  "特殊状态": Record<string, SpecialStatusData | string>; // 可能是对象或"与xx共享"
  "特殊能力"?: Record<string, string>;
  "战斗风格"?: string[];
  "术之等级": Record<string, ArtLevelData> | string; // 可能是对象或"与xx共享"
  "物品": Record<string, ItemData | string>; // 可能是对象或"与xx共享"
  "简介"?: string; // 次要角色可能有
}

export interface Coordinates3D {
  "x": number[];
  "y": number[];
  "z": number[];
}

export interface PersonalityData {
  "社交取向": number;
  "决策模式": number;
  "思维倾向": number;
  "人际姿态": number;
  "人性温度": number;
  "性格总结": string[];
}

export interface RelationshipData {
  "信任度": number;
  "好感度": number;
  "浪漫度": number;
  "情欲": number;
  "依赖度": number;
  "熟悉度": number;
  "洞察度": number;
  "影响力": number;
  "责任义务": number;
  "利用价值": number;
  "关系总结": string;
}

export interface LifeStatus {
  "生命力": number;
  "体力": number;
  "精神力": number;
}

export interface SpecialStatusData {
  "描述": string;
  "效果": string;
  "不可移除"?: boolean;
}

export interface ArtLevelData {
  "当前等级": number | string; // 可能是数字或 "密而不宣"
  "累计经验值": number;
  "下一级需求经验": number;
}

export interface ItemData {
  "类型": string;
  "描述": string;
  "作用": string;
  "数量": number;
  "耐久": number;
}

/**
 * 地图数据 (递归结构)
 */
export interface MapNodeData {
  "描述": string;
  "详情": string[];
  "图标": string;
  "方位": {
    "x": number[];
    "y": number[];
    "z": number[];
  };
  "子地图"?: Record<string, MapNodeData>;
}

/**
 * 经济体系
 */
export interface EconomyData {
  "名称检索词": string[];
  "区域检索词": string[];
  "货币体系": Record<string, CurrencyData>;
  "物价": Record<string, string[]>;
  "社会阶层": Record<string, SocialClassData>;
}

export interface CurrencyData {
  "描述": string;
  "价值": number;
}

export interface SocialClassData {
  "平均收入": string;
  "收入来源": string[];
  "典型特征"?: string;
}

/**
 * 季节与节日
 */
export interface TimeEventData {
  "名称检索词": string[];
  "区域检索词": string[];
  "类型": "季节" | "节日" | "会议" | "禁忌";
  "描述": string[];
  "开始日期": string;
  "截止日期": string;
}

/**
 * 势力数据
 */
export interface FactionData {
  "名称检索词": string[];
  "区域检索词": string[];
  "描述": string | string[]; // JSON中有时是字符串，有时是数组
  "详情": string[];
}

/**
 * 主线任务
 */
export interface MainQuestData {
  "描述": string;
  "警惕度"?: number;
  "详细"?: string[];
  "已交融的魂质"?: string[];
}

/**
 * 普通任务
 */
export interface TaskData {
  "描述": string;
  "目标": string;
  "阻碍": string;
  "取得成果": string[];
  "期望奖励": string;
}

/**
 * 事件
 */
export interface EventData {
  "描述": string;
  "作用": string;
  "进度": number;
  "总进度": number;
}

/**
 * 系统设置
 */
export interface SystemSettings {
  "全知视角": boolean;
  "theme": string;
}
