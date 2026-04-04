<template>
  <div class="inventory-equipment-module">
    <!-- 身上装备区域 -->
    <section class="equipment-section">
      <h3 class="section-title">身上装备</h3>
      <div class="equipment-grid">
        <!-- 武器 -->
        <div class="equip-slot">
          <div class="slot-label">武器 (1/1)</div>
          <div v-for="(item, name) in equipment['武器']" :key="name" class="item-card equipped">
            <div class="item-header">
              <span class="item-name">
                <span class="icon-wrapper" v-html="getIconHtml(item)"></span>
                {{ name }}
              </span>
              <button class="action-btn" @click="unequipItem('武器', name, item)">卸下</button>
            </div>
            <div class="item-desc">{{ item.description || '暂无描述' }}</div>
          </div>
          <div v-if="!Object.keys(equipment['武器'] || {}).length" class="empty-slot">空闲</div>
        </div>

        <!-- 防具 -->
        <div class="equip-slot">
          <div class="slot-label">防具 (1/1)</div>
          <div v-for="(item, name) in equipment['防具']" :key="name" class="item-card equipped">
            <div class="item-header">
              <span class="item-name">
                <span class="icon-wrapper" v-html="getIconHtml(item)"></span>
                {{ name }}
              </span>
              <button class="action-btn" @click="unequipItem('防具', name, item)">卸下</button>
            </div>
            <div class="item-desc">{{ item.description || '暂无描述' }}</div>
          </div>
          <div v-if="!Object.keys(equipment['防具'] || {}).length" class="empty-slot">空闲</div>
        </div>

        <!-- 饰品 -->
        <div class="equip-slot">
          <div class="slot-label">饰品 ({{ Object.keys(equipment['饰品'] || {}).length }}/3)</div>
          <div v-for="(item, name) in equipment['饰品']" :key="name" class="item-card equipped">
            <div class="item-header">
              <span class="item-name">
                <span class="icon-wrapper" v-html="getIconHtml(item)"></span>
                {{ name }}
              </span>
              <button class="action-btn" @click="unequipItem('饰品', name, item)">卸下</button>
            </div>
            <div class="item-desc">{{ item.description || '暂无描述' }}</div>
          </div>
          <div v-if="Object.keys(equipment['饰品'] || {}).length === 0" class="empty-slot">空闲</div>
        </div>
      </div>
    </section>

    <!-- 背包物品区域 -->
    <section class="inventory-section">
      <div class="section-header">
        <h3 class="section-title">背包物品</h3>

        <!-- 搜索框 -->
        <div class="search-box">
          <span class="icon-wrapper" v-html="getSVG('intel', { size: 16, color: 'var(--text-muted)' })"></span>
          <input type="text" v-model="searchQuery" placeholder="搜索物品名称..." />
        </div>

        <!-- 排序控制 -->
        <div class="sort-controls">
          <span class="sort-label">排序:</span>
          <button :class="{ active: sortMethod === 'type' }" @click="sortMethod = 'type'">种类</button>
          <button :class="{ active: sortMethod === 'value' }" @click="sortMethod = 'value'">品级</button>
        </div>
      </div>

      <!-- 分类标签页 -->
      <div class="category-tabs">
        <button
          v-for="tab in tabs" :key="tab"
          :class="{ active: currentTab === tab }"
          @click="currentTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <!-- 批量操作区 -->
      <div class="batch-controls" v-if="paginatedInventory.length > 0">
        <template v-if="isBatchDeleteMode">
          <label class="select-all-label">
            <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" />
            全选当前页
          </label>
          <div class="batch-actions">
            <button class="action-btn" @click="toggleBatchDeleteMode">取消</button>
            <button
              class="action-btn delete-btn"
              :disabled="selectedItems.length === 0"
              @click="deleteSelectedItems"
            >
              确认删除 ({{ selectedItems.length }})
            </button>
          </div>
        </template>
        <template v-else>
          <div></div> <!-- 占位符，用于将按钮推至右侧 -->
          <button class="action-btn delete-btn" @click="toggleBatchDeleteMode">
            批量删除
          </button>
        </template>
      </div>

      <!-- 物品列表 -->
      <div class="inventory-list">
        <div v-for="itemObj in paginatedInventory" :key="itemObj.category + itemObj.name" class="item-card" :class="{ 'selected-card': selectedItems.includes(`${itemObj.category}::${itemObj.name}`) }">
          <div class="item-header">
            <div class="item-name-wrapper">
              <input
                v-if="isBatchDeleteMode"
                type="checkbox"
                :value="`${itemObj.category}::${itemObj.name}`"
                v-model="selectedItems"
                class="item-checkbox"
              />
              <span class="item-name">
                <span class="icon-wrapper" v-html="getIconHtml(itemObj.item)"></span>
                <span class="name-text" :style="{ color: getTierColor(itemObj.item.tier) }">{{ itemObj.name }}</span>
                <span class="item-qty">x{{ itemObj.item.quantity || 1 }}</span>
              </span>
            </div>
            <div class="item-actions">
              <button
                v-if="['武器', '防具', '饰品'].includes(itemObj.category)"
                class="action-btn equip-btn"
                @click="equipItem(itemObj.category, itemObj.name, itemObj.item)">
                装备
              </button>
              <button
                v-else
                class="action-btn use-btn"
                @click="useItem(itemObj.name)">
                使用
              </button>
            </div>
          </div>
          <div class="item-meta" :style="{ paddingLeft: isBatchDeleteMode ? '40px' : '24px' }">
            <span class="item-tier" v-if="itemObj.item.tier" :style="{ color: getTierColor(itemObj.item.tier) }">品级: {{ itemObj.item.tier }}</span>
          </div>
          <div class="item-desc" :style="{ paddingLeft: isBatchDeleteMode ? '40px' : '24px' }">{{ itemObj.item.description || '暂无描述' }}</div>
        </div>
        <div v-if="paginatedInventory.length === 0" class="empty-inventory">
          {{ searchQuery ? '未找到匹配的物品...' : '该分类下空空如也...' }}
        </div>
      </div>

      <!-- 分页控制 -->
      <div class="pagination" v-if="totalPages > 1">
        <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { MvuUtil } from '@/Utils/MvuUtil';
