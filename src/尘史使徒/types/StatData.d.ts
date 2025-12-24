/**
 * 辅助 Interface：定义术的等级描述数据结构
 * @description 存储不同“术”在各个等级解锁的文本描述。
 * - 第一层键是术的中文名，如 "灯", "铸"。
 * - 第二层键是等级阈值（字符串形式），如 "5", "10"。
 * - 值为该等级解锁的描述文本数组。
 */
interface ArtLevelDescriptions {
  [artName: string]: {
    [level: string]: string;
  };
}

/**
 * 辅助 Interface：定义一个主要角色的完整数据结构
 */
interface MainCharacter {
  "当前身份": string;
  "生命状态": {
    "生命力": number;
    "体力": number;
    "精神力": number;
  };
  "特殊状态": {
    // 动态键，例如 "印记:瞥见真实" 或 "魂质:道成肉红身"
    [key: string]: {
      "描述": string;
      "效果": string;
      "不可移除": boolean;
    };
  };
  "术之等级": {
    // 动态键，例如 "灯", "铸", "刃" 等八大准则
    [key: string]: {
      "当前等级": number;
      "累计经验值": number;
      "下一级需求经验": number;
    };
  };
  "人物关系": {
    // 动态键，例如 "莉莉丝", "白尘女士"
    [key: string]: {
      "情感纽带": {
        "信任度": number;
        "好感度": number;
        "情欲": number;
        "依赖度": number;
      };
      "认知与了解": {
        "熟悉度": number;
        "洞察度": number;
        "可预测度": number;
      };
      "社交与功利链接": {
        "影响力": number;
        "责任义务": number;
        "利用价值": number;
      };
      "关系总结": string;
    };
  };
  "当前想法": string;
}

/**
 * 辅助 Interface：定义一个次要角色的数据结构 (基于 $template)
 */
interface MinorCharacter {
  "简介":"",
  "生命状态": {
    "生命力": number;
    "体力": number;
    "精神力": number;
  };
  "特殊状态": {
    // 结构未知，根据模板是空对象，但可能动态添加
    [key: string]: any;
  };
  "术之等级": {
    // 结构未知，根据模板是空对象，但可能动态添加
    [key: string]: any;
  };
  "隐藏": boolean;
}

/**
 * 辅助 Interface：定义一个主线任务的数据结构
 */
interface MainQuest {
  "描述": string;
  // "已交融的魂质" 仅在特定任务中存在，因此设为可选
  "已交融的魂质"?: {
    [key: string]: boolean;
  };
}

/**
 * 核心 Interface：StatData
 * 严格按照 ERA初始化.json 的结构和字段进行定义
 */
export interface StatData {
  "世界": {
    "日期": string;
    "地点": string;
    "时间": string;
    "当前人物": string;
    "$meta": {
      "necessary": "all";
    };
  };
  "角色": {
    "主要角色": {
      // 动态键，例如 "user", "莉莉丝"
      [key: string]: MainCharacter;
    };
    "次要角色": {
      // 动态键，例如 "$template" 和其他次要角色名
      [key: string]: MinorCharacter;
    };
    "已出场角色": {
      // 动态键，例如 "user", "莉莉丝"
      [key: string]: boolean;
    };
  };
  "器具": {
    // 动态键，例如 "白蛾戒指"
    [key: string]: {
      "描述": string;
      "作用": string;
      "耐久":number;
    };
  };
  "主线": {
    // 动态键，例如 "诱惑：存续"
    [key: string]: MainQuest;
  };
  "支线": {
    // 动态键，例如 "$template" 和其他支线任务名
    [key: string]: {
      "描述": string;
      "目标": string;
      "大敌": string;
      "敌人的目标": string;
      "敌人的行动": string;
      "进度": number;
      "需要进度": number;
      "目前成果": string;
    };
  };
  "术": ArtLevelDescriptions;
  "全知视角":boolean,
  "theme": string;
}
