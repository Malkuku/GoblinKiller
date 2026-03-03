/**
 * 密教模拟器风格 - 属性计算系统
 * v2.0 - 引入主副性相衰减机制
 */

// ==========================================
// 1. 类型定义
// ==========================================

export type Aspect =
  | 'Lantern' | 'Forge' | 'Edge' | 'Winter'
  | 'Heart' | 'Grail' | 'Moth' | 'Knock';

export type Attribute =
  | 'Life' | 'Stamina' | 'Spirit'
  | 'Strength' | 'Agility' | 'Wisdom' | 'Charisma';

export type CharacterLevels = Partial<Record<Aspect, number>>;
export type AttributeResult = Record<Attribute, number>;

// ==========================================
// 2. 核心配置常量
// ==========================================

const BASE_VALUE_POOL = 100;
const BASE_VALUE_STAT = 10;

/**
 * 阶位倍率表 (M) - 微调版
 * 稍微拉高了高阶位的倍率，确保等级压制的基础。
 */
const TIER_MULTIPLIERS = {
  MORTAL: 0.25,    // Lv 1-9   (原 0.2)
  ASCENDANT: 0.6,  // Lv 10-13 (原 0.5)
  INHUMAN: 1.0,    // Lv 14-18 (原 0.8，整数倍率更直观)
  DIVINE: 2.0      // Lv 19+   (原 1.5，神性应当强大)
};

/**
 * 性相优先级权重
 * 当提供的加成数值相等时，优先级高的占据主槽位。
 * 顺序：灯 < 铸 < 刃 < 冬 < 心 < 杯 < 蛾 < 启
 * (数值越大优先级越高)
 */
const ASPECT_PRIORITY: Record<Aspect, number> = {
  Lantern: 1,
  Forge: 2,
  Edge: 3,
  Winter: 4,
  Heart: 5,
  Grail: 6,
  Moth: 7,
  Knock: 8
};

/**
 * 性相修正系数矩阵 (保持不变)
 */
const ASPECT_COEFFICIENTS: Record<Attribute, Record<Aspect, number>> = {
  Life: { Heart: 6.0, Winter: 4.5, Forge: 4.0, Grail: 3.5, Edge: 2.5, Moth: 1.5, Knock: 1.5, Lantern: 1.0 },
  Stamina: { Forge: 6.0, Heart: 5.0, Edge: 3.5, Grail: 2.5, Winter: 2.0, Moth: 1.5, Knock: 1.0, Lantern: 1.0 },
  Spirit: { Lantern: 6.0, Winter: 5.0, Knock: 4.5, Moth: 3.5, Heart: 2.5, Forge: 1.5, Edge: 1.5, Grail: 1.0 },
  Strength: { Forge: 2.5, Edge: 2.2, Grail: 1.5, Heart: 1.2, Winter: 0.8, Knock: 0.6, Moth: 0.6, Lantern: 0.4 },
  Agility: { Moth: 2.5, Edge: 2.2, Knock: 1.8, Grail: 1.2, Lantern: 1.0, Heart: 0.8, Forge: 0.6, Winter: 0.4 },
  Wisdom: { Lantern: 2.5, Knock: 2.3, Moth: 1.6, Winter: 1.4, Forge: 1.2, Heart: 0.8, Edge: 0.8, Grail: 0.6 },
  Charisma: { Grail: 2.5, Heart: 2.0, Moth: 1.8, Lantern: 1.5, Knock: 1.2, Edge: 1.0, Forge: 0.5, Winter: 0.1 }
};

// ==========================================
// 3. 计算逻辑函数
// ==========================================

function getTierMultiplier(level: number): number {
  if (level <= 0) return 0;
  if (level <= 9) return TIER_MULTIPLIERS.MORTAL;
  if (level <= 13) return TIER_MULTIPLIERS.ASCENDANT;
  if (level <= 18) return TIER_MULTIPLIERS.INHUMAN;
  return TIER_MULTIPLIERS.DIVINE;
}

/**
 * 计算单个性相的效能 P(L)
 * 公式: P(L) = (L^2) * M
 */
function calculateAspectPower(level: number): number {
  const multiplier = getTierMultiplier(level);
  return Math.pow(level, 2) * multiplier;
}

/**
 * 计算角色的完整属性面板
 * 规则：
 * 1. 计算所有性相对该属性的原始加成值。
 * 2. 排序：数值大的优先；数值相同时，按 ASPECT_PRIORITY 排序。
 * 3. 衰减累加：第1名 100%，第2名 50%，其余 20%。
 */
export function calculateCharacterAttributes(levels: CharacterLevels): AttributeResult {
  const result: AttributeResult = {
    Life: BASE_VALUE_POOL, Stamina: BASE_VALUE_POOL, Spirit: BASE_VALUE_POOL,
    Strength: BASE_VALUE_STAT, Agility: BASE_VALUE_STAT, Wisdom: BASE_VALUE_STAT, Charisma: BASE_VALUE_STAT
  };

  // 1. 预计算所有活跃性相的 Power
  const aspectPowers: Partial<Record<Aspect, number>> = {};
  for (const aspectKey in levels) {
    const aspect = aspectKey as Aspect;
    const level = levels[aspect] || 0;
    if (level > 0) {
      aspectPowers[aspect] = calculateAspectPower(level);
    }
  }

  // 2. 遍历每个属性进行计算
  for (const attrKey in result) {
    const attribute = attrKey as Attribute;

    // 收集该属性下所有性相提供的原始加成 (Raw Bonus)
    const bonusSources: { aspect: Aspect; value: number }[] = [];

    for (const aspectKey in aspectPowers) {
      const aspect = aspectKey as Aspect;
      const power = aspectPowers[aspect]!;
      const coefficient = ASPECT_COEFFICIENTS[attribute][aspect] || 0;

      if (coefficient > 0) {
        bonusSources.push({
          aspect: aspect,
          value: power * coefficient
        });
      }
    }

    // 排序逻辑：
    // 1. 数值高的排前面
    // 2. 数值相等，优先级高的排前面 (Knock > ... > Lantern)
    bonusSources.sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value;
      }
      return ASPECT_PRIORITY[b.aspect] - ASPECT_PRIORITY[a.aspect];
    });

    // 衰减累加逻辑
    let totalBonus = 0;
    bonusSources.forEach((source, index) => {
      let weight = 0.3; // 默认权重 (第3名及以后)

      if (index === 0) weight = 1.0;      // 第1名：100%
      else if (index === 1) weight = 0.6; // 第2名：60%

      totalBonus += source.value * weight;
    });

    result[attribute] += totalBonus;

    result[attribute] = Math.round(result[attribute]);
  }

  return result;
}
