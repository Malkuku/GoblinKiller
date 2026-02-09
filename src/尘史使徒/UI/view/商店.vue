<template>
  <div class="shop-view" @click="handleGlobalClick">
    <!-- 全局遮罩：用于点击空白处关闭资产详情 -->
    <div v-if="showAssetDetail" class="click-mask" @click.stop="showAssetDetail = false"></div>

    <!-- 顶部资产概览 -->
    <div class="shop-header">
      <div class="header-content">
        <div class="title-group">
          <h2>交易</h2>
          <span class="sub-title">Trade & Barter</span>
        </div>

        <!-- 可点击的资产显示区域 -->
        <div class="gold-wrapper">
          <div
            class="gold-display"
            @click.stop="showAssetDetail = !showAssetDetail"
            :class="{ 'active': showAssetDetail }"
          >
            <span class="label">总资产估值</span>
            <div class="value-row">
              <span class="currency-symbol">⟡</span>
              <span class="value">{{ totalGold.toFixed(2) }}</span>
              <span class="unit">g</span>
              <span class="dropdown-arrow">▼</span>
            </div>
          </div>

          <!-- 资产详情悬浮窗 -->
          <Transition name="fade-slide">
            <div v-if="showAssetDetail" class="asset-dropdown" @click.stop>
              <div class="dropdown-header">货币构成</div>
              <div class="currency-list">
                <div v-for="(info, name) in currencyBreakdown" :key="name" class="currency-row">
                  <div class="c-name">{{ name }}</div>
                  <div class="c-calc">
                    <span class="c-qty">x{{ info.count }}</span>
                    <span class="c-price">(@{{ info.price }}g)</span>
                  </div>
                  <div class="c-total">{{ info.total.toFixed(1) }}g</div>
                </div>
                <div v-if="Object.keys(currencyBreakdown).length === 0" class="empty-currency">
                  身无分文
                </div>
              </div>
              <div class="dropdown-footer">
                <span>Total</span>
                <span class="total-val">{{ totalGold.toFixed(2) }}g</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <div class="shop-content">
      <!-- 左侧：出售列表 -->
      <div class="panel left-panel">
        <div class="panel-header">
          <div class="ph-left">
            <h3>行囊</h3>
            <span class="hint">Inventory</span>
          </div>
          <div class="ph-right icon-sell">出售</div>
        </div>
        <div class="scroll-area custom-scrollbar">
          <div v-if="Object.keys(sellableItems).length === 0" class="empty-tip">
            <span>◌</span><br>行囊空空如也
          </div>

          <div
            v-for="(item, name) in sellableItems"
            :key="name"
            class="item-card"
            :class="{ 'expanded': expandedItem === name, 'in-queue': getQueueCount(name, 'sell') > 0 }"
          >
            <!-- 核心行 -->
            <div class="card-main" @click="toggleExpand(name)">
              <div class="main-left">
                <div class="item-name">{{ name }}</div>
                <div class="item-meta">
                  <span class="meta-tag stock">持: {{ item.userItem.数量 }}</span>
                  <span class="meta-tag dur" v-if="item.userItem.耐久">耐: {{ item.userItem.耐久 }}</span>
                </div>
              </div>
              <div class="main-right">
                <div class="price-tag gain">+{{ item.shopInfo.价格 }}g</div>
              </div>
            </div>

            <!-- 详情折叠区 -->
            <div class="card-details" v-if="expandedItem === name">
              <div class="desc-text">{{ item.shopInfo.描述 }}</div>
              <div class="effect-text" v-if="item.shopInfo.作用">
                <span class="label">作用:</span> {{ item.shopInfo.作用 }}
              </div>
            </div>

            <!-- 操作栏 -->
            <div class="card-actions">
              <div class="qty-control">
                <button class="q-btn minus" @click.stop="updateQueue(name, 'sell', -1, item.userItem.数量)">−</button>
                <div class="q-display" :class="{ 'has-val': getQueueCount(name, 'sell') > 0 }">
                  {{ getQueueCount(name, 'sell') }}
                </div>
                <button class="q-btn plus" @click.stop="updateQueue(name, 'sell', 1, item.userItem.数量)">+</button>
              </div>
              <button class="max-btn" @click.stop="setQueueMax(name, 'sell', item.userItem.数量)">全部</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间装饰 -->
      <div class="divider-visual">
        <div class="line"></div>
        <div class="icon">⚖</div>
        <div class="line"></div>
      </div>

      <!-- 右侧：购买列表 -->
      <div class="panel right-panel">
        <div class="panel-header">
          <div class="ph-left">
            <h3>货架</h3>
            <span class="hint">Market</span>
          </div>
          <div class="ph-right icon-buy">购买</div>
        </div>
        <div class="scroll-area custom-scrollbar">
          <div v-if="Object.keys(buyableItems).length === 0" class="empty-tip">
            <span>🔒</span><br>暂无商品
          </div>

          <div
            v-for="(item, name) in buyableItems"
            :key="name"
            class="item-card"
            :class="{ 'expanded': expandedItem === name, 'in-queue': getQueueCount(name, 'buy') > 0 }"
          >
            <!-- 核心行 -->
            <div class="card-main" @click="toggleExpand(name)">
              <div class="main-left">
                <div class="item-name">{{ name }}</div>
                <div class="item-meta">
                  <span class="meta-tag stock">存: {{ item.最大数量 }}</span>
                  <span class="meta-tag dur">耐: {{ item.最大耐久 }}</span>
                </div>
              </div>
              <div class="main-right">
                <div class="price-tag cost">-{{ item.价格 }}g</div>
              </div>
            </div>

            <!-- 详情 -->
            <div class="card-details" v-if="expandedItem === name">
              <div class="desc-text">{{ item.描述 }}</div>
              <div class="effect-text" v-if="item.作用">
                <span class="label">作用:</span> {{ item.作用 }}
              </div>
            </div>

            <!-- 操作栏 -->
            <div class="card-actions">
              <div class="qty-control">
                <button class="q-btn minus" @click.stop="updateQueue(name, 'buy', -1, item.最大数量)">−</button>
                <div class="q-display" :class="{ 'has-val': getQueueCount(name, 'buy') > 0 }">
                  {{ getQueueCount(name, 'buy') }}
                </div>
                <button class="q-btn plus" @click.stop="updateQueue(name, 'buy', 1, item.最大数量)">+</button>
              </div>
              <button class="max-btn" @click.stop="setQueueMax(name, 'buy', item.最大数量)">最大</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部交易结算栏 -->
    <Transition name="slide-up">
      <div class="trade-bar-wrapper" v-if="queueTotalCount > 0">
        <div class="trade-bar">
          <div class="trade-info">
            <div class="info-block">
              <span class="lbl">预计变动</span>
              <div class="val-group">
                <span class="v-gain" v-if="pendingGain > 0">+{{ pendingGain.toFixed(1) }}</span>
                <span class="v-cost" v-if="pendingCost > 0">-{{ pendingCost.toFixed(1) }}</span>
                <span class="v-neutral" v-if="pendingGain === 0 && pendingCost === 0">0</span>
              </div>
            </div>
            <div class="separator"></div>
            <div class="info-block result-block">
              <span class="lbl">交易后余额</span>
              <span class="val final" :class="finalBalance < 0 ? 'danger' : 'safe'">
                {{ finalBalance.toFixed(1) }}g
              </span>
            </div>
          </div>

          <div class="trade-btns">
            <button class="btn-clear" @click="clearQueue">清空</button>
            <button
              class="btn-confirm"
              :disabled="finalBalance < 0"
              @click="submitTransaction"
            >
              <span class="btn-text">{{ finalBalance < 0 ? '资金不足' : '确认交易' }}</span>
              <span class="btn-badge">{{ queueTotalCount }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useShopStore } from '@/尘史使徒/UI/store/ShopStore';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';

