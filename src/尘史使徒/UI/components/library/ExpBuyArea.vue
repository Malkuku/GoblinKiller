<template>
  <div class="scroll-area transaction-area arts-container">

    <!-- 统一结算控制台 (当有待消耗异质时显示) -->
    <div class="settlement-bar" v-if="totalPendingCost > 0">
      <div class="settlement-info">
        <span>当前拥有异质: <span class="val-base">{{ userHeterogeneity }}</span></span>
        <span>本次将消耗: <span class="val-cost">-{{ totalPendingCost }}</span></span>
        <span>结算后剩余: <span class="val-remain">{{ remainingHeterogeneity }}</span></span>
      </div>
      <div class="settlement-actions">
        <button class="btn-reset" @click="resetPending">重置</button>
        <button class="btn-confirm" @click="confirmSettlement">确认灌注</button>
      </div>
    </div>

    <div class="arts-grid">
      <!-- 遍历所有固定的术 (使用包含预览数据的 projectedArts) -->
      <div v-for="(data, artName) in projectedArts" :key="artName" class="art-card" :class="getAspectClass(artName)">

        <!-- 头部：图标、名称、等级 -->
        <div class="art-header">
          <div class="art-title-group">
            <span class="art-icon" v-html="getAspectIcon(artName)"></span>
            <strong class="art-name">{{ artName }}</strong>
          </div>
          <div class="art-meta">
            <span class="art-level-badge">
              Lv.{{ data.baseLevel }}
              <!-- 如果预览等级提升，则高亮显示新等级 -->
              <span v-if="data.等级 > data.baseLevel" class="text-upgrade"> ➔ {{ data.等级 }}</span>
            </span>
          </div>
        </div>

        <!-- 主体：经验信息与描述 -->
        <div class="art-body">
          <p class="art-desc" v-if="data.baseLevel === 0">尚未入门，无法凭空感悟</p>
          <p class="art-desc" v-else-if="data.等级 >= 19">已触及神性，凡物不可度量</p>
          <template v-else>
            <div class="art-details">
              <div class="detail-row">
                <span class="label">经验:</span>
                <span class="value">
                  {{ Math.floor(data.baseExp) }}
                  <!-- 显示本次待增加的经验 -->
                  <span v-if="pendingExp[artName] > 0" class="text-upgrade"> +{{ pendingExp[artName] }}</span>
                  / {{ getRequiredExp(data.等级) }}
                </span>
              </div>
              <div class="detail-row cost">
                <span class="label">距下级:</span>
                <span class="value">{{ getExpNeeded(data.等级, data.经验) }} 经验 (需 {{ getExpNeeded(data.等级, data.经验) * 5 }} 异质)</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 底部：操作按钮 (将经验加入待处理队列) -->
        <div class="art-action">
          <div v-if="data.baseLevel > 0 && data.等级 < 19" class="buy-controls">
            <button
              class="action-btn buy-btn"
              @click="queueExp(artName, 10)"
              :disabled="remainingHeterogeneity < 50"
              title="消耗 50 异质"
            >
              +10 经验
            </button>
            <button
              class="action-btn buy-btn"
              @click="queueExp(artName, 100)"
              :disabled="remainingHeterogeneity < 500"
              title="消耗 500 异质"
            >
              +100 经验
            </button>
            <button
              class="action-btn buy-btn highlight"
              @click="queueNextLevel(artName)"
              :disabled="remainingHeterogeneity < getExpNeeded(data.等级, data.经验) * 5 || getExpNeeded(data.等级, data.经验) === 0"
              title="消耗所需异质直接升至下一级"
            >
              升至下级
            </button>
          </div>
          <div v-else class="buy-controls">
            <button class="action-btn buy-btn disabled-btn" disabled>无法灌注</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { MvuUtil } from '@/Utils/MvuUtil';
import { MessageUtil } from '@/Utils/MessageUtil';

const showToast = inject('showToast', (msg) => console.log(msg));
const statStore = useStatStore();

// 固定的所有术的列表
const ALL_ARTS = ["灯", "铸", "刃", "冬", "心", "杯", "蛾", "启"];

// 获取玩家的基础数据
const userArts = computed(() => statStore.stat_data?.角色?.user?.术之等级 || {});
const userHeterogeneity = computed(() => statStore.stat_data?.角色?.user?.缥缈异质 || 0);

