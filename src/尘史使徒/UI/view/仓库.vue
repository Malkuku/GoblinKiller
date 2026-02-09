<template>
  <div class="ac-inventory-manager">
    <!-- 顶部状态栏 -->
    <header class="manager-header">
      <div class="header-title">
        <span class="animus-icon"></span>
        <h2>物资调配 / LOGISTICS</h2>
      </div>

      <div class="header-actions">
        <div v-if="hasUnsavedChanges" class="unsaved-warning">
          <span class="blink">⚠</span> 检测到未同步的现实扭曲
        </div>
        <button
          class="ac-btn save-btn"
          :class="{ 'is-active': hasUnsavedChanges }"
          :disabled="!hasUnsavedChanges || isSaving"
          @click="saveAllChanges"
        >
          <span v-if="isSaving">同步中...</span>
          <span v-else>确认变更 (COMMIT)</span>
        </button>
      </div>
    </header>

    <!-- 主体双栏区域 -->
    <div class="manager-body">

      <!-- 左侧：随身行囊 -->
      <div class="pane backpack-pane">
        <div class="pane-header">
          <h3>行囊 <small>INVENTORY</small></h3>
          <div class="pane-tools">
            <input v-model="searchQuery" placeholder="检索物品..." class="ac-input" />
          </div>
        </div>

        <div class="item-grid custom-scroll">
          <div
            v-for="item in backpackList"
            :key="item.name"
            class="item-card"
            :class="[
              getItemStyle(item),
              { 'is-modified': item.isModified },
              { 'is-expanded': activeItemId === 'bag-' + item.name }
            ]"
            @click="toggleItemExpand(item, 'toWarehouse', 'bag')"
          >
            <!-- 1. 卡片头部 (始终显示) -->
            <div class="card-inner">
              <div class="item-icon">{{ item.name[0] }}</div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-meta">
                  <span class="item-type">{{ item.raw.类型 || '杂物' }}</span>
                  <span class="item-durability" v-if="item.durability > 0">
                    <div class="dur-bar" :style="{ width: Math.min(item.durability, 100) + '%' }"></div>
                  </span>
                </div>
              </div>
              <div class="item-qty">x{{ item.quantity }}</div>
            </div>

            <!-- 2. 展开区域 (包含详情 + 操作栏) -->
            <div
              v-if="activeItemId === 'bag-' + item.name"
              class="expanded-panel"
              @click.stop
            >
              <!-- 详情文本 -->
              <div class="item-details">
                <p v-if="item.raw.描述" class="detail-desc">"{{ item.raw.描述 }}"</p>
                <p v-if="item.raw.作用" class="detail-effect">
                  <span class="bullet">✦</span> {{ item.raw.作用 }}
                </p>
              </div>

              <!-- 操作栏 -->
              <div class="transfer-action-bar">
                <div class="slider-wrapper">
                  <!-- 只有数量大于1时才显示滑动条 -->
                  <template v-if="item.quantity > 1">
                    <span class="qty-label">{{ transferAmount }}</span>
                    <input
                      type="range"
                      v-model.number="transferAmount"
                      min="1"
                      :max="item.quantity"
                      class="mini-slider"
                    >
                    <span class="qty-max">/ {{ item.quantity }}</span>
                  </template>
                  <!-- 数量为1时显示静态文本 -->
                  <template v-else>
                    <span class="qty-static">仅有 1 个</span>
                  </template>
                </div>
                <button class="mini-confirm-btn" @click="confirmTransfer">
                  存入 ➔
                </button>
              </div>
            </div>
          </div>
          <div v-if="backpackList.length === 0" class="empty-state">行囊空空如也</div>
        </div>
      </div>

      <!-- 中间：装饰性连接符 -->
      <div class="divider-column">
        <div class="arrow-icon">⇄</div>
      </div>

      <!-- 右侧：漫宿仓库 -->
      <div class="pane warehouse-pane">
        <div class="pane-header">
          <h3>仓库 <small>WAREHOUSE</small></h3>
          <div class="pane-tools">
            <!-- 可以在此添加仓库特定的筛选 -->
          </div>
        </div>

        <div class="item-grid custom-scroll">
          <div
            v-for="item in warehouseList"
            :key="item.name"
            class="item-card"
            :class="[
              getItemStyle(item),
              { 'is-modified': item.isModified },
              { 'is-expanded': activeItemId === 'wh-' + item.name }
            ]"
            @click="toggleItemExpand(item, 'toBackpack', 'wh')"
          >
            <!-- 1. 卡片头部 -->
            <div class="card-inner">
              <div class="item-icon">{{ item.name[0] }}</div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-meta">
                  <span class="item-type">{{ item.raw.类型 || '杂物' }}</span>
                  <span class="item-durability" v-if="item.durability > 0">
                    <div class="dur-bar" :style="{ width: Math.min(item.durability, 100) + '%' }"></div>
                  </span>
                </div>
              </div>
              <div class="item-qty">x{{ item.quantity }}</div>
            </div>

            <!-- 2. 展开区域 -->
            <div
              v-if="activeItemId === 'wh-' + item.name"
              class="expanded-panel"
              @click.stop
            >
              <!-- 详情文本 -->
              <div class="item-details">
                <p v-if="item.raw.描述" class="detail-desc">"{{ item.raw.描述 }}"</p>
                <p v-if="item.raw.作用" class="detail-effect">
                  <span class="bullet">✦</span> {{ item.raw.作用 }}
                </p>
              </div>

              <!-- 操作栏 -->
              <div class="transfer-action-bar">
                <div class="slider-wrapper">
                  <template v-if="item.quantity > 1">
                    <span class="qty-label">{{ transferAmount }}</span>
                    <input
                      type="range"
                      v-model.number="transferAmount"
                      min="1"
                      :max="item.quantity"
                      class="mini-slider"
                    >
                    <span class="qty-max">/ {{ item.quantity }}</span>
                  </template>
                  <template v-else>
                    <span class="qty-static">仅有 1 个</span>
                  </template>
                </div>
                <button class="mini-confirm-btn" @click="confirmTransfer">
                  取出 ➔
                </button>
              </div>
            </div>
          </div>
          <div v-if="warehouseList.length === 0" class="empty-state">仓库空置</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { ERAUtil } from '@/Utils/ERAUtil';
