<template>
  <div class="ac-inventory-manager" :class="{ 'mode-delete': isDeleteMode }">
    <!-- 顶部状态栏 -->
    <header class="manager-header">
      <div class="header-title">
        <span class="animus-icon"></span>
        <h2>物资调配 / LOGISTICS</h2>
      </div>

      <div class="header-actions">
        <!-- 新增：删除模式切换按钮 -->
        <button
          class="ac-btn delete-mode-btn"
          :class="{ 'is-active': isDeleteMode }"
          @click="toggleDeleteMode"
          :disabled="isSaving"
        >
          <span v-if="isDeleteMode">⚠ 删除模式开启</span>
          <span v-else>🗑 删除模式</span>
        </button>

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

      <!-- 移动端 Tab 切换栏 -->
      <div class="mobile-tabs">
        <div
          class="mobile-tab-item"
          :class="{ active: activeMobileTab === 'backpack' }"
          @click="activeMobileTab = 'backpack'"
        >
          行囊 ({{ Object.keys(localBackpack).length }})
        </div>
        <div
          class="mobile-tab-item"
          :class="{ active: activeMobileTab === 'warehouse' }"
          @click="activeMobileTab = 'warehouse'"
        >
          仓库 ({{ Object.keys(localWarehouse).length }})
        </div>
      </div>

      <!-- 左侧：随身行囊 -->
      <div
        class="pane backpack-pane"
        :class="{ 'mobile-hidden': activeMobileTab !== 'backpack' }"
      >
        <div class="pane-header">
          <h3>行囊 <small>INVENTORY</small></h3>
          <div class="header-controls">
            <div class="money-display" title="持有金钱">
              <span class="currency-symbol">◈</span>
              <span class="currency-val">{{ localMoney }}</span>
              <span class="currency-unit">g</span>
            </div>
            <div class="pane-tools">
              <input v-model="searchQuery" placeholder="检索物品..." class="ac-input" />
            </div>
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
            <!-- 卡片头部 -->
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

            <!-- 展开区域 -->
            <div
              v-if="activeItemId === 'bag-' + item.name"
              class="expanded-panel"
              @click.stop
            >
              <div class="item-details">
                <p v-if="item.raw.描述" class="detail-desc">"{{ item.raw.描述 }}"</p>
                <p v-if="item.raw.作用" class="detail-effect">
                  <span class="bullet">✦</span> {{ item.raw.作用 }}
                </p>
              </div>

              <!-- 操作栏 -->
              <div class="transfer-action-bar">
                <div class="slider-wrapper" :class="{ 'danger-zone': isDeleteMode }">
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

                <!-- 根据模式显示不同按钮 -->
                <button
                  v-if="!isDeleteMode"
                  class="mini-confirm-btn"
                  @click="confirmTransfer"
                >
                  存入 ➔
                </button>
                <button
                  v-else
                  class="mini-confirm-btn btn-danger"
                  @click="confirmDelete"
                >
                  丢弃 🗑
                </button>
              </div>
            </div>
          </div>
          <div v-if="backpackList.length === 0" class="empty-state">行囊空空如也</div>
        </div>
      </div>

      <!-- 中间：装饰性连接符 -->
      <div class="divider-column">
        <div class="arrow-icon" v-if="!isDeleteMode">⇄</div>
        <div class="arrow-icon danger-icon" v-else>🗑</div>
      </div>

      <!-- 右侧：漫宿仓库 -->
      <div
        class="pane warehouse-pane"
        :class="{ 'mobile-hidden': activeMobileTab !== 'warehouse' }"
      >
        <div class="pane-header">
          <h3>仓库 <small>WAREHOUSE</small></h3>
          <div class="pane-tools"></div>
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
            <!-- 卡片头部 -->
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

            <!-- 展开区域 -->
            <div
              v-if="activeItemId === 'wh-' + item.name"
              class="expanded-panel"
              @click.stop
            >
              <div class="item-details">
                <p v-if="item.raw.描述" class="detail-desc">"{{ item.raw.描述 }}"</p>
                <p v-if="item.raw.作用" class="detail-effect">
                  <span class="bullet">✦</span> {{ item.raw.作用 }}
                </p>
              </div>

              <!-- 操作栏 -->
              <div class="transfer-action-bar">
                <div class="slider-wrapper" :class="{ 'danger-zone': isDeleteMode }">
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

                <!-- 根据模式显示不同按钮 -->
                <button
                  v-if="!isDeleteMode"
                  class="mini-confirm-btn"
                  @click="confirmTransfer"
                >
                  取出 ➔
                </button>
                <button
                  v-else
                  class="mini-confirm-btn btn-danger"
                  @click="confirmDelete"
                >
                  销毁 🗑
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
const localMoney = ref(0);
const hasUnsavedChanges = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');