const router = useRouter();
const shopStore = useShopStore();
const statStore = useStatStore();
const uiStore = useUiStore();

// --- 状态管理 ---
const expandedItem = ref<string | null>(null);
const showAssetDetail = ref(false);
const transactionQueue = reactive<Record<string, { type: 'buy' | 'sell', count: number, price: number, info: any }>>({});

// --- 交互逻辑 ---
const handleGlobalClick = () => {
  // 备用：如果点击遮罩层不够，这里可以处理全局点击关闭
};

const toggleExpand = (name: string) => {
  expandedItem.value = expandedItem.value === name ? null : name;
};

const getQueueCount = (name: string, type: 'buy' | 'sell') => {
  const item = transactionQueue[name];
  if (item && item.type === type) return item.count;
  return 0;
};

const updateQueue = (name: string, type: 'buy' | 'sell', delta: number, maxLimit: number) => {
  const currentCount = getQueueCount(name, type);
  let newCount = currentCount + delta;

  if (newCount < 0) newCount = 0;
  if (newCount > maxLimit) newCount = maxLimit;

  if (newCount === 0) {
    delete transactionQueue[name];
  } else {
    let info = {};
    let price = 0;

    if (type === 'buy') {
      const item = buyableItems.value[name];
      info = { ...item };
      price = item.价格;
    } else {
      const item = sellableItems.value[name];
      info = { ...item.shopInfo, 当前耐久: item.userItem.耐久 };
      price = item.shopInfo.价格;
    }

    transactionQueue[name] = { type, count: newCount, price, info };
  }
};