// 待处理的经验队列 { "灯": 0, "铸": 100, ... }
const pendingExp = ref(Object.fromEntries(ALL_ARTS.map(art => [art, 0])));

// 计算升级所需经验
const getRequiredExp = (level) => {
  if (level <= 0) return Infinity;
  if (level >= 1 && level <= 13) return level * 200;
  if (level >= 14 && level <= 18) return Math.pow(level, 2) * 500;
  return Infinity; // 19级及以上
};

// 计算距离下一级还差多少经验
const getExpNeeded = (level, currentExp) => {
  const req = getRequiredExp(level);
  if (req === Infinity) return 0;
  return Math.max(0, req - (currentExp || 0));
};

// 计算包含待处理经验后的【预览数据】
const projectedArts = computed(() => {
  const result = {};
  ALL_ARTS.forEach(art => {
    const baseData = userArts.value[art] || { 等级: 0, 经验: 0 };
    const baseLevel = baseData.等级 || 0;
    const baseExp = baseData.经验 || 0;
    const addedExp = pendingExp.value[art] || 0;

    let level = baseLevel;
    let exp = baseExp + addedExp;

    // 模拟升级过程
    while (level > 0 && level < 19 && exp >= getRequiredExp(level)) {
      exp -= getRequiredExp(level);
      level++;
    }

    result[art] = {
      baseLevel,
      baseExp,
      等级: level,
      经验: exp
    };
  });
  return result;
});

// 计算待消耗的总异质
const totalPendingCost = computed(() => {
  return Object.values(pendingExp.value).reduce((sum, exp) => sum + exp * 5, 0);
});

// 计算结算后的剩余异质
const remainingHeterogeneity = computed(() => {
  return Math.max(0, userHeterogeneity.value - totalPendingCost.value);
});

// 将经验加入待处理队列
const queueExp = (artName, amount) => {
  const cost = amount * 5;
  if (remainingHeterogeneity.value < cost) {
    showToast("剩余缥缈异质不足！");
    return;
  }

  const proj = projectedArts.value[artName];
  if (proj.baseLevel === 0) {
    showToast("0级无法通过异质提升！");
    return;
  }
  if (proj.等级 >= 19) {
    showToast("已达秘而不宣之境！");
    return;
  }

  pendingExp.value[artName] += amount;
};

// 快捷加入升至下一级所需的经验
const queueNextLevel = (artName) => {
  const proj = projectedArts.value[artName];
  const needed = getExpNeeded(proj.等级, proj.经验);
  if (needed > 0) {
    queueExp(artName, needed);
  }
};

// 重置待处理队列
const resetPending = () => {
  ALL_ARTS.forEach(art => pendingExp.value[art] = 0);
};

// 确认结算并写入数据库
const confirmSettlement = async () => {
  if (totalPendingCost.value === 0) return;

  const diff = {
    角色: {
      user: {
        缥缈异质: userHeterogeneity.value - totalPendingCost.value,
        术之等级: {}
      }
    }
  };

  let logDetails = [];

  ALL_ARTS.forEach(art => {
    if (pendingExp.value[art] > 0) {
      const proj = projectedArts.value[art];
      diff.角色.user.术之等级[art] = {
        经验: proj.经验
      };

      let logStr = `【${art}】(+${pendingExp.value[art]}经验)`;
      if (proj.等级 > proj.baseLevel) {
        diff.角色.user.术之等级[art].等级 = proj.等级;
        logStr = `【${art}】(突破至 Lv.${proj.等级})`;
      }
      logDetails.push(logStr);
    }
  });

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`成功消耗 ${totalPendingCost.value} 异质进行灌注！`);

    // 写入交易日志
    const logText = `\n<user>将缥缈异质注入了灵魂深处，加深了对术的感悟：${logDetails.join('，')}。\n`;
    let lastMsgId = -1;
    if (typeof getLastMessageId === 'function') {
      lastMsgId = getLastMessageId();
    }
    await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');


    // 清空队列并刷新
    resetPending();
    setTimeout(() => statStore.initData(), 200);
  } catch (e) {
    showToast("灌注失败，请重试");
    console.error(e);
  }
};

