<template>
  <div class="shop-container">
    <header class="shop-header">
      <h2 class="shop-title">交易</h2>
      <div class="shop-divider"></div>
      <!-- 显示玩家当前资产 -->
      <div class="player-wealth">
        <span class="wealth-label">当前持有:</span>
        <span class="wealth-value">{{ formatCurrencyFromObject(playerMoneyObj) }}</span>
      </div>
    </header>

    <transition-group v-if="hasData" name="list" tag="div" class="items-grid">
      <div
        v-for="(item, name) in shopData"
        :key="name"
        class="item-card"
        :class="[
          item['方向'] === '出售' ? 'type-sell' : 'type-buy',
          { 'is-disabled': item['方向'] === '购买' && !canAffordItem(name as string) }
        ]"
      >
        <div class="card-header">
          <span class="item-name">{{ name }}</span>
          <span class="item-badge">{{ item['方向'] }}</span>
        </div>

        <div class="card-body">
          <p class="item-desc">{{ item['描述'] }}</p>
          <div class="item-stats">
            <span v-if="item['作用']">效果: {{ item['作用'] }}</span>
            <span v-if="item['最大耐久']">耐久: {{ item['最大耐久'] }}</span>
          </div>
        </div>

        <div class="card-footer">
          <!-- 价格显示 -->
          <div class="price-display">
            <span class="price-label">单价:</span>
            <span class="currency-text" v-html="formatPriceToHtml(item['价格'])"></span>
          </div>

          <div class="action-controls">
            <button
              class="ctrl-btn minus"
              :disabled="!cart[name]"
              @click="updateCart(name as string, -1)"
            >-</button>
            <span class="qty">{{ cart[name] || 0 }}</span>
            <button
              class="ctrl-btn plus"
              :disabled="isAddDisabled(name as string, item)"
              @click="updateCart(name as string, 1)"
            >+</button>
          </div>
        </div>
      </div>
    </transition-group>

    <div v-else class="empty-state">
      <p>暂无交易信息...</p>
    </div>

    <!-- 底部结算浮层 -->
    <transition name="slide-up">
      <div class="checkout-bar" v-if="totalItems > 0">
        <div class="checkout-info">
          <div class="summary-row">
            <span>已选: {{ totalItems }} 项</span>
            <span :class="{ 'text-danger': !isTransactionValid }">
              总计: <span v-html="formatCurrencyFromCopper(totalTransactionCostInCopper)"></span>
            </span>
          </div>
          <div class="balance-preview" v-if="totalTransactionCostInCopper > 0">
            剩余预计: <span v-html="formatCurrencyFromCopper(playerTotalCopper - totalTransactionCostInCopper)"></span>
          </div>
        </div>

        <button
          class="confirm-btn"
          @click="submitTransaction"
          :disabled="!isTransactionValid"
        >
          {{ isTransactionValid ? '确认交易' : '资金不足' }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useShopStore } from '@/尘史使徒/store/ShopStore';
import { useStatStore } from '@/尘史使徒/store/StatStore';
import type { ShopItem } from '@/尘史使徒/store/ShopStore';

const shopStore = useShopStore();
const statStore = useStatStore();

const shopData = computed(() => shopStore.shopData);
const hasData = computed(() => shopStore.hasShopData);

// 获取玩家金钱对象
const playerMoneyObj = computed(() => statStore.stat_data?.金钱 || { 金索尔: 0, 银里弗: 0, 铜便士: 0 });

// --- 货币核心逻辑 ---

// 1. 将所有货币转换为最小单位（铜便士）进行计算
// 1 金索尔 = 100 银里弗 = 1000 铜便士
// 1 银里弗 = 10 铜便士
const toCopper = (gold: number, silver: number, copper: number) => {
  return (gold * 1000) + (silver * 10) + copper;
};

// 玩家总资产（铜便士）
const playerTotalCopper = computed(() => {
  const m = playerMoneyObj.value;
  return toCopper(m.金索尔 || 0, m.银里弗 || 0, m.铜便士 || 0);
});

