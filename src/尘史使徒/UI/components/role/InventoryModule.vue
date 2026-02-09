<template>
  <div class="inventory-module">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="检索物品..."
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="sort-controls">
        <select v-model="sortBy">
          <option value="name">名称排序</option>
          <option value="count">数量优先</option>
          <option value="durability">耐久优先</option>
        </select>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-scroll-wrapper">
      <div class="category-tabs">
        <button
          v-for="cat in dynamicCategories"
          :key="cat"
          :class="['cat-btn', { active: activeCategory === cat }]"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- 主体区域：改为 Flex Row 布局 -->
    <div class="inventory-container">

      <!-- 左侧：物品列表 (当有详情时，在PC端自动缩小宽度) -->
      <div class="inventory-grid-wrapper">
        <div class="inventory-grid">
          <div
            v-for="item in filteredItems"
            :key="item.name"
            class="item-card"
            :class="[item.styleClass, { 'is-selected': selectedItem?.name === item.name }]"
            @click="toggleDetail(item)"
          >
            <div class="card-top">
              <span class="type-tag">{{ item.类型 }}</span>
              <span class="count-badge">x{{ item.数量 }}</span>
            </div>
            <div class="card-body">
              <div
                class="item-name-visual"
                :style="{ fontSize: getNameFontSize(item.name) }"
              >
                {{ item.name }}
              </div>
            </div>
            <div class="card-bottom">
              <span class="durability-text" v-if="item.耐久">
                Dur: {{ item.耐久 }}
              </span>
            </div>
            <div class="card-bg-effect"></div>
          </div>

          <div v-if="filteredItems.length === 0" class="empty-state">
            <p>无相关物品</p>
          </div>
        </div>
      </div>

      <!-- 右侧：详情面板 (PC端并排，移动端覆盖) -->
      <Transition name="panel-slide">
        <div v-if="selectedItem" class="detail-panel" :class="selectedItem.styleClass">
          <!-- 头部操作栏 -->
          <div class="panel-actions">
            <button class="close-panel-btn" @click="closeDetail">×</button>
          </div>

          <div class="panel-content-wrapper">
            <div class="panel-header">
              <h2 class="panel-title">{{ selectedItem.name }}</h2>
              <div class="panel-type">{{ selectedItem.类型 }}</div>
            </div>

            <div class="stat-grid">
              <div class="stat-box">
                <span class="label">持有数量</span>
                <span class="value">{{ selectedItem.数量 }}</span>
              </div>
              <div class="stat-box">
                <span class="label">耐久度</span>
                <span class="value">{{ selectedItem.耐久 }}</span>
              </div>
            </div>

            <div class="info-section">
              <h4>描述</h4>
              <p class="desc-text">{{ selectedItem.描述 }}</p>
            </div>

            <div class="info-section">
              <h4>作用</h4>
              <p class="effect-text">{{ selectedItem.作用 }}</p>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

// --- 状态 ---
const searchQuery = ref('');
const sortBy = ref('name');
const activeCategory = ref('全部');
const selectedItem = ref(null);

// --- 逻辑：智能字号 ---
const getNameFontSize = (name) => {
  const len = name.length;
  if (len <= 4) return '1.4rem';
  if (len <= 7) return '1.15rem';
  if (len <= 10) return '1rem';
  return '0.85rem';
};