// 新增：删除模式状态
const isDeleteMode = ref(false);

// 移动端 Tab 状态
const activeMobileTab = ref('backpack');

// 交互状态
const activeItemId = ref(null);
const pendingTransferItem = ref(null);
const pendingTransferDirection = ref('');
const transferAmount = ref(1);

// --- 初始化 ---
onMounted(() => {
  resetInventory();
});

function resetInventory() {
  // 路径修正：角色.user.物品
  const rawBackpack = statStore.stat_data?.角色?.user?.物品 || {};
  const rawWarehouse = statStore.stat_data?.仓库 || {};

  localMoney.value = statStore.stat_data?.角色?.user?.金钱 ?? 0;

  // 深拷贝断开引用，确保本地修改不影响 store
  localBackpack.value = JSON.parse(JSON.stringify(rawBackpack));
  localWarehouse.value = JSON.parse(JSON.stringify(rawWarehouse));

  hasUnsavedChanges.value = false;
  activeItemId.value = null;
  isDeleteMode.value = false;
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

function toggleDeleteMode() {
  isDeleteMode.value = !isDeleteMode.value;
  closeTransfer();
}

function toggleItemExpand(item, direction, prefix) {
  const id = `${prefix}-${item.name}`;

  if (activeItemId.value === id) {
    closeTransfer();
  } else {
    activeItemId.value = id;
    pendingTransferItem.value = item;
    pendingTransferDirection.value = direction;
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
      closeTransfer();
    }
  }

  // 2. 增加目标
  if (targetObj[item.name]) {
    const existing = targetObj[item.name];
    // 简单的耐久合并逻辑
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
  if (sourceObj[item.name]) {
    transferAmount.value = 1;
  }
}

function confirmDelete() {
  if (!pendingTransferItem.value || transferAmount.value <= 0) return;

  const item = pendingTransferItem.value;
  const qty = transferAmount.value;
  const direction = pendingTransferDirection.value;
  const isFromBackpack = direction === 'toWarehouse';
  const sourceObj = isFromBackpack ? localBackpack.value : localWarehouse.value;

  if (sourceObj[item.name]) {
    sourceObj[item.name].数量 -= qty;
    sourceObj[item.name].isModified = true;
    if (sourceObj[item.name].数量 <= 0) {
      delete sourceObj[item.name];
      closeTransfer();
    }
  }

  hasUnsavedChanges.value = true;
  if (sourceObj[item.name]) {
    transferAmount.value = 1;
  }
}

// --- 核心优化：严格差分保存逻辑 ---

/**
 * 辅助函数：清理对象中的临时字段 (如 isModified)
 */
function cleanData(item) {
  const { isModified, ...rest } = item;
  return rest;
}

/**
 * 辅助函数：构建嵌套 Payload
 * 确保同一层级的多个修改能合并到同一个对象中
 * 例如: root['仓库']['苹果'] = ... 和 root['仓库']['香蕉'] = ...
 */
function addToPayload(root, pathArr, key, value) {
  let current = root;
  // 遍历路径，构建中间层对象
  pathArr.forEach(pathKey => {
    if (!current[pathKey]) {
      current[pathKey] = {};
    }
    current = current[pathKey];
  });
  // 设置最终的值
  current[key] = value;
}

/**
 * 辅助函数：生成差分
 * @param {Object} localObj 本地数据 (如 localBackpack.value)
 * @param {Object} remoteObj 远程数据 (如 statStore...物品)
 * @param {Array} pathArr 数据在全局状态中的路径 (如 ['角色', 'user', '物品'])
 * @param {Object} payloads 包含 delete, insert, update 三个容器
 */
function generateDiff(localObj, remoteObj, pathArr, payloads) {
  // 获取所有涉及的键（并集）
  const allKeys = new Set([...Object.keys(localObj), ...Object.keys(remoteObj)]);

  allKeys.forEach(key => {
    if (key === '$template') return;

    const localItem = localObj[key];
    const remoteItem = remoteObj[key];

    // 情况 1: 远程有，本地无 -> 删除 (Delete)
    // 场景：物品被移走，或者被丢弃
    if (remoteItem && !localItem) {
      // API 规定：空对象 {} 表示删除该节点
      addToPayload(payloads.delete, pathArr, key, {});
    }

      // 情况 2: 本地有，远程无 -> 插入 (Insert)
    // 场景：物品是从别处移过来的，或者是新生成的
    else if (localItem && !remoteItem) {
      addToPayload(payloads.insert, pathArr, key, cleanData(localItem));
    }

      // 情况 3: 两边都有 -> 检查是否需要更新 (Update)
    // 场景：物品还在，但数量或耐久变了
    else if (localItem && remoteItem) {
      const cleanLocal = cleanData(localItem);
      // 简单深比较，如果数据不一致则更新
      if (JSON.stringify(cleanLocal) !== JSON.stringify(remoteItem)) {
        addToPayload(payloads.update, pathArr, key, cleanLocal);
      }
    }
  });
}

async function saveAllChanges() {
  if (isSaving.value) return;
  isSaving.value = true;

  try {
    // 1. 初始化 Payloads 容器
    const payloads = {
      delete: {},
      insert: {},
      update: {}
    };

    // 2. 获取远程快照 (作为对比基准)
    const remoteBackpack = statStore.stat_data?.角色?.user?.物品 || {};
    const remoteWarehouse = statStore.stat_data?.仓库 || {};

    // 3. 计算差分
    // 3.1 计算背包的变动 (路径: 角色 -> user -> 物品)
    generateDiff(
      localBackpack.value,
      remoteBackpack,
      ['角色', 'user', '物品'],
      payloads
    );

    // 3.2 计算仓库的变动 (路径: 仓库)
    generateDiff(
      localWarehouse.value,
      remoteWarehouse,
      ['仓库'],
      payloads
    );

    // 4. 按顺序执行 API 调用
    // 注意：这里必须分步执行，因为 API 是按类型区分的

    // 4.1 执行删除 (DeleteByObject)
    if (Object.keys(payloads.delete).length > 0) {
      await ERAUtil.DeleteByObject(payloads.delete);
    }

    // 4.2 执行更新 (UpdateByObject)
    if (Object.keys(payloads.update).length > 0) {
      await ERAUtil.UpdateByObject(payloads.update);
    }

    // 4.3 执行插入 (InsertByObject)
    if (Object.keys(payloads.insert).length > 0) {
      await ERAUtil.InsertByObject(payloads.insert);
    }

    // 5. 生成并发送日志 (仅用于显示，不影响数据)
    const exchangeLogs = [];
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

      // 日志逻辑：只有当一边减少且另一边增加时，才视为“交换”
      if (bagDiff < 0 && whDiff > 0) {
        exchangeLogs.push({ "名称": name, "数量": Math.min(Math.abs(bagDiff), whDiff), "方向": "存入仓库" });
      } else if (bagDiff > 0 && whDiff < 0) {
        exchangeLogs.push({ "名称": name, "数量": Math.min(bagDiff, Math.abs(whDiff)), "方向": "取出到背包" });
      }
    });

    if (exchangeLogs.length > 0) {
      const logText = `\n<user>与漫宿之上的神秘空间完成了物品交换:\n${JSON.stringify(exchangeLogs, null, 0)}\n`;
      // 兼容性处理：确保 getLastMessageId 存在
      const lastMsgId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
      await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');
    }

    // 6. 重置本地状态
    hasUnsavedChanges.value = false;
    Object.values(localBackpack.value).forEach(i => i.isModified = false);
    Object.values(localWarehouse.value).forEach(i => i.isModified = false);
    activeItemId.value = null;
    isDeleteMode.value = false;

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
  --c-danger-dim: rgba(255, 77, 77, 0.3);
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
  transition: background 0.5s;
}

