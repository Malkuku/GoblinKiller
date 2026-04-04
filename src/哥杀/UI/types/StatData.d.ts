// 自动生成的类型定义文件，基于 Zod Schema

/** 物品基础类型 */
export interface ItemBase {
  "name": string;
  "type": string;
  "tier": string;
  "part": string;
  "description": string;
  "hands": string;
  "special_effects": Record<string, string>;
  "quantity": number;
  "armor_value": number;
}

/** 物品类型（可为 '待初始化' 字符串） */
export type Item = ItemBase | "待初始化";

/** 货币结构 */
export interface Money {
  "金币": number;
  "银币": number;
  "铜币": number;
}

/** 背包结构 */
export interface Inventory {
  "武器": Record<string, Item>;
  "防具": Record<string, Item>;
  "饰品": Record<string, Item>;
  "消耗品": Record<string, Item>;
  "材料": Record<string, Item>;
  "杂物": Record<string, Item>;
  "金钱": Money;
}

/** 资源（生命值、魔力值等） */
export interface Resource {
  "当前值": number | null;
  "最大值": number | null;
}

/** 七维历练进度 */
export interface Progress {
  "力量": number;
  "敏捷": number;
  "感知": number;
  "知识": number;
  "魅力": number;
  "魔力": number;
  "信仰力": number;
}

/** 快照条目值类型 */
export type SnapshotValue = string | { "效果": number; "时间": string };

/** 快照结构 */
export type Snapshot = Record<string, SnapshotValue>;

/** 装备分类（武器、防具、饰品） */
export interface Equipment {
  "武器": Record<string, Item>;
  "防具": Record<string, Item>;
  "饰品": Record<string, Item>;
}

/** 公会信息 */
export interface GuildInfo {
  "所属公会": string;
  "公会阶级": string;
  "贡献度": string | number;
}

/** 性档案 */
export interface SexProfile {
  "私处叙述": string;
  "阴道结构叙述": string;
  "情动特征": string;
  "性事熟悉度": Record<string, string>;
  "技巧评价": string;
  "对主角心意": string;
  "通用性癖好": string;
  "私密偏好": string;
}

/** 职业等级信息 */
export interface ClassLevel {
  "当前等级": number;
  "最大等级": number;
  "当前经验": number;
  "升级所需": number;
}

/** 进行中任务 */
export interface ActiveQuest {
  "类型": string;
  "当前目标": string;
  "进度说明": string;
  "奖励预览": string;
}

/** 已完成任务 */
export interface CompletedQuest {
  "完成评价": string;
  "获得奖励": string;
}

/** 任务日志 */
export interface QuestLog {
  "进行中": Record<string, ActiveQuest>;
  "已完成": Record<string, CompletedQuest>;
}

/** 角色共有能力属性 */
export interface AbilityScores {
  "力量": number;
  "敏捷": number;
  "感知": number;
  "知识": number;
  "魅力": number;
  "魔力": number;
  "信仰力": number;
}

/** 世界信息 */
export interface WorldInfo {
  "当前时间": string;
  "世界动向": string;
  "城市趣闻": string;
  "冒险逸闻": string;
  "当前活动阶段": string;
  "活动表单": Record<string, { "介绍": string } | "待初始化">;
}

/** 主角（玩家）完整信息 */
export interface PlayerCharacter {
  "姓名": string;
  "所在地": string | null;
  "层级": string; // 经过 normalizeRelationTier 标准化
  "职业": Record<string, ClassLevel>;
  "经验等级": number;
  "技能点": number;
  "种族": string | null;
  "能力": AbilityScores;
  "生命值": Resource;
  "护甲值": Resource;
  "魔力值": Resource;
  "信仰力值": Resource;
  "体力值": Resource;
  "资源快照": Snapshot;
  "历练进度": Progress;
  "装备": Equipment;
  "技能列表": Record<string, any>;
  "资产": Record<string, any>;
  "当前状态": Record<string, any>;
  "任务日志": QuestLog;
  "背包": Inventory;
  "公会信息": GuildInfo;
}

/** 关系角色（NPC/同伴） */
export interface RelationCharacter {
  "姓名": string;
  "职业": Record<string, ClassLevel>;
  "职业等级": number;
  "种族": string;
  "is_companion": boolean;
  "在场": boolean;
  "能力": AbilityScores;
  "装备": Equipment;
  "背包": Inventory;
  "技能列表": Record<string, any>;
  "生命值": Resource;
  "护甲值": Resource;
  "魔力值": Resource;
  "信仰力值": Resource;
  "体力值": Resource;
  "资源快照": Snapshot;
  "公会信息": GuildInfo;
  "身份背景": string;
  "性格标签": Record<string, boolean>;
  "外貌": string;
  "称呼": string;
  "与主角关系": string;
  "层级": string; // 经过 normalizeRelationTier 标准化
  "历练进度": Progress;
  "性档案": SexProfile;
  "所处地点": string;
  "小简历": string | Record<string, string>;
  "屏蔽": boolean;
}

/** 关系列表中的值可以是完整的角色对象或 '待初始化' 字符串 */
export type RelationEntry = RelationCharacter | "待初始化";

/** 宠物信息 */
export interface Pet {
  "品类": string;
  "内在": string;
  "外在": string;
  "评价": string;
  "词条": Record<string, any>;
  "装备": Record<string, any>;
}

/** 敌人信息 */
export interface Enemy {
  "类型": string;
  "生命值": Resource;
  "护甲值": Resource;
  "能力": Record<string, number>;
  "备注": string;
}

/** 敌人列表中的值可以是完整敌人对象或 '待初始化' 字符串 */
export type EnemyEntry = Enemy | "待初始化";

/** 顶层数据结构 */
export interface StatData {
  "世界": WorldInfo;
  "主角": PlayerCharacter;
  "关系列表": Record<string, RelationEntry>;
  "宠物": Record<string, Pet>;
  "敌人列表": Record<string, EnemyEntry>;
}