import { MessageUtil } from '@/Utils/MessageUtil';

// --- 状态定义 ---
const statStore = useStatStore();
const localBackpack = ref({});
const localWarehouse = ref({});
const hasUnsavedChanges = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');

// 交互状态
const activeItemId = ref(null); // 格式: 'bag-itemName' 或 'wh-itemName'
const pendingTransferItem = ref(null);
const pendingTransferDirection = ref(''); // 'toWarehouse' | 'toBackpack'
const transferAmount = ref(1);

// --- 初始化 ---
onMounted(() => {
  resetInventory();
});

function resetInventory() {
  const rawBackpack = statStore.stat_data?.角色.user.物品 || {};
  const rawWarehouse = statStore.stat_data?.仓库 || {};

  localBackpack.value = JSON.parse(JSON.stringify(rawBackpack));
  localWarehouse.value = JSON.parse(JSON.stringify(rawWarehouse));
  hasUnsavedChanges.value = false;
  activeItemId.value = null;
}

// --- 数据处理 ---
const processList = (sourceObj) => {
  return Object.entries(sourceObj)
    .filter(([key]) => key !== '$template')
    .map(([key, val]) => ({
      name: key,
      quantity: val.数量 || 0,
      durability: val.耐久 || 0,
      isModified: val.isModified || false,
      raw: val
    }))
    .filter(item => {
      if (!searchQuery.value) return true;
      return item.name.includes(searchQuery.value) ||
        (item.raw.类型 && item.raw.类型.includes(searchQuery.value));
    })
    .sort((a, b) => {
      if (a.isModified && !b.isModified) return -1;
      if (!a.isModified && b.isModified) return 1;
      return a.name.localeCompare(b.name);
    });
};

