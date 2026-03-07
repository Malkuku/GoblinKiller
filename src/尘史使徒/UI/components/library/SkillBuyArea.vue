<template>
  <div class="scroll-area transaction-area">
    <div v-if="Object.keys(displaySkills).length === 0" class="empty-state">
      <span class="empty-icon">✧</span>
      <p>虚空之中暂无回响...</p>
    </div>

    <!-- 添加列表过渡动画 -->
    <TransitionGroup name="card-vanish" tag="div" class="card-grid" v-else>
      <div v-for="(details, name) in displaySkills" :key="name" class="trade-card skill-card">
        <div class="card-inner">
          <div class="card-top">
            <span class="card-title">{{ name }}</span>
            <span class="level-badge">Lv.{{ details.技能等级 }}</span>
          </div>

          <div class="card-mid">
            <div class="tags">
              <span class="tag aspect">{{ details.性相 }}</span>
              <span class="tag cost">消耗: {{ details.消耗 }}</span>
            </div>
            <p class="desc">"{{ details.描述 }}"</p>
            <div class="divider"></div>
            <p class="effect"><span class="label">效果:</span> {{ details.作用 }}</p>

            <!-- 新增：定价理由展示区 -->
            <div class="reason-box" v-if="details.定价理由">
              <div class="reason-title">⚖️ 价值评估</div>
              <p class="reason-text">{{ details.定价理由 }}</p>
            </div>
          </div>

          <div class="card-action">
            <div class="price-display">
              <span class="currency-icon">✦</span> {{ details.价格 || 100 }} 异质
            </div>
            <button v-if="pendingCart[name]" class="action-btn cancel-btn" @click="removeFromCart(name)">取消</button>
            <button
              v-else
              class="action-btn buy-btn"
              :disabled="hasSkill(name) || !canAddMore(details.价格 || 100)"
              @click="addToCart(name, details)"
            >
              {{ hasSkill(name) ? '已刻印' : '契约' }}
            </button>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- 结算悬浮栏 -->
    <Transition name="fade-up">
      <div class="checkout-bar" v-if="totalCartCount > 0">
        <div class="checkout-info">
          <span class="label">代价总计</span>
          <span class="value">{{ totalCartCost }} <span class="unit">异质</span></span>
        </div>
        <div class="checkout-actions">
          <button class="action-btn clear-btn" @click="clearCart">清空</button>
          <button class="action-btn confirm-btn" @click="confirmCheckout">确认交割</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { MvuUtil } from '@/Utils/MvuUtil';
import { MessageUtil } from '@/Utils/MessageUtil';
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil'; // 引入世界书工具

const props = defineProps({ skillBuys: Object });
const emit = defineEmits(['transaction-complete']); // 通知父组件刷新
const showToast = inject('showToast', msg => console.log(msg));
const statStore = useStatStore();

const pendingCart = ref({});
const localHiddenSkills = ref(new Set()); // 本地临时隐藏已买技能，实现即时动画

// 过滤掉本地已隐藏的技能
const displaySkills = computed(() => {
  const result = {};
  for (const [key, val] of Object.entries(props.skillBuys)) {
    if (!localHiddenSkills.value.has(key)) {
      result[key] = val;
    }
  }
  return result;
});

const totalCartCount = computed(() => Object.keys(pendingCart.value).length);
const totalCartCost = computed(() => {
  return Object.values(pendingCart.value).reduce((sum, item) => sum + (item.details.价格 || 100), 0);
});

const currentYizhi = computed(() => statStore.stat_data?.角色?.user?.缥缈异质 || 0);

const hasSkill = skillName => {
  const skills = statStore.stat_data?.角色?.user?.技能 || {};
  return !!skills[skillName];
};

const canAddMore = price => {
  return currentYizhi.value - totalCartCost.value >= price;
};

const addToCart = (name, details) => {
  if (hasSkill(name)) { showToast('该技艺已铭刻于灵魂'); return; }
  if (!canAddMore(details.价格 || 100)) { showToast('异质不足以支付代价'); return; }
  pendingCart.value[name] = { details };
};

