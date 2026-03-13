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
          <span v-if="isDeleteMode">退出整理</span>
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

    <!-- 分类与筛选栏 -->
    <div class="filter-bar-wrapper">
      <div class="category-scroll custom-scroll">
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
      <div class="global-search">
        <input v-model="searchQuery" placeholder="检索物品..." class="ac-input" />
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="manager-body" :class="{ 'details-visible': !!activeItem }">
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
              { 'is-active': activeItemId === 'bag-' + item.name },
              { 'is-selected': isSelected('bag', item.name) },
              { 'mode-select': isDeleteMode },
            ]"
            @click="handleItemClick(item, 'toWarehouse', 'bag')"
          >
            <div v-if="isDeleteMode" class="selection-indicator">
              <div class="checkbox-inner"></div>
            </div>
            <div class="card-bg-effect"></div>
            <div class="card-inner">
              <div class="card-top">
                <span class="type-tag">{{ item.raw.类型 || '杂物' }}</span>
                <span class="count-badge">x{{ item.quantity }}</span>
              </div>
              <div class="card-body">
                <div class="item-name-visual" :style="{ fontSize: getNameFontSize(item.name) }">
                  {{ item.name }}
                </div>
              </div>
              <div class="card-bottom">
                <span class="durability-text" v-if="item.durability > 0">
                  Dur: {{ item.durability }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="backpackList.length === 0" class="empty-state">
            {{ activeCategory !== '全部' ? '该分类下无物品' : '行囊空空如也' }}
          </div>
        </div>
      </div>

      <!-- 中间：装饰性连接符 -->
      <div class="divider-column" v-if="!activeItem">
        <div class="arrow-icon" v-if="!isDeleteMode">⇄</div>
        <div class="arrow-icon danger-icon" v-else>✕</div>
      </div>

      <!-- 右侧：漫宿仓库 -->
      <div class="pane warehouse-pane" :class="{ 'mobile-hidden': activeMobileTab !== 'warehouse' }">
        <div class="pane-header">
          <div class="title-group">
            <h3>仓库 <small>WAREHOUSE</small></h3>
            <button
              v-if="isDeleteMode && warehouseList.length > 0"
              class="select-all-btn"
              @click="toggleSelectAll('wh')"
            >
              {{ isAllSelected('wh') ? '取消全选' : '全选' }}
            </button>
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
              { 'is-active': activeItemId === 'wh-' + item.name },
              { 'is-selected': isSelected('wh', item.name) },
              { 'mode-select': isDeleteMode },
            ]"
            @click="handleItemClick(item, 'toBackpack', 'wh')"
          >
            <div v-if="isDeleteMode" class="selection-indicator">
              <div class="checkbox-inner"></div>
            </div>
            <div class="card-bg-effect"></div>
            <div class="card-inner">
              <div class="card-top">
                <span class="type-tag">{{ item.raw.类型 || '杂物' }}</span>
                <span class="count-badge">x{{ item.quantity }}</span>
              </div>
              <div class="card-body">
                <div class="item-name-visual" :style="{ fontSize: getNameFontSize(item.name) }">
                  {{ item.name }}
                </div>
              </div>
              <div class="card-bottom">
                <span class="durability-text" v-if="item.durability > 0">
                  Dur: {{ item.durability }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="warehouseList.length === 0" class="empty-state">
            {{ activeCategory !== '全部' ? '该分类下无物品' : '仓库空置' }}
          </div>
        </div>
      </div>

      <!-- 详情与操作面板 -->
      <transition name="panel-slide">
        <div v-if="activeItem" class="details-pane" :class="getItemStyle(activeItem)">
          <div class="details-pane-header">
            <h4>{{ activeItem.name }}</h4>
            <button class="close-btn" @click="closeDetailsPane">×</button>
          </div>
          <div class="details-pane-body custom-scroll">
            <div class="item-details">
              <p v-if="activeItem.raw.描述" class="detail-desc">"{{ formatItemText(activeItem.raw.描述, activeItem) }}"</p>
              <p v-if="activeItem.raw.作用" class="detail-effect">
                <span class="bullet">✦</span> {{ formatItemText(activeItem.raw.作用, activeItem) }}
              </p>
            </div>

            <!-- 操作栏 -->
            <div class="transfer-action-bar">
              <div class="slider-wrapper">
                <template v-if="activeItem.quantity > 1">
                  <span class="qty-label">{{ transferAmount }}</span>
                  <input
                    type="range"
                    v-model.number="transferAmount"
                    min="1"
                    :max="activeItem.quantity"
                    class="mini-slider"
                  />
                  <span class="qty-max">/ {{ activeItem.quantity }}</span>
                </template>
                <template v-else>
                  <span class="qty-static">仅有 1 个</span>
                </template>
              </div>

              <!-- NEW: Action buttons group -->
              <div class="action-buttons-group">
                <button
                  class="large-confirm-btn use-btn"
                  v-if="pendingTransferDirection === 'toWarehouse' && activeItem && activeItem.raw.作用"
                  @click="confirmUseItem"
                >
                  使用物品
                  <span class="arrow-symbol">✨</span>
                </button>
                <button class="large-confirm-btn" @click="confirmTransfer">
                  {{ pendingTransferDirection === 'toWarehouse' ? '存入仓库' : '取出到行囊' }}
                  <span class="arrow-symbol">➔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { useUiStore } from '@/尘史使徒/UI/store/UIStore';
import { MvuUtil } from '@/Utils/MvuUtil';
import { MessageUtil } from '@/Utils/MessageUtil';

const statStore = useStatStore();
const uiStore = useUiStore();
const router = useRouter();

const localBackpack = ref({});
const localWarehouse = ref({});
const localMoney = ref(0);
const hasUnsavedChanges = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');
const activeCategory = ref('全部');
const isDeleteMode = ref(false);
const selectedItems = ref(new Set());
const activeMobileTab = ref('backpack');
const activeItemId = ref(null);
const pendingTransferDirection = ref('');
const transferAmount = ref(1);

const activeItem = computed(() => {
  if (!activeItemId.value) return null;
  const [prefix, ...nameParts] = activeItemId.value.split('-');
  const name = nameParts.join('-');
  const sourceList = prefix === 'bag' ? backpackList.value : warehouseList.value;
  return sourceList.find(item => item.name === name) || null;
});

watch(activeItem, (newItem) => {
  if (newItem) {
    transferAmount.value = 1;
  }
});

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
  closeDetailsPane();
  isDeleteMode.value = false;
  selectedItems.value.clear();
  activeCategory.value = '全部';
}