const backpackList = computed(() => processList(localBackpack.value));
const warehouseList = computed(() => processList(localWarehouse.value));

const getItemStyle = (item) => {
  const type = item.raw.类型 || '';
  const name = item.name || '';
  if (name.includes('刃') || type === '武器') return 'style-weapon';
  if (name.includes('书') || type === '密传') return 'style-lore';
  if (name.includes('币') || type === '货币') return 'style-currency';
  return 'style-default';
};

// --- 交互逻辑 ---

function toggleItemExpand(item, direction, prefix) {
  const id = `${prefix}-${item.name}`;

  if (activeItemId.value === id) {
    closeTransfer();
  } else {
    activeItemId.value = id;
    pendingTransferItem.value = item;
    pendingTransferDirection.value = direction;
    // 默认数量：如果有多个，默认为1；如果只有1个，也为1
    transferAmount.value = 1;
  }
}

function closeTransfer() {
  activeItemId.value = null;
  pendingTransferItem.value = null;
}

function confirmTransfer() {
  if (!pendingTransferItem.value || transferAmount.value <= 0) return;

  const item = pendingTransferItem.value;
  const qty = transferAmount.value;
  const direction = pendingTransferDirection.value;

  const isStoring = direction === 'toWarehouse';
  const sourceObj = isStoring ? localBackpack.value : localWarehouse.value;
  const targetObj = isStoring ? localWarehouse.value : localBackpack.value;

  // 1. 扣除源头
  if (sourceObj[item.name]) {
    sourceObj[item.name].数量 -= qty;
    sourceObj[item.name].isModified = true;
    if (sourceObj[item.name].数量 <= 0) {
      delete sourceObj[item.name];
      closeTransfer(); // 物品没了，关闭展开
    }
  }

  // 2. 增加目标
  if (targetObj[item.name]) {
    const existing = targetObj[item.name];
    const newDurability = Math.ceil((existing.耐久 + item.durability) / 2);
    existing.数量 += qty;
    existing.耐久 = newDurability;
    existing.isModified = true;
  } else {
    targetObj[item.name] = {
      ...item.raw,
      "数量": qty,
      "耐久": item.durability,
      "isModified": true
    };
  }

  hasUnsavedChanges.value = true;
  // 如果源物品还有剩余，保持展开方便继续操作
  if (sourceObj[item.name]) {
    // 重置滑块
    transferAmount.value = 1;
  }
}