const removeFromCart = name => delete pendingCart.value[name];
const clearCart = () => pendingCart.value = {};

const getVagueYizhiDesc = amount => {
  if (amount <= 20) return '些许微弱的异质';
  if (amount <= 60) return '一缕缥缈的异质';
  if (amount <= 150) return '一团氤氲的异质';
  return '一股涌动的浓郁异质';
};

const confirmCheckout = async () => {
  if (totalCartCount.value === 0) return;
  if (!statStore.stat_data) return;

  const user = statStore.stat_data.角色.user;
  if ((user.缥缈异质 || 0) < totalCartCost.value) {
    showToast('异质不足');
    return;
  }

  // 1. 准备玩家数据更新
  const diff = {
    角色: {
      user: {
        缥缈异质: user.缥缈异质 - totalCartCost.value,
        技能: {},
      },
    },
  };

  const acquiredNames = [];
  for (const [skillName, cartItem] of Object.entries(pendingCart.value)) {
    acquiredNames.push(skillName);
    diff.角色.user.技能[skillName] = {
      性相: cartItem.details.性相 || '无',
      技能等级: cartItem.details.技能等级 || 1,
      描述: cartItem.details.描述 || '',
      消耗: cartItem.details.消耗 || '',
      作用: cartItem.details.作用 || '',
    };
  }

  try {
    // 2. 执行玩家数据更新
    await MvuUtil.updateMvuDataByDiff(diff);

    // 3. 修改世界书：从交易记录中移除已购买的技能
    const entryName = '<图书馆>交易记录';
    const rawText = await WorldInfoUtil.getWorldBookContent([entryName]);

    // 正则匹配 <SkillBuy> 标签内容
    const skillBuyRegex = /<SkillBuy>([\s\S]*?)<\/SkillBuy>/;
    const match = rawText.match(skillBuyRegex);

    if (match) {
      let skillData = {};
      try {
        skillData = JSON.parse(match[1]);
      } catch (e) {
        console.error("解析交易记录失败", e);
      }

      // 从数据中删除已买技能
      let hasChange = false;
      acquiredNames.forEach(name => {
        if (skillData[name]) {
          delete skillData[name];
          hasChange = true;
        }
      });

      if (hasChange) {
        const newJsonStr = JSON.stringify(skillData, null, 2);
        const newRawText = rawText.replace(skillBuyRegex, `<SkillBuy>\n${newJsonStr}\n</SkillBuy>`);
        await WorldInfoUtil.updateEntryContent(entryName, newRawText);
      }
    }

    // 4. UI 反馈与日志
    showToast(`成功习得 ${acquiredNames.length} 项禁忌知识`);

    // 立即在本地隐藏，触发消失动画
    acquiredNames.forEach(name => localHiddenSkills.value.add(name));

    const vagueDesc = getVagueYizhiDesc(totalCartCost.value);
    const namesStr = acquiredNames.map(n => `【${n}】`).join('、');
    const logText = `\n<systemLog>\n<user>献出了${vagueDesc}。随着契约的达成，${namesStr}的知识化作流光钻入你的脑海，原本记载它们的书页在虚空中燃烧殆尽。\n</systemLog>\n`;
    const lastMsgId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
    await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');

    clearCart();
    emit('transaction-complete'); // 通知父组件重新拉取数据

  } catch (e) {
    console.error(e);
    showToast('交易中断：虚空回应了错误');
  }
};
</script>

<style scoped>
/* 动画：卡片消失 */
.card-vanish-move,
.card-vanish-enter-active,
.card-vanish-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-vanish-enter-from,
.card-vanish-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
  filter: blur(5px);
}
.card-vanish-leave-active {
  position: absolute; /* 确保移除时不占位，平滑过渡 */
}

/* 动画：底部栏 */
.fade-up-enter-active, .fade-up-leave-active { transition: all 0.3s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(20px); }