import { getItemIcon, getSVG } from '@/哥杀/UI/composables/icon/icon';
import { useStatStore } from '@/哥杀/UI/store/StatStore';
import { useUiStore } from '@/哥杀/UI/store/UIStore';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const statStore = useStatStore();
const uiStore = useUiStore();
const router = useRouter();

// 状态控制
const sortMethod = ref('type');
const searchQuery = ref('');
const currentTab = ref('全部');
const tabs = ['全部', '武器', '防具', '饰品', '消耗品', '材料', '杂物'];

// 批量选择控制
const isBatchDeleteMode = ref(false);
const selectedItems = ref([]); // 存储格式: "category::name"

// 分页控制
const currentPage = ref(1);
const itemsPerPage = 12;

// 获取主角数据
const player = computed(() => statStore.stat_data?.['主角'] || {});
const equipment = computed(() => player.value['装备'] || { '武器': {}, '防具': {}, '饰品': {} });
const inventory = computed(() => player.value['背包'] || {});

// 获取品质对应颜色
const getTierColor = (tier) => {
  const isDark = uiStore.darkMode;
  const colors = {
    '普通': isDark ? '#a0a0a0' : '#757575',
    '精良': isDark ? '#7986cb' : '#3f51b5',
    '稀有': isDark ? '#ce93d8' : '#9c27b0',
    '史诗': isDark ? '#ffb74d' : '#f57c00',
    '传奇': isDark ? '#f48fb1' : '#d81b60',
    '传说': isDark ? '#f48fb1' : '#d81b60',
    '特殊': isDark ? '#ce93d8' : '#6a1b9a',
    '奥义': isDark ? '#fff176' : '#f9a825',
    '唯一': isDark ? '#ef9a9a' : '#d32f2f',
    '通用': isDark ? '#90a4ae' : '#455a64'
  };
  return colors[tier] || (isDark ? '#b8a98d' : '#8b7355');
};

// 获取图标HTML (根据品质上色)
const getIconHtml = (item) => {
  const iconKey = getItemIcon(item) || 'misc';
  const color = getTierColor(item?.tier);
  return getSVG(iconKey, { size: 18, color });
};

