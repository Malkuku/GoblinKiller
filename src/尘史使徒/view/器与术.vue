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

      <!-- A. "术" 的内容区 (保持原样，略微调整以适应新结构) -->
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

      <!-- B. "器 & 仓" 的内容区 (重构) -->
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
          </div>

          <div class="inventory-columns">
            <!-- 左侧：背包 -->
            <div class="inventory-column">
              <h3 class="column-title">随身行囊</h3>
              <div class="items-list-wrapper">
                <ul class="items-list compact">
                  <li v-for="item in paginatedBackpackItems" :key="item.name" class="item-entry compact-entry">
                    <div class="item-header">
                      <span class="item-name" :title="item.description">{{ item.name }}</span>
                      <div class="item-meta">
                        <span class="item-qty">x{{ item.quantity }}</span>
                        <span class="item-durability" :class="getDurabilityClass(item.durability)">D:{{ item.durability }}</span>
                      </div>
                      <button
                        class="action-btn store-btn"
                        @click="transferItem(item, 'toWarehouse')"
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
              <!-- 背包分页 -->
              <div class="pagination-controls" v-if="totalBackpackPages > 1">
                <button @click="backpackPage--" :disabled="backpackPage === 1">‹</button>
                <span>{{ backpackPage }} / {{ totalBackpackPages }}</span>
                <button @click="backpackPage++" :disabled="backpackPage === totalBackpackPages">›</button>
              </div>
            </div>

            <!-- 右侧：仓库 -->
            <div class="inventory-column warehouse-column">
              <h3 class="column-title">秘密仓库</h3>
              <div class="items-list-wrapper">
                <ul class="items-list compact">
                  <li v-for="item in paginatedWarehouseItems" :key="item.name" class="item-entry compact-entry">
                    <div class="item-header">
                      <button
                        class="action-btn retrieve-btn"
                        @click="transferItem(item, 'toBackpack')"
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
              <!-- 仓库分页 -->
              <div class="pagination-controls" v-if="totalWarehousePages > 1">
                <button @click="warehousePage--" :disabled="warehousePage === 1">‹</button>
                <span>{{ warehousePage }} / {{ totalWarehousePages }}</span>
                <button @click="warehousePage++" :disabled="warehousePage === totalWarehousePages">›</button>
              </div>
            </div>
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStatStore } from '@/尘史使徒/store/StatStore';
import { ERAUtil } from '@/Utils/ERAUtil';
import { MessageUtil } from '@/Utils/MessageUtil';

// --- 静态数据：术的原则与主题 ---
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

// 2. 物品处理 (通用函数)
const processItems = (itemsData) => {
  if (!itemsData) return [];
  return Object.entries(itemsData)
    .filter(([itemName]) => itemName !== '$template')
    .map(([itemName, itemDetails]) => ({
      name: itemName,
      description: itemDetails?.描述 || '描述缺失',
      effect: itemDetails?.作用 || '作用未知',
      quantity: itemDetails?.数量 !== undefined ? itemDetails.数量 : 0,
      durability: itemDetails?.耐久 !== undefined ? itemDetails.耐久 : 0,
      // 保留原始引用以便更新
      raw: itemDetails
    }));
};

const rawBackpackItems = computed(() => processItems(statStore.stat_data?.器具));
const rawWarehouseItems = computed(() => processItems(statStore.stat_data?.仓库));

// 3. 搜索过滤
const filterItems = (items) => {
  if (!itemSearchQuery.value) return items;
  const query = itemSearchQuery.value.toLowerCase();
  return items.filter(item => item.name.toLowerCase().includes(query));
};

const filteredBackpackItems = computed(() => filterItems(rawBackpackItems.value));
const filteredWarehouseItems = computed(() => filterItems(rawWarehouseItems.value));