/* 样式重写 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #555;
  font-family: 'Cinzel', serif;
}
.empty-icon { font-size: 3rem; color: #333; margin-bottom: 10px; }

.skill-card {
  position: relative;
  background: linear-gradient(145deg, #1a1a1a, #111);
  border: 1px solid #333;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  overflow: hidden;
}
.skill-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--c-gold), transparent);
  opacity: 0.5;
}
.skill-card:hover {
  border-color: var(--c-gold-dim);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(212, 175, 55, 0.1);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 8px;
}
.card-title {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  color: var(--c-gold);
  font-size: 1.1rem;
  text-shadow: 0 0 5px rgba(212, 175, 55, 0.3);
}
.level-badge {
  font-size: 0.75rem;
  background: #2a2a2a;
  color: #888;
  padding: 2px 6px;
  border-radius: 2px;
  border: 1px solid #444;
}

.tags { display: flex; gap: 6px; margin-bottom: 10px; }
.tag {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tag.aspect { background: rgba(74, 59, 105, 0.3); color: #d8b4fe; border: 1px solid rgba(107, 76, 154, 0.5); }
.tag.cost { background: rgba(105, 59, 59, 0.3); color: #fca5a5; border: 1px solid rgba(154, 76, 76, 0.5); }

.desc { font-style: italic; color: #888; font-size: 0.9rem; line-height: 1.4; margin-bottom: 8px; }
.divider { height: 1px; background: rgba(255,255,255,0.05); margin: 8px 0; }
.effect { font-size: 0.85rem; color: #ccc; line-height: 1.4; }
.effect .label { color: var(--c-gold-light); opacity: 0.8; }

/* 定价理由样式 */
.reason-box {
  margin-top: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 2px solid var(--c-gold-dim);
  padding: 8px 10px;
  border-radius: 0 4px 4px 0;
}
.reason-title {
  font-size: 0.7rem;
  color: var(--c-gold-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
  font-weight: bold;
}
.reason-text {
  font-size: 0.8rem;
  color: #999;
  line-height: 1.3;
  font-family: 'Lato', sans-serif;
}

.card-action {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price-display { color: var(--c-gold-light); font-weight: bold; font-family: 'Cinzel', serif; }
.currency-icon { color: var(--c-gold); margin-right: 4px; }

.action-btn {
  padding: 6px 18px;
  border: 1px solid var(--c-gold);
  background: transparent;
  color: var(--c-gold);
  font-family: 'Cinzel', serif;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-size: 0.8rem;
}
.action-btn:hover:not(:disabled) {
  background: var(--c-gold);
  color: #000;
  box-shadow: 0 0 10px var(--c-gold-dim);
}
.action-btn:disabled {
  border-color: #444;
  color: #555;
  cursor: not-allowed;
}
.cancel-btn { border-color: #d32f2f; color: #ef5350; }
.cancel-btn:hover { background: #d32f2f; color: #fff; }

.checkout-bar {
  position: sticky;
  bottom: 0;
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--c-gold-dim);
  padding: 15px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  box-shadow: 0 -5px 20px rgba(0,0,0,0.5);
  z-index: 10;
}
.checkout-info .label { color: #888; font-size: 0.9rem; margin-right: 10px; }
.checkout-info .value { color: var(--c-gold); font-size: 1.2rem; font-family: 'Cinzel', serif; font-weight: bold; }
.checkout-info .unit { font-size: 0.8rem; color: #666; }

.confirm-btn {
  background: var(--c-gold);
  color: #000;
  border: none;
  padding: 8px 24px;
  font-weight: bold;
  font-family: 'Cinzel', serif;
}
.confirm-btn:hover { background: #eec95e; box-shadow: 0 0 15px rgba(212, 175, 55, 0.4); }
.clear-btn { background: #333; color: #aaa; border: none; margin-right: 10px; }
.clear-btn:hover { background: #444; color: #fff; }
</style>