// 过滤与排序后的背包列表
const filteredInventory = computed(() => {
  let list = [];
  const inv = inventory.value;

  for (const [category, items] of Object.entries(inv)) {
    if (category === '金钱' || !items) continue;
    // 分类过滤
    if (currentTab.value !== '全部' && category !== currentTab.value) continue;

    for (const [name, item] of Object.entries(items)) {
      if (item !== '待初始化') {
        // 搜索过滤 (模糊匹配)
        if (searchQuery.value && !name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
          continue;
        }
        list.push({ category, name, item });
      }
    }
  }

  return list.sort((a, b) => {
    if (sortMethod.value === 'type') {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    } else {
      const tierA = a.item.tier || '';
      const tierB = b.item.tier || '';
      if (tierA !== tierB) return tierB.localeCompare(tierA);
      return a.name.localeCompare(b.name);
    }
  });
});

// 分页计算
const totalPages = computed(() => Math.ceil(filteredInventory.value.length / itemsPerPage) || 1);
const paginatedInventory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredInventory.value.slice(start, start + itemsPerPage);
});

// 当搜索、分类或排序改变时，重置页码并清空选中、退出批量模式
watch([searchQuery, currentTab, sortMethod, currentPage], () => {
  if (arguments[0][3] === currentPage.value) {
    // 如果不是翻页引起的变动，重置页码
    currentPage.value = 1;
  }
  selectedItems.value = [];
  isBatchDeleteMode.value = false;
});

// 切换批量删除模式
const toggleBatchDeleteMode = () => {
  isBatchDeleteMode.value = !isBatchDeleteMode.value;
  if (!isBatchDeleteMode.value) {
    selectedItems.value = [];
  }
};

// 全选当前页逻辑
const isAllSelected = computed(() => {
  if (paginatedInventory.value.length === 0) return false;
  return paginatedInventory.value.every(item => selectedItems.value.includes(`${item.category}::${item.name}`));
});

const toggleSelectAll = (e) => {
  const checked = e.target.checked;
  if (checked) {
    paginatedInventory.value.forEach(item => {
      const id = `${item.category}::${item.name}`;
      if (!selectedItems.value.includes(id)) {
        selectedItems.value.push(id);
      }
    });
  } else {
    paginatedInventory.value.forEach(item => {
      const id = `${item.category}::${item.name}`;
      const idx = selectedItems.value.indexOf(id);
      if (idx > -1) {
        selectedItems.value.splice(idx, 1);
      }
    });
  }
};

// 装备物品
const equipItem = async (category, name, itemData) => {
  const diff = { 主角: { 背包: { [category]: {} }, 装备: { [category]: {} } } };
  const currentEquipped = Object.keys(equipment.value[category] || {});
  const limit = category === '饰品' ? 3 : 1;

  if (currentEquipped.length >= limit) {
    const itemToUnequipName = currentEquipped[0];
    const itemToUnequipData = equipment.value[category][itemToUnequipName];
    diff.主角.装备[category][itemToUnequipName] = null;
    const existingInInv = inventory.value[category]?.[itemToUnequipName];
    diff.主角.背包[category][itemToUnequipName] = existingInInv
      ? { ...itemToUnequipData, quantity: (existingInInv.quantity || 1) + (itemToUnequipData.quantity || 1) }
      : itemToUnequipData;
  }

  diff.主角.装备[category][name] = { ...itemData, quantity: 1 };

  if (itemData.quantity > 1) {
    diff.主角.背包[category][name] = { ...itemData, quantity: itemData.quantity - 1 };
  } else {
    diff.主角.背包[category][name] = null;
  }

  // 如果装备的物品在选中列表中，将其移除
  const id = `${category}::${name}`;
  const idx = selectedItems.value.indexOf(id);
  if (idx > -1) selectedItems.value.splice(idx, 1);

  await MvuUtil.updateMvuDataByDiff(diff);
};

// 卸下物品
const unequipItem = async (category, name, itemData) => {
  const diff = { 主角: { 背包: { [category]: {} }, 装备: { [category]: {} } } };
  diff.主角.装备[category][name] = null;
  const existingInInv = inventory.value[category]?.[name];
  diff.主角.背包[category][name] = existingInInv
    ? { ...itemData, quantity: (existingInInv.quantity || 1) + (itemData.quantity || 1) }
    : itemData;

  await MvuUtil.updateMvuDataByDiff(diff);
};

// 批量删除物品
const deleteSelectedItems = async () => {
  if (selectedItems.value.length === 0) return;
  if (!confirm(`确定要删除选中的 ${selectedItems.value.length} 个物品吗？`)) return;

  const diff = { 主角: { 背包: {} } };

  for (const id of selectedItems.value) {
    const [category, name] = id.split('::');
    if (!diff.主角.背包[category]) {
      diff.主角.背包[category] = {};
    }
    diff.主角.背包[category][name] = null;
  }

  await MvuUtil.updateMvuDataByDiff(diff);
  selectedItems.value = [];
  isBatchDeleteMode.value = false;
};