const formatItemText = (text, currentItem) => {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\$\{([^}]+)\}/g, (match, key) => {
    if (key === '数量' && currentItem) return `数量[${currentItem.quantity}]`;
    if (key === '耐久' && currentItem) return `耐久[${currentItem.durability}]`;
    const stats = statStore.stat_data.角色.user;
    if (!stats) return match;
    if (stats['基础数值'] && stats['基础数值'][key] !== undefined) return `${key}[${stats['基础数值'][key]}]`;
    if (stats['术之等级'] && stats['术之等级'][key]) {
      const artData = stats['术之等级'][key];
      if (typeof artData === 'object' && artData['等级'] !== undefined) return `${key}[${artData['等级']}]`;
      if (typeof artData === 'number') return `${key}[${artData}]`;
    }
    if (stats['生命状态'] && stats['生命状态'][key]) {
      const status = stats['生命状态'][key];
      if (typeof status === 'object' && status['当前'] !== undefined) return `${key}[${status['当前']}]`;
    }
    return match;
  });
};

const categories = computed(() => {
  const types = new Set();
  const collectTypes = obj => {
    Object.entries(obj).forEach(([key, val]) => {
      if (key !== '$template' && val.类型) types.add(val.类型);
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
        const query = searchQuery.value.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(query) || (item.raw.类型 && item.raw.类型.toLowerCase().includes(query));
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

const getNameFontSize = (name) => {
  const len = name.length;
  if (len <= 4) return '1.4rem';
  if (len <= 7) return '1.15rem';
  if (len <= 10) return '1rem';
  return '0.85rem';
};

const getItemStyle = item => {
  const n = (item.name || '').toLowerCase();
  const t = (item.raw.类型 || '').toLowerCase();
  if (n.includes('蛾')) return 'style-moth';
  if (n.includes('证明') || n.includes('证书') || n.includes('执照') || n.includes('徽') || n.includes('印') || n.includes('章') || n.includes('钥') || n.includes('令') || n.includes('邀请') || t === '证明' || t === '信物') return 'style-proof';
  if (n.includes('书') || n.includes('录') || n.includes('篇') || t === '秘传') return 'style-lore';
  if (n.includes('刃') || n.includes('剑') || n.includes('刀') || n.includes('枪') || n.includes('斧') || t === '武器') return 'style-weapon';
  if (n.includes('仪式') || n.includes('阵') || n.includes('祭') || t === '仪式') return 'style-ritual';
  if (n.includes('币') || n.includes('金') || n.includes('银') || t === '货币') return 'style-currency';
  if (n.includes('药') || n.includes('剂') || n.includes('水') || n.includes('露') || t === '药食') return 'style-medicine';
  if (n.includes('杯') || n.includes('血')) return 'style-grail';
  if (n.includes('镜') || n.includes('灯') || n.includes('光')) return 'style-lantern';
  if (t === '器具') return 'style-tool';
  return 'style-default';
};

function toggleDeleteMode() {
  isDeleteMode.value = !isDeleteMode.value;
  closeDetailsPane();
  selectedItems.value.clear();
}

function handleItemClick(item, direction, prefix) {
  if (isDeleteMode.value) {
    toggleSelection(prefix, item.name);
  } else {
    const id = getUniqueId(prefix, item.name);
    if (activeItemId.value === id) {
      closeDetailsPane();
    } else {
      activeItemId.value = id;
      pendingTransferDirection.value = direction;
    }
  }
}

function closeDetailsPane() {
  activeItemId.value = null;
}

function getUniqueId(prefix, name) { return `${prefix}-${name}`; }
function isSelected(prefix, name) { return selectedItems.value.has(getUniqueId(prefix, name)); }
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
  selectedItems.value.forEach(id => {
    const [prefix, ...nameParts] = id.split('-');
    const name = nameParts.join('-');
    const sourceObj = prefix === 'bag' ? localBackpack.value : localWarehouse.value;
    if (sourceObj[name]) {
      delete sourceObj[name];
    }
  });
  hasUnsavedChanges.value = true;
  selectedItems.value.clear();
}

function confirmTransfer() {
  if (!activeItem.value || transferAmount.value <= 0) return;
  const item = activeItem.value;
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
      closeDetailsPane();
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

// NEW: Function to handle using an item
function confirmUseItem() {
  if (!activeItem.value || !activeItem.value.raw.作用) return;

  const item = activeItem.value;
  const qty = transferAmount.value;

  // Format the text similar to the shop
  const itemToUse = {
    物品名称: item.name,
    使用数量: qty,
    描述: item.raw.描述 || '无',
    作用: formatItemText(item.raw.作用, item) || '未知'
  };

  // The text to be sent to the main input
  const logText = `<user>决定使用[${qty}]个'${item.name}'。\n<list>\n${JSON.stringify(itemToUse, null, 2)}\n</list>\n`;

  uiStore.setPendingInput(logText);
  router.push('/选项');
}


function cleanData(item) {
  const { isModified, ...rest } = item;
  return rest;
}
function addToPayload(root, pathArr, key, value) {
  let current = root;
  pathArr.forEach(pathKey => {
    if (!current[pathKey]) current[pathKey] = {};
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
      addToPayload(payload, pathArr, key, null);
    } else if (localItem && !remoteItem) {
      addToPayload(payload, pathArr, key, cleanData(localItem));
    } else if (localItem && remoteItem) {
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
    const mergedPayload = {};
    const remoteBackpack = statStore.stat_data?.角色?.user?.物品 || {};
    const remoteWarehouse = statStore.stat_data?.仓库 || {};
    generateDiff(localBackpack.value, remoteBackpack, ['角色', 'user', '物品'], mergedPayload);
    generateDiff(localWarehouse.value, remoteWarehouse, ['仓库'], mergedPayload);
    if (Object.keys(mergedPayload).length > 0) {
      await MvuUtil.updateMvuDataByDiff(mergedPayload);
    }
    const exchangeLogs = [];
    const allNames = new Set([...Object.keys(remoteBackpack), ...Object.keys(remoteWarehouse), ...Object.keys(localBackpack.value), ...Object.keys(localWarehouse.value)]);
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
    closeDetailsPane();
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
  --c-gold: #d4af37; --c-gold-dim: rgba(212, 175, 55, 0.3); --c-bg: #0f0f13; --c-bg-panel: #16161a; --c-card-bg: #1a1a1f; --c-text: #e0e0e0; --c-danger: #ff4d4d; --c-danger-dim: rgba(255, 77, 77, 0.3); --font-title: 'Cinzel', serif; --font-body: 'EB Garamond', serif;
  --rgb-lore: 189, 178, 255; --rgb-ritual: 255, 100, 100; --rgb-curr: 255, 214, 165; --rgb-med: 155, 246, 255; --rgb-weapon: 255, 80, 80; --rgb-tool: 160, 196, 255; --rgb-proof: 255, 160, 50; --rgb-def: 140, 140, 140; --rgb-moth: 136, 136, 136; --rgb-grail: 220, 40, 40; --rgb-lantern: 255, 255, 200;
  display: flex; flex-direction: column; height: 100vh; height: 100dvh; width: 100%; background: var(--c-bg); color: var(--c-text); font-family: var(--font-body); overflow: hidden; transition: background 0.5s;
}
.ac-inventory-manager.mode-delete { --c-gold: #ff6b6b; --c-gold-dim: rgba(255, 107, 107, 0.3); background: #1a1010; }

/* --- 头部 --- */
.manager-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 2px solid var(--c-gold); background: linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent); flex-shrink: 0; transition: border-color 0.3s; }
.header-title h2 { margin: 0; font-family: var(--font-title); color: var(--c-gold); font-size: 1.4rem; letter-spacing: 2px; display: flex; align-items: center; gap: 10px; }
.animus-icon { width: 10px; height: 10px; background: var(--c-gold); transform: rotate(45deg); box-shadow: 0 0 8px var(--c-gold); }
.header-actions { display: flex; align-items: center; gap: 15px; }
.unsaved-warning { color: var(--c-gold); font-size: 0.9rem; font-family: var(--font-title); display: none; }
@media (min-width: 768px) { .unsaved-warning { display: block; } }
.blink { animation: blink 1.5s infinite; }
@keyframes blink { 50% { opacity: 0; } }
.ac-btn { background: transparent; border: 1px solid var(--c-gold-dim); color: var(--c-gold); padding: 8px 16px; font-family: var(--font-title); cursor: pointer; transition: all 0.3s; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; font-size: 0.85rem; }
.ac-btn:hover:not(:disabled) { background: var(--c-gold); color: #000; box-shadow: 0 0 15px var(--c-gold-dim); }
.ac-btn:disabled { opacity: 0.3; cursor: not-allowed; border-color: #444; color: #666; }
.save-btn.is-active { border-color: var(--c-gold); box-shadow: inset 0 0 10px rgba(212, 175, 55, 0.1); }
.delete-mode-btn { border-color: #666; color: #888; }
.delete-mode-btn:hover { border-color: var(--c-danger); color: var(--c-danger); }
.delete-mode-btn.is-active { border-color: var(--c-danger); color: var(--c-danger); background: rgba(255, 77, 77, 0.1); }
.batch-delete-btn { background: var(--c-danger); color: #fff; border-color: var(--c-danger); font-weight: bold; }
.batch-delete-btn:hover { background: #ff4d4d; box-shadow: 0 0 15px rgba(255, 77, 77, 0.5); }

/* --- 筛选栏 --- */
.filter-bar-wrapper { display: flex; align-items: center; gap: 20px; padding: 10px 20px; flex-shrink: 0; background: rgba(0, 0, 0, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
.category-scroll { display: flex; gap: 10px; overflow-x: auto; flex-grow: 1; scrollbar-width: none; }
.category-scroll::-webkit-scrollbar { display: none; }
.cat-btn { background: transparent; border: 1px solid transparent; color: #888; padding: 6px 16px; border-radius: 2px; cursor: pointer; transition: 0.3s; font-family: var(--font-title); font-size: 0.85rem; white-space: nowrap; text-transform: uppercase; }
.cat-btn:hover { color: #ccc; background: rgba(255, 255, 255, 0.05); }
.cat-btn.active { color: var(--c-gold); border-color: var(--c-gold-dim); background: rgba(212, 175, 55, 0.08); }
.global-search .ac-input { width: 180px; background: rgba(0, 0, 0, 0.3); border: 1px solid #444; border-radius: 4px; padding: 6px 12px; transition: all 0.3s; }
.global-search .ac-input:focus { width: 220px; border-color: var(--c-gold); background: rgba(0, 0, 0, 0.5); }

/* --- 主体区域 --- */
.manager-body { flex: 1; display: flex; overflow: hidden; padding: 20px; gap: 15px; transition: gap 0.3s ease; }
.pane { flex: 1; background: var(--c-bg-panel); border: 1px solid rgba(255, 255, 255, 0.05); display: flex; flex-direction: column; border-radius: 2px; min-width: 0; min-height: 0; transition: flex 0.3s ease; }
.manager-body.details-visible .backpack-pane { flex: 1 1 38%; }
.manager-body.details-visible .warehouse-pane { flex: 1 1 38%; }
.manager-body.details-visible .details-pane { flex: 0 0 24%; }
.pane-header { padding: 12px 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; height: 50px; }
.title-group { display: flex; align-items: center; gap: 15px; }
.pane-header h3 { margin: 0; font-family: var(--font-title); color: #ccc; font-size: 1.1rem; }
.pane-header small { color: #666; font-size: 0.7rem; margin-left: 8px; }
.select-all-btn { background: transparent; border: 1px solid #444; color: #888; font-size: 0.75rem; padding: 2px 8px; cursor: pointer; transition: 0.2s; }
.select-all-btn:hover { border-color: var(--c-gold); color: var(--c-gold); }
.header-controls { display: flex; align-items: center; gap: 15px; }
.money-display { display: flex; align-items: baseline; gap: 4px; color: var(--c-gold); font-family: var(--font-title); background: rgba(212, 175, 55, 0.1); padding: 4px 10px; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 2px; user-select: none; }
.currency-symbol { font-size: 1.1rem; text-shadow: 0 0 5px var(--c-gold); }
.currency-val { font-size: 1.1rem; font-weight: bold; color: #fff; }
.divider-column { display: flex; align-items: center; justify-content: center; width: 40px; flex-shrink: 0; color: var(--c-gold-dim); font-size: 1.5rem; }
.danger-icon { color: var(--c-danger); animation: pulse 2s infinite; }
@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

/* --- 物品网格与卡片 --- */
.item-grid { flex: 1; padding: 10px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); grid-auto-rows: 100px; gap: 12px; align-content: start; min-height: 0; }
.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
.item-card { background: var(--c-card-bg); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 4px; cursor: pointer; transition: all 0.2s ease; position: relative; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
.item-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.4); z-index: 2; }
.item-card.is-active { border-color: var(--c-gold); box-shadow: 0 0 15px var(--c-gold-dim); z-index: 3; transform: translateY(0); }
.item-card.is-modified::after { content: ''; position: absolute; top: 0; right: 0; width: 0; height: 0; border-top: 16px solid var(--c-gold); border-left: 16px solid transparent; z-index: 5; pointer-events: none; }
.item-card.is-selected { border-color: var(--c-danger); box-shadow: 0 0 15px rgba(255, 77, 77, 0.3); }
.selection-indicator { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 4; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.checkbox-inner { width: 24px; height: 24px; border: 2px solid #666; border-radius: 4px; background: rgba(0,0,0,0.8); position: relative; transition: 0.2s; }
.item-card.is-selected .checkbox-inner { background: var(--c-danger); border-color: var(--c-danger); box-shadow: 0 0 10px var(--c-danger); }
.item-card.is-selected .checkbox-inner::after { content: '✓'; position: absolute; color: #fff; font-size: 16px; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; }
.card-inner { display: flex; flex-direction: column; justify-content: space-between; height: 100px; padding: 6px 8px; position: relative; z-index: 2; }
.card-top { display: flex; justify-content: space-between; align-items: center; }
.type-tag { opacity: 0.5; font-size: 0.6rem; text-transform: uppercase; color: #ccc; }
.count-badge { background: rgba(255,255,255,0.1); padding: 0 4px; border-radius: 2px; color: #fff; font-size: 0.7rem; font-weight: bold; }
.card-body { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
.item-name-visual { font-family: var(--font-title); font-weight: 600; color: #eee; text-shadow: 0 2px 4px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center; }
.card-bottom { height: 16px; display: flex; justify-content: flex-end; align-items: flex-end; }
.durability-text { font-size: 0.65rem; color: #888; font-family: monospace; }
.card-bg-effect { position: absolute; top: 0; left: 0; right: 0; height: 100px; opacity: 0.1; z-index: 1; transition: opacity 0.3s; pointer-events: none; }
.item-card:hover .card-bg-effect { opacity: 0.25; }
.style-moth { --theme-color: rgb(var(--rgb-moth)); border-color: var(--theme-color); } .style-moth .item-name-visual { color: var(--theme-color); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); animation: art-moth-glitch-strong 1.5s infinite steps(1); } .style-moth .card-bg-effect { background: repeating-linear-gradient(45deg, #0001, #0001 1px, transparent 1px, transparent 5px); opacity: 0.15; } @keyframes art-moth-glitch-strong { 0% { transform: translate(0, 0) skew(0); } 10% { transform: translate(-5px, 3px) skew(-5deg); } 20% { transform: translate(5px, -3px) skew(5deg); } 30% { transform: translate(-8px, 5px) skew(-2deg); } 40% { transform: translate(8px, -5px) skew(2deg); } 50% { transform: translate(-5px, 3px) skew(-5deg); } 60% { transform: translate(5px, -3px) skew(5deg); } 70% { transform: translate(-8px, 5px) skew(-2deg); } 80% { transform: translate(0, 0) skew(0); } 100% { transform: translate(0, 0) skew(0); } }
.style-lore { border-color: rgba(var(--rgb-lore), 0.4); } .style-lore .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-lore), 0.8), transparent 90%); } .style-lore .item-name-visual { color: rgb(var(--rgb-lore)); } .style-weapon { border-color: rgba(var(--rgb-weapon), 0.4); } .style-weapon .card-bg-effect { background: linear-gradient(135deg, rgba(var(--rgb-weapon), 0.1), transparent); } .style-weapon .item-name-visual { color: rgb(var(--rgb-weapon)); } .style-ritual { border-color: rgba(var(--rgb-ritual), 0.4); } .style-ritual .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-ritual), 0.8), transparent 90%); } .style-ritual .item-name-visual { color: rgb(var(--rgb-ritual)); } .style-currency { border-color: rgba(var(--rgb-curr), 0.4); } .style-currency .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-curr), 0.8), transparent 90%); } .style-currency .item-name-visual { color: rgb(var(--rgb-curr)); } .style-medicine { border-color: rgba(var(--rgb-med), 0.4); } .style-medicine .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-med), 0.8), transparent 90%); } .style-medicine .item-name-visual { color: rgb(var(--rgb-med)); } .style-tool { border-color: rgba(var(--rgb-tool), 0.4); } .style-tool .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-tool), 0.8), transparent 90%); } .style-tool .item-name-visual { color: rgb(var(--rgb-tool)); } .style-proof { border-color: rgba(var(--rgb-proof), 0.6); } .style-proof .card-bg-effect { background: radial-gradient(circle at center, transparent 30%, rgba(var(--rgb-proof), 0.15) 100%); border: 1px solid rgba(var(--rgb-proof), 0.1); inset: 2px; } .style-proof .item-name-visual { color: rgb(var(--rgb-proof)); letter-spacing: 1px; } .style-default { border-color: rgba(var(--rgb-def), 0.3); } .style-default .card-bg-effect { background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent); }
.style-grail { border-color: rgba(var(--rgb-grail), 0.4); } .style-grail .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-grail), 0.8), transparent 90%); } .style-grail .item-name-visual { color: rgb(var(--rgb-grail)); }
.style-lantern { border-color: rgba(var(--rgb-lantern), 0.4); } .style-lantern .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-lantern), 0.8), transparent 90%); } .style-lantern .item-name-visual { color: rgb(var(--rgb-lantern)); }

