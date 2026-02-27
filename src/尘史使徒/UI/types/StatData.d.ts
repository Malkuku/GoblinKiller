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
  "user": UserCharacterData;
  "主要角色": Record<string, MainCharacterData>;
  "次要角色": Record<string, MinorCharacterData>;
}

/**
 * =================================================
 * 1. User (玩家) 专属数据结构
 * =================================================
 */
export interface UserCharacterData {
  "年龄": string;
  "当前身份": string;
  "当前行动"?: string;
  "当前想法"?: string;
  "外貌": string[];
  "背景": string[];
  "金钱": number;
  "生命状态": LifeStatus;
  "特殊状态": Record<string, SpecialStatusData>;
  "术之等级": Record<string, ArtLevelData>;
  "性格": PersonalityData;
  "语料": Record<string, string[]>;
  "物品": Record<string, ItemData>;
  "人际关系": Record<string, RelationshipData>;
  "性经验": Record<string, number>;
}

/**
 * =================================================
 * 2. 主要角色 (Main Character) 数据结构
 * =================================================
 */
export interface MainCharacterData {
  "姓名": string;
  "名称检索词": string[];
  "区域检索词": string[];
  "在场": boolean;
  "年龄": string;
  "当前身份": string;
  "当前想法": string;
  "外貌": string[];
  "外貌概括"?: string;
  "背景": string[];
  "战斗风格"?: string[];

  "生命状态": LifeStatus;
  "特殊状态": Record<string, SpecialStatusData>;
  "术之等级": Record<string, ArtLevelData>;

  "性格": PersonalityData;
  "语料": Record<string, string[]>;
  "物品"?: Record<string, ItemData>;
  "人际关系": Record<string, RelationshipData>;
  "性经验": Record<string, number>;
}

/**
 * =================================================
 * 3. 次要角色 (Minor Character) 数据结构
 * =================================================
 */
export interface MinorCharacterData {
  "姓名": string;
  "名称检索词": string[];
  "区域检索词": string[];
  "生命状态": LifeStatus;
  "特殊状态": Record<string, SpecialStatusData>;
  "在场": boolean;
  "简介": string;
  "性格标签": string[];
  "术之等级": Record<string, ArtLevelData>;
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
  "好感度": number;
  "浪漫度": number;
  "情欲": number;
  "依赖度": number;
  "熟悉度": number;
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
  "当前等级": number | string;
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
  "名称检索词"?: string[]; // 新增
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
  "货币体系": Record<string, string>; // 结构变更: 值变为描述字符串
  "物价": Record<string, string[]>;
  "平均收入": Record<string, string>; // 新增: 替代原社会阶层
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
  "描述": string; // 变更: 统一为字符串
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
  "进度": string;
}

/**
 * 系统设置
 */
export interface SystemSettings {
  "关注角色列表":{
    "主要角色": string[];
    "次要角色": string[];
  },
  "当前版本":number;
  "当前剧本":string;
  "插图模式":"男性"|"女性";
  "玩家插图"?: number;
  "叙事节奏"?: "轻松奇幻" | "诡秘现实" | string;
}