// 使用物品（非可装备物品）
const useItem = (name) => {
  uiStore.setPendingInput(`<user>准备使用【${name}】`);
  router.push('/选项');
};
</script>

<style scoped>
.inventory-equipment-module { display: flex; flex-direction: column; gap: 20px; }
.section-title { color: var(--accent-gold); border-bottom: 1px solid var(--scroll-border); padding-bottom: 5px; margin-bottom: 15px; }
.equipment-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
.equip-slot { background: rgba(0, 0, 0, 0.03); border: 1px dashed var(--scroll-border); padding: 10px; border-radius: 8px; }
.slot-label { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px; }
.item-card { background: var(--bg-base); border: 1px solid var(--scroll-border); border-radius: 6px; padding: 10px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: all 0.2s; }
.item-card.equipped { border-color: var(--accent-gold); background: rgba(198, 166, 100, 0.1); }
.item-card.selected-card { border-color: #b33939; background: rgba(179, 57, 57, 0.05); }
.item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.item-name-wrapper { display: flex; align-items: center; gap: 8px; }
.item-checkbox { cursor: pointer; width: 16px; height: 16px; accent-color: #b33939; flex-shrink: 0; }
.item-name { font-weight: bold; color: var(--text-main); display: flex; align-items: center; gap: 6px; }
.icon-wrapper { display: inline-flex; align-items: center; justify-content: center; }
.item-qty { color: var(--accent-gold); font-size: 0.9rem; margin-left: 4px; }
.item-meta { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px; transition: padding-left 0.2s; }
.item-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; transition: padding-left 0.2s; }
.action-btn { background: transparent; border: 1px solid var(--scroll-border); color: var(--text-main); padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
.action-btn:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.use-btn { color: #27ae60; border-color: #27ae60; }
.use-btn:hover { background: #27ae60; color: #fff; border-color: #27ae60; }
.delete-btn { color: #b33939; border-color: #b33939; }
.delete-btn:hover:not(:disabled) { background: #b33939; color: #fff; border-color: #b33939; }
.delete-btn:disabled { opacity: 0.5; cursor: not-allowed; border-color: var(--scroll-border); color: var(--text-muted); }

/* 头部控制区 */
.section-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
.section-header .section-title { border-bottom: none; margin-bottom: 0; }
.search-box { display: flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.03); border: 1px solid var(--scroll-border); border-radius: 4px; padding: 4px 8px; }
.search-box input { border: none; background: transparent; outline: none; color: var(--text-main); font-family: inherit; font-size: 0.9rem; width: 150px; }
.sort-controls { display: flex; gap: 5px; align-items: center; font-size: 0.9rem; }
.sort-controls button { background: transparent; border: 1px solid var(--scroll-border); color: var(--text-muted); padding: 4px 10px; border-radius: 4px; cursor: pointer; }
.sort-controls button.active { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }

/* 分类标签 */
.category-tabs { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; border-bottom: 1px solid var(--scroll-border); padding-bottom: 10px; }
.category-tabs button { background: transparent; border: none; color: var(--text-muted); padding: 4px 12px; cursor: pointer; font-family: inherit; font-size: 0.95rem; border-radius: 4px; transition: all 0.2s; }
.category-tabs button:hover { background: rgba(0,0,0,0.05); }
.category-tabs button.active { background: var(--accent-gold); color: #fff; font-weight: bold; }

/* 批量操作区 */
.batch-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 8px 12px; background: rgba(0,0,0,0.02); border-radius: 6px; border: 1px solid var(--scroll-border); min-height: 42px; }
.batch-actions { display: flex; gap: 10px; }
.select-all-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; color: var(--text-main); user-select: none; }
.select-all-label input { cursor: pointer; width: 16px; height: 16px; accent-color: #b33939; }

.inventory-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
.empty-slot, .empty-inventory { text-align: center; color: var(--text-muted); font-style: italic; padding: 10px; grid-column: 1 / -1; }

/* 分页 */
.pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; }
.pagination button { background: transparent; border: 1px solid var(--scroll-border); color: var(--text-main); padding: 4px 12px; border-radius: 4px; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination button:not(:disabled):hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.page-info { font-size: 0.9rem; color: var(--text-muted); }
</style>