/* --- 详情面板样式 --- */
.details-pane { background: #1c1c21; border-left: 2px solid var(--c-gold); display: flex; flex-direction: column; overflow: hidden; transition: border-color 0.3s; }
.details-pane.style-default { border-top: 4px solid transparent; }
.details-pane.style-moth { border-top: 4px solid rgb(var(--rgb-moth)); }
.details-pane.style-lore { border-top: 4px solid rgb(var(--rgb-lore)); }
.details-pane.style-weapon { border-top: 4px solid rgb(var(--rgb-weapon)); }
.details-pane.style-ritual { border-top: 4px solid rgb(var(--rgb-ritual)); }
.details-pane.style-currency { border-top: 4px solid rgb(var(--rgb-curr)); }
.details-pane.style-medicine { border-top: 4px solid rgb(var(--rgb-med)); }
.details-pane.style-tool { border-top: 4px solid rgb(var(--rgb-tool)); }
.details-pane.style-proof { border-top: 4px solid rgb(var(--rgb-proof)); }
.details-pane.style-grail { border-top: 4px solid rgb(var(--rgb-grail)); }
.details-pane.style-lantern { border-top: 4px solid rgb(var(--rgb-lantern)); }

.details-pane-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); flex-shrink: 0; }
.details-pane-header h4 { margin: 0; font-family: var(--font-title); color: var(--c-gold); font-size: 1.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.close-btn { background: none; border: none; color: #666; font-size: 1.5rem; cursor: pointer; transition: color 0.2s; line-height: 1; }
.close-btn:hover { color: #fff; }
.details-pane-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.item-details { font-size: 0.9rem; color: #bbb; line-height: 1.6; word-break: break-word; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 4px; border-left: 2px solid rgba(255,255,255,0.1); }
.detail-desc { font-style: italic; margin: 0 0 10px 0; color: #999; }
.detail-effect { margin: 0; color: #ddd; }
.detail-effect .bullet { color: var(--c-gold); margin-right: 8px; }
.transfer-action-bar { display: flex; flex-direction: column; gap: 15px; margin-top: auto; padding-top: 20px; }
.slider-wrapper { display: flex; align-items: center; gap: 10px; background: rgba(0, 0, 0, 0.5); padding: 8px 12px; border-radius: 4px; height: 40px; border: 1px solid rgba(255,255,255,0.1); }
.qty-label { color: var(--c-gold); font-family: var(--font-title); font-weight: bold; min-width: 30px; text-align: center; font-size: 1.2rem; }
.qty-static { color: #888; font-size: 0.9rem; flex: 1; text-align: center; }
.mini-slider { flex: 1; accent-color: var(--c-gold); height: 5px; cursor: pointer; background: #333; border-radius: 3px; outline: none; -webkit-appearance: none; }
.mini-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: var(--c-gold); border-radius: 50%; cursor: pointer; box-shadow: 0 0 8px var(--c-gold); }
.qty-max { font-size: 0.8rem; color: #777; font-family: var(--font-title); }

/* NEW: Button group for actions */
.action-buttons-group {
  display: flex;
  gap: 10px;
}

.large-confirm-btn {
  background: linear-gradient(135deg, var(--c-gold), #b8962e); color: #000; border: none; padding: 12px 20px; font-size: 1rem; font-weight: bold; cursor: pointer; border-radius: 4px; transition: all 0.2s; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; gap: 10px;
  flex: 1; /* Allow buttons to grow and fill space */
}
.large-confirm-btn:hover { background: linear-gradient(135deg, #fff, var(--c-gold)); box-shadow: 0 0 15px rgba(212, 175, 55, 0.6); transform: translateY(-2px); }
.large-confirm-btn .arrow-symbol { font-size: 1.2rem; transition: transform 0.2s; }
.large-confirm-btn:hover .arrow-symbol { transform: translateX(4px); }

/* NEW: Style for the 'Use Item' button */
.large-confirm-btn.use-btn {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}
.large-confirm-btn.use-btn:hover {
  background: linear-gradient(135deg, #6bc1ff, #33f7ff);
  box-shadow: 0 0 15px rgba(79, 172, 254, 0.6);
}


/* --- Transitions --- */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.panel-slide-enter-active, .panel-slide-leave-active { transition: all 0.35s cubic-bezier(0.25, 0.8, 0.5, 1); }
.panel-slide-enter-from, .panel-slide-leave-to { transform: translateX(20px); opacity: 0; }

/* --- 移动端适配 --- */
.mobile-tabs { display: none; }
@media (max-width: 768px) {
  .manager-body { flex-direction: column; padding: 10px; }
  .mobile-tabs { display: flex; gap: 10px; margin-bottom: 5px; flex-shrink: 0; }
  .mobile-tab-item { flex: 1; text-align: center; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #888; font-family: var(--font-title); cursor: pointer; transition: 0.3s; }
  .mobile-tab-item.active { background: rgba(212, 175, 55, 0.1); border-color: var(--c-gold); color: var(--c-gold); }
  .divider-column, .pane.mobile-hidden { display: none; }
  .pane { width: 100%; flex: 1 !important; height: 100%; }
  .item-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); grid-auto-rows: 90px; gap: 8px; }
  .card-inner, .card-bg-effect { height: 90px; }
  .item-name-visual { font-size: 0.9rem !important; }
  .header-title h2 { font-size: 1.1rem; }
  .ac-btn { padding: 6px 10px; font-size: 0.75rem; }
  .filter-bar-wrapper { flex-direction: column; align-items: stretch; padding: 10px; }
  .category-scroll { padding-bottom: 10px; }
  .global-search .ac-input, .global-search .ac-input:focus { width: 100%; }

  .details-pane {
    position: fixed !important;
    top: 0;
    left: 0;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    z-index: 10000 !important;
    background: #131316 !important;
    border-left: none !important;
    border-top-width: 6px !important;
    flex: none !important;
  }

  .details-pane-body {
    padding-bottom: 80px;
  }

  .panel-slide-enter-from, .panel-slide-leave-to {
    transform: translateX(100%) !important;
    opacity: 1 !important;
  }
}
</style>