// 2. 格式化显示函数 (从铜便士转回文本)
const formatCurrencyFromCopper = (totalCopper: number) => {
  const isNegative = totalCopper < 0;
  let absCopper = Math.abs(totalCopper);

  const gold = Math.floor(absCopper / 1000);
  const silver = Math.floor((absCopper % 1000) / 10);
  const copper = Math.floor(absCopper % 10);

  let html = '';
  if (isNegative) html += '<span style="color:var(--accent-danger)">- </span>';

  if (gold > 0) html += `<span class="c-gold">${gold}金</span> `;
  if (silver > 0) html += `<span class="c-silver">${silver}银</span> `;
  if (copper > 0) html += `<span class="c-copper">${copper}铜</span>`;

  if (html === '') html = '<span class="c-copper">0铜</span>';

  return html;
};

// 3. 格式化显示函数 (从对象)
const formatCurrencyFromObject = (money: {金索尔:number, 银里弗:number, 铜便士:number}) => {
  const c = toCopper(money.金索尔, money.银里弗, money.铜便士);
  // 这里为了复用逻辑，先转铜再转字符串，也可以直接拼字符串
  // 但为了去掉为0的单位，转铜再算比较方便
  // 注意：这里返回纯文本用于插值，上面那个返回HTML
  const gold = money.金索尔;
  const silver = money.银里弗;
  const copper = money.铜便士;

  let text = [];
  if (gold > 0) text.push(`${gold}金索尔`);
  if (silver > 0) text.push(`${silver}银里弗`);
  if (copper > 0) text.push(`${copper}铜便士`);
  return text.length > 0 ? text.join(' ') : "身无分文";
};

// 4. 格式化商品价格 (输入是银里弗)
const formatPriceToHtml = (priceInSilver: number) => {
  return formatCurrencyFromCopper(priceInSilver * 10);
};

// --- 购物车逻辑 ---

const cart = ref<Record<string, number>>({});

const totalItems = computed(() => Object.values(cart.value).reduce((a, b) => a + b, 0));

// 计算当前交易的总花费（铜便士）
// 正数表示玩家需要支付，负数表示玩家获得
const totalTransactionCostInCopper = computed(() => {
  let totalCost = 0;
  for (const [name, count] of Object.entries(cart.value)) {
    const item = shopData.value[name];
    if (!item) continue;

    // 商品价格单位是银里弗，转为铜便士需 * 10
    const itemPriceCopper = item['价格'] * 10;

    if (item['方向'] === '购买') {
      totalCost += itemPriceCopper * count;
    } else {
      // 出售获得金钱，花费为负
      totalCost -= itemPriceCopper * count;
    }
  }
  return totalCost;
});

// 交易是否合法（钱够不够）
const isTransactionValid = computed(() => {
  // 如果总花费 <= 玩家资产，则合法
  // 注意：如果是在卖东西，totalTransactionCostInCopper 是负数，肯定小于玩家资产，所以总是合法的
  return playerTotalCopper.value >= totalTransactionCostInCopper.value;
});

// 判断单个商品是否买得起（用于UI样式）
const canAffordItem = (name: string) => {
  const item = shopData.value[name];
  if (!item) return false;
  // 简单判断：买1个是否买得起（不考虑购物车里其他东西，仅用于列表显示灰色状态）
  // 如果要严谨，应该判断 (当前购物车总价 + 这个商品单价) <= 玩家余额
  return playerTotalCopper.value >= (item['价格'] * 10);
};

// 判断加号是否禁用
const isAddDisabled = (name: string, item: ShopItem) => {
  const currentQty = cart.value[name] || 0;
  const maxQty = item['最大数量'] || 99;

  // 1. 数量限制
  if (currentQty >= maxQty) return true;

  // 2. 金钱限制 (仅针对购买)
  if (item['方向'] === '购买') {
    const itemPriceCopper = item['价格'] * 10;
    // 预测增加一个后的总花费
    const nextTotalCost = totalTransactionCostInCopper.value + itemPriceCopper;
    if (nextTotalCost > playerTotalCopper.value) return true;
  }

  return false;
};

const updateCart = (name: string, delta: number) => {
  const current = cart.value[name] || 0;
  const next = current + delta;

  // 这里的逻辑主要处理减法，加法的限制在 isAddDisabled 中处理了
  // 但为了安全，这里也可以再校验一次
  if (next <= 0) {
    delete cart.value[name];
  } else {
    cart.value[name] = next;
  }
};

