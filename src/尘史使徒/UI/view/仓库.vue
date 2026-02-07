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
            :class="[getItemStyle(item), { 'is-modified': item.isModified }]"
            @click="openTransferModal(item, 'toWarehouse')"
          >
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
            :class="[getItemStyle(item), { 'is-modified': item.isModified }]"
            @click="openTransferModal(item, 'toBackpack')"
          >
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
          </div>
          <div v-if="warehouseList.length === 0" class="empty-state">仓库空置</div>
        </div>
      </div>

    </div>

    <!-- 交互模态框 -->
    <Transition name="fade">
      <div v-if="showQuantityModal" class="modal-overlay" @click.self="closeModal">
        <div class="ac-modal">
          <div class="modal-header">
            <h3>物资转移</h3>
            <div class="modal-subtitle">{{ pendingTransferItem?.name }}</div>
          </div>

          <div class="modal-body">
            <div class="transfer-direction">
              <span :class="{ active: pendingTransferDirection === 'toWarehouse' }">行囊</span>
              <span class="arrow">➔</span>
              <span :class="{ active: pendingTransferDirection === 'toBackpack' }">仓库</span>
            </div>

            <div class="quantity-control">
              <button class="qty-btn" @click="transferAmount = Math.max(1, transferAmount - 1)">-</button>
              <input type="number" v-model.number="transferAmount" class="qty-input" min="1" :max="pendingTransferItem?.quantity">
              <button class="qty-btn" @click="transferAmount = Math.min(pendingTransferItem?.quantity, transferAmount + 1)">+</button>
            </div>

            <div class="slider-container">
              <input
                type="range"
                v-model.number="transferAmount"
                min="1"
                :max="pendingTransferItem?.quantity"
                class="ac-slider"
              >
            </div>

            <div class="info-text">
              <p>现有数量: {{ pendingTransferItem?.quantity }}</p>
              <p v-if="willMerge">注意：目标容器已存在该物品，耐久度将混合。</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="ac-btn cancel" @click="closeModal">取消</button>
            <button class="ac-btn confirm" @click="confirmTransfer">确认转移</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore'; // 假设路径
import { ERAUtil } from '@/Utils/ERAUtil';
import { MessageUtil } from '@/Utils/MessageUtil';

// --- 状态定义 ---
const statStore = useStatStore();
const localBackpack = ref({});
const localWarehouse = ref({});
const hasUnsavedChanges = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');

// 模态框状态
const showQuantityModal = ref(false);
const pendingTransferItem = ref(null);
const pendingTransferDirection = ref(''); // 'toWarehouse' | 'toBackpack'
const transferAmount = ref(1);

// --- 初始化 ---
onMounted(() => {
  resetInventory();
});

function resetInventory() {
  // 深拷贝 store 中的数据到本地 ref，建立 Draft State
  const rawBackpack = statStore.stat_data?.角色.user.物品 || {};
  const rawWarehouse = statStore.stat_data?.仓库 || {};

  // 过滤掉 $template 等特殊字段
  localBackpack.value = JSON.parse(JSON.stringify(rawBackpack));
  localWarehouse.value = JSON.parse(JSON.stringify(rawWarehouse));
  hasUnsavedChanges.value = false;
}

// --- 数据处理与计算属性 ---

// 将对象转换为数组以供列表渲染，并支持搜索过滤
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
      // 修改过的物品排在前面
      if (a.isModified && !b.isModified) return -1;
      if (!a.isModified && b.isModified) return 1;
      return a.name.localeCompare(b.name);
    });
};

const backpackList = computed(() => processList(localBackpack.value));
const warehouseList = computed(() => processList(localWarehouse.value));

// 检查目标容器是否已有该物品（用于提示合并）
const willMerge = computed(() => {
  if (!pendingTransferItem.value) return false;
  const targetObj = pendingTransferDirection.value === 'toWarehouse'
    ? localWarehouse.value
    : localBackpack.value;
  return !!targetObj[pendingTransferItem.value.name];
});

// --- 样式辅助 ---
const getItemStyle = (item) => {
  const type = item.raw.类型 || '';
  const name = item.name || '';
  if (name.includes('刃') || type === '武器') return 'style-weapon';
  if (name.includes('书') || type === '密传') return 'style-lore';
  if (name.includes('币') || type === '货币') return 'style-currency';
  return 'style-default';
};

// --- 交互逻辑 ---

function openTransferModal(item, direction) {
  pendingTransferItem.value = item;
  pendingTransferDirection.value = direction;
  transferAmount.value = 1; // 默认转移1个
  showQuantityModal.value = true;
}

function closeModal() {
  showQuantityModal.value = false;
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
    }
  }

  // 2. 增加目标
  if (targetObj[item.name]) {
    // 合并逻辑：耐久度取平均值向上取整
    const existing = targetObj[item.name];
    const newDurability = Math.ceil((existing.耐久 + item.durability) / 2);
    existing.数量 += qty;
    existing.耐久 = newDurability;
    existing.isModified = true;
  } else {
    // 新建逻辑
    targetObj[item.name] = {
      ...item.raw,
      "数量": qty,
      "耐久": item.durability,
      "isModified": true
    };
  }

  hasUnsavedChanges.value = true;
  closeModal();
}