const setQueueMax = (name: string, type: 'buy' | 'sell', maxLimit: number) => {
  updateQueue(name, type, maxLimit, maxLimit);
};

const clearQueue = () => {
  for (const key in transactionQueue) delete transactionQueue[key];
};

// --- 数据获取 ---
const userInventory = computed(() => statStore.stat_data?.角色?.user?.物品 || {});
const currencySystem = computed(() => {
  const economy = statStore.stat_data?.世界经济 || {};
  for (const key in economy) {
    if (economy[key].货币体系) return economy[key].货币体系;
  }
  return {};
});

const userCurrencies = computed(() => {
  const currencies: Record<string, any> = {};
  const inventory = userInventory.value;
  const system = currencySystem.value;
  if (typeof inventory === 'string') return {};
  for (const itemName in inventory) {
    if (system[itemName]) currencies[itemName] = inventory[itemName];
  }
  return currencies;
});

// 计算货币详情列表
const currencyBreakdown = computed(() => {
  const list: Record<string, { count: number, price: number, total: number }> = {};
  const currencies = userCurrencies.value;
  const system = currencySystem.value;

  for (const name in currencies) {
    const count = currencies[name].数量 || 0;
    const price = system[name]?.价值 || 0;
    list[name] = {
      count,
      price,
      total: count * price
    };
  }
  return list;
});

const totalGold = computed(() => {
  let total = 0;
  const list = currencyBreakdown.value;
  for (const name in list) {
    total += list[name].total;
  }
  return total;
});

const buyableItems = computed(() => {
  const result: Record<string, any> = {};
  const data = shopStore.shopData;
  for (const key in data) {
    if (data[key].方向 === '购买') result[key] = data[key];
  }
  return result;
});

const sellableItems = computed(() => {
  const result: Record<string, any> = {};
  const shopData = shopStore.shopData;
  const inventory = userInventory.value;
  if (typeof inventory === 'string') return {};
  for (const key in shopData) {
    if (shopData[key].方向 === '出售' && inventory[key]) {
      result[key] = { shopInfo: shopData[key], userItem: inventory[key] };
    }
  }
  return result;
});

