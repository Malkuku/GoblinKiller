<template>
  <div class="scroll-area transaction-area">
    <div v-if="Object.keys(itemSells).length === 0" class="empty-state">
      <!-- SVG: 天平 (Empty State) -->
      <svg class="svg-icon empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 3V10M12 10L16 6M12 10L8 6M3 12H9L6 18L3 12ZM15 12H21L18 18L15 12ZM10 5H14" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 21C12 21 7 21 7 18M12 21C12 21 17 21 17 18" stroke-linecap="round"/>
      </svg>
      <p>暂无收购需求...</p>
    </div>
    <div v-else class="card-grid">
      <div v-for="(details, name) in itemSells" :key="name" class="trade-card item-card">
        <div class="card-inner">
          <div class="card-top">
            <span class="card-title">{{ name }}</span>
            <span class="price-badge">
              <!-- SVG: 异质/星芒 (Currency) -->
              <svg class="svg-icon currency-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9L22 12L14.5 15L12 22L9.5 15L2 12L9.5 9Z" />
              </svg>
              {{ details.单价 }}
            </span>
          </div>

          <div class="card-mid">
            <p class="meta">
              <span class="type-tag" :class="getUserAssetInfo(name).type">
                {{ getUserAssetInfo(name).type === 'skill' ? '技能' : '物品' }}
              </span>
              {{ details.类型 }}
            </p>

            <p class="inventory-check" :class="{ 'has-item': getUserAssetInfo(name).count > 0 }">
              <template v-if="getUserAssetInfo(name).type === 'skill'">
                <span v-if="getUserAssetInfo(name).count > 0" class="icon-text-align">
                   <!-- SVG: 实心星 (Learned) -->
                   <svg class="svg-icon small-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                   已习得
                </span>
                <span v-else>未习得</span>
              </template>
              <template v-else>
                库存: {{ getUserAssetInfo(name).count }}
              </template>
            </p>

            <!-- 定价理由展示区 -->
            <div class="reason-box" v-if="details.定价理由">
              <div class="reason-title">
                <!-- SVG: 鉴定/天平 (Reason) -->
                <svg class="svg-icon small-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M7 6v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6M12 3v3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                鉴定报告
              </div>
              <p class="reason-text">{{ details.定价理由 }}</p>
            </div>
          </div>

          <div class="card-action">
            <div class="cart-controls" v-if="pendingCart[name]">
              <button class="ctrl-btn" @click="removeFromCart(name)">-</button>
              <span class="count">{{ pendingCart[name].count }}</span>
              <button class="ctrl-btn" :disabled="!canSellMore(name)" @click="addToCart(name, details)">+</button>
            </div>
            <button v-else class="action-btn sell-btn" :disabled="!canSellMore(name)" @click="addToCart(name, details)">
              {{ getSellButtonText(name) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 结算悬浮栏 -->
    <Transition name="fade-up">
      <div class="checkout-bar" v-if="totalCartCount > 0">
        <div class="checkout-info">
          <span class="label">出售 {{ totalCartCount }} 项</span>
          <span class="value">+{{ totalCartEarn }} <span class="unit">异质</span></span>
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

const props = defineProps({ itemSells: Object });
const showToast = inject('showToast', msg => console.log(msg));
const statStore = useStatStore();

const pendingCart = ref({});

const totalCartCount = computed(() => Object.values(pendingCart.value).reduce((sum, item) => sum + item.count, 0));
const totalCartEarn = computed(() => Object.values(pendingCart.value).reduce((sum, item) => sum + item.count * (item.details.单价 || 0), 0));

const getUserAssetInfo = (name) => {
  const user = statStore.stat_data?.角色?.user;
  if (!user) return { count: 0, type: 'none', data: null };
  if (user.物品 && user.物品[name]) return { count: user.物品[name].数量 || 0, type: 'item', data: user.物品[name] };
  if (user.技能 && user.技能[name]) return { count: 1, type: 'skill', data: user.技能[name] };
  return { count: 0, type: 'none', data: null };
};

const canSellMore = itemName => {
  const info = getUserAssetInfo(itemName);
  const owned = info.count;
  const pending = pendingCart.value[itemName]?.count || 0;
  return owned > pending;
};

const getSellButtonText = (name) => {
  const info = getUserAssetInfo(name);
  if (info.count <= 0) return '未持有';
  if (info.type === 'skill') return '遗忘并出售';
  return '出售';
};

const addToCart = (name, details) => {
  if (!canSellMore(name)) { showToast('持有数量不足'); return; }
  if (!pendingCart.value[name]) pendingCart.value[name] = { details, count: 0 };
  pendingCart.value[name].count++;
};

const removeFromCart = name => {
  if (pendingCart.value[name]) {
    pendingCart.value[name].count--;
    if (pendingCart.value[name].count <= 0) delete pendingCart.value[name];
  }
};

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
  let totalEarn = 0;
  const soldLogItems = [];

  for (const [itemName, cartItem] of Object.entries(pendingCart.value)) {
    totalEarn += cartItem.count * (cartItem.details.单价 || 0);
  }

  const diff = {
    角色: {
      user: {
        缥缈异质: (user.缥缈异质 || 0) + totalEarn,
        物品: {},
        技能: {}
      },
    },
  };

  for (const [itemName, cartItem] of Object.entries(pendingCart.value)) {
    const assetInfo = getUserAssetInfo(itemName);
    const sellCount = cartItem.count;

    if (assetInfo.type === 'item') {
      const remainCount = assetInfo.count - sellCount;
      diff.角色.user.物品[itemName] = remainCount > 0 ? { ...assetInfo.data, 数量: remainCount } : null;
      soldLogItems.push(`${itemName}x${sellCount}`);
    } else if (assetInfo.type === 'skill') {
      diff.角色.user.技能[itemName] = null;
      soldLogItems.push(`[技]${itemName}`);
    }
  }

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`交易完成，获得 ${totalEarn} 异质`);
    const vagueDesc = getVagueYizhiDesc(totalEarn);
    const namesStr = soldLogItems.join('、');
    const logText = `\n<systemLog>\n<user>将${namesStr}投入了未知的虚空。作为交换，你失去了它们，但从中汲取了${vagueDesc}。\n</systemLog>\n`;
    const lastMsgId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
    await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');
    clearCart();
  } catch (e) {
    showToast('交易失败');
  }
};
</script>