// --- 核心保存逻辑 (参考文件三) ---
async function saveAllChanges() {
  if (isSaving.value) return;
  isSaving.value = true;

  try {
    const deletePayload = { "器具": {}, "仓库": {} };
    const insertPayload = { "器具": {}, "仓库": {} };
    const exchangeLogs = [];

    const remoteBackpack = statStore.stat_data?.器具 || {};
    const remoteWarehouse = statStore.stat_data?.仓库 || {};

    // 1. 构建删除 Payload (清空远程所有相关数据)
    Object.keys(remoteBackpack).forEach(k => { if(k!=='$template') deletePayload["器具"][k] = {}; });
    Object.keys(remoteWarehouse).forEach(k => { if(k!=='$template') deletePayload["仓库"][k] = {}; });

    // 2. 构建插入 Payload (写入本地所有数据)
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

    // 3. 生成日志 (对比差异)
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

    // 4. 执行 API
    if (Object.keys(deletePayload["器具"]).length > 0 || Object.keys(deletePayload["仓库"]).length > 0) {
      await ERAUtil.DeleteByObject(deletePayload);
    }
    if (Object.keys(insertPayload["器具"]).length > 0 || Object.keys(insertPayload["仓库"]).length > 0) {
      await ERAUtil.InsertByObject(insertPayload);
    }

    // 5. 发送消息日志
    if (exchangeLogs.length > 0) {
      const logText = `\n<user>与漫宿之上的神秘空间完成了物品交换:\n${JSON.stringify(exchangeLogs, null, 0)}\n`;
      await MessageUtil.mergeContentToMessage(getLastMessageId(), logText, 'none');
    }

    // 6. 完成
    hasUnsavedChanges.value = false;
    // 移除修改标记
    Object.values(localBackpack.value).forEach(i => i.isModified = false);
    Object.values(localWarehouse.value).forEach(i => i.isModified = false);

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
}

.pane {
  flex: 1;
  background: var(--c-bg-panel);
  border: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  border-radius: 2px;
}

.pane-header {
  padding: 15px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  width: 150px;
  transition: 0.3s;
}
.ac-input:focus {
  outline: none;
  border-color: var(--c-gold);
  width: 180px;
}

.divider-column {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  color: var(--c-gold-dim);
  font-size: 1.5rem;
}

/* --- 物品网格 --- */
.item-grid {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: 70px;
  gap: 10px;
  align-content: start;
}

.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

.item-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.item-card:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.2);
  transform: translateX(2px);
}

.item-card.is-modified {
  border-left: 3px solid var(--c-gold);
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.05), transparent);
}

.card-inner {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
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
}

.item-info {
  flex: 1;
  overflow: hidden;
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
}

/* 样式变体 */
.style-weapon .item-icon { color: #ff6b6b; border-color: rgba(255, 107, 107, 0.3); }
.style-lore .item-icon { color: #a29bfe; border-color: rgba(162, 155, 254, 0.3); }
.style-currency .item-icon { color: #ffeaa7; border-color: rgba(255, 234, 167, 0.3); }

/* --- 模态框 --- */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(2px);
}

.ac-modal {
  width: 400px;
  background: #111;
  border: 1px solid var(--c-gold);
  box-shadow: 0 0 30px rgba(0,0,0,0.8);
  padding: 2px; /* Inner border effect */
  position: relative;
}

.ac-modal::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--c-gold), transparent);
}

.modal-header {
  background: rgba(212, 175, 55, 0.1);
  padding: 15px 20px;
  text-align: center;
}

.modal-header h3 { margin: 0; font-family: var(--font-title); color: var(--c-gold); }
.modal-subtitle { color: #888; margin-top: 5px; font-size: 0.9rem; }

.modal-body { padding: 20px; }

.transfer-direction {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  font-family: var(--font-title);
  color: #666;
  margin-bottom: 20px;
}

.transfer-direction span.active { color: #fff; text-shadow: 0 0 5px #fff; }
.transfer-direction .arrow { color: var(--c-gold); }

.quantity-control {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
}

.qty-btn {
  background: #222; border: 1px solid #444; color: #fff;
  width: 30px; height: 30px; cursor: pointer;
}
.qty-btn:hover { border-color: var(--c-gold); }

.qty-input {
  background: transparent; border: 1px solid #444; color: var(--c-gold);
  text-align: center; font-family: var(--font-title); font-size: 1.2rem;
  width: 80px;
}

.ac-slider {
  width: 100%;
  accent-color: var(--c-gold);
}

.info-text {
  margin-top: 20px;
  text-align: center;
  font-size: 0.8rem;
  color: #666;
}

.modal-footer {
  display: flex;
  border-top: 1px solid #333;
}

.modal-footer .ac-btn {
  flex: 1;
  border: none;
  border-right: 1px solid #333;
  padding: 15px;
}
.modal-footer .ac-btn:last-child { border-right: none; }
.modal-footer .confirm:hover { background: rgba(212, 175, 55, 0.1); }
.modal-footer .cancel:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
