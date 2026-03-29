<template>
  <div class="world-info-view ac-theme">
    <!-- 背景动态噪点层 -->
    <div class="global-noise"></div>

    <!-- 顶部导航栏 -->
    <header class="wi-header">
      <div class="wi-title-group">
        <div class="animus-logo">
          <div class="triangle"></div>
        </div>
        <div class="title-text">
          <span class="main">WORLD_INTEL</span>
          <span class="sub">DATABASE // V.3.0.1</span>
        </div>
      </div>
      <nav class="wi-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: currentTab === tab.key }]"
          @click="currentTab = tab.key"
        >
          <span class="btn-content">{{ tab.name }}</span>
          <div class="active-bar"></div>
        </button>
      </nav>
    </header>

    <!-- 内容滚动区域 -->
    <div class="wi-content scroll-container">

      <!-- ==================== 1. 时序与节庆 ==================== -->
      <section v-if="currentTab === 'time'" class="tab-pane time-pane">

        <!-- [重构] 季节全屏特效 Hero Section -->
        <!-- 动态绑定 season-style 类名 -->
        <div
          class="season-hero-wrapper"
          :class="[currentSeason ? 'active' : 'inactive', currentSeason?.styleKey]"
        >
          <!-- 动态环境层 -->
          <div class="ambient-light"></div>

          <!-- 粒子特效层 -->
          <div class="particle-layer layer-1"></div>
          <div class="particle-layer layer-2"></div>
          <div class="particle-layer layer-3"></div>

          <!-- 扫描网格 -->
          <div class="scan-grid"></div>

          <div class="hero-content" v-if="currentSeason">
            <div class="season-meta">CURRENT SEQUENCE DETECTED</div>
            <h1 class="season-title" :data-text="currentSeason.name">{{ currentSeason.name }}</h1>

            <div class="season-desc-box">
              <div class="corner-bracket top-left"></div>
              <div class="corner-bracket bottom-right"></div>
              <p v-for="(desc, i) in normalizeArray(currentSeason.data.描述)" :key="i" class="desc-line">
                {{ desc }}
              </p>
            </div>
          </div>

          <div class="hero-content empty" v-else>
            <h1 class="season-title">NO SEASON DATA</h1>
          </div>
        </div>

        <!-- [重构] HUD 状态栏 -->
        <div class="hud-status-bar">
          <div class="hud-block">
            <span class="hud-label">DATE</span>
            <span class="hud-value gold">{{ worldData.时间 || 'UNKNOWN' }}</span>
          </div>
          <div class="hud-divider"></div>
          <div class="hud-block">
            <span class="hud-label">LOC</span>
            <span class="hud-value">{{ worldData.地点 || 'UNKNOWN' }}</span>
          </div>
          <div class="hud-divider"></div>
          <div class="hud-block">
            <span class="hud-label">ENV</span>
            <span class="hud-value">{{ worldData.天气 || 'STABLE' }}</span>
          </div>
        </div>

        <!-- 近期节日与会议 -->
        <div class="events-section">
          <div class="section-header-tech">
            <span class="icon">💠</span> UPCOMING EVENTS
            <div class="header-line"></div>
          </div>

          <div v-if="upcomingFestivals.length === 0" class="empty-state-tech">
            // NO ACTIVE SIGNALS
          </div>

          <div class="events-grid">
            <div
              v-for="(event, index) in upcomingFestivals"
              :key="index"
              class="tech-card event-card"
              :class="{ 'live-event': event.isActive }"
            >
              <div class="card-deco-corner"></div>
              <div class="event-header">
                <span class="event-type">{{ event.type }}</span>
                <span class="event-status" v-if="event.isActive">● LIVE</span>
                <span class="event-status future" v-else>○ SOON</span>
              </div>
              <div class="event-main">
                <div class="event-name">{{ event.name }}</div>
                <div class="event-date">{{ event.dateStr }}</div>
              </div>
              <div class="event-desc">
                {{ normalizeArray(event.data.描述)[0] }}
              </div>
            </div>
          </div>
        </div>

        <!-- [重构] 分离的全境档案 -->
        <div class="archives-container">
          <div class="archive-divider">
            <span>DATABASE ARCHIVES</span>
          </div>

          <!-- 1. 季节档案 -->
          <div class="ac-accordion-wrapper">
            <button class="ac-accordion-btn season-style" @click="toggleSection('archive_season')">
              <span class="btn-text">SEASONAL CYCLES // 季节轮替</span>
              <span class="btn-icon">{{ isSectionOpen('archive_season') ? '▼' : '▶' }}</span>
            </button>
            <div v-if="isSectionOpen('archive_season')" class="ac-accordion-content">
              <div class="ac-grid-list">
                <div v-for="(item, idx) in seasonArchive" :key="idx" class="ac-mini-card season-border">
                  <div class="mini-header">
                    <span class="mini-title">{{ item.name }}</span>
                    <span class="mini-date">{{ item.dateShort }}</span>
                  </div>
                  <div class="mini-desc text-truncate">{{ normalizeArray(item.data.描述)[0] }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 禁忌档案 -->
          <div class="ac-accordion-wrapper">
            <button class="ac-accordion-btn taboo-style" @click="toggleSection('archive_taboo')">
              <span class="btn-text">FORBIDDEN KNOWLEDGE // 禁忌与灾害</span>
              <span class="btn-icon">{{ isSectionOpen('archive_taboo') ? '▼' : '▶' }}</span>
            </button>
            <div v-if="isSectionOpen('archive_taboo')" class="ac-accordion-content">
              <div class="ac-grid-list">
                <div v-for="(item, idx) in tabooArchive" :key="idx" class="ac-mini-card taboo-border">
                  <div class="mini-header">
                    <span class="mini-title warning-text">{{ item.name }}</span>
                    <span class="mini-date">{{ item.dateShort }}</span>
                  </div>
                  <div class="mini-desc text-truncate">{{ normalizeArray(item.data.描述)[0] }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 节日档案 -->
          <div class="ac-accordion-wrapper">
            <button class="ac-accordion-btn festival-style" @click="toggleSection('archive_festival')">
              <span class="btn-text">CULTURAL EVENTS // 庆典与会议</span>
              <span class="btn-icon">{{ isSectionOpen('archive_festival') ? '▼' : '▶' }}</span>
            </button>
            <div v-if="isSectionOpen('archive_festival')" class="ac-accordion-content">
              <div class="ac-grid-list">
                <div v-for="(item, idx) in festivalArchive" :key="idx" class="ac-mini-card festival-border">
                  <div class="mini-header">
                    <span class="mini-title gold-text">{{ item.name }}</span>
                    <span class="mini-date">{{ item.dateShort }}</span>
                  </div>
                  <div class="mini-desc text-truncate">{{ normalizeArray(item.data.描述)[0] }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ==================== 2. 世界经济 ==================== -->
      <section v-if="currentTab === 'economy'" class="tab-pane economy-pane">
        <div v-for="(econ, region) in economyData" :key="region" class="ac-group-wrapper">
          <button class="ac-accordion-btn region-btn" @click="toggleSection('econ_' + region)">
            <span class="btn-text">REGION: {{ region }}</span>
            <span class="btn-icon">{{ isSectionOpen('econ_' + region) ? '▼' : '▶' }}</span>
          </button>

          <div v-if="isSectionOpen('econ_' + region)" class="ac-accordion-content">
            <!-- 收入与物价 -->
            <div class="sub-section">
              <h4 class="ac-sub-title">ECONOMICS_DATA</h4>
              <div class="data-table">
                <div v-for="(income, className) in filterTemplate(econ.平均收入)" :key="className" class="data-row">
                  <span class="label">{{ className }}</span>
                  <span class="value">{{ income }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== 3. 势力 ==================== -->
      <section v-if="currentTab === 'faction'" class="tab-pane faction-pane">
        <div class="section-header-tech">
          <span class="icon">♟</span> FACTION DATABASE
          <div class="header-line"></div>
        </div>

        <div class="masonry-layout">
          <div v-for="(faction, name, index) in factionData" :key="name" class="tech-card faction-card">
            <div class="card-deco-corner top-right"></div>
            <div class="card-deco-corner bottom-left"></div>

            <div class="faction-header">
              <span class="card-title">{{ name }}</span>
              <span class="faction-id">ID: 0x{{ (index + 10).toString(16).toUpperCase() }}</span>
            </div>

            <div class="faction-body">
              <button
                class="ac-decrypt-btn"
                :class="{ active: isSectionOpen('fac_' + name) }"
                @click="toggleSection('fac_' + name)"
              >
                <span class="icon">{{ isSectionOpen('fac_' + name) ? '🔓' : '🔒' }}</span>
                <span class="text">{{ isSectionOpen('fac_' + name) ? 'CLOSE_FILE' : 'DECRYPT_DATA' }}</span>
                <div class="scan-line"></div>
              </button>

              <div v-if="isSectionOpen('fac_' + name)" class="details-terminal">
                <ul class="details-list">
                  <li v-for="(desc, i) in normalizeArray(faction.描述)" :key="i">
                    <span class="bullet">></span> {{ desc }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== 4. 种族 ==================== -->
      <section v-if="currentTab === 'race'" class="tab-pane race-pane">
        <div v-for="(races, category) in raceData" :key="category" class="ac-group-wrapper">
          <button class="ac-accordion-btn category-btn" @click="toggleSection('race_' + category)">
            <span class="btn-text">CLASS: {{ category }}</span>
            <span class="btn-icon">{{ isSectionOpen('race_' + category) ? '▼' : '▶' }}</span>
          </button>

          <div v-if="isSectionOpen('race_' + category)" class="ac-accordion-content">
            <div class="race-grid">
              <div v-for="(traits, raceName) in filterTemplate(races)" :key="raceName" class="tech-card race-card">
                <div class="race-header">{{ raceName }}</div>
                <div class="race-body">
                  <span v-for="(trait, t) in traits" :key="t" class="tech-tag">{{ trait }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
const statStore = useStatStore();

// --- 状态管理 ---
const currentTab = ref('time');
const expandedKeys = ref({});

const tabs = [
  { name: 'TIMELINE', key: 'time' },
  { name: 'ECONOMY', key: 'economy' },
  { name: 'FACTIONS', key: 'faction' },
  { name: 'SPECIES', key: 'race' },
];

// --- 辅助函数 ---
const filterTemplate = (obj) => {
  if (!obj || typeof obj !== 'object') return {};
  const result = {};
  for (const key in obj) {
    if (key !== '$template') {
      result[key] = obj[key];
    }
  }
  return result;
};

const toggleSection = (key) => {
  if (expandedKeys.value[key] === undefined) {
    expandedKeys.value[key] = true;
  } else {
    expandedKeys.value[key] = !expandedKeys.value[key];
  }
};

const isSectionOpen = (key) => {
  return !!expandedKeys.value[key];
};

const normalizeArray = (val) => {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

// --- 数据计算属性 ---
const worldData = computed(() => statStore.stat_data?.["世界"] || {});
const economyData = computed(() => filterTemplate(statStore.stat_data?.["世界经济"]));
const factionData = computed(() => filterTemplate(statStore.stat_data?.["势力"]));
const raceData = computed(() => filterTemplate(statStore.stat_data?.["种族"]));
const rawFestivalData = computed(() => statStore.stat_data?.["季节与节日"] || {});

// --- 日期逻辑 ---
const parseDateParts = (str) => {
  const s = String(str || "");
  const match = s.match(/(\d{4}|xxxx)-(\d{2})-(\d{2})/);
  if (match) {
    return {
      yearStr: match[1],
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10)
    };
  }
  return null;
};

const formatDisplayDate = (rawStr) => {
  if (!rawStr) return '???';
  if (rawStr.includes('xx-xx')) return 'PERM';
  const match = rawStr.match(/(\d{4}|xxxx)-(\d{2})-(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    if (year === 'xxxx') return `${month}-${day}`;
    return `${year}-${month}-${day}`;
  }
  return rawStr;
};

const createSafeDate = (year, month, day) => {
  const d = new Date(2000, month - 1, day);
  d.setFullYear(year);
  d.setHours(0, 0, 0, 0);
  return d;
};

const checkDateActive = (item, currentWorldDate) => {
  const startStr = item["开始日期"];
  const endStr = item["截止日期"];
  if (!startStr || !endStr) return { isActive: false, matched: false, dateStr: '' };

  if (startStr.includes("xx-xx")) {
    return { isActive: true, matched: true, dateStr: "PERMANENT" };
  }

  const sParts = parseDateParts(startStr);
  const eParts = parseDateParts(endStr);
  if (!sParts || !eParts) return { isActive: false, matched: false, dateStr: '' };

  const oneDay = 24 * 60 * 60 * 1000;
  const currentYear = currentWorldDate.getFullYear();
  const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];

  let matched = false;
  let isActive = false;
  let displayDateStr = `${formatDisplayDate(startStr)} ~ ${formatDisplayDate(endStr)}`;

  for (let year of yearsToCheck) {
    let startDate = createSafeDate(year, sParts.month, sParts.day);
    let endDate = createSafeDate(year, eParts.month, eParts.day);
    if (endDate < startDate) endDate.setFullYear(year + 1);

    const showStart = new Date(startDate.getTime() - (7 * oneDay));
    const showEnd = new Date(endDate.getTime() + (3 * oneDay));

    if (currentWorldDate >= showStart && currentWorldDate <= showEnd) {
      matched = true;
      if (currentWorldDate >= startDate && currentWorldDate <= endDate) isActive = true;
      break;
    }
  }
  return { isActive, matched, dateStr: displayDateStr };
};

const getCurrentWorldDate = () => {
  const worldTimeStr = worldData.value["时间"];
  if (!worldTimeStr) return null;
  const worldParts = parseDateParts(worldTimeStr);
  if (worldParts && worldParts.yearStr !== 'xxxx') {
    return createSafeDate(parseInt(worldParts.yearStr), worldParts.month, worldParts.day);
  }
  return null;
};

// --- 季节样式映射逻辑 ---
const getSeasonStyle = (name) => {
  if (!name) return 'default';
  if (name.includes('复苏') || name.includes('春')) return 'spring';
  if (name.includes('熔炉') || name.includes('夏')) return 'summer';
  if (name.includes('长风') || name.includes('秋')) return 'autumn';
  if (name.includes('静默') || name.includes('冬')) return 'winter';
  return 'default';
};

// 1. 当前季节
const currentSeason = computed(() => {
  const currentWorldDate = getCurrentWorldDate();
  if (!currentWorldDate) return null;
  const festivals = rawFestivalData.value;

  for (const key in festivals) {
    if (key === '$template') continue;
    const item = festivals[key];
    if (item["类型"] !== '季节') continue;
    const { isActive } = checkDateActive(item, currentWorldDate);
    if (isActive) {
      return {
        name: key,
        data: item,
        styleKey: getSeasonStyle(key) // 添加样式Key
      };
    }
  }
  return null;
});

// 2. 当前禁忌
const activeTaboos = computed(() => {
  const currentWorldDate = getCurrentWorldDate();
  if (!currentWorldDate) return [];
  const festivals = rawFestivalData.value;
  const list = [];

  for (const key in festivals) {
    if (key === '$template') continue;
    const item = festivals[key];
    if (item["类型"] !== '禁忌' && item["类型"] !== '灾害') continue;
    const { isActive } = checkDateActive(item, currentWorldDate);
    if (isActive) list.push({ name: key, data: item });
  }
  return list;
});

// 3. 近期节日/会议
const upcomingFestivals = computed(() => {
  const currentWorldDate = getCurrentWorldDate();
  if (!currentWorldDate) return [];
  const festivals = rawFestivalData.value;
  const resultList = [];

  for (const key in festivals) {
    if (key === '$template') continue;
    const item = festivals[key];
    const type = item["类型"];
    if (type === '季节' || type === '禁忌' || type === '灾害') continue;
    const { isActive, matched, dateStr } = checkDateActive(item, currentWorldDate);
    if (matched) {
      resultList.push({
        name: key, data: item, type: type, isActive: isActive, dateStr: dateStr
      });
    }
  }
  return resultList.sort((a, b) => (a.isActive !== b.isActive ? (a.isActive ? -1 : 1) : 0));
});

// 4. 档案分离逻辑
const getArchiveList = (filterFn) => {
  const festivals = rawFestivalData.value;
  const list = [];
  for (const key in festivals) {
    if (key === '$template') continue;
    const item = festivals[key];
    if (!filterFn(item["类型"])) continue;

    const startStr = item["开始日期"] || "";
    let sortVal = 9999;
    let dateShort = "UNKNOWN";
    const parts = parseDateParts(startStr);
    if (parts) {
      sortVal = parts.month * 100 + parts.day;
      dateShort = formatDisplayDate(startStr);
    } else if (startStr.includes("xx-xx")) {
      sortVal = 0;
      dateShort = "PERM";
    }
    list.push({
      name: key, data: item, type: item["类型"], sortVal: sortVal, dateShort: dateShort
    });
  }
  return list.sort((a, b) => a.sortVal - b.sortVal);
};

const seasonArchive = computed(() => getArchiveList(t => t === '季节'));
const tabooArchive = computed(() => getArchiveList(t => t === '禁忌' || t === '灾害'));
const festivalArchive = computed(() => getArchiveList(t => t !== '季节' && t !== '禁忌' && t !== '灾害'));

</script>

<style scoped>
/* --- 全局变量与主题 --- */
.ac-theme {
  --ac-gold: #cda45e;
  --ac-gold-dim: rgba(205, 164, 94, 0.3);
  --ac-dark: #0a0a0a;
  --ac-panel: rgba(15, 15, 15, 0.9);
  --ac-border: rgba(255, 255, 255, 0.12);
  --ac-text: #e0e0e0;
  --ac-text-dim: #757575;

  /* 默认季节色 */
  --color-season: #00e5ff;
  --color-season-dim: rgba(0, 229, 255, 0.15);

  --color-taboo: #ff3d3d;
  --color-taboo-dim: rgba(255, 61, 61, 0.1);
  --color-festival: #ffb300;

  --font-tech: 'Segoe UI', 'Roboto', Helvetica, Arial, sans-serif;

  width: 100%;
  height: 100vh; /* 兼容旧浏览器 */
  height: 100dvh; /* 关键修复：使用动态视口高度，自动适应浏览器地址栏/工具栏 */
  display: flex;
  flex-direction: column;
  background: #050505;
  color: var(--ac-text);
  font-family: var(--font-tech);
  overflow: hidden;
  position: relative;
}

/* 全局噪点背景 */
.global-noise {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

.scroll-container::-webkit-scrollbar { width: 4px; }
.scroll-container::-webkit-scrollbar-track { background: #000; }
.scroll-container::-webkit-scrollbar-thumb { background: var(--ac-gold); border-radius: 2px; }

/* --- 顶部导航 --- */
.wi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(0,0,0,0.8);
  border-bottom: 1px solid var(--ac-border);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.wi-title-group { display: flex; align-items: center; gap: 15px; }
.animus-logo {
  width: 30px; height: 30px;
  border: 1px solid var(--ac-gold);
  display: flex; align-items: center; justify-content: center;
  transform: rotate(45deg);
}
.triangle { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 10px solid var(--ac-gold); }

.title-text { display: flex; flex-direction: column; }
.title-text .main { font-size: 1.2rem; letter-spacing: 2px; font-weight: 300; color: #fff; }
.title-text .sub { font-size: 0.6rem; color: var(--ac-gold); letter-spacing: 1px; }

.wi-tabs { display: flex; gap: 5px; }
.tab-btn {
  background: transparent; border: none;
  color: var(--ac-text-dim);
  padding: 8px 15px;
  cursor: pointer;
  position: relative;
  font-size: 0.85rem;
  letter-spacing: 1px;
  transition: all 0.3s;
}
.tab-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
.tab-btn.active { color: var(--ac-gold); font-weight: bold; }
.active-bar {
  position: absolute; bottom: 0; left: 0; width: 0%; height: 2px;
  background: var(--ac-gold); transition: width 0.3s;
}
.tab-btn.active .active-bar { width: 100%; }

/* --- 内容区 --- */
.wi-content { flex: 1; padding: 30px; overflow-y: auto; position: relative; z-index: 1; }

/* --- 1. 季节 Hero Section (重构) --- */
.season-hero-wrapper {
  position: relative;
  width: 100%;
  min-height: 300px;
  margin-bottom: 40px;
  border: 1px solid var(--ac-border);
  background: #000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(0,0,0,0.8);
  transition: border-color 0.5s;
}

/* 通用粒子层 */
.particle-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  opacity: 0.3;
  pointer-events: none;
}
.ambient-light {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  opacity: 0.2;
  transition: background 0.5s;
}

/* ================== 季节特定特效 ================== */

/* 1. 复苏季 (Spring) - 绿色，漂浮孢子 */
.season-hero-wrapper.spring {
  --color-season: #69f0ae;
  border-color: rgba(105, 240, 174, 0.3);
}
.season-hero-wrapper.spring .ambient-light {
  background: radial-gradient(circle at bottom, rgba(105, 240, 174, 0.2) 0%, transparent 70%);
}
.season-hero-wrapper.spring .particle-layer {
  background-image: radial-gradient(var(--color-season) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: floatUp 20s linear infinite;
}
.season-hero-wrapper.spring .layer-2 { background-size: 70px 70px; animation-duration: 35s; opacity: 0.2; }
.season-hero-wrapper.spring .layer-3 { background-size: 120px 120px; animation-duration: 50s; opacity: 0.1; }

@keyframes floatUp {
  0% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-50px) translateX(10px); }
  100% { transform: translateY(-100px) translateX(0); }
}

/* 2. 熔炉季 (Summer) - 红色，热浪与火星 */
.season-hero-wrapper.summer {
  --color-season: #ff5252;
  border-color: rgba(255, 82, 82, 0.3);
}
.season-hero-wrapper.summer .ambient-light {
  background: radial-gradient(circle at center, rgba(255, 82, 82, 0.15) 0%, transparent 80%);
  animation: heatPulse 4s ease-in-out infinite;
}
.season-hero-wrapper.summer .particle-layer {
  background-image: linear-gradient(0deg, var(--color-season) 1px, transparent 1px);
  background-size: 100% 60px; /* 垂直线条模拟上升气流 */
  opacity: 0.2;
  animation: riseFast 2s linear infinite;
}
.season-hero-wrapper.summer .layer-2 {
  background-image: radial-gradient(#ffab40 2px, transparent 2px); /* 火星 */
  background-size: 100px 100px;
  animation: riseEmbers 5s linear infinite;
  opacity: 0.4;
}

@keyframes heatPulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.25; transform: scale(1.02); }
}
@keyframes riseFast {
  from { background-position: 0 0; }
  to { background-position: 0 -60px; }
}
@keyframes riseEmbers {
  from { transform: translateY(100px); opacity: 0; }
  50% { opacity: 0.6; }
  to { transform: translateY(-100px); opacity: 0; }
}

/* 3. 长风季 (Autumn) - 金色，横向风速线 */
.season-hero-wrapper.autumn {
  --color-season: #ffc107;
  border-color: rgba(255, 193, 7, 0.3);
}
.season-hero-wrapper.autumn .ambient-light {
  background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255, 193, 7, 0.1) 50%, rgba(0,0,0,0) 100%);
}
.season-hero-wrapper.autumn .particle-layer {
  background-image: linear-gradient(90deg, var(--color-season) 2px, transparent 2px);
  background-size: 200px 100%;
  opacity: 0.1;
  animation: windBlow 1s linear infinite;
}
.season-hero-wrapper.autumn .layer-2 {
  /* 模拟落叶/碎片 */
  background-image: radial-gradient(square, #d4a017 2px, transparent 2px);
  background-size: 150px 150px;
  animation: debrisFly 4s linear infinite;
  opacity: 0.3;
}

@keyframes windBlow {
  from { transform: translateX(0); }
  to { transform: translateX(-200px); }
}
@keyframes debrisFly {
  from { transform: translateX(200px) translateY(-50px) rotate(0deg); }
  to { transform: translateX(-200px) translateY(50px) rotate(90deg); }
}

/* 4. 静默季 (Winter) - 冰蓝，静止/下落雪花 */
.season-hero-wrapper.winter {
  --color-season: #40c4ff;
  border-color: rgba(64, 196, 255, 0.3);
}
.season-hero-wrapper.winter .ambient-light {
  background: radial-gradient(circle at top, rgba(64, 196, 255, 0.15) 0%, transparent 80%);
  filter: blur(5px);
}
.season-hero-wrapper.winter .particle-layer {
  background-image: radial-gradient(#fff 1px, transparent 1px);
  background-size: 30px 30px;
  animation: snowFall 10s linear infinite;
  opacity: 0.4;
}
.season-hero-wrapper.winter .layer-2 {
  background-size: 80px 80px;
  animation-duration: 20s;
  opacity: 0.2;
}
.season-hero-wrapper.winter .scan-grid {
  opacity: 0.1; /* 冬季网格更淡 */
}

@keyframes snowFall {
  from { transform: translateY(-100px); }
  to { transform: translateY(100px); }
}

/* ================== 通用 Hero 内容 ================== */

.scan-grid {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: 1;
}

.hero-content {
  position: relative; z-index: 5;
  text-align: center; width: 80%;
  animation: fadeInScale 0.8s ease-out;
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.season-meta {
  font-size: 0.7rem; letter-spacing: 6px; color: var(--color-season);
  margin-bottom: 10px; opacity: 0.8;
}

.season-title {
  font-size: 4rem; font-weight: 100; letter-spacing: 15px;
  color: #fff; margin: 0;
  text-shadow: 0 0 20px var(--color-season);
  position: relative;
  transition: text-shadow 0.3s;
}
/* 故障文字效果 */
.season-title::before {
  content: attr(data-text);
  position: absolute; left: 2px; text-shadow: -1px 0 red;
  top:0; color: #fff; background: transparent;
  overflow: hidden; clip: rect(0, 900px, 0, 0);
  animation: noise-anim-2 3s infinite linear alternate-reverse;
}

@keyframes noise-anim-2 {
  0% { clip: rect(10px, 9999px, 30px, 0); }
  5% { clip: rect(50px, 9999px, 60px, 0); }
  10% { clip: rect(0, 0, 0, 0); }
  100% { clip: rect(0, 0, 0, 0); }
}

.season-desc-box {
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  backdrop-filter: blur(5px);
}
.corner-bracket {
  position: absolute; width: 10px; height: 10px;
  border: 2px solid var(--color-season);
  transition: border-color 0.3s;
}
.top-left { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.bottom-right { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.desc-line { color: #ccc; font-size: 0.9rem; margin: 5px 0; line-height: 1.5; }

/* --- 2. HUD 状态栏 --- */
.hud-status-bar {
  display: flex; justify-content: center; align-items: center;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid var(--ac-border);
  border-top: 2px solid var(--ac-gold);
  padding: 15px; margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.hud-block { text-align: center; padding: 0 30px; }
.hud-label { display: block; font-size: 0.65rem; color: var(--ac-text-dim); letter-spacing: 2px; margin-bottom: 4px; }
.hud-value { font-size: 1.2rem; letter-spacing: 1px; font-family: monospace; }
.hud-value.gold { color: var(--ac-gold); text-shadow: 0 0 8px var(--ac-gold-dim); }
.hud-divider { width: 1px; height: 25px; background: rgba(255,255,255,0.1); transform: skewX(-20deg); }

/* --- 4. 节日与会议 --- */
.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
.tech-card {
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 15px;
  position: relative;
  transition: all 0.2s;
}
.tech-card:hover { border-color: var(--ac-gold); transform: translateY(-2px); }
.card-deco-corner {
  position: absolute; top: 0; right: 0; width: 0; height: 0;
  border-top: 10px solid var(--ac-gold); border-left: 10px solid transparent;
  opacity: 0.5;
}

.event-card.live-event { border-left: 3px solid var(--ac-gold); background: linear-gradient(90deg, rgba(205,164,94,0.05), transparent); }
.event-header { display: flex; justify-content: space-between; font-size: 0.7rem; color: #888; margin-bottom: 5px; }
.event-status { color: var(--ac-gold); font-weight: bold; }
.event-status.future { color: #666; }

.event-main { margin-bottom: 8px; }
.event-name { font-size: 1.1rem; color: #fff; font-weight: bold; margin-bottom: 2px; }
.event-date { font-family: monospace; color: var(--ac-gold); font-size: 0.8rem; }
.event-desc { font-size: 0.85rem; color: #aaa; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* --- 5. 分离的档案 --- */
.archives-container { margin-top: 60px; }
.archive-divider {
  text-align: center; margin-bottom: 20px; position: relative;
}
.archive-divider span {
  background: #050505; padding: 0 15px; color: var(--ac-text-dim); font-size: 0.8rem; letter-spacing: 3px; position: relative; z-index: 1;
}
.archive-divider::before {
  content: ''; position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background: var(--ac-border); z-index: 0;
}

.ac-accordion-wrapper { margin-bottom: 10px; }
.ac-accordion-btn {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  background: rgba(255,255,255,0.03); border: 1px solid var(--ac-border);
  padding: 12px 20px; color: #ccc; cursor: pointer; transition: all 0.2s;
}
.ac-accordion-btn:hover { background: rgba(255,255,255,0.08); }

/* 分类颜色 */
.season-style { border-left: 3px solid var(--color-season); }
.season-style:hover { color: var(--color-season); }
.taboo-style { border-left: 3px solid var(--color-taboo); }
.taboo-style:hover { color: var(--color-taboo); }
.festival-style { border-left: 3px solid var(--color-festival); }
.festival-style:hover { color: var(--color-festival); }

.ac-accordion-content { background: rgba(0,0,0,0.5); border: 1px solid var(--ac-border); border-top: none; padding: 15px; }
.ac-grid-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.ac-mini-card { padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid transparent; }
.ac-mini-card:hover { background: rgba(255,255,255,0.05); }

.season-border:hover { border-color: var(--color-season); }
.taboo-border:hover { border-color: var(--color-taboo); }
.festival-border:hover { border-color: var(--color-festival); }

.mini-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.85rem; }
.mini-title { font-weight: bold; color: #eee; }
.warning-text { color: var(--color-taboo); }
.gold-text { color: var(--ac-gold); }
.mini-date { font-family: monospace; color: #666; }
.mini-desc { font-size: 0.75rem; color: #888; }
.text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* --- 经济与势力通用 --- */
.data-table { display: flex; flex-direction: column; gap: 5px; }
.data-row { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.data-row .label { color: var(--ac-gold); }
.data-row .value { color: #ccc; }

.faction-card { padding: 0; }
.faction-header { padding: 15px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
.faction-body { padding: 15px; }
.ac-decrypt-btn {
  width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--ac-border);
  color: var(--ac-gold); font-family: monospace; cursor: pointer; display: flex; justify-content: center; gap: 10px;
  transition: all 0.3s;
}
.ac-decrypt-btn:hover { background: var(--ac-gold-dim); color: #fff; }
.details-terminal { margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.5); border-left: 2px solid var(--ac-gold); font-size: 0.85rem; color: #aaa; }
.details-list { list-style: none; padding: 0; margin: 0; }
.details-list li { margin-bottom: 5px; }

/* --- 种族 --- */
.race-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.race-card { padding: 12px; }
.race-header { color: #fff; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; }
.tech-tag { display: inline-block; font-size: 0.75rem; padding: 2px 6px; background: rgba(255,255,255,0.1); margin: 0 4px 4px 0; border-radius: 2px; color: #ccc; }

/* 响应式 */
@media (max-width: 768px) {
  .wi-header { flex-direction: column; align-items: flex-start; gap: 15px; }
  .season-title { font-size: 2.5rem; letter-spacing: 5px; }
  .hud-status-bar { flex-direction: column; gap: 10px; }
  .hud-divider { width: 30px; height: 1px; transform: none; }
  .masonry-layout { column-count: 1; }
}
</style>