// --- UI 辅助方法 ---
const getAspectIcon = (aspect) => {
  const baseSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="aspect-svg">`;
  const icons = {
    '刃': `${baseSvg}<path d="M12 2v20M9 7l3-4 3 4M8 11h8"/></svg>`,
    '杯': `${baseSvg}<path d="M7 3h10M7 3v4c0 3 2.5 5.5 5 5.5s5-2.5 5-5V3M12 12.5V21M8 21h8M12 7v.01"/></svg>`,
    '铸': `${baseSvg}<path d="M12 22c4.4 0 8-3.6 8-8 0-5-4-9-8-12-4 3-8 7-8 12 0 4.4 3.6 8 8 8z"/><path d="M12 22c-2 0-3.5-1.5-3.5-3.5 0-2.5 2-4.5 3.5-6.5 1.5 2 3.5 4 3.5 6.5 0 2-1.5 3.5-3.5 3.5z"/></svg>`,
    '蛾': `${baseSvg}<path d="M12 22v-6M12 16c-4 0-8-2-8-8 0-4 3-6 8-6s8 2 8 6c0 6-4 8-8 8z"/><path d="M12 16c-2 0-4-1-4-4 0-2 1.5-3 4-3s4 1 4 3c0 3-2 4-4 4z"/></svg>`,
    '心': `${baseSvg}<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M12 15l-3-3 1.5-1.5L12 12l3-3 1.5 1.5-4.5 4.5z"/></svg>`,
    '灯': `${baseSvg}<path d="M12 2L2 12l10 10 10-10L12 2z"/><circle cx="12" cy="12" r="3"/><path d="M12 9v.01M12 15v.01"/></svg>`,
    '冬': `${baseSvg}<path d="M21 7.5V16.5L13.5 21H10.5L3 16.5V7.5L10.5 3H13.5L21 7.5Z"/><path d="M12 3v18M3 7.5l18 9M3 16.5l18-9"/></svg>`,
    '启': `${baseSvg}<circle cx="12" cy="9" r="4"/><path d="M10.5 12.5L9 21h6l-1.5-8.5"/></svg>`
  };
  return icons[aspect] || `${baseSvg}<path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>`;
};

const getAspectClass = (aspect) => {
  const map = {
    '刃': 'aspect-edge', '杯': 'aspect-grail', '铸': 'aspect-forge', '蛾': 'aspect-moth',
    '心': 'aspect-heart', '灯': 'aspect-lantern', '冬': 'aspect-winter', '启': 'aspect-knock'
  };
  return map[aspect] || 'aspect-generic';
};
</script>

<style scoped>
.arts-container {
  width: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 10px;
  position: relative;
}

/* --- 统一结算控制台样式 --- */
.settlement-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(20, 20, 22, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 213, 79, 0.3);
  border-radius: 4px;
  padding: 12px 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
}

.settlement-info {
  display: flex;
  gap: 20px;
  font-size: 0.95rem;
  color: #e8e8e8;
}