// --- 结算计算 ---
const pendingCost = computed(() => {
  let cost = 0;
  for (const key in transactionQueue) {
    if (transactionQueue[key].type === 'buy') cost += transactionQueue[key].count * transactionQueue[key].price;
  }
  return cost;
});

const pendingGain = computed(() => {
  let gain = 0;
  for (const key in transactionQueue) {
    if (transactionQueue[key].type === 'sell') gain += transactionQueue[key].count * transactionQueue[key].price;
  }
  return gain;
});

const finalBalance = computed(() => totalGold.value + pendingGain.value - pendingCost.value);
const queueTotalCount = computed(() => {
  let count = 0;
  for (const key in transactionQueue) count += transactionQueue[key].count;
  return count;
});

// --- 提交 ---
const submitTransaction = () => {
  const items = [];
  for (const [name, data] of Object.entries(transactionQueue)) {
    items.push({
      物品名称: name,
      数量: data.count,
      方向: data.type === 'buy' ? '购买' : '出售',
      单价: data.price,
      总价: (data.price * data.count).toFixed(4)+"g黄金",
      描述: data.info.描述,
      作用: data.info.作用,
      耐久信息: data.type === 'sell' ? `当前耐久:${data.info.当前耐久}` : `最大耐久:${data.info.最大耐久}`
    });
  }

  const log = `<user>打算完成以下批量交易:\n<list>\n${JSON.stringify(items, null, 2)}\n</list>\n交易后预计剩余资产: ${finalBalance.value.toFixed(2)}g\n如果顺利，则离开当前场景\n`;
  uiStore.setPendingInput(log);
  clearQueue();
  router.push('/选项');
};
</script>

<style scoped>
/* --- 核心变量 --- */
.shop-view {
  --c-bg: #0b0c10;
  --c-panel-bg: rgba(20, 22, 28, 0.6);
  --c-panel-border: rgba(255, 255, 255, 0.08);

  --c-gold: #e6c15c;
  --c-gold-dim: #8a7538;
  --c-text: #e0e6ed;
  --c-text-dim: #718096;

  --c-accent-sell: #64ffda;
  --c-accent-buy: #ff7e67;

  --font-serif: 'Cinzel', serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  height: 100%;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top center, #1a1c24 0%, #0b0c10 100%);
  color: var(--c-text);
  font-family: var(--font-sans);
  position: relative;
  overflow: hidden;
}

/* --- 遮罩层 --- */
.click-mask {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  z-index: 90; cursor: default;
}

/* --- 顶部 Header --- */
.shop-header {
  flex-shrink: 0;
  padding: 20px 30px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0));
  border-bottom: 1px solid rgba(255,255,255,0.05);
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  max-width: 1200px;
  margin: 0 auto;
}

.title-group h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 2rem;
  background: linear-gradient(to right, var(--c-gold), #fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}

.sub-title {
  font-size: 0.85rem;
  color: var(--c-text-dim);
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-left: 2px;
}

/* --- 资产显示与下拉 --- */
.gold-wrapper {
  position: relative;
}

.gold-display {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160px;
  backdrop-filter: blur(5px);
}

.gold-display:hover, .gold-display.active {
  background: rgba(230, 193, 92, 0.1);
  border-color: var(--c-gold);
  box-shadow: 0 0 15px rgba(230, 193, 92, 0.15);
}

.gold-display .label {
  display: block;
  font-size: 0.7rem;
  color: var(--c-text-dim);
  text-transform: uppercase;
  margin-bottom: 2px;
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--c-gold);
}

.currency-symbol { font-size: 1.2rem; }
.value { font-family: var(--font-mono); font-size: 1.4rem; font-weight: bold; }
.unit { font-size: 0.9rem; color: var(--c-gold-dim); }
.dropdown-arrow { margin-left: auto; font-size: 0.8rem; opacity: 0.7; transition: transform 0.3s; }
.gold-display.active .dropdown-arrow { transform: rotate(180deg); }