// --- 保存逻辑 ---
async function saveAllChanges() {
  if (isSaving.value) return;
  isSaving.value = true;

  try {
    const deletePayload = { "器具": {}, "仓库": {} };
    const insertPayload = { "器具": {}, "仓库": {} };
    const exchangeLogs = [];

    const remoteBackpack = statStore.stat_data?.器具 || {};
    const remoteWarehouse = statStore.stat_data?.仓库 || {};

    Object.keys(remoteBackpack).forEach(k => { if(k!=='$template') deletePayload["器具"][k] = {}; });
    Object.keys(remoteWarehouse).forEach(k => { if(k!=='$template') deletePayload["仓库"][k] = {}; });

    Object.entries(localBackpack.value).forEach(([k, v]) => {
      if(k!=='$template') {
        const { isModified, ...clean } = v;
        insertPayload["器具"][k] = clean;
      }
    });
    Object.entries(localWarehouse.value).forEach(([k, v]) => {
      if(k!=='$template') {
        const { isModified, ...clean } = v;
        insertPayload["仓库"][k] = clean;
      }
    });

    const allNames = new Set([
      ...Object.keys(remoteBackpack), ...Object.keys(remoteWarehouse),
      ...Object.keys(localBackpack.value), ...Object.keys(localWarehouse.value)
    ]);

    allNames.forEach(name => {
      if (name === '$template') return;
      const oldBag = remoteBackpack[name]?.数量 || 0;
      const newBag = localBackpack.value[name]?.数量 || 0;
      const oldWh = remoteWarehouse[name]?.数量 || 0;
      const newWh = localWarehouse.value[name]?.数量 || 0;

      const bagDiff = newBag - oldBag;
      const whDiff = newWh - oldWh;

      if (bagDiff < 0 && whDiff > 0) {
        exchangeLogs.push({ "名称": name, "数量": Math.min(Math.abs(bagDiff), whDiff), "方向": "存入仓库" });
      } else if (bagDiff > 0 && whDiff < 0) {
        exchangeLogs.push({ "名称": name, "数量": Math.min(bagDiff, Math.abs(whDiff)), "方向": "取出到背包" });
      }
    });

    if (Object.keys(deletePayload["器具"]).length > 0 || Object.keys(deletePayload["仓库"]).length > 0) {
      await ERAUtil.DeleteByObject(deletePayload);
    }
    if (Object.keys(insertPayload["器具"]).length > 0 || Object.keys(insertPayload["仓库"]).length > 0) {
      await ERAUtil.InsertByObject(insertPayload);
    }

    if (exchangeLogs.length > 0) {
      const logText = `\n<user>与漫宿之上的神秘空间完成了物品交换:\n${JSON.stringify(exchangeLogs, null, 0)}\n`;
      await MessageUtil.mergeContentToMessage(getLastMessageId(), logText, 'none');
    }

    hasUnsavedChanges.value = false;
    Object.values(localBackpack.value).forEach(i => i.isModified = false);
    Object.values(localWarehouse.value).forEach(i => i.isModified = false);
    activeItemId.value = null;

  } catch (e) {
    console.error("Inventory Sync Failed:", e);
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
/* --- 基础变量 --- */
.ac-inventory-manager {
  --c-gold: #d4af37;
  --c-gold-dim: rgba(212, 175, 55, 0.3);
  --c-bg: #0f0f13;
  --c-bg-panel: #16161a;
  --c-text: #e0e0e0;
  --c-danger: #ff4d4d;
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--font-body);
  overflow: hidden;
}

/* --- 头部 --- */
.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid var(--c-gold);
  background: linear-gradient(to right, rgba(0,0,0,0.8), transparent);
  flex-shrink: 0;
}

.header-title h2 {
  margin: 0;
  font-family: var(--font-title);
  color: var(--c-gold);
  font-size: 1.4rem;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.animus-icon {
  width: 10px; height: 10px;
  background: var(--c-gold);
  transform: rotate(45deg);
  box-shadow: 0 0 8px var(--c-gold);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.unsaved-warning {
  color: var(--c-gold);
  font-size: 0.9rem;
  font-family: var(--font-title);
  display: none;
}
@media (min-width: 768px) {
  .unsaved-warning { display: block; }
}

.blink { animation: blink 1.5s infinite; }
@keyframes blink { 50% { opacity: 0; } }

.ac-btn {
  background: transparent;
  border: 1px solid var(--c-gold-dim);
  color: var(--c-gold);
  padding: 8px 20px;
  font-family: var(--font-title);
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
}

.ac-btn:hover:not(:disabled) {
  background: var(--c-gold);
  color: #000;
  box-shadow: 0 0 15px var(--c-gold-dim);
}

.ac-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: #444;
  color: #666;
}

.save-btn.is-active {
  border-color: var(--c-gold);
  box-shadow: inset 0 0 10px rgba(212, 175, 55, 0.1);
}

/* --- 主体区域 --- */
.manager-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px;
  gap: 10px;
  flex-direction: row;
}

.pane {
  flex: 1;
  background: var(--c-bg-panel);
  border: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  border-radius: 2px;
  min-width: 0;
  min-height: 0;
}

