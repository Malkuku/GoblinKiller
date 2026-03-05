<template>
  <div class="ac-inventory-manager" :class="{ 'mode-delete': isDeleteMode }">
    <!-- 顶部状态栏 -->
    <header class="manager-header">
      <div class="header-title">
        <span class="animus-icon"></span>
        <h2>物资调配 / LOGISTICS</h2>
      </div>

      <div class="header-actions">
        <!-- 批量删除确认按钮 (仅在删除模式且有选中项时显示) -->
        <transition name="fade">
          <button
            v-if="isDeleteMode && selectedItems.size > 0"
            class="ac-btn batch-delete-btn"
            @click="confirmBatchDelete"
          >
            🗑 确认删除 ({{ selectedItems.size }})
          </button>
        </transition>

        <!-- 删除模式切换按钮 -->
        <button
          class="ac-btn delete-mode-btn"
          :class="{ 'is-active': isDeleteMode }"
          @click="toggleDeleteMode"
          :disabled="isSaving"
        >
          <span v-if="isDeleteMode">退出删除模式</span>
          <span v-else>🗑 批量整理</span>
        </button>

        <div v-if="hasUnsavedChanges" class="unsaved-warning"><span class="blink">⚠</span> 未同步</div>
        <button
          class="ac-btn save-btn"
          :class="{ 'is-active': hasUnsavedChanges }"
          :disabled="!hasUnsavedChanges || isSaving"
          @click="saveAllChanges"
        >
          <span v-if="isSaving">同步中...</span>
          <span v-else>确认变更</span>
        </button>
      </div>
    </header>

    <!-- 分类筛选栏 -->
    <div class="category-bar-wrapper">
      <div class="category-scroll">
        <button
          v-for="cat in categories"
          :key="cat"
          class="cat-btn"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- 主体双栏区域 -->
    <div class="manager-body">
      <!-- 移动端 Tab 切换栏 -->
      <div class="mobile-tabs">
        <div
          class="mobile-tab-item"
          :class="{ active: activeMobileTab === 'backpack' }"
          @click="activeMobileTab = 'backpack'"
        >
          行囊 ({{ backpackList.length }})
        </div>
        <div
          class="mobile-tab-item"
          :class="{ active: activeMobileTab === 'warehouse' }"
          @click="activeMobileTab = 'warehouse'"
        >
          仓库 ({{ warehouseList.length }})
        </div>
      </div>

      <!-- 左侧：随身行囊 -->
      <div class="pane backpack-pane" :class="{ 'mobile-hidden': activeMobileTab !== 'backpack' }">
        <div class="pane-header">
          <div class="title-group">
            <h3>行囊 <small>INVENTORY</small></h3>
            <!-- 全选按钮 -->
            <button
              v-if="isDeleteMode && backpackList.length > 0"
              class="select-all-btn"
              @click="toggleSelectAll('bag')"
            >
              {{ isAllSelected('bag') ? '取消全选' : '全选' }}
            </button>
          </div>

          <div class="header-controls">
            <div class="money-display" title="持有金钱" v-if="!isDeleteMode">
              <span class="currency-symbol">◈</span>
              <span class="currency-val">{{ localMoney }}</span>
            </div>
            <div class="pane-tools">
              <input v-model="searchQuery" placeholder="检索..." class="ac-input" />
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
              { 'is-expanded': activeItemId === 'bag-' + item.name },
              { 'is-selected': isSelected('bag', item.name) },
              { 'mode-select': isDeleteMode },
            ]"
            @click="handleItemClick(item, 'toWarehouse', 'bag')"
          >
            <!-- 选中遮罩/复选框 -->
            <div v-if="isDeleteMode" class="selection-indicator">
              <div class="checkbox-inner"></div>
            </div>

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

            <!-- 展开区域 (仅在非删除模式下显示) -->
            <div v-if="activeItemId === 'bag-' + item.name && !isDeleteMode" class="expanded-panel" @click.stop>
              <div class="item-details">
                <p v-if="item.raw.描述" class="detail-desc">"{{ item.raw.描述 }}"</p>
                <p v-if="item.raw.作用" class="detail-effect"><span class="bullet">✦</span> {{ item.raw.作用 }}</p>
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
                    />
                    <span class="qty-max">/ {{ item.quantity }}</span>
                  </template>
                  <template v-else>
                    <span class="qty-static">仅有 1 个</span>
                  </template>
                </div>

                <button class="mini-confirm-btn" @click="confirmTransfer">存入 ➔</button>
              </div>
            </div>
          </div>
          <div v-if="backpackList.length === 0" class="empty-state">
            {{ activeCategory !== '全部' ? '该分类下无物品' : '行囊空空如也' }}
          </div>
        </div>
      </div>

      <!-- 中间：装饰性连接符 -->
      <div class="divider-column">
        <div class="arrow-icon" v-if="!isDeleteMode">⇄</div>
        <div class="arrow-icon danger-icon" v-else>✕</div>
      </div>

      <!-- 右侧：漫宿仓库 -->
      <div class="pane warehouse-pane" :class="{ 'mobile-hidden': activeMobileTab !== 'warehouse' }">
        <div class="pane-header">
          <div class="title-group">
            <h3>仓库 <small>WAREHOUSE</small></h3>
            <!-- 全选按钮 -->
            <button
              v-if="isDeleteMode && warehouseList.length > 0"
              class="select-all-btn"
              @click="toggleSelectAll('wh')"
            >
              {{ isAllSelected('wh') ? '取消全选' : '全选' }}
            </button>
          </div>
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
              { 'is-expanded': activeItemId === 'wh-' + item.name },
              { 'is-selected': isSelected('wh', item.name) },
              { 'mode-select': isDeleteMode },
            ]"
            @click="handleItemClick(item, 'toBackpack', 'wh')"
          >
            <!-- 选中遮罩/复选框 -->
            <div v-if="isDeleteMode" class="selection-indicator">
              <div class="checkbox-inner"></div>
            </div>

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
            <div v-if="activeItemId === 'wh-' + item.name && !isDeleteMode" class="expanded-panel" @click.stop>
              <div class="item-details">
                <p v-if="item.raw.描述" class="detail-desc">"{{ formatItemText(item.raw.描述, item) }}"</p>
                <p v-if="item.raw.作用" class="detail-effect">
                  <span class="bullet">✦</span> {{ formatItemText(item.raw.作用, item) }}
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
                    />
                    <span class="qty-max">/ {{ item.quantity }}</span>
                  </template>
                  <template v-else>
                    <span class="qty-static">仅有 1 个</span>
                  </template>
                </div>

                <button class="mini-confirm-btn" @click="confirmTransfer">取出 ➔</button>
              </div>
            </div>
          </div>
          <div v-if="warehouseList.length === 0" class="empty-state">
            {{ activeCategory !== '全部' ? '该分类下无物品' : '仓库空置' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { MvuUtil } from '@/Utils/MvuUtil';
import { MessageUtil } from '@/Utils/MessageUtil';

// --- 状态定义 ---
const statStore = useStatStore();
const localBackpack = ref({});
const localWarehouse = ref({});
const localMoney = ref(0);
const hasUnsavedChanges = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');

// 分类状态
const activeCategory = ref('全部');

// 删除模式与选中状态
const isDeleteMode = ref(false);
const selectedItems = ref(new Set()); // 存储格式: "prefix-itemName"

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
  const rawBackpack = statStore.stat_data?.角色?.user?.物品 || {};
  const rawWarehouse = statStore.stat_data?.仓库 || {};

  localMoney.value = statStore.stat_data?.角色?.user?.金钱 ?? 0;

  localBackpack.value = JSON.parse(JSON.stringify(rawBackpack));
  localWarehouse.value = JSON.parse(JSON.stringify(rawWarehouse));

  hasUnsavedChanges.value = false;
  activeItemId.value = null;
  isDeleteMode.value = false;
  selectedItems.value.clear();
  activeCategory.value = '全部';
}

// --- 文本正则格式化 ---
const formatItemText = (text, currentItem) => {
  if (!text || typeof text !== 'string') return text;

  return text.replace(/\$\{([^}]+)\}/g, (match, key) => {
    // 1. 物品自身属性替换 (例如 ${数量}, ${耐久})
    if (key === '数量' && currentItem) return `数量[${currentItem.quantity}]`;
    if (key === '耐久' && currentItem) return `耐久[${currentItem.durability}]`;

    // 2. 全局属性替换 (从 statStore 获取)
    const stats = statStore.stat_data;
    if (!stats) return match;

    // 检查 基础数值
    if (stats['基础数值'] && stats['基础数值'][key] !== undefined) {
      return `${key}[${stats['基础数值'][key]}]`;
    }

    // 检查 术之等级
    if (stats['术之等级'] && stats['术之等级'][key]) {
      const artData = stats['术之等级'][key];
      if (typeof artData === 'object' && artData['等级'] !== undefined) {
        return `${key}[${artData['等级']}]`;
      }
      if (typeof artData === 'number') {
        return `${key}[${artData}]`;
      }
    }

    // 检查 生命状态
    if (stats['生命状态'] && stats['生命状态'][key]) {
      const status = stats['生命状态'][key];
      if (typeof status === 'object' && status['当前'] !== undefined) {
        return `${key}[${status['当前']}]`;
      }
    }

    return match; // 如果都没找到，保持原样
  });
};