/* 下拉菜单 */
.asset-dropdown {
  position: absolute;
  top: 110%; right: 0;
  width: 280px;
  background: rgba(15, 17, 23, 0.95);
  border: 1px solid var(--c-gold-dim);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.8);
  z-index: 101;
  padding: 15px;
  backdrop-filter: blur(10px);
  transform-origin: top right;
}

.dropdown-header {
  font-size: 0.8rem;
  color: var(--c-text-dim);
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 8px;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.currency-list {
  max-height: 200px;
  overflow-y: auto;
}

.currency-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.9rem;
  border-bottom: 1px dashed rgba(255,255,255,0.05);
}
.currency-row:last-child { border-bottom: none; }

.c-name { color: #fff; font-weight: 500; }
.c-calc { font-size: 0.8rem; color: var(--c-text-dim); margin-left: auto; margin-right: 10px; }
.c-total { font-family: var(--font-mono); color: var(--c-gold); }

.dropdown-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.total-val { color: var(--c-gold); font-family: var(--font-mono); font-size: 1.1rem; }

/* --- 主内容区 --- */
.shop-content {
  flex: 1;
  display: flex;
  padding: 20px 30px;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
}

.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--c-panel-bg);
  border: 1px solid var(--c-panel-border);
  border-radius: 12px;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: border-color 0.3s;
}

.panel:hover { border-color: rgba(255,255,255,0.15); }

.panel-header {
  padding: 15px 20px;
  border-bottom: 1px solid var(--c-panel-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.02);
}

.ph-left h3 { margin: 0; font-family: var(--font-serif); font-size: 1.1rem; color: #fff; }
.hint { font-size: 0.7rem; color: var(--c-text-dim); text-transform: uppercase; letter-spacing: 1px; }

.ph-right {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 1px;
}
.icon-sell { color: var(--c-accent-sell); background: rgba(100, 255, 218, 0.1); }
.icon-buy { color: var(--c-accent-buy); background: rgba(255, 126, 103, 0.1); }

.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

/* --- 卡片样式 --- */
.item-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid transparent;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.item-card:hover {
  background: rgba(255,255,255,0.06);
  transform: translateY(-1px);
}

.item-card.expanded {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.1);
}

.item-card.in-queue {
  border-left: 3px solid var(--c-gold);
  background: linear-gradient(90deg, rgba(230, 193, 92, 0.05), transparent);
}

/* 卡片主体 */
.card-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
}

.item-name {
  font-weight: 600;
  font-size: 1rem;
  color: #f0f0f0;
  margin-bottom: 4px;
}

.item-meta { display: flex; gap: 8px; }
.meta-tag { font-size: 0.75rem; color: var(--c-text-dim); background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; }

.price-tag {
  font-family: var(--font-mono);
  font-weight: bold;
  font-size: 1rem;
}
.gain { color: var(--c-accent-sell); text-shadow: 0 0 10px rgba(100, 255, 218, 0.3); }
.cost { color: var(--c-accent-buy); text-shadow: 0 0 10px rgba(255, 126, 103, 0.3); }

/* 详情 */
.card-details {
  padding: 0 15px 15px 15px;
  font-size: 0.85rem;
  color: #a0aec0;
  border-top: 1px solid rgba(255,255,255,0.05);
  margin-top: -5px;
  padding-top: 10px;
  animation: fadeIn 0.3s ease;
}
.desc-text { font-style: italic; margin-bottom: 6px; line-height: 1.4; }
.effect-text .label { color: var(--c-gold-dim); margin-right: 5px; }

/* 操作栏 */
.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: rgba(0,0,0,0.2);
}

.qty-control {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
  padding: 2px;
}

.q-btn {
  width: 24px; height: 24px;
  border: none; background: transparent;
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  transition: color 0.2s;
}
.q-btn:hover { color: var(--c-gold); }

