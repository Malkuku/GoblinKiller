<template>
  <div class="arts-items-view-container">
    <!-- 1. 顶层选项卡 -->
    <div class="tabs">
      <button class="tab-button" :class="{ active: activeTab === 'money' }" @click="selectTab('money')">
        金钱
      </button>
      <button class="tab-button" :class="{ active: activeTab === 'arts' }" @click="selectTab('arts')">
        术
      </button>
      <button class="tab-button" :class="{ active: activeTab === 'items' }" @click="selectTab('items')">
        器
      </button>
    </div>

    <!-- 2. 内容展示区 -->
    <div class="content-wrapper">

      <!-- A. "术" 的内容区 -->
      <template v-if="activeTab === 'arts'">
        <div v-if="userArts.length > 0" class="arts-layout">
          <!-- A1. 术的选择列表 -->
          <nav class="pagination-nav">
            <ul>
              <li v-for="(art, index) in userArts" :key="art.name">
                <button class="art-button" :class="{ active: index === currentArtIndex }" @click="selectArt(index)">
                  {{ art.name }}
                </button>
              </li>
            </ul>
          </nav>

          <!-- A2. 术的详情面板 -->
          <div class="panel-display-area">
            <transition name="fade-main" mode="out-in">
              <div v-if="currentArt" :key="currentArt.name" class="art-panel" :class="artPrinciples[currentArt.name]?.themeClass">
                <div class="art-bg-effect"></div>
                <div class="art-content">
                  <h2 class="art-name">{{ currentArt.name }}</h2>
                  <div class="art-detail-tabs">
                    <button @click="selectArtDetailTab('description')" :class="{ active: artDetailTab === 'description' }">描述</button>
                    <button @click="selectArtDetailTab('levels')" :class="{ active: artDetailTab === 'levels' }">能力</button>
                  </div>
                  <transition name="fade-main" mode="out-in">
                    <div v-if="artDetailTab === 'description'" class="art-detail-page">
                      <p class="art-description">{{ artPrinciples[currentArt.name]?.description }}</p>
                      <div class="level-info">
                        <div class="level-display">
                          <span class="label">等级</span>
                          <span class="value">{{ currentArt.data.当前等级 }}</span>
                        </div>
                        <div v-if="currentArt.data.下一级需求经验 !== -1" class="xp-display-text">
                          <span>{{ currentArt.data.累计经验值 }} / {{ currentArt.data.下一级需求经验 }}</span>
                        </div>
                        <div v-if="currentArt.data.下一级需求经验 === -1" class="max-level-notice">
                          {{ maxLevelText }}
                        </div>
                      </div>
                    </div>
                    <div v-else-if="artDetailTab === 'levels'" class="art-detail-page">
                      <div v-if="currentArtLevelDescriptions.length > 0" class="level-descriptions-container">
                        <transition-group name="fade-list" tag="div" class="descriptions-list">
                          <p v-for="desc in paginatedDescriptions" :key="desc" class="level-description-item">
                            {{ desc }}
                          </p>
                        </transition-group>
                        <div v-if="totalDescriptionPages > 1" class="description-pagination">
                          <button @click="prevDescriptionPage" :disabled="descriptionPage === 1" class="pagination-btn">‹</button>
                          <span class="page-indicator">{{ descriptionPage }} / {{ totalDescriptionPages }}</span>
                          <button @click="nextDescriptionPage" :disabled="descriptionPage === totalDescriptionPages" class="pagination-btn">›</button>
                        </div>
                      </div>
                      <div v-else class="loading-state" style="padding: 2rem 0;">
                        此项准则的大门尚未向我敞开...
                      </div>
                    </div>
                  </transition>
                </div>
              </div>
            </transition>
          </div>
        </div>
        <div v-else class="loading-state">尚未习得任何“术”...</div>
      </template>

      <!-- B. "器 & 仓" 的内容区 (重构支持批量更新) -->
      <template v-else-if="activeTab === 'items'">
        <div class="inventory-layout">
          <!-- 搜索栏 -->
          <div class="inventory-search">
            <input
              v-model="itemSearchQuery"
              placeholder="搜索器具名称..."
              class="search-input"
            />
            <span class="danger-indicator" :class="{ 'is-danger': isDanger }">
              {{ isDanger ? '⚠ 危险场景：无法交换' : '✓ 安全区域：可以交换' }}
            </span>
            <div v-if="hasUnsavedChanges" class="unsaved-indicator">
              有未保存的变动
            </div>
          </div>

          <div class="inventory-columns">
            <!-- 左侧：背包 (Local Draft) -->
            <div class="inventory-column">
              <h3 class="column-title">随身行囊</h3>
              <div class="items-list-wrapper">
                <ul class="items-list compact">
                  <li v-for="item in paginatedBackpackItems" :key="item.name" class="item-entry compact-entry" :class="{ 'is-modified': item.isModified }">
                    <div class="item-header">
                      <span class="item-name" :title="item.description">{{ item.name }}</span>
                      <div class="item-meta">
                        <span class="item-qty">x{{ item.quantity }}</span>
                        <span class="item-durability" :class="getDurabilityClass(item.durability)">D:{{ item.durability }}</span>
                      </div>
                      <button
                        class="action-btn store-btn"
                        @click="openTransferModal(item, 'toWarehouse')"
                        :disabled="isDanger"
                        title="存入仓库"
                      >
                        ➜
                      </button>
                    </div>
                    <div class="item-tooltip">
                      <p><strong>描述:</strong> {{ item.description }}</p>
                      <p><strong>作用:</strong> {{ item.effect }}</p>
                    </div>
                  </li>
                  <li v-if="paginatedBackpackItems.length === 0" class="empty-hint">无匹配物品</li>
                </ul>
              </div>
              <div class="pagination-controls" v-if="totalBackpackPages > 1">
                <button @click="backpackPage--" :disabled="backpackPage === 1">‹</button>
                <span>{{ backpackPage }} / {{ totalBackpackPages }}</span>
                <button @click="backpackPage++" :disabled="backpackPage === totalBackpackPages">›</button>
              </div>
            </div>

            <!-- 右侧：仓库 (Local Draft) -->
            <div class="inventory-column warehouse-column">
              <h3 class="column-title">秘密仓库</h3>
              <div class="items-list-wrapper">
                <ul class="items-list compact">
                  <li v-for="item in paginatedWarehouseItems" :key="item.name" class="item-entry compact-entry" :class="{ 'is-modified': item.isModified }">
                    <div class="item-header">
                      <button
                        class="action-btn retrieve-btn"
                        @click="openTransferModal(item, 'toBackpack')"
                        :disabled="isDanger"
                        title="取出物品"
                      >
                        ➜
                      </button>
                      <span class="item-name" :title="item.description">{{ item.name }}</span>
                      <div class="item-meta">
                        <span class="item-qty">x{{ item.quantity }}</span>
                        <span class="item-durability" :class="getDurabilityClass(item.durability)">D:{{ item.durability }}</span>
                      </div>
                    </div>
                    <div class="item-tooltip right-tooltip">
                      <p><strong>描述:</strong> {{ item.description }}</p>
                      <p><strong>作用:</strong> {{ item.effect }}</p>
                    </div>
                  </li>
                  <li v-if="paginatedWarehouseItems.length === 0" class="empty-hint">无匹配物品</li>
                </ul>
              </div>
              <div class="pagination-controls" v-if="totalWarehousePages > 1">
                <button @click="warehousePage--" :disabled="warehousePage === 1">‹</button>
                <span>{{ warehousePage }} / {{ totalWarehousePages }}</span>
                <button @click="warehousePage++" :disabled="warehousePage === totalWarehousePages">›</button>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="action-bar">
            <button class="btn-reset" @click="resetInventory" :disabled="!hasUnsavedChanges">重置变动</button>
            <button class="btn-confirm" @click="saveAllChanges" :disabled="!hasUnsavedChanges || isDanger">
              {{ isDanger ? '危险场景不可操作' : '确认全部更新' }}
            </button>
          </div>
        </div>
      </template>

      <!-- C. "金钱" 的内容区 -->
      <template v-else-if="activeTab === 'money'">
        <div v-if="userMoney" class="money-container">
          <h2 class="money-title">当前资产</h2>
          <div class="money-display">
            <div class="money-item">
              <span class="money-icon">🪙</span>
              <span class="money-label">金索尔</span>
              <span class="money-value">{{ userMoney.金索尔 }}</span>
            </div>
            <div class="money-item">
              <span class="money-icon">🪩</span>
              <span class="money-label">银里弗</span>
              <span class="money-value">{{ userMoney.银里弗 }}</span>
            </div>
            <div class="money-item">
              <span class="money-icon">⚖️</span>
              <span class="money-label">铜便士</span>
              <span class="money-value">{{ userMoney.铜便士 }}</span>
            </div>
          </div>
          <div class="money-info">
            <p>我可以通过学院委托、社会打工、狩猎魔物等方式来获取金钱(迷茫之时，请叩问自己的内心)</p>
          </div>
        </div>
        <div v-else class="loading-state">财务状况未知...</div>
      </template>
    </div>

    <!-- 数量选择模态框 -->
    <transition name="fade-main">
      <div v-if="showQuantityModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <h3>交换: {{ pendingTransferItem?.name }}</h3>
          <div class="modal-body">
            <div class="range-display">
              <span>数量: {{ transferAmount }}</span>
              <span class="max-label">(最大: {{ pendingTransferItem?.quantity }})</span>
            </div>
            <input
              type="range"
              v-model.number="transferAmount"
              min="1"
              :max="pendingTransferItem?.quantity"
              class="qty-slider"
            >
            <div class="quick-select">
              <button @click="transferAmount = 1">1</button>
              <button @click="transferAmount = Math.ceil(pendingTransferItem?.quantity / 2)">1/2</button>
              <button @click="transferAmount = pendingTransferItem?.quantity">全部</button>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="closeModal">取消</button>
            <button class="btn-confirm-modal" @click="confirmTransfer">确定</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStatStore } from '@/尘史使徒/store/StatStore';