// --- 逻辑：样式匹配 ---
const getItemStyle = (name, type) => {
  const n = (name || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (n.includes('蛾')) return 'style-moth';

  if (
    n.includes('证明') || n.includes('证书') || n.includes('执照') ||
    n.includes('徽') || n.includes('印') || n.includes('章') ||
    n.includes('钥') || n.includes('令') || n.includes('邀请') ||
    t === '证明' || t === '信物'
  ) return 'style-proof';

  if (n.includes('书') || n.includes('录') || n.includes('篇') || t === '密传') return 'style-lore';
  if (n.includes('刃') || n.includes('剑') || n.includes('刀') || n.includes('枪') || n.includes('斧')) return 'style-weapon';
  if (n.includes('仪式') || n.includes('阵') || n.includes('祭') || t === '仪式') return 'style-ritual';
  if (n.includes('币') || n.includes('金') || n.includes('银') || t === '货币') return 'style-currency';
  if (n.includes('药') || n.includes('剂') || n.includes('水') || n.includes('露') || t === '药物') return 'style-medicine';
  if (n.includes('杯') || n.includes('血')) return 'style-grail';
  if (n.includes('镜') || n.includes('灯') || n.includes('光')) return 'style-lantern';
  if (t === '器具') return 'style-tool';

  return 'style-default';
};

// --- 数据处理 ---
const allItems = computed(() => {
  if (!props.data) return [];
  return Object.entries(props.data)
    .map(([key, val]) => {
      const baseItem = typeof val === 'string'
        ? { name: key, 类型: '未知', 描述: val, 作用: '未知', 数量: 1, 耐久: 0 }
        : { name: key, ...val };
      baseItem.styleClass = getItemStyle(baseItem.name, baseItem.类型);
      return baseItem;
    })
    .filter(item => item.name !== '$template');
});

const dynamicCategories = computed(() => {
  const types = new Set();
  allItems.value.forEach(item => { if (item.类型) types.add(item.类型); });
  return ['全部', ...Array.from(types).sort()];
});

const filteredItems = computed(() => {
  let items = [...allItems.value];
  if (activeCategory.value !== '全部') {
    items = items.filter(i => i.类型 === activeCategory.value);
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(query) ||
      (i.描述 && i.描述.toLowerCase().includes(query))
    );
  }
  items.sort((a, b) => {
    if (sortBy.value === 'count') return b.数量 - a.数量;
    if (sortBy.value === 'durability') return b.耐久 - a.耐久;
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  return items;
});

const toggleDetail = (item) => {
  if (selectedItem.value && selectedItem.value.name === item.name) {
    closeDetail();
  } else {
    selectedItem.value = item;
  }
};

const closeDetail = () => {
  selectedItem.value = null;
};
</script>

<style scoped>
/* --- 全局盒模型 --- */
* { box-sizing: border-box; }

.inventory-module {
  --c-bg: #0f0f13;
  --c-card-bg: #1a1a1f;
  --c-text: #e0e0e0;
  --c-border: rgba(255, 255, 255, 0.08);

  /* 颜色变量保持不变 */
  --rgb-lore: 189, 178, 255;
  --rgb-ritual: 255, 100, 100;
  --rgb-curr: 255, 214, 165;
  --rgb-med: 155, 246, 255;
  --rgb-weapon: 255, 80, 80;
  --rgb-tool: 160, 196, 255;

  /* 新增：证明/信物 (琥珀金/橙色) */
  --rgb-proof: 255, 160, 50;

  --rgb-def: 140, 140, 140;

  position: relative;
  background: var(--c-bg);
  color: var(--c-text);
  padding: 20px;
  height: 100%;
  width: 100%;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* --- 工具栏 & 分类 (保持不变) --- */
.toolbar { display: flex; gap: 15px; margin-bottom: 15px; flex-shrink: 0; }
.search-box { flex: 1; position: relative; }
.search-box input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--c-border); color: #fff; padding: 10px 40px 10px 15px; border-radius: 4px; font-size: 0.95rem; }
.search-box input:focus { border-color: rgba(var(--rgb-curr), 0.5); outline: none; background: rgba(0,0,0,0.3); }
.search-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); opacity: 0.4; }
.sort-controls select { background: rgba(255,255,255,0.05); border: 1px solid var(--c-border); color: #aaa; padding: 0 15px; height: 100%; border-radius: 4px; cursor: pointer; }

.category-scroll-wrapper { width: 100%; overflow-x: auto; padding-bottom: 5px; margin-bottom: 15px; border-bottom: 1px solid var(--c-border); flex-shrink: 0; scrollbar-width: none; }
.category-scroll-wrapper::-webkit-scrollbar { display: none; }
.category-tabs { display: flex; gap: 10px; white-space: nowrap; }
.cat-btn { background: transparent; border: 1px solid transparent; color: #666; padding: 6px 16px; border-radius: 4px; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
.cat-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
.cat-btn.active { color: rgb(var(--rgb-curr)); border-color: rgba(var(--rgb-curr), 0.3); background: rgba(var(--rgb-curr), 0.05); }

/* --- 核心布局容器 (修改点) --- */
.inventory-container {
  flex: 1;
  display: flex; /* 启用 Flex 布局 */
  flex-direction: row; /* 水平排列 */
  overflow: hidden; /* 确保内部滚动 */
  position: relative;
  gap: 0; /* 紧贴 */
}

/* --- 列表区域 --- */
.inventory-grid-wrapper {
  flex: 1; /* 占据剩余空间 */
  min-width: 0; /* 防止 Flex 子元素溢出 */
  display: flex;
  flex-direction: column;
}

.inventory-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  grid-auto-rows: 100px;
  gap: 12px;
  overflow-y: auto; /* 独立滚动 */
  padding-right: 5px;
  padding-bottom: 20px;
  align-content: start;
}

/* --- 卡片样式 (保持不变) --- */
.item-card { position: relative; background: var(--c-card-bg); border: 1px solid var(--c-border); border-radius: 4px; padding: 6px 8px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease; overflow: hidden; }
.item-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.4); z-index: 2; }
.item-card.is-selected { border-color: #fff; background: rgba(255,255,255,0.08); }
.card-top { display: flex; justify-content: space-between; align-items: center; z-index: 2; }
.type-tag { opacity: 0.5; font-size: 0.6rem; text-transform: uppercase; }
.count-badge { background: rgba(255,255,255,0.1); padding: 0 4px; border-radius: 2px; color: #fff; font-size: 0.7rem; font-weight: bold; }
.card-body { flex: 1; display: flex; align-items: center; justify-content: center; z-index: 2; width: 100%; }
.item-name-visual { font-family: 'Cinzel', serif; font-weight: 600; color: #eee; text-shadow: 0 2px 4px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center; }
.card-bottom { height: 16px; display: flex; justify-content: flex-end; align-items: flex-end; z-index: 2; }
.durability-text { font-size: 0.65rem; color: #888; font-family: monospace; }
.card-bg-effect { position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; z-index: 1; transition: opacity 0.3s; }
.item-card:hover .card-bg-effect { opacity: 0.25; }

/* 样式类 (保持不变) */
.style-moth { --theme-color: #888888; border-color: var(--theme-color); }
.style-moth .item-name-visual { color: var(--theme-color); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); animation: art-moth-glitch-strong 1.5s infinite steps(1); }
.style-moth .card-bg-effect { background: repeating-linear-gradient(45deg, #0001, #0001 1px, transparent 1px, transparent 5px); opacity: 0.15; }
@keyframes art-moth-glitch-strong { 0% { transform: translate(0, 0) skew(0); } 10% { transform: translate(-5px, 3px) skew(-5deg); } 20% { transform: translate(5px, -3px) skew(5deg); } 30% { transform: translate(-8px, 5px) skew(-2deg); } 40% { transform: translate(8px, -5px) skew(2deg); } 50% { transform: translate(-5px, 3px) skew(-5deg); } 60% { transform: translate(5px, -3px) skew(5deg); } 70% { transform: translate(-8px, 5px) skew(-2deg); } 80% { transform: translate(0, 0) skew(0); } 100% { transform: translate(0, 0) skew(0); } }
.style-lore { border-color: rgba(var(--rgb-lore), 0.4); } .style-lore .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-lore), 0.8), transparent 90%); } .style-lore .item-name-visual { color: rgb(var(--rgb-lore)); }
.style-weapon { border-color: rgba(var(--rgb-weapon), 0.4); } .style-weapon .card-bg-effect { background: linear-gradient(135deg, rgba(var(--rgb-weapon), 0.1), transparent); } .style-weapon .item-name-visual { color: rgb(var(--rgb-weapon)); }
.style-ritual { border-color: rgba(var(--rgb-ritual), 0.4); } .style-ritual .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-ritual), 0.8), transparent 90%); } .style-ritual .item-name-visual { color: rgb(var(--rgb-ritual)); }
.style-currency { border-color: rgba(var(--rgb-curr), 0.4); } .style-currency .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-curr), 0.8), transparent 90%); } .style-currency .item-name-visual { color: rgb(var(--rgb-curr)); }
.style-medicine { border-color: rgba(var(--rgb-med), 0.4); } .style-medicine .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-med), 0.8), transparent 90%); } .style-medicine .item-name-visual { color: rgb(var(--rgb-med)); }
.style-tool { border-color: rgba(var(--rgb-tool), 0.4); } .style-tool .card-bg-effect { background: radial-gradient(circle at center, rgba(var(--rgb-tool), 0.8), transparent 90%); } .style-tool .item-name-visual { color: rgb(var(--rgb-tool)); }

