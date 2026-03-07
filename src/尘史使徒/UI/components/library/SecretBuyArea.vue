<template>
  <div class="scroll-area transaction-area">
    <div v-if="Object.keys(displaySecrets).length === 0" class="empty-state">
      <!-- SVG: 卷轴/古籍 (Empty State) -->
      <svg class="svg-icon empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>暂无隐秘线索...</p>
    </div>

    <!-- 添加列表过渡动画 -->
    <TransitionGroup name="card-vanish" tag="div" class="card-grid" v-else>
      <div v-for="(details, name) in displaySecrets" :key="name" class="trade-card secret-card">
        <div class="card-inner">
          <div class="card-top">
            <span class="card-title">{{ name }}</span>
            <span class="icon-badge">
              <!-- SVG: 秘文卷轴 (Mystic Scroll) -->
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                <path d="M9 17h6" />
                <path d="M12 13v1" />
              </svg>
            </span>
          </div>
          <div class="card-mid">
            <p class="desc">"{{ details.描述 }}"</p>
            <div class="divider"></div>
            <p class="effect"><span class="label">线索指向:</span> {{ details.作用 }}</p>

            <!-- 定价理由展示区 -->
            <div class="reason-box" v-if="details.定价理由">
              <div class="reason-title">
                <!-- SVG: 眼睛/洞察 (Risk Assessment) -->
                <svg class="svg-icon small-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                风险评估
              </div>
              <p class="reason-text">{{ details.定价理由 }}</p>
            </div>
          </div>
          <div class="card-action">
            <div class="price-display">
              <!-- SVG: 异质/星芒 (Currency) -->
              <svg class="svg-icon currency-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9L22 12L14.5 15L12 22L9.5 15L2 12L9.5 9Z" />
              </svg>
              {{ details.价格 || 50 }} 异质
            </div>
            <button v-if="pendingCart[name]" class="action-btn cancel-btn" @click="removeFromCart(name)">取消</button>
            <button
              v-else
              class="action-btn buy-btn"
              :disabled="!canAddMore(details.价格 || 50)"
              @click="addToCart(name, details)"
            >
              获取线索
            </button>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- 结算悬浮栏 -->
    <Transition name="fade-up">
      <div class="checkout-bar" v-if="totalCartCount > 0">
        <div class="checkout-info">
          <span class="label">总计</span>
          <span class="value">{{ totalCartCost }} <span class="unit">异质</span></span>
        </div>
        <div class="checkout-actions">
          <button class="action-btn clear-btn" @click="clearCart">清空</button>
          <button class="action-btn confirm-btn" @click="confirmCheckout">确认交易</button>
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
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil';

const props = defineProps({ secretBuys: Object });
const emit = defineEmits(['transaction-complete']);
const showToast = inject('showToast', msg => console.log(msg));
const statStore = useStatStore();

const pendingCart = ref({});
const localHiddenSecrets = ref(new Set()); // 本地临时隐藏已买密传

// 过滤掉本地已隐藏的密传
const displaySecrets = computed(() => {
  const result = {};
  for (const [key, val] of Object.entries(props.secretBuys)) {
    if (!localHiddenSecrets.value.has(key)) {
      result[key] = val;
    }
  }
  return result;
});

const totalCartCount = computed(() => Object.keys(pendingCart.value).length);
const totalCartCost = computed(() => Object.values(pendingCart.value).reduce((sum, item) => sum + (item.details.价格 || 50), 0));
const currentYizhi = computed(() => statStore.stat_data?.角色?.user?.缥缈异质 || 0);

const canAddMore = price => currentYizhi.value - totalCartCost.value >= price;