import { ERAUtil } from '@/Utils/ERAUtil';
import { MessageUtil } from '@/Utils/MessageUtil';

// --- 静态数据 ---
const artPrinciples = {
  '灯': { description: '灯是理性、求知与启明的准则。',  themeClass: 'theme-lamp' },
  '铸': { description: '铸是毁灭、塑形与技巧的准则。',  themeClass: 'theme-forge' },
  '刃': { description: '刃是斗争与征服的准则。',  themeClass: 'theme-blade' },
  '冬': { description:'冬是静默、消逝、铭记、终结的准则。', themeClass: 'theme-winter' },
  '心': { description: '心是生命、存续、不息的准则。', themeClass: 'theme-heart' },
  '杯': { description: '杯是欲望、生育、诱惑的准则。', themeClass: 'theme-cup' },
  '蛾': { description: '蛾是变化、混沌、未知的准则。', themeClass: 'theme-moth' },
  '启': { description: '启是揭示、洞开、拆解的准则。',  themeClass: 'theme-key' },
};

const statStore = useStatStore();

// --- 状态管理 ---
const activeTab = ref('money');
const currentArtIndex = ref(0);
const artDetailTab = ref('description');
const descriptionPage = ref(1);
const DESCRIPTIONS_PER_PAGE = 4;