.pane-header {
  padding: 15px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.pane-header h3 {
  margin: 0;
  font-family: var(--font-title);
  color: #ccc;
  font-size: 1.1rem;
}

.pane-header small {
  color: #666;
  font-size: 0.7rem;
  margin-left: 8px;
}

.ac-input {
  background: rgba(0,0,0,0.3);
  border: none;
  border-bottom: 1px solid #444;
  color: #fff;
  padding: 5px 10px;
  font-family: var(--font-body);
  width: 120px;
  transition: 0.3s;
}
.ac-input:focus {
  outline: none;
  border-color: var(--c-gold);
  width: 150px;
}

.divider-column {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  flex-shrink: 0;
  color: var(--c-gold-dim);
  font-size: 1.5rem;
}

/* --- 物品网格 --- */
.item-grid {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  /* 允许卡片高度自适应 */
  grid-auto-rows: minmax(70px, auto);
  gap: 10px;
  align-content: start;
  min-height: 0;
}

.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

/* --- 卡片样式 --- */
.item-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 70px;
}

.item-card:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.2);
}

.item-card.is-expanded {
  background: rgba(0,0,0,0.5);
  border-color: var(--c-gold);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  z-index: 10;
  grid-row: span 2; /* 尝试让展开的卡片占更多空间，视情况而定 */
}

.item-card.is-modified {
  border-left: 3px solid var(--c-gold);
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.05), transparent);
}

.card-inner {
  display: flex;
  align-items: center;
  padding: 0 10px;
  height: 70px;
  flex-shrink: 0;
}

.item-icon {
  width: 40px;
  height: 40px;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-size: 1.2rem;
  color: #666;
  margin-right: 10px;
  border: 1px solid #333;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.item-name {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95rem;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.item-type {
  font-size: 0.7rem;
  color: #888;
  text-transform: uppercase;
}

.item-durability {
  flex: 1;
  height: 3px;
  background: #333;
  max-width: 50px;
}

.dur-bar {
  height: 100%;
  background: #888;
}

.item-qty {
  font-family: var(--font-title);
  color: var(--c-gold);
  font-size: 1.1rem;
  margin-left: 10px;
  flex-shrink: 0;
}

/* --- 展开面板 (包含详情和操作) --- */
.expanded-panel {
  border-top: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.3);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 详情文本 */
.item-details {
  font-size: 0.85rem;
  color: #aaa;
  line-height: 1.4;
  padding: 0 5px;
}

.detail-desc {
  font-style: italic;
  margin: 0 0 6px 0;
  color: #888;
}

.detail-effect {
  margin: 0;
  color: #ccc;
}
.detail-effect .bullet {
  color: var(--c-gold);
  margin-right: 4px;
}

/* 操作栏 */
.transfer-action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}

.slider-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0,0,0,0.4);
  padding: 4px 8px;
  border-radius: 4px;
  height: 32px; /* 固定高度 */
}

.qty-label {
  color: var(--c-gold);
  font-family: var(--font-title);
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.qty-static {
  color: #888;
  font-size: 0.8rem;
  flex: 1;
  text-align: center;
}

.mini-slider {
  flex: 1;
  accent-color: var(--c-gold);
  height: 4px;
  cursor: pointer;
}

.qty-max {
  font-size: 0.7rem;
  color: #666;
}

.mini-confirm-btn {
  background: var(--c-gold);
  color: #000;
  border: none;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  border-radius: 2px;
  white-space: nowrap;
  transition: 0.2s;
  height: 32px;
}

.mini-confirm-btn:hover {
  background: #fff;
  box-shadow: 0 0 10px var(--c-gold);
}

/* 样式变体 */
.style-weapon .item-icon { color: #ff6b6b; border-color: rgba(255, 107, 107, 0.3); }
.style-lore .item-icon { color: #a29bfe; border-color: rgba(162, 155, 254, 0.3); }
.style-currency .item-icon { color: #ffeaa7; border-color: rgba(255, 234, 167, 0.3); }

/* --- 移动端适配 --- */
@media (max-width: 768px) {
  .manager-body {
    flex-direction: column;
    padding: 10px;
  }

  .divider-column {
    width: 100%;
    height: 40px;
  }
  .divider-column .arrow-icon {
    transform: rotate(90deg);
  }

  .pane {
    width: 100%;
    flex: 1;
  }

  .item-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  .header-title h2 {
    font-size: 1.1rem;
  }

  .ac-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
}
</style>