<style scoped>
/* 通用 SVG 样式 */
.svg-icon { width: 1.2em; height: 1.2em; vertical-align: text-bottom; display: inline-block; }
.small-icon { width: 1em; height: 1em; margin-right: 4px; vertical-align: -0.15em; }
.icon-text-align { display: inline-flex; align-items: center; }

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.3s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(20px); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #555; font-family: 'Cinzel', serif; }
.empty-icon { width: 4rem; height: 4rem; margin-bottom: 15px; opacity: 0.5; }

.item-card {
  background: linear-gradient(145deg, #1a1a1a, #111);
  border: 1px solid #333;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  transition: all 0.2s;
}
.item-card:hover { border-color: #4caf50; transform: translateY(-2px); }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
.card-title { font-family: 'Cinzel', serif; font-weight: bold; color: #e0e0e0; font-size: 1.1rem; }
.price-badge { color: var(--c-gold); font-weight: bold; font-family: 'Cinzel', serif; display: flex; align-items: center; gap: 4px; }
.currency-icon { color: var(--c-gold); width: 14px; height: 14px; }

.meta { font-size: 0.85rem; color: #888; margin-bottom: 5px; }
.type-tag { font-size: 0.75em; padding: 1px 5px; border-radius: 2px; margin-right: 6px; text-transform: uppercase; }
.type-tag.skill { background: rgba(74, 59, 105, 0.3); color: #d8b4fe; border: 1px solid rgba(107, 76, 154, 0.5); }
.type-tag.item { background: rgba(46, 125, 50, 0.2); color: #a5d6a7; border: 1px solid rgba(76, 175, 80, 0.3); }

.inventory-check { font-size: 0.8rem; color: #555; margin-bottom: 10px; }
.inventory-check.has-item { color: #81c784; }

/* 定价理由样式复用 */
.reason-box { margin-top: 10px; background: rgba(0, 0, 0, 0.3); border-left: 2px solid #4caf50; padding: 8px 10px; border-radius: 0 4px 4px 0; }
.reason-title { font-size: 0.7rem; color: #4caf50; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: bold; display: flex; align-items: center; }
.reason-text { font-size: 0.8rem; color: #999; line-height: 1.3; }

.card-action { margin-top: 15px; display: flex; justify-content: flex-end; }
.sell-btn { width: 100%; background: #2e7d32; color: white; border: none; padding: 6px 0; font-family: 'Cinzel', serif; cursor: pointer; transition: all 0.2s; }
.sell-btn:hover:not(:disabled) { background: #388e3c; box-shadow: 0 0 10px rgba(76, 175, 80, 0.4); }
.sell-btn:disabled { background: #1b1b1b; color: #444; cursor: not-allowed; border: 1px solid #333; }

.cart-controls { display: flex; align-items: center; gap: 8px; width: 100%; justify-content: space-between; }
.ctrl-btn { width: 30px; height: 30px; background: #333; border: 1px solid #555; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.ctrl-btn:hover:not(:disabled) { background: #444; border-color: #888; }
.count { font-weight: bold; color: var(--c-gold); font-family: 'Cinzel', serif; }

.checkout-bar { position: sticky; bottom: 0; background: rgba(15, 15, 15, 0.95); border-top: 1px solid #333; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; box-shadow: 0 -5px 20px rgba(0,0,0,0.5); z-index: 10; }
.checkout-info .label { color: #888; font-size: 0.9rem; margin-right: 10px; }
.checkout-info .value { color: #4caf50; font-size: 1.2rem; font-family: 'Cinzel', serif; font-weight: bold; }
.checkout-info .unit { font-size: 0.8rem; color: #666; }
.confirm-btn { background: #2e7d32; color: white; border: none; padding: 8px 24px; font-weight: bold; font-family: 'Cinzel', serif; cursor: pointer; }
.confirm-btn:hover { background: #388e3c; }
.clear-btn { background: #333; color: #aaa; border: none; margin-right: 10px; padding: 8px 16px; cursor: pointer; }
</style>