/* 删除模式下的全局氛围 */
.ac-inventory-manager.mode-delete {
  --c-gold: #ff4d4d; /* 将主色调临时替换为红色 */
  --c-gold-dim: rgba(255, 77, 77, 0.3);
  background: #1a0f0f;
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
  transition: border-color 0.3s;
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

/* 删除模式按钮特定样式 */
.delete-mode-btn {
  border-color: #666;
  color: #888;
}
.delete-mode-btn:hover {
  border-color: var(--c-danger);
  color: var(--c-danger);
  background: transparent;
  box-shadow: none;
}
.delete-mode-btn.is-active {
  border-color: var(--c-danger);
  color: var(--c-danger);
  background: rgba(255, 77, 77, 0.1);
  box-shadow: 0 0 10px var(--c-danger-dim);
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

/* 移动端 Tab 默认隐藏 */
.mobile-tabs {
  display: none;
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

.header-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.money-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--c-gold);
  font-family: var(--font-title);
  background: rgba(212, 175, 55, 0.1);
  padding: 4px 10px;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 2px;
  user-select: none;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
}

/* 删除模式下金钱显示变暗，不突出 */
.mode-delete .money-display {
  filter: grayscale(1);
  opacity: 0.5;
}

.currency-symbol {
  font-size: 1.1rem;
  text-shadow: 0 0 5px var(--c-gold);
}

.currency-val {
  font-size: 1.1rem;
  font-weight: bold;
  letter-spacing: 1px;
  color: #fff;
}

.currency-unit {
  font-size: 0.8rem;
  color: #888;
  margin-left: 2px;
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

.danger-icon {
  color: var(--c-danger);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

/* --- 物品网格 --- */
.item-grid {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
  height: 32px;
}

.slider-wrapper.danger-zone {
  border: 1px solid rgba(255, 77, 77, 0.2);
  background: rgba(255, 0, 0, 0.05);
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

.mini-confirm-btn.btn-danger {
  background: var(--c-danger);
  color: #fff;
}
.mini-confirm-btn.btn-danger:hover {
  background: #ff8888;
  box-shadow: 0 0 10px var(--c-danger);
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

  .mobile-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 5px;
    flex-shrink: 0;
  }

  .mobile-tab-item {
    flex: 1;
    text-align: center;
    padding: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #888;
    font-family: var(--font-title);
    cursor: pointer;
    transition: 0.3s;
  }

  .mobile-tab-item.active {
    background: rgba(212, 175, 55, 0.1);
    border-color: var(--c-gold);
    color: var(--c-gold);
    box-shadow: inset 0 0 10px rgba(212, 175, 55, 0.05);
  }

  .divider-column {
    display: none;
  }

  .pane.mobile-hidden {
    display: none;
  }

  .pane {
    width: 100%;
    flex: 1;
    height: 100%;
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

  .header-controls {
    gap: 8px;
  }

  .money-display {
    padding: 2px 6px;
  }

  .currency-val {
    font-size: 0.9rem;
  }

  .ac-input {
    width: 80px;
  }
  .ac-input:focus {
    width: 100px;
  }
}
</style>
