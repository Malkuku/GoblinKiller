<template>
  <div class="shop-container">
    <header class="shop-header">
      <div class="header-top-row">
        <h2 class="shop-title">交易</h2>
        <!-- 玩家资产显示 -->
        <div class="player-wealth">
          <span class="wealth-label">持有:</span>
          <span class="wealth-value">{{ formatCurrencyFromObject(playerMoneyObj) }}</span>
        </div>
      </div>

      <!-- 分页/分类 Tab -->
      <div class="shop-tabs">
        <button
          class="tab-btn"
          :class="{ active: currentTab === '购买' }"
          @click="currentTab = '购买'"
        >
          购买物资
        </button>
        <button
          class="tab-btn"
          :class="{ active: currentTab === '出售' }"
          @click="currentTab = '出售'"
        >
          出售物品
        </button>
      </div>
    </header>

    <!-- 商品列表 -->
    <transition-group v-if="hasData" name="list" tag="div" class="items-grid">
      <div
        v-for="(item, name) in paginatedShopData"
        :key="name"
        class="item-card"
        :class="[
          item['方向'] === '出售' ? 'type-sell' : 'type-buy',
          { 'is-disabled': item['方向'] === '购买' && !canAffordItem(name as string) }
        ]"
      >
        <div class="card-top">
          <div class="item-name">{{ name }}</div>
          <div class="item-price" v-html="formatPriceToHtml(item['价格'])"></div>
        </div>

        <div class="card-body">
          <!-- 描述改为完整显示，绑定自定义Hover/Click事件 -->
          <p
            class="item-desc"
            @mouseenter="(e) => showTooltip(e, name as string, item)"
            @mousemove="updateTooltipPosition"
            @mouseleave="hideTooltip"
            @click="(e) => showTooltip(e, name as string, item)"
          >
            {{ item['描述'] }}
          </p>
          <!-- 原来的 item-meta 已移除，信息移至 Tooltip -->
        </div>

        <div class="card-footer">
          <div class="input-group">
            <button
              class="qty-btn minus"
              @click="updateCart(name as string, -1)"
              :disabled="!cart[name]"
            >-</button>

            <!-- 手动输入框 -->
            <input
              type="number"
              class="qty-input"
              :value="cart[name] || 0"
              @input="(e) => handleInput(e, name as string, item)"
              @blur="(e) => fixInputQuantity(e, name as string, item)"
              @keydown.enter="(e) => (e.target as HTMLInputElement).blur()"
            />

            <button
              class="qty-btn plus"
              @click="updateCart(name as string, 1)"
              :disabled="isAddDisabled(name as string, item)"
            >+</button>
          </div>

          <!-- 最大值按钮 -->
          <button
            class="max-btn"
            @click="setMaxQuantity(name as string, item)"
            :disabled="isAddDisabled(name as string, item) && (!cart[name] || cart[name] >= calculateMax(name as string, item))"
          >
            最大
          </button>
        </div>
      </div>
    </transition-group>

    <div v-else class="empty-state">
      <p>暂无交易信息...</p>
    </div>

    <!-- 分页控制器 -->
    <div class="pagination-controls" v-if="hasData && totalPages > 1">
      <button
        class="page-btn"
        @click="currentPage--"
        :disabled="currentPage === 1"
      >
        &lt;
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="page-btn"
        @click="currentPage++"
        :disabled="currentPage === totalPages"
      >
        &gt;
      </button>
    </div>

    <!-- 底部结算浮层 -->
    <transition name="slide-up">
      <div class="checkout-bar" v-if="totalItems > 0">
        <div class="checkout-info">
          <div class="summary-row">
            <span>已选: {{ totalItems }}</span>
            <span class="divider">|</span>
            <span :class="{ 'text-danger': !isTransactionValid }">
              总计: <span v-html="formatCurrencyFromCopper(totalTransactionCostInCopper)"></span>
            </span>
          </div>
          <div class="balance-preview" v-if="totalTransactionCostInCopper > 0">
            剩余: <span v-html="formatCurrencyFromCopper(playerTotalCopper - totalTransactionCostInCopper)"></span>
          </div>
        </div>

        <button
          class="confirm-btn"
          @click="submitTransaction"
          :disabled="!isTransactionValid"
        >
          {{ isTransactionValid ? '确认' : '不足' }}
        </button>
      </div>
    </transition>

    <!-- 自定义 Tooltip -->
    <div
      v-if="tooltip.visible"
      class="custom-tooltip"
      :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
    >
      <div class="tooltip-header">{{ tooltip.name }}</div>
      <div class="tooltip-content">
        <div class="tooltip-row"><span class="t-label">作用:</span> {{ tooltip.effect }}</div>
        <div class="tooltip-row" v-if="tooltip.durability"><span class="t-label">耐久:</span> {{ tooltip.durability }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useShopStore } from '@/尘史使徒/store/ShopStore';