// 4. 分页
const paginate = (items, page) => {
  const start = (page - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
};

const paginatedBackpackItems = computed(() => paginate(filteredBackpackItems.value, backpackPage.value));
const paginatedWarehouseItems = computed(() => paginate(filteredWarehouseItems.value, warehousePage.value));

const totalBackpackPages = computed(() => Math.ceil(filteredBackpackItems.value.length / ITEMS_PER_PAGE));
const totalWarehousePages = computed(() => Math.ceil(filteredWarehouseItems.value.length / ITEMS_PER_PAGE));

// 5. 术相关计算
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
      if (descriptions && typeof descriptions === 'string') {
        unlockedDescriptions.push(descriptions);
      }
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

// 搜索时重置分页
watch(itemSearchQuery, () => {
  backpackPage.value = 1;
  warehousePage.value = 1;
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

/**
 * 物品交换核心逻辑
 * @param {Object} item - 当前操作的物品对象
 * @param {String} direction - 'toWarehouse' (存入) 或 'toBackpack' (取出)
 */
async function transferItem(item, direction) {
  // 1. 检查危险场景
  if (isDanger.value) {
    console.warn("危险场景下无法交换物品");
    return;
  }

  const isStoring = direction === 'toWarehouse';
  const sourceKey = isStoring ? '器具' : '仓库';
  const targetKey = isStoring ? '仓库' : '器具';

  // 获取目标容器中是否已有同名物品
  const targetContainer = statStore.stat_data?.[targetKey] || {};
  const existingItem = targetContainer[item.name];

  // 准备更新数据
  const updatePayload = {};
  const delPreUpdatePayload = {};
  const deletePayload = {};

  // 构造目标物品的新状态
  let newQuantity = item.quantity;
  let newDurability = item.durability;

  if (existingItem) {
    // 存在相同key：更新数量，计算耐久堆叠
    newQuantity += existingItem.数量;
    // 耐久度为两者之和/2向上取整
    newDurability = Math.ceil((item.durability + existingItem.耐久) / 2);
  }

  // 设置目标数据 (UpdateByObject)
  updatePayload[targetKey] = {
    [item.name]: {
      "描述": item.description,
      "作用": item.effect,
      "数量": newQuantity,
      "耐久": newDurability
    }
  };
  delPreUpdatePayload[targetKey] = {
    [item.name]: {}
  }

  // 设置源数据删除 (DeleteByObject) - 假设每次移动都是全部移动
  // 如果需要部分移动，这里需要修改逻辑为更新源数量
  deletePayload[sourceKey] = {
    [item.name]: {} // 空对象表示删除
  };

  try {
    // 执行 API 调用
    await ERAUtil.DeleteByObject(deletePayload);
    await ERAUtil.DeleteByObject(delPreUpdatePayload);
    await ERAUtil.InsertByObject(updatePayload);

    // 3. 记录日志
    const logItem = JSON.stringify([{ "道具名": item.name, "数量": item.quantity }]);
    const logText = isStoring
      ? `\n<user>将以下道具放入了仓库：\n${logItem}`
      : `\n<user>从仓库中取出了以下道具：\n${logItem}`;

    await MessageUtil.mergeContentToMessage(getCurrentMessageId(), logText,'none');

  } catch (e) {
    console.error("物品交换失败:", e);
  }
}

</script>

<style scoped lang="scss">
/* --- 基础布局与通用样式 --- */
.arts-items-view-container { display: flex; flex-direction: column; height: 100%; }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
.tab-button { background: none; border: none; border-bottom: 3px solid transparent; padding: 0.5rem 1.5rem; font-family: 'Cinzel', serif; font-size: 1.1rem; color: var(--text-secondary); cursor: pointer; transition: all 0.3s ease; }
.tab-button:hover { color: var(--text-primary); }
.tab-button.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
.content-wrapper { flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; } /* overflow hidden specifically for items tab scrolling */
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

/* --- "器 & 仓" 模块样式 (新) --- */
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

.inventory-columns {
  display: flex;
  flex-grow: 1;
  gap: 1rem;
  overflow: hidden; /* Prevent outer scroll */
}

.inventory-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(40, 40, 40, 0.4);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  overflow: hidden;
}

.warehouse-column {
  background: rgba(20, 20, 30, 0.6); /* Slightly darker for warehouse */
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

/* Tooltip Logic */
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
.store-btn:hover { background: #fbbf24; border-color: #fbbf24; } /* Yellow for store */
.retrieve-btn { transform: rotate(180deg); } /* Arrow pointing left */
.retrieve-btn:hover { background: #4ade80; border-color: #4ade80; } /* Green for retrieve */

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