// --- 数据处理 ---
const categories = computed(() => {
  const types = new Set();
  const collectTypes = obj => {
    Object.entries(obj).forEach(([key, val]) => {
      if (key !== '$template' && val.类型) {
        types.add(val.类型);
      }
    });
  };
  collectTypes(localBackpack.value);
  collectTypes(localWarehouse.value);
  return ['全部', ...Array.from(types).sort()];
});

const processList = sourceObj => {
  return Object.entries(sourceObj)
    .filter(([key]) => key !== '$template')
    .map(([key, val]) => ({
      name: key,
      quantity: val.数量 || 0,
      durability: val.耐久 || 0,
      isModified: val.isModified || false,
      raw: val,
    }))
    .filter(item => {
      if (searchQuery.value) {
        const query = searchQuery.value;
        const matchesSearch = item.name.includes(query) || (item.raw.类型 && item.raw.类型.includes(query));
        if (!matchesSearch) return false;
      }
      if (activeCategory.value !== '全部') {
        const type = item.raw.类型 || '杂物';
        if (type !== activeCategory.value) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isModified && !b.isModified) return -1;
      if (!a.isModified && b.isModified) return 1;
      return a.name.localeCompare(b.name);
    });
};

const backpackList = computed(() => processList(localBackpack.value));
const warehouseList = computed(() => processList(localWarehouse.value));