import { useStatStore } from '@/尘史使徒/store/StatStore';
import type { ShopItem } from '@/尘史使徒/store/ShopStore';

const shopStore = useShopStore();
const statStore = useStatStore();

const shopData = computed(() => shopStore.shopData);
const hasData = computed(() => shopStore.hasShopData);

// 当前选中的 Tab
const currentTab = ref<'购买' | '出售'>('购买');

// 根据 Tab 过滤商品
const filteredShopData = computed(() => {
  const targetDir = currentTab.value;
  const result: Record<string, ShopItem> = {};
  for (const [key, val] of Object.entries(shopData.value)) {
    if (val['方向'] === targetDir) {
      result[key] = val;
    }
  }
  return result;
});

// --- 分页逻辑 ---
const currentPage = ref(1);
const pageSize = ref(8); // 默认桌面端8条

// 响应式调整每页数量
const updatePageSize = () => {
  // 手机端通常宽度小于 768px
  pageSize.value = window.innerWidth <= 768 ? 4 : 8;
};

onMounted(() => {
  updatePageSize();
  window.addEventListener('resize', updatePageSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updatePageSize);
});

// 切换 Tab 时重置页码
watch(currentTab, () => {
  currentPage.value = 1;
});

// 计算总页数
const totalPages = computed(() => {
  const totalItems = Object.keys(filteredShopData.value).length;
  return Math.ceil(totalItems / pageSize.value) || 1;
});

// 获取当前页的数据
const paginatedShopData = computed(() => {
  const allItems = Object.entries(filteredShopData.value);
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  const slicedItems = allItems.slice(start, end);
  return Object.fromEntries(slicedItems);
});

// 获取玩家金钱对象
const playerMoneyObj = computed(() => statStore.stat_data?.金钱 || { 金索尔: 0, 银里弗: 0, 铜便士: 0 });

// --- 货币核心逻辑 ---
const toCopper = (gold: number, silver: number, copper: number) => {
  return (gold * 1000) + (silver * 10) + copper;
};

const playerTotalCopper = computed(() => {
  const m = playerMoneyObj.value;
  return toCopper(m.金索尔 || 0, m.银里弗 || 0, m.铜便士 || 0);
});

const formatCurrencyFromCopper = (totalCopper: number) => {
  const isNegative = totalCopper < 0;
  let absCopper = Math.abs(totalCopper);
  const gold = Math.floor(absCopper / 1000);
  const silver = Math.floor((absCopper % 1000) / 10);
  const copper = Math.floor(absCopper % 10);

  let html = '';
  if (isNegative) html += '<span style="color:var(--accent-danger)">-</span>';
  if (gold > 0) html += `<span class="c-gold">${gold}金</span>`;
  if (silver > 0) html += `<span class="c-silver">${silver}银</span>`;
  if (copper > 0) html += `<span class="c-copper">${copper}铜</span>`;
  if (html === '') html = '<span class="c-copper">0铜</span>';
  return html;
};

const formatCurrencyFromObject = (money: {金索尔:number, 银里弗:number, 铜便士:number}) => {
  const gold = money.金索尔;
  const silver = money.银里弗;
  const copper = money.铜便士;
  let text = [];
  if (gold > 0) text.push(`${gold}金`);
  if (silver > 0) text.push(`${silver}银`);
  if (copper > 0) text.push(`${copper}铜`);
  return text.length > 0 ? text.join(' ') : "0";
};

const formatPriceToHtml = (priceInSilver: number) => {
  return formatCurrencyFromCopper(priceInSilver * 10);
};

// --- Tooltip 逻辑 ---
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  name: '',
  effect: '',
  durability: '' as string | number
});

const showTooltip = (e: MouseEvent, name: string, item: ShopItem) => {
  tooltip.value = {
    visible: true,
    x: e.clientX + 15,
    y: e.clientY + 15,
    name: name,
    effect: item['作用'] || '无特殊作用',
    durability: item['最大耐久'] || 0
  };
};