.val-base { color: #81c784; font-weight: bold; }
.val-cost { color: #e57373; font-weight: bold; }
.val-remain { color: #64b5f6; font-weight: bold; }

.settlement-actions {
  display: flex;
  gap: 10px;
}

.btn-confirm {
  background: rgba(255, 213, 79, 0.15);
  color: #fff9c4;
  border: 1px solid rgba(255, 213, 79, 0.4);
  padding: 6px 16px;
  border-radius: 3px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}
.btn-confirm:hover { background: rgba(255, 213, 79, 0.3); }

.btn-reset {
  background: rgba(229, 115, 115, 0.1);
  color: #ffcdd2;
  border: 1px solid rgba(229, 115, 115, 0.3);
  padding: 6px 16px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-reset:hover { background: rgba(229, 115, 115, 0.2); }

/* --- 升级高亮文本 --- */
.text-upgrade {
  color: #4fc3f7;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(79, 195, 247, 0.4);
}

/* --- 卡片网格：强制一排四个 --- */
.arts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 卡片基础样式 */
.art-card {
  background: rgba(20, 20, 22, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.art-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 头部样式 */
.art-header {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.art-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.art-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.art-name {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1.15rem;
  color: #e8e8e8;
  letter-spacing: 1px;
  font-weight: 500;
}

.art-meta {
  display: flex;
  gap: 6px;
  font-size: 0.75rem;
}

.art-level-badge {
  background: rgba(255, 255, 255, 0.1);
  color: #ddd;
  padding: 2px 6px;
  border-radius: 2px;
  font-family: monospace;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 内容区域 */
.art-body {
  padding: 12px 14px;
  font-size: 0.9rem;
  color: #bbb;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
}

.art-desc {
  margin: 0;
  line-height: 1.5;
  font-style: italic;
  color: #888;
  text-align: center;
  padding: 10px 0;
}

.art-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 2px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.detail-row {
  display: flex;
  align-items: baseline;
  line-height: 1.4;
}

.detail-row .label {
  flex-shrink: 0;
  width: 55px;
  font-weight: 600;
  margin-right: 6px;
  opacity: 0.7;
  font-size: 0.85rem;
  color: #ffd54f;
}

.detail-row.cost .label { color: #e57373; }
.detail-row.cost .value { color: #ffcdd2; font-weight: bold; }

/* 底部操作区 */
.art-action {
  padding: 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
}

.buy-controls {
  display: flex;
  gap: 8px;
  width: 100%;
}

.action-btn {
  flex: 1;
  padding: 8px 4px;
  font-size: 0.75rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ddd;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.action-btn.highlight {
  background: rgba(229, 115, 115, 0.1);
  border-color: rgba(229, 115, 115, 0.3);
  color: #ffcdd2;
}

.action-btn.highlight:hover:not(:disabled) {
  background: rgba(229, 115, 115, 0.2);
  border-color: rgba(229, 115, 115, 0.5);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.disabled-btn {
  background: transparent;
  border-style: dashed;
}

/* --- 性相配色方案 --- */
.aspect-edge { border-top: 2px solid #2a2a2a; }
.aspect-edge .art-header { background: linear-gradient(90deg, rgba(42, 42, 42, 0.15), transparent); }
.aspect-edge .art-icon { color: #4a4a4a; filter: drop-shadow(0 0 4px rgba(74, 74, 74, 0.5)); }

.aspect-grail { border-top: 2px solid #d32f2f; }
.aspect-grail .art-header { background: linear-gradient(90deg, rgba(211, 47, 47, 0.15), transparent); }
.aspect-grail .art-icon { color: #e57373; filter: drop-shadow(0 0 4px rgba(229, 115, 115, 0.5)); }

.aspect-forge { border-top: 2px solid #f57c00; }
.aspect-forge .art-header { background: linear-gradient(90deg, rgba(245, 124, 0, 0.15), transparent); }
.aspect-forge .art-icon { color: #ffb74d; filter: drop-shadow(0 0 4px rgba(255, 183, 77, 0.5)); }

.aspect-moth { border-top: 2px solid #a1887f; }
.aspect-moth .art-header { background: linear-gradient(90deg, rgba(161, 136, 127, 0.15), transparent); }
.aspect-moth .art-icon { color: #d7ccc8; filter: drop-shadow(0 0 4px rgba(215, 204, 200, 0.5)); }

.aspect-heart { border-top: 2px solid #c2185b; }
.aspect-heart .art-header { background: linear-gradient(90deg, rgba(194, 24, 91, 0.15), transparent); }
.aspect-heart .art-icon { color: #f06292; filter: drop-shadow(0 0 4px rgba(240, 98, 146, 0.5)); }

.aspect-lantern { border-top: 2px solid #fbc02d; }
.aspect-lantern .art-header { background: linear-gradient(90deg, rgba(251, 192, 45, 0.15), transparent); }
.aspect-lantern .art-icon { color: #fff59d; filter: drop-shadow(0 0 4px rgba(255, 245, 157, 0.5)); }

.aspect-winter { border-top: 2px solid #78909c; }
.aspect-winter .art-header { background: linear-gradient(90deg, rgba(120, 144, 156, 0.15), transparent); }
.aspect-winter .art-icon { color: #cfd8dc; filter: drop-shadow(0 0 4px rgba(207, 216, 220, 0.5)); }

.aspect-knock { border-top: 2px solid #7b1fa2; }
.aspect-knock .art-header { background: linear-gradient(90deg, rgba(123, 31, 162, 0.15), transparent); }
.aspect-knock .art-icon { color: #ce93d8; filter: drop-shadow(0 0 4px rgba(206, 147, 216, 0.5)); }

.aspect-generic { border-top: 2px solid #777; }
.aspect-generic .art-icon { color: #ccc; }
</style>