.q-display {
  min-width: 30px; text-align: center;
  font-family: var(--font-mono); font-size: 0.9rem;
  color: var(--c-text-dim);
}
.q-display.has-val { color: var(--c-gold); font-weight: bold; }

.max-btn {
  background: transparent;
  border: 1px solid var(--c-text-dim);
  color: var(--c-text-dim);
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}
.max-btn:hover { border-color: var(--c-gold); color: var(--c-gold); }

/* --- 底部交易栏 --- */
.trade-bar-wrapper {
  position: absolute;
  bottom: 20px; left: 50%;
  transform: translateX(-50%);
  width: 90%; max-width: 800px;
  z-index: 50;
}

.trade-bar {
  background: rgba(22, 24, 30, 0.95);
  border: 1px solid var(--c-gold);
  border-radius: 12px;
  padding: 15px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(230, 193, 92, 0.1);
  backdrop-filter: blur(10px);
}

.trade-info { display: flex; align-items: center; gap: 20px; }
.info-block { display: flex; flex-direction: column; }
.lbl { font-size: 0.7rem; color: var(--c-text-dim); text-transform: uppercase; margin-bottom: 2px; }
.val-group { display: flex; gap: 10px; font-family: var(--font-mono); font-weight: bold; font-size: 1.1rem; }
.v-gain { color: var(--c-accent-sell); }
.v-cost { color: var(--c-accent-buy); }
.v-neutral { color: #666; }

.separator { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }

.result-block .final { font-family: var(--font-mono); font-size: 1.4rem; font-weight: bold; }
.final.safe { color: var(--c-gold); }
.final.danger { color: #ff4d4d; }

.trade-btns { display: flex; align-items: center; gap: 15px; }
.btn-clear { background: none; border: none; color: var(--c-text-dim); cursor: pointer; text-decoration: underline; font-size: 0.9rem; }
.btn-clear:hover { color: #fff; }

.btn-confirm {
  background: var(--c-gold);
  color: #1a1c24;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: bold;
  font-family: var(--font-serif);
  font-size: 1rem;
  cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(230, 193, 92, 0.3);
}
.btn-confirm:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(230, 193, 92, 0.5); background: #ffd700; }
.btn-confirm:disabled { background: #4a5568; color: #718096; cursor: not-allowed; box-shadow: none; }
.btn-badge { background: rgba(0,0,0,0.2); color: inherit; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-family: var(--font-mono); }

/* --- 装饰分割线 --- */
.divider-visual {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--c-panel-border); width: 40px;
}
.line { flex: 1; width: 1px; background: linear-gradient(to bottom, transparent, var(--c-panel-border), transparent); }
.icon { padding: 10px 0; font-size: 1.2rem; opacity: 0.5; }

/* --- 滚动条与动画 --- */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

.empty-tip { text-align: center; color: var(--c-text-dim); padding-top: 50px; font-style: italic; opacity: 0.5; }
.empty-tip span { font-size: 2rem; display: block; margin-bottom: 10px; filter: grayscale(1); }

/* 动画 */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 100%); opacity: 0; }

@media (max-width: 768px) {
  .shop-content { flex-direction: column; padding: 10px; padding-bottom: 100px; }
  .divider-visual { flex-direction: row; width: 100%; height: 40px; }
  .line { width: auto; height: 1px; flex: 1; background: linear-gradient(to right, transparent, var(--c-panel-border), transparent); }
  .icon { padding: 0 10px; }
  .trade-bar-wrapper { width: 95%; bottom: 10px; }
  .trade-bar { flex-direction: column; gap: 15px; padding: 15px; }
  .trade-info { width: 100%; justify-content: space-between; }
  .trade-btns { width: 100%; }
  .btn-confirm { flex: 1; justify-content: center; }
  .asset-dropdown { width: 240px; right: -20px; }
}
</style>