const updateTooltipPosition = (e: MouseEvent) => {
  if (!tooltip.value.visible) return;
  tooltip.value.x = e.clientX + 15;
  tooltip.value.y = e.clientY + 15;
};

const hideTooltip = () => {
  tooltip.value.visible = false;
};

// --- 购物车逻辑 ---

const cart = ref<Record<string, number>>({});

const totalItems = computed(() => Object.values(cart.value).reduce((a, b) => a + b, 0));

const totalTransactionCostInCopper = computed(() => {
  let totalCost = 0;
  for (const [name, count] of Object.entries(cart.value)) {
    const item = shopData.value[name];
    if (!item) continue;
    const itemPriceCopper = item['价格'] * 10;
    if (item['方向'] === '购买') {
      totalCost += itemPriceCopper * count;
    } else {
      totalCost -= itemPriceCopper * count;
    }
  }
  return totalCost;
});

const isTransactionValid = computed(() => {
  return playerTotalCopper.value >= totalTransactionCostInCopper.value;
});

const canAffordItem = (name: string) => {
  const item = shopData.value[name];
  if (!item) return false;
  return playerTotalCopper.value >= (item['价格'] * 10);
};

// --- 数量输入与限制逻辑 ---

// 计算某个商品的最大可操作数量
const calculateMax = (name: string, item: ShopItem) => {
  const maxStock = item['最大数量'] || 99;

  // 如果是出售（玩家卖给商店），理论上受限于玩家背包，但这里暂无背包数据，仅受限于商店接收上限
  if (item['方向'] === '出售') {
    return maxStock;
  }

  // 如果是购买，受限于金钱
  const priceCopper = item['价格'] * 10;
  if (priceCopper <= 0) return maxStock;

  // 计算当前剩余预算（排除掉购物车里其他商品的花费）
  const currentQty = cart.value[name] || 0;
  const currentSpentOnThis = currentQty * priceCopper;

  const otherItemsCost = totalTransactionCostInCopper.value - currentSpentOnThis;
  const availableMoney = playerTotalCopper.value - otherItemsCost;

  const maxAffordable = Math.floor(availableMoney / priceCopper);

  return Math.min(maxStock, maxAffordable);
};

// 判断加号是否禁用
const isAddDisabled = (name: string, item: ShopItem) => {
  const currentQty = cart.value[name] || 0;
  const max = calculateMax(name, item);
  return currentQty >= max;
};

// 更新购物车（按钮点击）
const updateCart = (name: string, delta: number) => {
  const current = cart.value[name] || 0;
  const next = current + delta;

  if (next <= 0) {
    delete cart.value[name];
  } else {
    cart.value[name] = next;
  }
};

// 设置为最大值
const setMaxQuantity = (name: string, item: ShopItem) => {
  const max = calculateMax(name, item);
  if (max > 0) {
    cart.value[name] = max;
  }
};

// 处理输入框实时输入 (仅限制非数字)
const handleInput = (e: Event, name: string, item: ShopItem) => {
  const val = (e.target as HTMLInputElement).value;
  if (val === '') return;
};

// 处理输入框失焦 (修正数值)
const fixInputQuantity = (e: Event, name: string, item: ShopItem) => {
  const input = e.target as HTMLInputElement;
  let val = parseInt(input.value);

  if (isNaN(val) || val < 0) val = 0;

  const max = calculateMax(name, item);
  if (val > max) val = max;

  if (val === 0) {
    delete cart.value[name];
    input.value = '0'; // 视觉归零
  } else {
    cart.value[name] = val;
    input.value = val.toString(); // 修正显示
  }
};

// --- 提交逻辑 ---
const formatPriceToString = (priceInSilver: number) => {
  const totalCopper = priceInSilver * 10;
  const gold = Math.floor(totalCopper / 1000);
  const silver = Math.floor((totalCopper % 1000) / 10);
  const copper = Math.floor(totalCopper % 10);
  let text = [];
  if (gold > 0) text.push(`${gold}金`);
  if (silver > 0) text.push(`${silver}银`);
  if (copper > 0) text.push(`${copper}铜`);
  return text.length > 0 ? text.join('') : "0铜";
};