const addToCart = (name, details) => {
  if (!canAddMore(details.价格 || 50)) { showToast('异质不足'); return; }
  if (!pendingCart.value[name]) pendingCart.value[name] = { details, count: 1 };
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
  if ((user.缥缈异质 || 0) < totalCartCost.value) { showToast('异质不足'); return; }

  const diff = {
    角色: {
      user: {
        缥缈异质: user.缥缈异质 - totalCartCost.value,
        物品: {},
      },
    },
  };

  const userItems = user.物品 || {};
  const occupiedNames = new Set(Object.keys(userItems));
  const acquiredNames = [];
  const boughtKeys = []; // 记录购买的原始Key，用于从商店移除

  for (const [secretName, cartItem] of Object.entries(pendingCart.value)) {
    boughtKeys.push(secretName);
    let finalName = secretName;
    let counter = 1;
    // 如果玩家已有同名物品，则重命名新物品（虽然商店里会移除，但防止背包冲突）
    while (occupiedNames.has(finalName)) { finalName = `${secretName}${counter}`; counter++; }
    occupiedNames.add(finalName);
    acquiredNames.push(finalName);

    diff.角色.user.物品[finalName] = {
      类型: '密传',
      数量: 1,
      耐久: 100,
      描述: cartItem.details.描述 || '一份神秘的记录',
      作用: cartItem.details.作用 || '阅读以获取知识',
    };
  }

  try {
    // 1. 更新玩家数据
    await MvuUtil.updateMvuDataByDiff(diff);

    // 2. 修改世界书：从交易记录中移除已购买的密传
    const entryName = '<图书馆>交易记录';
    const rawText = await WorldInfoUtil.getWorldBookContent([entryName]);

    // 尝试匹配 <SecretBuy> 标签
    const secretBuyRegex = /<SecretBuy>([\s\S]*?)<\/SecretBuy>/;
    const match = rawText.match(secretBuyRegex);

    if (match) {
      let secretData = {};
      try {
        secretData = JSON.parse(match[1]);
      } catch (e) {
        console.error("解析密传交易记录失败", e);
      }

      let hasChange = false;
      boughtKeys.forEach(name => {
        if (secretData[name]) {
          delete secretData[name];
          hasChange = true;
        }
      });

      if (hasChange) {
        const newJsonStr = JSON.stringify(secretData, null, 2);
        const newRawText = rawText.replace(secretBuyRegex, `<SecretBuy>\n${newJsonStr}\n</SecretBuy>`);
        await WorldInfoUtil.updateEntryContent(entryName, newRawText);
      }
    }

    // 3. UI 反馈与日志
    showToast(`成功购买 ${totalCartCount.value} 份密传`);

    // 立即在本地隐藏，触发消失动画
    boughtKeys.forEach(name => localHiddenSecrets.value.add(name));

    const vagueDesc = getVagueYizhiDesc(totalCartCost.value);
    const namesStr = acquiredNames.map(n => `【${n}】`).join('、');
    const logText = `\n<systemLog>\n<user>散去了${vagueDesc}。随着异质的流失，隐秘的知识在现实中凝结，你获得了密传线索：${namesStr}。原本记录它们的虚影已消散无踪。\n</systemLog>\n`;
    const lastMsgId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
    await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');

    clearCart();
    emit('transaction-complete');
  } catch (e) {
    console.error(e);
    showToast('购买失败');
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

/* 通用 SVG 样式 */
.svg-icon { width: 1.2em; height: 1.2em; vertical-align: text-bottom; display: inline-block; }
.small-icon { width: 1em; height: 1em; margin-right: 4px; vertical-align: -0.15em; }

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.3s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(20px); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #555; font-family: 'Cinzel', serif; }
.empty-icon { width: 4rem; height: 4rem; margin-bottom: 15px; opacity: 0.5; }

.secret-card {
  background: linear-gradient(145deg, #1a1a1a, #111);
  border: 1px solid #333;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  width: 100%; /* 确保在Grid中占满单元格 */
}
.secret-card:hover { border-color: #9c27b0; transform: translateY(-2px); }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
.card-title { font-family: 'Cinzel', serif; font-weight: 700; color: #e1bee7; font-size: 1.1rem; }
.icon-badge { color: #e1bee7; display: flex; align-items: center; }

.desc { font-style: italic; color: #888; font-size: 0.9rem; margin-bottom: 8px; }
.divider { height: 1px; background: rgba(255,255,255,0.05); margin: 8px 0; }
.effect { font-size: 0.85rem; color: #ccc; }
.effect .label { color: #ce93d8; opacity: 0.8; }

/* 定价理由 */
.reason-box { margin-top: 12px; background: rgba(0, 0, 0, 0.3); border-left: 2px solid #9c27b0; padding: 8px 10px; border-radius: 0 4px 4px 0; }
.reason-title { font-size: 0.7rem; color: #9c27b0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: bold; display: flex; align-items: center; }
.reason-text { font-size: 0.8rem; color: #999; line-height: 1.3; }

.card-action { margin-top: 15px; display: flex; justify-content: space-between; align-items: center; }
.price-display { color: #e1bee7; font-weight: bold; font-family: 'Cinzel', serif; display: flex; align-items: center; gap: 4px; }
.currency-icon { color: #9c27b0; width: 14px; height: 14px; }

.action-btn { padding: 6px 18px; border: 1px solid #9c27b0; background: transparent; color: #e1bee7; font-family: 'Cinzel', serif; font-weight: bold; cursor: pointer; transition: all 0.2s; }
.action-btn:hover:not(:disabled) { background: #9c27b0; color: #fff; box-shadow: 0 0 10px rgba(156, 39, 176, 0.4); }
.action-btn:disabled { border-color: #444; color: #555; cursor: not-allowed; }
.cancel-btn { border-color: #d32f2f; color: #ef5350; }
.cancel-btn:hover { background: #d32f2f; color: #fff; }

.checkout-bar { position: sticky; bottom: 0; background: rgba(15, 15, 15, 0.95); border-top: 1px solid #9c27b0; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; box-shadow: 0 -5px 20px rgba(0,0,0,0.5); z-index: 10; }
.checkout-info .label { color: #888; font-size: 0.9rem; margin-right: 10px; }
.checkout-info .value { color: #e1bee7; font-size: 1.2rem; font-family: 'Cinzel', serif; font-weight: bold; }
.checkout-info .unit { font-size: 0.8rem; color: #666; }
.confirm-btn { background: #7b1fa2; color: #fff; border: none; padding: 8px 24px; font-weight: bold; font-family: 'Cinzel', serif; }
.confirm-btn:hover { background: #8e24aa; }
.clear-btn { background: #333; color: #aaa; border: none; margin-right: 10px; }
</style>