// 新增：专门用于日志记录的纯文本格式化函数
const formatPriceToString = (priceInSilver: number) => {
  const totalCopper = priceInSilver * 10;
  const gold = Math.floor(totalCopper / 1000);
  const silver = Math.floor((totalCopper % 1000) / 10);
  const copper = Math.floor(totalCopper % 10);

  let text = [];
  if (gold > 0) text.push(`${gold}金索尔`);
  if (silver > 0) text.push(`${silver}银里弗`);
  if (copper > 0) text.push(`${copper}铜便士`);

  return text.length > 0 ? text.join(' ') : "0铜便士";
};

const submitTransaction = () => {
  if (!isTransactionValid.value) return;

  // 构建详细日志
  const logs = Object.entries(cart.value).map(([name, quantity]) => {
    const item = shopData.value[name];

    // 计算单价和总价的文字描述
    const totalPriceStr = formatPriceToString(item['价格'] * quantity);

    return {
      [name]:{
        "描述": item['描述'],
        "作用": item['作用'] || "无特殊作用", // 防止 undefined
        "交易方向": item['方向'],
        "数量": quantity,
        "总价": totalPriceStr
      }
    }
  });

  if (logs.length === 0) return;

  try {
    const input = window.parent.document.querySelector('#send_textarea') as HTMLTextAreaElement;
    if (input) {
      // 使用 null, 2 参数让 JSON 格式化输出，更易读
      const jsonStr = JSON.stringify(logs, null, 2);
      const outputText = `\n<user>希望进行以下交易：\n${jsonStr}`;

      const currentVal = input.value;
      input.value = currentVal ? currentVal + outputText : outputText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();

      cart.value = {};
    }
  } catch (e) {
    console.error("交易提交失败", e);
  }
};
</script>

<style scoped>
/* 引入之前的样式，并增加货币相关的样式 */
.shop-container {
  padding-bottom: 100px;
}

.shop-header {
  text-align: center;
  margin-bottom: 1.5rem;
  background: rgba(0,0,0,0.2);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.shop-title {
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  color: var(--accent-primary);
  margin: 0;
}

.player-wealth {
  margin-top: 0.8rem;
  font-family: 'EB Garamond', serif;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.wealth-label {
  color: var(--text-secondary);
  margin-right: 0.5rem;
}

.wealth-value {
  color: #ffd700; /* 金色高亮 */
  font-weight: bold;
}

/* 货币颜色类 (用于 v-html) */
:deep(.c-gold) { color: #ffd700; font-weight: bold; margin-right: 4px; }
:deep(.c-silver) { color: #c0c0c0; font-weight: bold; margin-right: 4px; }
:deep(.c-copper) { color: #cd7f32; font-weight: bold; }
:deep(.text-danger) { color: var(--accent-danger); }

/* 卡片样式调整 */
.item-card {
  /* ...原有样式... */
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 禁用状态（买不起） */
.item-card.is-disabled {
  opacity: 0.7;
  border-color: transparent;
}
.item-card.is-disabled .price-display {
  color: var(--accent-danger);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card-header {
  padding: 0.8rem;
  display: flex;
  justify-content: space-between;
  background: rgba(0,0,0,0.1);
}

.item-name {
  font-family: 'Cinzel', serif;
  font-weight: bold;
  color: var(--text-primary);
}

.card-body {
  padding: 0.8rem;
  flex-grow: 1;
}

.item-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.card-footer {
  padding: 0.8rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-display {
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.action-controls {
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.ctrl-btn {
  background: none;
  border: none;
  color: var(--text-primary);
  width: 28px;
  height: 28px;
  cursor: pointer;
}
.ctrl-btn:disabled {
  color: var(--text-secondary);
  opacity: 0.3;
  cursor: not-allowed;
}

/* 底部结算栏增强 */
.checkout-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 500px;
  background: var(--bg-secondary);
  border: 1px solid var(--accent-primary);
  box-shadow: 0 4px 20px rgba(0,0,0,0.8);
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.checkout-info {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}

.summary-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 4px;
}

.balance-preview {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.confirm-btn {
  background: var(--accent-primary);
  color: #1a1d24;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:disabled {
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: not-allowed;
  border: 1px solid var(--border-color);
}
</style>