const getItemStyle = item => {
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
  selectedItems.value.clear(); // 切换模式时清空选中
}

// 统一处理点击：区分模式
function handleItemClick(item, direction, prefix) {
  if (isDeleteMode.value) {
    toggleSelection(prefix, item.name);
  } else {
    toggleItemExpand(item, direction, prefix);
  }
}

// --- 批量选择逻辑 ---

function getUniqueId(prefix, name) {
  return `${prefix}-${name}`;
}

function isSelected(prefix, name) {
  return selectedItems.value.has(getUniqueId(prefix, name));
}

function toggleSelection(prefix, name) {
  const id = getUniqueId(prefix, name);
  if (selectedItems.value.has(id)) {
    selectedItems.value.delete(id);
  } else {
    selectedItems.value.add(id);
  }
}

function isAllSelected(prefix) {
  const list = prefix === 'bag' ? backpackList.value : warehouseList.value;
  if (list.length === 0) return false;
  return list.every(item => selectedItems.value.has(getUniqueId(prefix, item.name)));
}

function toggleSelectAll(prefix) {
  const list = prefix === 'bag' ? backpackList.value : warehouseList.value;
  const allSelected = isAllSelected(prefix);

  list.forEach(item => {
    const id = getUniqueId(prefix, item.name);
    if (allSelected) {
      selectedItems.value.delete(id);
    } else {
      selectedItems.value.add(id);
    }
  });
}

function confirmBatchDelete() {
  if (selectedItems.value.size === 0) return;

  // 遍历选中项进行删除
  selectedItems.value.forEach(id => {
    const [prefix, ...nameParts] = id.split('-');
    const name = nameParts.join('-'); // 防止名字里有横杠

    const sourceObj = prefix === 'bag' ? localBackpack.value : localWarehouse.value;

    if (sourceObj[name]) {
      delete sourceObj[name];
      // 标记为修改（虽然delete了，但为了触发保存逻辑，我们需要确保diff能检测到）
      // 注意：generateDiff 是对比 local 和 remote，只要 local 没了，remote 有，就会生成 delete payload
    }
  });

  hasUnsavedChanges.value = true;
  selectedItems.value.clear();
  // 保持在删除模式，方便继续操作，或者可以 isDeleteMode.value = false;
}

// --- 原有逻辑 ---

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

  if (sourceObj[item.name]) {
    sourceObj[item.name].数量 -= qty;
    sourceObj[item.name].isModified = true;
    if (sourceObj[item.name].数量 <= 0) {
      delete sourceObj[item.name];
      closeTransfer();
    }
  }

  if (targetObj[item.name]) {
    const existing = targetObj[item.name];
    const newDurability = Math.ceil((existing.耐久 + item.durability) / 2);
    existing.数量 += qty;
    existing.耐久 = newDurability;
    existing.isModified = true;
  } else {
    targetObj[item.name] = {
      ...item.raw,
      数量: qty,
      耐久: item.durability,
      isModified: true,
    };
  }

  hasUnsavedChanges.value = true;
  if (sourceObj[item.name]) {
    transferAmount.value = 1;
  }
}