// 仓库/背包 状态
const itemSearchQuery = ref('');
const backpackPage = ref(1);
const warehousePage = ref(1);
const ITEMS_PER_PAGE = 10;

// 本地暂存库存 (Draft State)
const localBackpack = ref({});
const localWarehouse = ref({});
const hasUnsavedChanges = ref(false);

// 模态框状态
const showQuantityModal = ref(false);
const pendingTransferItem = ref(null); // 当前正在操作的物品对象
const pendingTransferDirection = ref(''); // 'toWarehouse' or 'toBackpack'
const transferAmount = ref(1);

// --- 计算属性 ---

// 1. 基础数据获取
const isDanger = computed(() => statStore.stat_data?.危险场景 === true);
const artLevelDescriptionsData = computed(() => statStore.stat_data?.术);
const userArts = computed(() => {
  const artsData = statStore.stat_data?.角色?.主要角色?.['user']?.术之等级;
  return artsData ? Object.entries(artsData).map(([name, data]) => ({ name, data })) : [];
});
const userMoney = computed(() => {
  const moneyData = statStore.stat_data?.金钱;
  if (!moneyData) return null;
  return {
    金索尔: moneyData.金索尔 || 0,
    银里弗: moneyData.银里弗 || 0,
    铜便士: moneyData.铜便士 || 0
  };
});

// 2. 物品处理 (基于本地 Draft)
const processLocalItems = (itemsObj) => {
  if (!itemsObj) return [];
  return Object.entries(itemsObj)
    .filter(([itemName]) => itemName !== '$template')
    .map(([itemName, itemDetails]) => ({
      name: itemName,
      description: itemDetails?.描述 || '描述缺失',
      effect: itemDetails?.作用 || '作用未知',
      quantity: itemDetails?.数量 !== undefined ? itemDetails.数量 : 0,
      durability: itemDetails?.耐久 !== undefined ? itemDetails.耐久 : 0,
      isModified: itemDetails?.isModified || false, // 标记是否被修改过
      raw: itemDetails
    }));
};

const localBackpackList = computed(() => processLocalItems(localBackpack.value));
const localWarehouseList = computed(() => processLocalItems(localWarehouse.value));

// 3. 搜索过滤
const filterItems = (items) => {
  if (!itemSearchQuery.value) return items;
  const query = itemSearchQuery.value.toLowerCase();
  return items.filter(item => item.name.toLowerCase().includes(query));
};

const filteredBackpackItems = computed(() => filterItems(localBackpackList.value));
const filteredWarehouseItems = computed(() => filterItems(localWarehouseList.value));

