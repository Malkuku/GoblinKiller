<template>
  <div class="shop-view" @click="handleGlobalClick">
    <!-- 顶部资产概览 -->
    <div class="shop-header">
      <div class="header-content">
        <div class="title-group">
          <h2>交易</h2>
          <span class="sub-title">Trade & Barter</span>
        </div>

        <div class="gold-wrapper">
          <div class="gold-display">
            <span class="label">当前资金</span>
            <div class="value-row">
              <span class="currency-symbol">⟡</span>
              <span class="value">{{ totalGold.toFixed(4) }}</span>
              <span class="unit">g</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="shop-content">
      <!-- 左侧：出售列表 (移动端仅在 activeTab === 'sell' 时显示) -->
      <div class="panel left-panel" :class="{ 'mobile-hidden': activeTab !== 'sell' }">
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

            <div class="card-details" v-if="expandedItem === name">
              <div class="desc-text">{{ item.shopInfo.描述 }}</div>
              <div class="effect-text" v-if="item.shopInfo.作用">
                <span class="label">作用:</span> {{ item.shopInfo.作用 }}
              </div>
            </div>

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

      <!-- 中间装饰 (仅PC显示) -->
      <div class="divider-visual desktop-only">
        <div class="line"></div>
        <div class="icon">⚖</div>
        <div class="line"></div>
      </div>

      <!-- 右侧：购买列表 (移动端仅在 activeTab === 'buy' 时显示) -->
      <div class="panel right-panel" :class="{ 'mobile-hidden': activeTab !== 'buy' }">
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

            <div class="card-details" v-if="expandedItem === name">
              <div class="desc-text">{{ item.描述 }}</div>
              <div class="effect-text" v-if="item.作用">
                <span class="label">作用:</span> {{ item.作用 }}
              </div>
            </div>

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

      <!-- 移动端专用：交易确认页 (仅在 activeTab === 'confirm' 时显示) -->
      <div class="panel confirm-panel mobile-only" v-if="activeTab === 'confirm'">
        <div class="panel-header">
          <div class="ph-left">
            <h3>交易清单</h3>
            <span class="hint">Invoice</span>
          </div>
          <div class="ph-right" @click="clearQueue" style="color: #ff4d4d; cursor: pointer;">清空</div>
        </div>

        <div class="scroll-area custom-scrollbar invoice-area">
          <div v-if="queueTotalCount === 0" class="empty-tip">
            <span>📝</span><br>暂无交易项
          </div>

          <!-- 交易列表 -->
          <div class="invoice-list" v-else>
            <div v-for="(data, name) in transactionQueue" :key="name" class="invoice-item">
              <div class="inv-left">
                <div class="inv-name">{{ name }}</div>
                <div class="inv-type" :class="data.type">
                  {{ data.type === 'buy' ? '购买' : '出售' }}
                </div>
              </div>
              <div class="inv-right">
                <div class="inv-calc">{{ data.count }} × {{ data.price }}g</div>
                <div class="inv-total" :class="data.type === 'buy' ? 'cost' : 'gain'">
                  {{ data.type === 'buy' ? '-' : '+' }}{{ (data.count * data.price).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 结算汇总区域 -->
          <div class="invoice-summary" v-if="queueTotalCount > 0">
            <div class="summary-row">
              <span>当前资金</span>
              <span>{{ totalGold.toFixed(2) }}g</span>
            </div>
            <div class="summary-row">
              <span>总收入</span>
              <span class="gain">+{{ pendingGain.toFixed(2) }}g</span>
            </div>
            <div class="summary-row">
              <span>总支出</span>
              <span class="cost">-{{ pendingCost.toFixed(2) }}g</span>
            </div>
            <div class="divider-dashed"></div>
            <div class="summary-row final">
              <span>预计结余</span>
              <span :class="finalBalance < 0 ? 'danger' : 'safe'">{{ finalBalance.toFixed(2) }}g</span>
            </div>

            <button class="btn-mobile-confirm" :disabled="queueTotalCount === 0" @click="submitTransaction">
              确认交易
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PC端：底部悬浮交易栏 (移动端隐藏) -->
    <Transition name="slide-up">
      <div class="trade-bar-wrapper desktop-only" v-if="queueTotalCount > 0">
        <div class="trade-bar">
          <div class="trade-info-compact">
            <div class="info-group">
              <span class="label">预计结余</span>
              <div class="value-main" :class="finalBalance < 0 ? 'danger' : 'safe'">
                <span class="symbol">⟡</span>{{ finalBalance.toFixed(2) }}
              </div>
            </div>
            <div class="separator"></div>
            <div class="info-group">
              <span class="label">变动</span>
              <div class="value-sub">
                <span class="diff-val gain" v-if="pendingGain > 0">+{{ pendingGain.toFixed(2) }}</span>
                <span class="diff-val cost" v-if="pendingCost > 0"> -{{ pendingCost.toFixed(2) }}</span>
                <span class="diff-val neutral" v-if="pendingGain === 0 && pendingCost === 0">0</span>
              </div>
            </div>
          </div>
          <div class="trade-actions-compact">
            <button class="btn-icon-clear" @click="clearQueue" title="清空">✕</button>
            <button class="btn-confirm-compact" @click="submitTransaction">
              <span class="btn-text">确认交易</span>
              <span class="badge">{{ queueTotalCount }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 移动端：底部导航栏 (非悬浮，Flex布局) -->
    <div class="mobile-nav mobile-only">
      <div class="nav-item" :class="{ active: activeTab === 'sell' }" @click="activeTab = 'sell'">
        <span class="nav-icon">🎒</span>
        <span class="nav-label">出售</span>
      </div>
      <div class="nav-item" :class="{ active: activeTab === 'buy' }" @click="activeTab = 'buy'">
        <span class="nav-icon">🛒</span>
        <span class="nav-label">购买</span>
      </div>
      <div class="nav-item" :class="{ active: activeTab === 'confirm' }" @click="activeTab = 'confirm'">
        <span class="nav-icon">🧾</span>
        <span class="nav-label">结算</span>
        <span class="nav-badge" v-if="queueTotalCount > 0">{{ queueTotalCount }}</span>
      </div>
    </div>
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
const activeTab = ref<'sell' | 'buy' | 'confirm'>('sell'); // 移动端Tab状态
const transactionQueue = reactive<Record<string, { type: 'buy' | 'sell', count: number, price: number, info: any }>>({});

// --- 交互逻辑 ---
const handleGlobalClick = () => {
  // 预留全局点击处理
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
const totalGold = computed(() => statStore.stat_data?.角色?.user?.金钱 || 0);
const userInventory = computed(() => statStore.stat_data?.角色?.user?.物品 || {});

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
      描述: data.info.描述,
      作用: data.info.作用,
      耐久信息: data.type === 'sell' ? `当前耐久:${data.info.当前耐久}` : `最大耐久:${data.info.最大耐久}`
    });
  }

  const balance = finalBalance.value;
  let balanceInfo = `交易完成后余额: ${balance.toFixed(4)}g`;

  if (balance < 0) {
    balanceInfo += `（<user>没有足够的金钱，需要说服店主，交易可能失败）`;
  }

  const log = `<user>打算完成以下交易:\n<list>\n${JSON.stringify(items, null, 4)}\n</list>\n${balanceInfo}\n如果顺利，则离开当前场景\n`;

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

/* --- 资产显示 --- */
.gold-wrapper {
  position: relative;
}

.gold-display {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  min-width: 140px;
  backdrop-filter: blur(5px);
  cursor: default;
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
  padding-bottom: 120px;
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

/* --- PC端 底部交易栏 (默认显示) --- */
.trade-bar-wrapper {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  min-width: 400px;
  max-width: 90%;
  z-index: 500;
  pointer-events: none;
  display: flex; /* PC端默认显示 */
}

.trade-bar {
  pointer-events: auto;
  background: rgba(11, 12, 16, 0.85);
  border: 1px solid rgba(230, 193, 92, 0.3);
  border-top: 1px solid rgba(230, 193, 92, 0.5);
  border-radius: 16px;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px);
}

.trade-info-compact { display: flex; align-items: center; gap: 20px; }
.info-group { display: flex; flex-direction: column; justify-content: center; }
.info-group .label { font-size: 0.7rem; color: var(--c-text-dim); text-transform: uppercase; margin-bottom: 2px; }
.value-main { font-family: var(--font-mono); font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: 4px; }
.value-main.safe { color: var(--c-gold); }
.value-main.danger { color: #ff4d4d; }
.separator { width: 1px; height: 24px; background: rgba(255,255,255,0.15); }
.value-sub { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 600; }
.diff-val.gain { color: var(--c-accent-sell); }
.diff-val.cost { color: var(--c-accent-buy); }
.diff-val.neutral { color: var(--c-text-dim); }

.trade-actions-compact { display: flex; align-items: center; gap: 12px; }
.btn-icon-clear { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: var(--c-text-dim); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-icon-clear:hover { color: #ff4d4d; border-color: rgba(255,77,77,0.4); }

.btn-confirm-compact {
  background: linear-gradient(135deg, var(--c-gold) 0%, #b8860b 100%);
  border: none; padding: 0 24px; height: 44px; border-radius: 8px;
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  box-shadow: 0 4px 15px rgba(230, 193, 92, 0.25);
  transition: all 0.2s ease;
}
.btn-confirm-compact:hover { transform: translateY(-2px); filter: brightness(1.1); }
.btn-text { color: #0b0c10; font-weight: 800; font-family: var(--font-serif); }
.badge { background: #0b0c10; color: var(--c-gold); font-family: var(--font-mono); font-size: 0.8rem; padding: 2px 8px; border-radius: 10px; }

/* --- 装饰分割线 --- */
.divider-visual {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--c-panel-border); width: 40px;
}
.line { flex: 1; width: 1px; background: linear-gradient(to bottom, transparent, var(--c-panel-border), transparent); }
.icon { padding: 10px 0; font-size: 1.2rem; opacity: 0.5; }

/* --- 移动端专用组件 (默认隐藏) --- */
.mobile-nav { display: none; } /* PC端隐藏导航栏 */
.confirm-panel { display: none; } /* PC端隐藏确认面板 */

/* 移动端交易清单页样式 */
.invoice-list { padding: 10px 0; }
.invoice-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
}
.inv-left { display: flex; flex-direction: column; gap: 4px; }
.inv-name { font-weight: bold; color: #fff; }
.inv-type { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; display: inline-block; width: fit-content; }
.inv-type.buy { background: rgba(255, 126, 103, 0.2); color: var(--c-accent-buy); }
.inv-type.sell { background: rgba(100, 255, 218, 0.2); color: var(--c-accent-sell); }

.inv-right { text-align: right; }
.inv-calc { font-size: 0.8rem; color: var(--c-text-dim); font-family: var(--font-mono); }
.inv-total { font-family: var(--font-mono); font-weight: bold; }
.inv-total.gain { color: var(--c-accent-sell); }
.inv-total.cost { color: var(--c-accent-buy); }

.invoice-summary {
  margin-top: 20px; padding: 20px;
  background: rgba(0,0,0,0.3); border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.05);
}
.summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; color: var(--c-text-dim); }
.summary-row span:last-child { font-family: var(--font-mono); color: #fff; }
.summary-row .gain { color: var(--c-accent-sell) !important; }
.summary-row .cost { color: var(--c-accent-buy) !important; }
.divider-dashed { border-bottom: 1px dashed rgba(255,255,255,0.1); margin: 15px 0; }
.summary-row.final { font-size: 1.2rem; font-weight: bold; color: #fff; margin-bottom: 20px; }
.summary-row.final .safe { color: var(--c-gold) !important; }
.summary-row.final .danger { color: #ff4d4d !important; }

.btn-mobile-confirm {
  width: 100%; padding: 15px; border: none; border-radius: 8px;
  background: var(--c-gold); color: #0b0c10;
  font-weight: bold; font-size: 1.1rem; font-family: var(--font-serif);
  cursor: pointer; transition: all 0.2s;
}
.btn-mobile-confirm:disabled { background: #4a5568; color: #718096; cursor: not-allowed; }

/* --- 滚动条与动画 --- */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
.empty-tip { text-align: center; color: var(--c-text-dim); padding-top: 50px; font-style: italic; opacity: 0.5; }
.empty-tip span { font-size: 2rem; display: block; margin-bottom: 10px; filter: grayscale(1); }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 100%); opacity: 0; }

/* --- 响应式适配 (关键逻辑) --- */
@media (max-width: 768px) {
  /* 1. 隐藏PC端元素 */
  .desktop-only { display: none !important; }
  .trade-bar-wrapper { display: none !important; } /* 隐藏PC悬浮条 */
  .divider-visual { display: none; }

  /* 2. 显示移动端元素 */
  .mobile-only { display: flex; }
  .confirm-panel { display: flex; } /* 允许显示确认面板 */

  /* 3. 移动端导航栏样式 (非悬浮，Flex布局) */
  .mobile-nav {
    /* 取消 fixed 定位，改为文档流 */
    position: relative;
    width: 100%;
    height: 60px;
    background: #14161c;
    border-top: 1px solid rgba(255,255,255,0.1);
    display: flex !important; /* 强制显示 */
    justify-content: space-around;
    align-items: center;
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom);
    flex-shrink: 0; /* 防止被挤压 */
  }

  .nav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; color: var(--c-text-dim); position: relative;
    transition: all 0.2s;
  }
  .nav-item.active { color: var(--c-gold); background: rgba(255,255,255,0.03); }
  .nav-icon { font-size: 1.2rem; margin-bottom: 2px; }
  .nav-label { font-size: 0.7rem; }
  .nav-badge {
    position: absolute; top: 5px; right: 25%;
    background: #ff4d4d; color: white; font-size: 0.6rem;
    padding: 2px 5px; border-radius: 10px; font-weight: bold;
  }

  /* 4. 布局调整 */
  .shop-view {
    height: 100vh; /* 兼容旧浏览器 */
    height: 100dvh; /* 适配移动端动态视口 */
    overflow: hidden;
    display: flex;
    flex-direction: column; /* 垂直排列：Header -> Content -> Nav */
  }

  .shop-header { padding: 15px; flex-shrink: 0; }
  .header-content { flex-direction: column; gap: 10px; align-items: stretch; }
  .title-group { text-align: center; }
  .gold-wrapper { width: 100%; }
  .gold-display { width: 100%; box-sizing: border-box; justify-content: space-between; }

  .shop-content {
    flex: 1; /* 自动占据剩余空间 */
    flex-direction: column;
    padding: 10px;
    gap: 0;
    height: auto; /* 取消固定高度计算 */
    overflow: hidden; /* 内部滚动 */
  }

  .panel {
    height: 100%; border: none; background: transparent; box-shadow: none;
    display: flex; flex-direction: column;
  }

  /* 5. 隐藏非当前Tab的面板 (仅在移动端生效) */
  .mobile-hidden { display: none !important; }

  .scroll-area { padding-bottom: 20px; /* 底部不再需要为悬浮栏留白 */ }

  /* 确认页特殊处理 */
  .confirm-panel { background: var(--c-panel-bg); border-radius: 12px; height: 100%; }
  .invoice-area { padding: 15px; padding-bottom: 20px; }
}
</style>