// --- 保存逻辑 (保持不变) ---

function cleanData(item) {
  const { isModified, ...rest } = item;
  return rest;
}

function addToPayload(root, pathArr, key, value) {
  let current = root;
  pathArr.forEach(pathKey => {
    if (!current[pathKey]) {
      current[pathKey] = {};
    }
    current = current[pathKey];
  });
  current[key] = value;
}

function generateDiff(localObj, remoteObj, pathArr, payload) {
  const allKeys = new Set([...Object.keys(localObj), ...Object.keys(remoteObj)]);

  allKeys.forEach(key => {
    if (key === '$template') return;

    const localItem = localObj[key];
    const remoteItem = remoteObj[key];

    if (remoteItem && !localItem) {
      // 远程有，本地没有 -> 删除 (值为 null)
      addToPayload(payload, pathArr, key, null);
    } else if (localItem && !remoteItem) {
      // 本地有，远程没有 -> 新增
      addToPayload(payload, pathArr, key, cleanData(localItem));
    } else if (localItem && remoteItem) {
      // 都有 -> 检查差异
      const cleanLocal = cleanData(localItem);
      if (JSON.stringify(cleanLocal) !== JSON.stringify(remoteItem)) {
        addToPayload(payload, pathArr, key, cleanLocal);
      }
    }
  });
}

async function saveAllChanges() {
  if (isSaving.value) return;
  isSaving.value = true;

  try {
    // 1. 创建单一的 payload 对象
    const mergedPayload = {};

    const remoteBackpack = statStore.stat_data?.角色?.user?.物品 || {};
    const remoteWarehouse = statStore.stat_data?.仓库 || {};

    // 2. 直接将差异写入 mergedPayload
    // addToPayload 会自动处理深层路径合并，不会发生覆盖
    generateDiff(localBackpack.value, remoteBackpack, ['角色', 'user', '物品'], mergedPayload);
    generateDiff(localWarehouse.value, remoteWarehouse, ['仓库'], mergedPayload);

    // 3. 如果有变更，直接提交
    if (Object.keys(mergedPayload).length > 0) {
      await MvuUtil.updateMvuDataByDiff(mergedPayload);
    }

    // --- 以下是日志逻辑 (保持不变) ---
    const exchangeLogs = [];
    const allNames = new Set([
      ...Object.keys(remoteBackpack),
      ...Object.keys(remoteWarehouse),
      ...Object.keys(localBackpack.value),
      ...Object.keys(localWarehouse.value),
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
        exchangeLogs.push({ 名称: name, 数量: Math.min(Math.abs(bagDiff), whDiff), 方向: '存入仓库' });
      } else if (bagDiff > 0 && whDiff < 0) {
        exchangeLogs.push({ 名称: name, 数量: Math.min(bagDiff, Math.abs(whDiff)), 方向: '取出到背包' });
      }
    });

    if (exchangeLogs.length > 0) {
      const logText = `\n<systemLog>\n<user>与漫宿之上的神秘空间完成了物品交换:\n${JSON.stringify(exchangeLogs, null, 0)}\n</systemLog>\n`;
      const lastMsgId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
      await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');
    }

    hasUnsavedChanges.value = false;
    Object.values(localBackpack.value).forEach(i => (i.isModified = false));
    Object.values(localWarehouse.value).forEach(i => (i.isModified = false));
    activeItemId.value = null;
    isDeleteMode.value = false;
    selectedItems.value.clear();
  } catch (e) {
    console.error('Inventory Sync Failed:', e);
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
  height: 100vh;
  height: 100dvh;
  width: 100%;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--font-body);
  overflow: hidden;
  transition: background 0.5s;
}

/* 删除模式下的全局氛围 */
.ac-inventory-manager.mode-delete {
  --c-gold: #ff6b6b; /* 红色主题 */
  --c-gold-dim: rgba(255, 107, 107, 0.3);
  background: #1a1010;
}

/* --- 头部 --- */
.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid var(--c-gold);
  background: linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent);
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
  width: 10px;
  height: 10px;
  background: var(--c-gold);
  transform: rotate(45deg);
  box-shadow: 0 0 8px var(--c-gold);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.unsaved-warning {
  color: var(--c-gold);
  font-size: 0.9rem;
  font-family: var(--font-title);
  display: none;
}
@media (min-width: 768px) {
  .unsaved-warning {
    display: block;
  }
}

.blink {
  animation: blink 1.5s infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}