// 4. 分页
const paginate = (items, page) => {
  const start = (page - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
};

const paginatedBackpackItems = computed(() => paginate(filteredBackpackItems.value, backpackPage.value));
const paginatedWarehouseItems = computed(() => paginate(filteredWarehouseItems.value, warehousePage.value));

const totalBackpackPages = computed(() => Math.ceil(filteredBackpackItems.value.length / ITEMS_PER_PAGE));
const totalWarehousePages = computed(() => Math.ceil(filteredWarehouseItems.value.length / ITEMS_PER_PAGE));

// 5. 术相关计算 (保持原样)
const currentArt = computed(() => userArts.value[currentArtIndex.value]);
const maxLevelText = computed(() => {
  if (!currentArt.value || currentArt.value.data.下一级需求经验 !== -1) return '';
  const level = currentArt.value.data.当前等级;
  if (level === 0) return "我不具备此术的适性，或许还有其他办法...";
  if (level >= 14 && level <= 18) return "我需要仪式或者秘密来精进此术...";
  if (level >= 19) return "唯有更靠近准则本质方有精进的可能...";
  return "前路已断，无法再精进。";
});
const currentArtLevelDescriptions = computed(() => {
  if (!currentArt.value) return [];
  const artName = currentArt.value.name;
  const currentLevel = currentArt.value.data.当前等级;
  const descriptionsMap = artLevelDescriptionsData.value?.[artName];
  if (!descriptionsMap) return [];
  const unlockedDescriptions = [];
  const levelThresholds = Object.keys(descriptionsMap).map(Number).sort((a, b) => a - b);
  for (const threshold of levelThresholds) {
    if (threshold > 0 && threshold <= currentLevel) {
      const descriptions = descriptionsMap[String(threshold)];
      if (descriptions && typeof descriptions === 'string') unlockedDescriptions.push(descriptions);
    }
  }
  return unlockedDescriptions;
});
const totalDescriptionPages = computed(() => Math.ceil(currentArtLevelDescriptions.value.length / DESCRIPTIONS_PER_PAGE));
const paginatedDescriptions = computed(() => {
  const startIndex = (descriptionPage.value - 1) * DESCRIPTIONS_PER_PAGE;
  return currentArtLevelDescriptions.value.slice(startIndex, startIndex + DESCRIPTIONS_PER_PAGE);
});

// --- 监听器 ---
watch(currentArtIndex, () => {
  artDetailTab.value = 'description';
  descriptionPage.value = 1;
});
watch(itemSearchQuery, () => {
  backpackPage.value = 1;
  warehousePage.value = 1;
});
// 当切换到 items 标签页时，初始化本地库存
watch(activeTab, (newTab) => {
  if (newTab === 'items') {
    resetInventory();
  }
});

// --- 方法 ---
function selectTab(tabName) { activeTab.value = tabName; }
function selectArt(index) { currentArtIndex.value = index; }
function selectArtDetailTab(tabName) { artDetailTab.value = tabName; }
function prevDescriptionPage() { if (descriptionPage.value > 1) descriptionPage.value--; }
function nextDescriptionPage() { if (descriptionPage.value < totalDescriptionPages.value) descriptionPage.value++; }

function getDurabilityClass(val) {
  if (val < 10) return 'durability-critical';
  if (val < 30) return 'durability-low';
  return 'durability-normal';
}

// --- 核心逻辑：本地库存管理与批量更新 ---

// 1. 初始化/重置库存
function resetInventory() {
  // 深拷贝 store 中的数据到本地 ref
  const rawBackpack = statStore.stat_data?.器具 || {};
  const rawWarehouse = statStore.stat_data?.仓库 || {};

  localBackpack.value = JSON.parse(JSON.stringify(rawBackpack));
  localWarehouse.value = JSON.parse(JSON.stringify(rawWarehouse));
  hasUnsavedChanges.value = false;
}

// 2. 打开交换模态框
function openTransferModal(item, direction) {
  if (isDanger.value) return;
  pendingTransferItem.value = item;
  pendingTransferDirection.value = direction;
  transferAmount.value = 1; // 默认数量
  showQuantityModal.value = true;
}

function closeModal() {
  showQuantityModal.value = false;
  pendingTransferItem.value = null;
}

// 3. 确认单次本地交换 (不调用 API，只改本地数据)
function confirmTransfer() {
  if (!pendingTransferItem.value || transferAmount.value <= 0) return;

  const item = pendingTransferItem.value;
  const qty = transferAmount.value;
  const direction = pendingTransferDirection.value;

  const isStoring = direction === 'toWarehouse';
  const sourceObj = isStoring ? localBackpack.value : localWarehouse.value;
  const targetObj = isStoring ? localWarehouse.value : localBackpack.value;

  // A. 处理源头 (减少数量)
  if (sourceObj[item.name]) {
    sourceObj[item.name].数量 -= qty;
    sourceObj[item.name].isModified = true; // 标记修改
    // 如果数量归零，删除条目
    if (sourceObj[item.name].数量 <= 0) {
      delete sourceObj[item.name];
    }
  }

  // B. 处理目标 (增加数量)
  if (targetObj[item.name]) {
    // 目标已存在：合并逻辑
    const existing = targetObj[item.name];
    // 耐久度合并算法：(原耐久 + 新耐久) / 2，向上取整
    const newDurability = Math.ceil((existing.耐久 + item.durability) / 2);

    existing.数量 += qty;
    existing.耐久 = newDurability;
    existing.isModified = true;
  } else {
    // 目标不存在：新建条目
    targetObj[item.name] = {
      "描述": item.description,
      "作用": item.effect,
      "数量": qty,
      "耐久": item.durability,
      "isModified": true
    };
  }

  hasUnsavedChanges.value = true;
  closeModal();
}
// 4. 批量保存更改 (API 调用)
async function saveAllChanges() {
  if (isDanger.value) return;

  // 1. 准备 Payload
  const deletePayload = { "器具": {}, "仓库": {} };
  const insertPayload = { "器具": {}, "仓库": {} };
  const exchangeLogs = [];

  // 获取远程原始数据（用于构建删除列表和对比日志）
  const remoteBackpack = statStore.stat_data?.器具 || {};
  const remoteWarehouse = statStore.stat_data?.仓库 || {};

  // --- A. 构建删除 Payload (清空远程现有的所有条目) ---
  // 只要远程有的，全部加入删除列表
  Object.keys(remoteBackpack).forEach(key => {
    if (key !== '$template') deletePayload["器具"][key] = {};
  });
  Object.keys(remoteWarehouse).forEach(key => {
    if (key !== '$template') deletePayload["仓库"][key] = {};
  });

  // --- B. 构建插入 Payload (写入本地当前的所有条目) ---
  // 将本地草稿中的所有数据写入
  Object.entries(localBackpack.value).forEach(([key, item]) => {
    if (key !== '$template') {
      const { isModified, ...cleanItem } = item; // 移除前端临时字段
      insertPayload["器具"][key] = cleanItem;
    }
  });
  Object.entries(localWarehouse.value).forEach(([key, item]) => {
    if (key !== '$template') {
      const { isModified, ...cleanItem } = item;
      insertPayload["仓库"][key] = cleanItem;
    }
  });

  // --- C. 计算日志 (对比 本地 vs 远程) ---
  const allItemNames = new Set([
    ...Object.keys(remoteBackpack),
    ...Object.keys(remoteWarehouse),
    ...Object.keys(localBackpack.value),
    ...Object.keys(localWarehouse.value)
  ]);

  allItemNames.forEach(name => {
    if (name === '$template') return;

    // 获取数量，不存在则为0
    const oldBagQty = remoteBackpack[name]?.数量 || 0;
    const newBagQty = localBackpack.value[name]?.数量 || 0;
    const oldWhQty = remoteWarehouse[name]?.数量 || 0;
    const newWhQty = localWarehouse.value[name]?.数量 || 0;

    const bagDiff = newBagQty - oldBagQty;
    const whDiff = newWhQty - oldWhQty;

    // 只有当背包和仓库都有变动时，才视为交换
    if (bagDiff === 0 && whDiff === 0) return;

    // 逻辑：背包减少且仓库增加 -> 存入
    if (bagDiff < 0 && whDiff > 0) {
      const amount = Math.min(Math.abs(bagDiff), whDiff); // 取变动量的最小值作为实际交换量
      exchangeLogs.push({ "名称": name, "数量": amount, "方向": "存入仓库" });
    }
    // 逻辑：背包增加且仓库减少 -> 取出
    else if (bagDiff > 0 && whDiff < 0) {
      const amount = Math.min(bagDiff, Math.abs(whDiff));
      exchangeLogs.push({ "名称": name, "数量": amount, "方向": "取出到背包" });
    }
  });

  // 如果没有实际变动且没有未保存标记，直接返回
  if (Object.keys(deletePayload["器具"]).length === 0 &&
    Object.keys(deletePayload["仓库"]).length === 0 &&
    Object.keys(insertPayload["器具"]).length === 0 &&
    Object.keys(insertPayload["仓库"]).length === 0) {
    hasUnsavedChanges.value = false;
    return;
  }

  try {
    // 执行 API：先删后增
    // 1. 删除远程旧数据
    if (Object.keys(deletePayload["器具"]).length > 0 || Object.keys(deletePayload["仓库"]).length > 0) {
      await ERAUtil.DeleteByObject(deletePayload);
    }

    // 2. 插入本地新数据
    if (Object.keys(insertPayload["器具"]).length > 0 || Object.keys(insertPayload["仓库"]).length > 0) {
      await ERAUtil.InsertByObject(insertPayload);
    }

    // 3. 记录日志
    if (exchangeLogs.length > 0) {
      const jsonLog = JSON.stringify(exchangeLogs, null, 2);
      const logText = `\n<user>与漫宿之上的神秘空间进行了物资交换:\n\`\`\`json\n${jsonLog}\n\`\`\``;

      // 确保 getCurrentMessageId 可用
      if (typeof getCurrentMessageId === 'function') {
        await MessageUtil.mergeContentToMessage(getCurrentMessageId(), logText, 'none');
      }
    }

    // 重置状态
    hasUnsavedChanges.value = false;
    Object.values(localBackpack.value).forEach(i => i.isModified = false);
    Object.values(localWarehouse.value).forEach(i => i.isModified = false);

  } catch (e) {
    console.error("批量更新失败:", e);
    // 可以在这里添加错误提示 UI
  }
}

</script>

<style scoped lang="scss">
/* --- 基础布局与通用样式 --- */
.arts-items-view-container { display: flex; flex-direction: column; height: 100%; position: relative; }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
.tab-button { background: none; border: none; border-bottom: 3px solid transparent; padding: 0.5rem 1.5rem; font-family: 'Cinzel', serif; font-size: 1.1rem; color: var(--text-secondary); cursor: pointer; transition: all 0.3s ease; }
.tab-button:hover { color: var(--text-primary); }
.tab-button.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
.content-wrapper { flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; }
.loading-state { color: var(--text-secondary); font-style: italic; text-align: center; padding: 4rem 0; }

/* --- "术" 模块布局 (保持原样) --- */
.arts-layout { display: grid; grid-template-columns: 220px 1fr; gap: 1.5rem; height: 100%; overflow: auto; }
.pagination-nav { background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem 0; overflow-y: auto; }
.pagination-nav ul { list-style: none; padding: 0; margin: 0; }
.art-button { width: 100%; background: none; border: none; border-left: 3px solid transparent; padding: 0.8rem 1.5rem; text-align: left; font-family: 'EB Garamond', serif; font-size: 1rem; color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
.art-button:hover { background-color: var(--bg-primary); color: var(--text-primary); }
.art-button.active { background-color: var(--bg-primary); color: var(--accent-primary); border-left-color: var(--accent-danger); font-weight: bold; }
.panel-display-area { overflow: hidden; height: 100%; }
.art-panel { position: relative; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; height: 100%; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
.art-bg-effect { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
.art-content { position: relative; z-index: 1; padding: 2rem 3rem; text-align: center; max-width: 60ch; width: 100%; overflow-y: auto; height: 100%; display: flex; flex-direction: column; }
.art-name { font-family: 'Cinzel', serif; font-size: 3rem; margin: 0; }
.art-description { font-family: 'EB Garamond', serif; font-size: 1.1rem; line-height: 1.6; margin-top: 2rem; }
.art-detail-tabs { display: flex; gap: 1.5rem; justify-content: center; margin-top: 1.5rem; border-bottom: 1px solid var(--border-color); }
.art-detail-tabs button { background: none; border: none; border-bottom: 2px solid transparent; padding: 0.5rem 0; font-family: 'EB Garamond', serif; font-size: 1rem; color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
.art-detail-tabs button:hover { color: var(--text-primary); }
.art-detail-tabs button.active { color: var(--theme-color, var(--accent-primary)); border-bottom-color: var(--theme-color, var(--accent-primary)); font-weight: bold; }
.art-detail-page { flex-grow: 1; padding-top: 0.5rem; }
.level-info { margin-top: 2.5rem; }
.level-display { margin-bottom: 1.5rem; }
.level-display .label { font-size: 1rem; color: var(--text-secondary); margin-right: 1rem; }
.level-display .value { font-size: 2.5rem; font-weight: bold; }
.xp-display-text { background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.6rem 1rem; text-align: center; font-family: 'EB Garamond', serif; font-size: 1rem; color: var(--text-secondary); letter-spacing: 1px; }
.max-level-notice { font-style: italic; color: var(--accent-primary); margin-top: 1.5rem; }
.level-descriptions-container { text-align: left; }
.descriptions-list { min-height: 120px; }
.level-description-item { font-family: 'EB Garamond', serif; font-size: 1rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 0.75rem; padding-left: 1.2em; text-indent: -1.2em; }
.level-description-item::before { content: '◈'; margin-right: 0.5em; color: var(--theme-color, var(--accent-primary)); font-size: 0.8em; vertical-align: middle; }
.description-pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(136, 136, 136, 0.15); }
.pagination-btn { background: none; border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 50%; width: 32px; height: 32px; font-size: 1.4rem; font-weight: bold; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0; padding-bottom: 2px; }
.pagination-btn:hover:not(:disabled) { background-color: var(--bg-primary); color: var(--text-primary); border-color: var(--accent-primary); transform: scale(1.1); }
.pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-indicator { font-family: 'EB Garamond', serif; font-size: 0.9rem; color: var(--text-secondary); min-width: 4ch; text-align: center; }

/* --- "器 & 仓" 模块样式 --- */
.inventory-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.5rem;
  overflow: hidden;
}

.inventory-search {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0 0.5rem;
}

.search-input {
  flex-grow: 1;
  background: rgba(30, 30, 30, 0.5);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'EB Garamond', serif;
}

.danger-indicator {
  font-size: 0.8rem;
  color: var(--success-color, #4ade80);
  font-weight: bold;
}
.danger-indicator.is-danger {
  color: var(--danger-color, #f87171);
}

.unsaved-indicator {
  font-size: 0.8rem;
  color: #fbbf24;
  font-weight: bold;
  animation: pulse 2s infinite;
}

.inventory-columns {
  display: flex;
  flex-grow: 1;
  gap: 1rem;
  overflow: hidden;
}

.inventory-column {
  flex: 1;
  display: flex;
  min-height: 300px;
  flex-direction: column;
  background: rgba(40, 40, 40, 0.4);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  overflow: hidden;
}

.warehouse-column {
  background: rgba(20, 20, 30, 0.6);
}

.column-title {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  text-align: center;
  margin: 0;
  padding: 0.5rem;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid var(--border-color);
  color: var(--accent-primary);
}

.items-list-wrapper {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.items-list.compact {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-entry.compact-entry {
  position: relative;
  background: rgba(60, 60, 60, 0.3);
  border: 1px solid transparent;
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  transition: background 0.2s;
}

/* 标记修改过的条目 */
.item-entry.compact-entry.is-modified {
  border-left: 3px solid #fbbf24;
  background: rgba(251, 191, 36, 0.1);
}

.item-tooltip {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--accent-primary);
  padding: 0.5rem;
  z-index: 10;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  font-size: 0.8rem;
  color: var(--text-secondary);
  pointer-events: none;
}
.item-entry.compact-entry:hover .item-tooltip {
  display: block;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.item-name {
  font-weight: bold;
  color: var(--text-primary);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.item-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-family: monospace;
}

.item-qty { color: var(--accent-primary); }

.action-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0 0.4rem;
  border-radius: 3px;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.action-btn:hover:not(:disabled) {
  background: var(--accent-primary);
  color: #000;
  border-color: var(--accent-primary);
}
.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.store-btn:hover { background: #fbbf24; border-color: #fbbf24; }
.retrieve-btn { transform: rotate(180deg); }
.retrieve-btn:hover { background: #4ade80; border-color: #4ade80; }

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-top: 1px solid var(--border-color);
  background: rgba(0,0,0,0.1);
}
.pagination-controls button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: bold;
}
.pagination-controls button:disabled { opacity: 0.3; }

.empty-hint {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
  font-size: 0.8rem;
  padding: 1rem;
}

.durability-value { font-weight: bold; color: var(--success-color, #4ade80); font-size: 0.8rem; }
.durability-low { color: var(--warning-color, #fbbf24); }
.durability-critical { color: var(--danger-color, #f87171); animation: pulse 1s infinite; }

/* 底部操作栏 */
.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 0.5rem;
  border-top: 1px solid var(--border-color);
  background: rgba(0,0,0,0.2);
}
.btn-reset, .btn-confirm {
  padding: 0.5rem 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  transition: all 0.2s;
}
.btn-reset {
  background: transparent;
  color: var(--text-secondary);
}
.btn-reset:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}
.btn-confirm {
  background: var(--accent-primary);
  color: #000;
  font-weight: bold;
  border-color: var(--accent-primary);
}
.btn-confirm:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 0 10px var(--accent-primary);
}
.btn-confirm:disabled, .btn-reset:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #333;
  color: #666;
  border-color: #444;
}

/* 模态框样式 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(2px);
}
.modal-content {
  background: var(--bg-secondary);
  border: 1px solid var(--accent-primary);
  padding: 1.5rem;
  border-radius: 8px;
  width: 300px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.8);
}
.modal-content h3 {
  margin-top: 0;
  color: var(--accent-primary);
  font-family: 'Cinzel', serif;
  text-align: center;
}
.modal-body {
  margin: 1.5rem 0;
}
.range-display {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-family: monospace;
}
.max-label { color: var(--text-secondary); font-size: 0.8rem; }
.qty-slider {
  width: 100%;
  margin-bottom: 1rem;
  cursor: pointer;
}
.quick-select {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.quick-select button {
  flex: 1;
  background: rgba(255,255,255,0.1);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 3px;
}
.quick-select button:hover {
  background: var(--accent-primary);
  color: #000;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.4rem 1rem;
  cursor: pointer;
}
.btn-confirm-modal {
  background: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  color: #000;
  padding: 0.4rem 1rem;
  cursor: pointer;
  font-weight: bold;
}

/* --- "金钱" 模块样式 --- */
.money-container { background: rgba(40, 40, 40, 0.7); border: 1px solid var(--border-color); border-radius: 5px; padding: 1.1rem; display: flex; flex-direction: column; align-items: center; overflow: auto; }
.money-title { font-family: 'Cinzel', serif; font-size: 1.2rem; margin: 0 0 0.7rem 0; text-align: center; color: var(--accent-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; width: 100%; }
.money-display { display: flex; flex-direction: column; gap: 0.8rem; width: 100%; margin-bottom: 1.5rem; }
.money-item { display: flex; justify-content: space-between; align-items: center; background: rgba(30, 30, 30, 0.5); border: 1px solid var(--border-color); border-radius: 3px; padding: 0.5rem 0.7rem; }
.money-item:hover { border-color: var(--accent-primary); }
.money-icon { font-size: 1.2rem; margin-right: 0.5rem; width: 2rem; text-align: center; }
.money-label { font-family: 'Cinzel', serif; font-size: 0.9rem; color: var(--text-secondary); flex-grow: 1; text-align: left; }
.money-value { font-family: 'EB Garamond', serif; font-size: 1rem; font-weight: bold; color: var(--accent-primary); min-width: 40px; text-align: right; }
.money-info { font-family: 'EB Garamond', serif; font-size: 0.9rem; color: var(--text-secondary); text-align: center; padding: 0.5rem; border-top: 1px solid var(--border-color); width: 100%; margin-top: 0.5rem; }

/* --- 动态主题与特效 (保持原样) --- */
.theme-lamp { --theme-color: #FFD700; }
.theme-lamp .art-name { color: var(--theme-color); text-shadow: 0 0 10px var(--theme-color); }
.theme-lamp .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 70%); opacity: 0.15; }
.theme-forge { --theme-color: #FF4500; --flame-color-2: #FF8C00; }
.theme-forge .art-name { color: var(--theme-color); text-shadow: 0 0 5px #fff, 0 0 10px var(--theme-color), 0 0 15px var(--flame-color-2); }
.theme-forge .art-bg-effect { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 0; }
@keyframes art-forge-seamless-rise { from { transform: translateY(0); } to { transform: translateY(-50%); } }
.theme-forge .art-bg-effect::before, .theme-forge .art-bg-effect::after { content: ''; position: absolute; left: 0; width: 100%; height: 200%; background-image: radial-gradient(circle, var(--theme-color) 1px, transparent 1px); background-repeat: repeat; animation-name: art-forge-seamless-rise; animation-timing-function: linear; animation-iteration-count: infinite; }
.theme-forge .art-bg-effect::before { top: 0; background-size: 70px 70px; animation-duration: 6s; opacity: 0.7; }
.theme-forge .art-bg-effect::after { top: 0; background-size: 110px 110px; animation-duration: 10s; opacity: 0.6; animation-delay: -3s; }
.theme-blade { --theme-color: #C0C0C0; --metal-dark: #888; --metal-light: #F0F0F0; }
.theme-blade .art-name { background: linear-gradient(180deg, var(--metal-light), var(--theme-color) 50%, var(--metal-dark) 51%, var(--theme-color) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); -webkit-text-fill-color: transparent; }
.theme-blade .art-bg-effect { background: linear-gradient(0deg, rgba(255,255,255,0.05), rgba(0,0,0,0.05)), repeating-linear-gradient(90deg, #ccc, #ccc 1px, #bbb 1px, #bbb 2px); opacity: 0.3; }
.theme-winter { --theme-color: #A3D5D5; }
.theme-winter .art-name { color: var(--theme-color); }
.theme-winter .art-bg-effect { background: radial-gradient(circle, #fff 5%, transparent 6%), radial-gradient(circle, #fff 3%, transparent 4%); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: snow 10s linear infinite; }
@keyframes snow { 0% {background-position: 0 0, 25px 25px;} 100% {background-position: 0 300px, 25px 325px;} }
.theme-heart { --theme-color: #FF69B4; }
.theme-heart .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }
.theme-heart .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 50%) no-repeat center; animation: art-heart-pulse-gradient 2s infinite ease-in-out; opacity: 0.15; }
@keyframes art-heart-pulse-gradient { 0%, 100% { background-size: 100% 100%; opacity: 0.1; } 50% { background-size: 150% 150%; opacity: 0.2; } }
.theme-cup { --theme-color: #8B0000; }
.theme-cup .art-name { color: var(--theme-color); text-shadow: 0 0 5px rgba(0,0,0,0.5); }
.theme-cup .art-bg-effect { background-image: linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%); background-repeat: no-repeat; background-size: 2px 150%, 3px 200%, 1px 220%, 2px 180%, 3px 250%, 1px 160%; background-position: 10% 0, 25% 0, 40% 0, 60% 0, 75% 0, 90% 0; animation: art-cup-drip-y 4s linear 0s infinite, art-cup-drip-y 6s linear 1.5s infinite, art-cup-drip-y 5s linear 3.5s infinite, art-cup-drip-y 7s linear 2s infinite, art-cup-drip-y 4.5s linear 5s infinite, art-cup-drip-y 5.5s linear 0.5s infinite; opacity: 0.5; }
@keyframes art-cup-drip-y { from { background-position-y: -250%; } to { background-position-y: 100%; } }
.theme-moth { --theme-color: #888888; }
.theme-moth .art-name { color: var(--theme-color); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); animation: art-moth-glitch-strong 1.5s infinite steps(1); }
.theme-moth .art-bg-effect { background: repeating-linear-gradient(45deg, #0001, #0001 1px, transparent 1px, transparent 5px); opacity: 0.15; }
@keyframes art-moth-glitch-strong { 0% { transform: translate(0, 0) skew(0); } 10% { transform: translate(-5px, 3px) skew(-5deg); } 20% { transform: translate(5px, -3px) skew(5deg); } 30% { transform: translate(-8px, 5px) skew(-2deg); } 40% { transform: translate(8px, -5px) skew(2deg); } 50% { transform: translate(-5px, 3px) skew(-5deg); } 60% { transform: translate(5px, -3px) skew(5deg); } 70% { transform: translate(-8px, 5px) skew(-2deg); } 80% { transform: translate(0, 0) skew(0); } 100% { transform: translate(0, 0) skew(0); } }
.theme-key { --theme-color: #9400D3; }
.theme-key .art-name { color: var(--theme-color); text-shadow: 0 0 8px var(--theme-color); }
.theme-key .art-bg-effect { background: radial-gradient(ellipse at center, var(--theme-color) 0%, rgba(148, 0, 211, 0.5) 30%, rgba(148, 0, 211, 0.1) 60%, transparent 80%); transform-origin: center; animation: art-key-slow-spin 30s linear infinite; opacity: 0.4; }
@keyframes art-key-slow-spin { from { transform: scale(1.5) rotate(0deg); } to { transform: scale(1.5) rotate(360deg); } }

/* --- 响应式与动画 --- */
@media (max-width: 900px) {
  .arts-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .pagination-nav ul { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
  .art-button { width: auto; border-left: none; border-bottom: 2px solid transparent; border-radius: 4px; }
  .art-button.active { border-bottom-color: var(--accent-danger); }
  .inventory-columns { flex-direction: column; overflow-y: auto; }
  .inventory-column { max-height: 400px; }
}
.fade-main-enter-active, .fade-main-leave-active { transition: opacity 0.3s ease; }
.fade-main-enter-from, .fade-main-leave-to { opacity: 0; }
.fade-list-move, .fade-list-enter-active, .fade-list-leave-active { transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1); }
.fade-list-enter-from, .fade-list-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }
.fade-list-leave-active { position: absolute; width: calc(100% - 6rem); }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
</style>