const submitTransaction = () => {
  if (!isTransactionValid.value) return;
  const logs = Object.entries(cart.value).map(([name, quantity]) => {
    const item = shopData.value[name];
    const totalPriceStr = formatPriceToString(item['价格'] * quantity);
    return {
      "名称": name,
      "描述": item['描述'],
      "作用": item['作用'] || "无特殊作用", // 防止 undefined
      "交易方向": item['方向'],
      "数量": quantity,
      "总价": totalPriceStr
    }
  });

  if (logs.length === 0) return;

  try {
    const input = window.parent.document.querySelector('#send_textarea') as HTMLTextAreaElement;
    if (input) {
      const jsonStr = JSON.stringify(logs, null, 2);
      const outputText = `\n<user>希望进行以下交易：\n<list>\n${jsonStr}\n</list>\n如果顺利，则完成交易，离开当前场景\n`;

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
.shop-container {
  padding-bottom: 80px;
  font-family: 'Segoe UI', sans-serif;
}

/* 紧凑 Header */
.shop-header {
  margin-bottom: 0.5rem;
  background: rgba(0,0,0,0.2);
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-title {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  color: var(--accent-primary);
  margin: 0;
}

.player-wealth {
  font-size: 0.85rem;
  color: var(--text-primary);
  background: rgba(0,0,0,0.2);
  padding: 2px 6px;
  border-radius: 4px;
}
.wealth-value { color: #ffd700; font-weight: bold; margin-left: 5px; }

/* Tabs 样式 */
.shop-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.tab-btn.active {
  background: var(--accent-primary);
  color: #1a1d24;
  font-weight: bold;
  border-color: var(--accent-primary);
}

/* 紧凑 Grid 布局 */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.8rem;
}

/* 紧凑卡片样式 */
.item-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 保持卡片圆角，但内容会撑开 */
  font-size: 0.85rem;
}

.item-card.is-disabled { opacity: 0.6; }

.card-top {
  padding: 0.5rem;
  background: rgba(0,0,0,0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.item-name {
  font-weight: bold;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 65%;
}

.item-price {
  font-size: 0.8rem;
  text-align: right;
}

.card-body {
  padding: 0.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-desc {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.3;
  /* 完整显示，移除截断 */
  white-space: normal;
  cursor: help; /* 提示可交互 */
}

/* 底部操作区 */
.card-footer {
  padding: 0.5rem;
  background: rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-primary);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.qty-btn {
  background: rgba(255,255,255,0.05);
  border: none;
  color: var(--text-primary);
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-btn:hover:not(:disabled) { background: rgba(255,255,255,0.15); }
.qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.qty-input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  text-align: center;
  font-size: 0.9rem;
  -moz-appearance: textfield;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.qty-input:focus { outline: none; background: rgba(255,255,255,0.05); }

.max-btn {
  width: 100%;
  background: transparent;
  border: 1px dashed var(--border-color);
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 2px 0;
  border-radius: 3px;
  cursor: pointer;
}
.max-btn:hover:not(:disabled) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.max-btn:disabled { opacity: 0.3; cursor: default; }

/* 分页控制器样式 */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
  padding: 10px;
}

.page-btn {
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--accent-primary);
  color: #1a1d24;
  border-color: var(--accent-primary);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 结算栏 */
.checkout-bar {
  position: fixed;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
  max-width: 400px;
  background: var(--bg-secondary);
  border: 1px solid var(--accent-primary);
  box-shadow: 0 4px 20px rgba(0,0,0,0.9);
  padding: 0.6rem 1rem;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.checkout-info {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}
.divider { color: var(--text-secondary); opacity: 0.5; }

.balance-preview {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.confirm-btn {
  background: var(--accent-primary);
  color: #1a1d24;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 15px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 70px;
}
.confirm-btn:disabled {
  background: #444;
  color: #888;
  cursor: not-allowed;
}

/* 自定义 Tooltip 样式 */
.custom-tooltip {
  position: fixed;
  z-index: 9999;
  background: rgba(20, 20, 25, 0.95);
  border: 1px solid var(--accent-primary);
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  pointer-events: none; /* 防止鼠标移动时闪烁 */
  min-width: 120px;
  max-width: 250px;
}

.tooltip-header {
  font-weight: bold;
  color: var(--accent-primary);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 4px;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.tooltip-content {
  font-size: 0.8rem;
  color: var(--text-primary);
}

.tooltip-row {
  margin-bottom: 2px;
}

.t-label {
  color: var(--text-secondary);
  margin-right: 4px;
}

/* 货币颜色 */
:deep(.c-gold) { color: #ffd700; margin-right: 2px; }
:deep(.c-silver) { color: #c0c0c0; margin-right: 2px; }
:deep(.c-copper) { color: #cd7f32; }
:deep(.text-danger) { color: #ff4d4d; }
</style>