.ac-btn {
  background: transparent;
  border: 1px solid var(--c-gold-dim);
  color: var(--c-gold);
  padding: 8px 16px;
  font-family: var(--font-title);
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
  font-size: 0.85rem;
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

.delete-mode-btn {
  border-color: #666;
  color: #888;
}
.delete-mode-btn:hover {
  border-color: var(--c-danger);
  color: var(--c-danger);
}
.delete-mode-btn.is-active {
  border-color: var(--c-danger);
  color: var(--c-danger);
  background: rgba(255, 77, 77, 0.1);
}

.batch-delete-btn {
  background: var(--c-danger);
  color: #fff;
  border-color: var(--c-danger);
  font-weight: bold;
}
.batch-delete-btn:hover {
  background: #ff4d4d;
  box-shadow: 0 0 15px rgba(255, 77, 77, 0.5);
}

/* --- 分类栏 --- */
.category-bar-wrapper {
  padding: 10px 20px 0 20px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.2);
}

.category-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  scrollbar-width: none;
}
.category-scroll::-webkit-scrollbar {
  display: none;
}

.cat-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #888;
  padding: 6px 16px;
  border-radius: 2px;
  cursor: pointer;
  transition: 0.3s;
  font-family: var(--font-title);
  font-size: 0.85rem;
  white-space: nowrap;
  text-transform: uppercase;
}

.cat-btn:hover {
  color: #ccc;
  background: rgba(255, 255, 255, 0.05);
}

.cat-btn.active {
  color: var(--c-gold);
  border-color: var(--c-gold-dim);
  background: rgba(212, 175, 55, 0.08);
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

.mobile-tabs {
  display: none;
}

.pane {
  flex: 1;
  background: var(--c-bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  border-radius: 2px;
  min-width: 0;
  min-height: 0;
}

.pane-header {
  padding: 12px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  height: 50px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 15px;
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

.select-all-btn {
  background: transparent;
  border: 1px solid #444;
  color: #888;
  font-size: 0.75rem;
  padding: 2px 8px;
  cursor: pointer;
  transition: 0.2s;
}
.select-all-btn:hover {
  border-color: var(--c-gold);
  color: var(--c-gold);
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
}

.currency-symbol {
  font-size: 1.1rem;
  text-shadow: 0 0 5px var(--c-gold);
}
.currency-val {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
}

.ac-input {
  background: rgba(0, 0, 0, 0.3);
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
@keyframes pulse {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

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

.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

/* --- 卡片样式 --- */
.item-card {
  background: rgba(255, 255, 255, 0.03);
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
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
}

.item-card.is-expanded {
  background: rgba(0, 0, 0, 0.5);
  border-color: var(--c-gold);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.item-card.is-modified {
  border-left: 3px solid var(--c-gold);
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.05), transparent);
}

/* 选中状态样式 */
.item-card.mode-select {
  padding-left: 30px; /* 为复选框留空间 */
}
.item-card.is-selected {
  border-color: var(--c-danger);
  background: rgba(255, 77, 77, 0.1);
}

.selection-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.checkbox-inner {
  width: 14px;
  height: 14px;
  border: 2px solid #666;
  border-radius: 2px;
  transition: 0.2s;
}

.item-card.is-selected .checkbox-inner {
  background: var(--c-danger);
  border-color: var(--c-danger);
  box-shadow: 0 0 5px var(--c-danger);
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

/* --- 展开面板 --- */
.expanded-panel {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.item-details {
  font-size: 0.85rem;
  color: #aaa;
  line-height: 1.4;
  padding: 0 5px;
  word-break: break-word;
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
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 8px;
  border-radius: 4px;
  height: 32px;
  min-width: 0;
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
  min-width: 0;
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
  flex-shrink: 0;
}
.mini-confirm-btn:hover {
  background: #fff;
  box-shadow: 0 0 10px var(--c-gold);
}

.style-weapon .item-icon {
  color: #ff6b6b;
  border-color: rgba(255, 107, 107, 0.3);
}
.style-lore .item-icon {
  color: #a29bfe;
  border-color: rgba(162, 155, 254, 0.3);
}
.style-currency .item-icon {
  color: #ffeaa7;
  border-color: rgba(255, 234, 167, 0.3);
}

/* Vue Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #888;
    font-family: var(--font-title);
    cursor: pointer;
    transition: 0.3s;
  }
  .mobile-tab-item.active {
    background: rgba(212, 175, 55, 0.1);
    border-color: var(--c-gold);
    color: var(--c-gold);
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
    padding: 6px 10px;
    font-size: 0.75rem;
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
  .category-bar-wrapper {
    padding: 10px 10px 0 10px;
  }
}
</style>