/* 新增：证明/信物样式 */
.style-proof {
  border-color: rgba(var(--rgb-proof), 0.6);
}
.style-proof .card-bg-effect {
  /* 模拟一种印章或边框的内发光效果 */
  background: radial-gradient(circle at center, transparent 30%, rgba(var(--rgb-proof), 0.15) 100%);
  border: 1px solid rgba(var(--rgb-proof), 0.1);
  inset: 2px;
}
.style-proof .item-name-visual {
  color: rgb(var(--rgb-proof));
  /* 稍微加一点字间距，显得正式 */
  letter-spacing: 1px;
}

.style-default { border-color: rgba(var(--rgb-def), 0.3); } .style-default .card-bg-effect { background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent); }

/* --- 详情面板 (重大修改) --- */
.detail-panel {
  /* 1. 移除 position: absolute */
  /* 2. 使用 Flex 属性 */
  flex: 0 0 320px; /* 固定宽度 320px，不伸缩 */
  width: 320px;

  /* 3. 高度自动撑满父容器 (Flex默认 align-items: stretch) */
  /* 不需要 height: 100% 或 bottom: 0 */

  background: #18181c;
  border-left: 1px solid var(--c-border);
  box-shadow: -5px 0 20px rgba(0,0,0,0.3);
  z-index: 10;

  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

/* 顶部边框颜色 */
.detail-panel.style-moth { border-top: 4px solid #888; }
.detail-panel.style-lore { border-top: 4px solid rgb(var(--rgb-lore)); }

/* 新增 */
.detail-panel.style-proof { border-top: 4px solid rgb(var(--rgb-proof)); }

.detail-panel.style-weapon { border-top: 4px solid rgb(var(--rgb-weapon)); }
.detail-panel.style-ritual { border-top: 4px solid rgb(var(--rgb-ritual)); }
.detail-panel.style-currency { border-top: 4px solid rgb(var(--rgb-curr)); }
.detail-panel.style-medicine { border-top: 4px solid rgb(var(--rgb-med)); }
.detail-panel.style-tool { border-top: 4px solid rgb(var(--rgb-tool)); }

.panel-actions {
  display: flex;
  justify-content: flex-end;
  padding: 10px;
}

.close-panel-btn {
  background: none; border: none;
  color: #666; font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}
.close-panel-btn:hover { color: #fff; }

.panel-content-wrapper {
  flex: 1;
  overflow-y: auto; /* 内部滚动 */
  padding: 0 20px 40px 20px;
}

/* 动画：PC端是宽度变化，移动端是滑入 */
.panel-slide-enter-active, .panel-slide-leave-active {
  transition: all 0.3s ease;
}
.panel-slide-enter-from, .panel-slide-leave-to {
  width: 0;
  opacity: 0;
  transform: translateX(20px);
}

/* 内部内容样式 (保持不变) */
.panel-header { margin-top: 10px; margin-bottom: 30px; text-align: center; }
.panel-title { margin: 0; font-family: 'Cinzel', serif; font-size: 1.5rem; color: #fff; line-height: 1.3; }
.panel-type { margin-top: 5px; font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 2px; }
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px; }
.stat-box { background: rgba(255,255,255,0.03); padding: 10px; border-radius: 4px; text-align: center; border: 1px solid rgba(255,255,255,0.05); }
.stat-box .label { display: block; font-size: 0.7rem; color: #666; margin-bottom: 4px; }
.stat-box .value { font-size: 1.1rem; color: #eee; font-weight: bold; }
.info-section { margin-bottom: 25px; }
.info-section h4 { color: #888; font-size: 0.8rem; text-transform: uppercase; margin: 0 0 8px 0; border-left: 2px solid #444; padding-left: 8px; }
.desc-text { color: #aaa; font-style: italic; line-height: 1.6; font-size: 0.95rem; }
.effect-text { color: #ddd; line-height: 1.6; font-size: 0.95rem; }
.empty-state { grid-column: 1 / -1; text-align: center; padding-top: 50px; color: #555; font-style: italic; }

/* --- 移动端适配 (Media Queries) --- */
@media (max-width: 768px) {
  .inventory-module { padding: 10px; }
  .toolbar { flex-direction: column; gap: 10px; }
  .sort-controls select { width: 100%; padding: 8px; }
  .inventory-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); grid-auto-rows: 90px; gap: 8px; }
  .item-name-visual { font-size: 0.9rem !important; }

  /* 移动端：恢复为全屏覆盖模式 */
  .detail-panel {
    position: fixed !important; /* 强制固定定位，脱离父容器限制 */
    top: 0; left: 0;

    /* 强制全屏尺寸 */
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;

    /* 关键修复：层级必须大于 9999 */
    z-index: 10001 !important;

    border-left: none;

    /* 强制不透明背景 */
    background: #131316 !important;
    backdrop-filter: none !important;

    flex: none; /* 禁用 Flex 行为 */
  }

  .panel-content-wrapper {
    padding-bottom: 100px; /* 移动端底部留白更多 */
  }

  /* 移动端动画改为从右侧滑入 */
  .panel-slide-enter-from, .panel-slide-leave-to {
    width: 100vw !important; /* 确保动画时也是全宽 */
    transform: translateX(100%);
    opacity: 1;
  }
}
</style>
