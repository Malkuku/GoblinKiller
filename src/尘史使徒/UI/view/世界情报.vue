<template>
  <div class="world-info-view ac-theme">
    <!-- 顶部标签栏 -->
    <header class="wi-header">
      <div class="wi-title">
        <span class="icon-animus"></span>
        <span class="text-glitch" data-text="WORLD_INTEL">WORLD_INTEL</span>
      </div>
      <nav class="wi-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: currentTab === tab.key }]"
          @click="currentTab = tab.key"
        >
          {{ tab.name }}
        </button>
      </nav>
    </header>

    <!-- 内容区域 -->
    <div class="wi-content scroll-container">

      <!-- 1. 时序与节庆 -->
      <section v-if="currentTab === 'time'" class="tab-pane time-pane">
        <!-- 状态栏 -->
        <div class="ac-status-bar">
          <div class="ac-stat-item">
            <span class="label">CURRENT_DATE</span>
            <span class="value highlight">{{ worldData.时间 || 'UNKNOWN' }}</span>
          </div>
          <div class="separator"></div>
          <div class="ac-stat-item">
            <span class="label">LOCATION</span>
            <span class="value">{{ worldData.地点 || 'UNKNOWN' }}</span>
          </div>
          <div class="separator"></div>
          <div class="ac-stat-item">
            <span class="label">ENVIRONMENT</span>
            <span class="value">{{ worldData.季节 }} <span class="dim">|</span> {{ worldData.天气 }}</span>
          </div>
        </div>

        <!-- 近期事象 -->
        <div class="ac-section-header">
          <span class="line"></span>
          <span class="title">ACTIVE_SIGNALS // 近期事象</span>
          <span class="line"></span>
        </div>

        <div v-if="sortedEvents.length === 0" class="ac-empty-state">
          NO ACTIVE SIGNALS DETECTED
        </div>

        <div class="events-list">
          <div
            v-for="(event, index) in sortedEvents"
            :key="index"
            class="ac-card event-card"
            :class="{ 'is-active': event.isActive }"
          >
            <div class="ac-card-header">
              <span class="event-name">{{ event.name }}</span>
              <div class="ac-badges">
                <span class="ac-badge type">{{ event.type }}</span>
                <span class="ac-badge status" :class="event.isActive ? 'live' : 'soon'">
                  {{ event.isActive ? 'LIVE' : 'INCOMING' }}
                </span>
              </div>
            </div>
            <div class="ac-card-meta">
              <span class="icon">📅</span> {{ event.dateStr }}
            </div>
            <div class="ac-card-body">
              <p v-for="(desc, i) in normalizeArray(event.data.描述)" :key="i">{{ desc }}</p>
            </div>
          </div>
        </div>

        <!-- 全境节庆档案 (折叠) -->
        <div class="ac-accordion-wrapper">
          <button class="ac-accordion-btn" @click="toggleSection('time_archive')">
            <span class="btn-text">GLOBAL_FESTIVAL_ARCHIVE // 全境节庆档案</span>
            <span class="btn-icon">{{ isSectionOpen('time_archive') ? '▼' : '▶' }}</span>
          </button>

          <div v-if="isSectionOpen('time_archive')" class="ac-accordion-content">
            <div class="ac-grid-list">
              <div v-for="(item, idx) in almanacList" :key="idx" class="ac-mini-card">
                <div class="mini-header">
                  <span class="mini-title">{{ item.name }}</span>
                  <span class="mini-date">{{ item.dateShort }}</span>
                </div>
                <div class="mini-body">
                  <div class="mini-type">{{ item.type }}</div>
                  <div class="mini-desc text-truncate">{{ normalizeArray(item.data.描述)[0] }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. 世界经济 -->
      <section v-if="currentTab === 'economy'" class="tab-pane economy-pane">
        <div v-for="(econ, region) in economyData" :key="region" class="ac-group-wrapper">
          <!-- 地区折叠头 -->
          <button class="ac-accordion-btn region-btn" @click="toggleSection('econ_' + region)">
            <span class="btn-text">REGION: {{ region }}</span>
            <span class="btn-icon">{{ isSectionOpen('econ_' + region) ? '▼' : '▶' }}</span>
          </button>

          <div v-if="isSectionOpen('econ_' + region)" class="ac-accordion-content">
            <!-- 货币 -->
            <div class="sub-section">
              <h4 class="ac-sub-title">CURRENCY_SYSTEM</h4>
              <div class="grid-container">
                <div v-for="(curr, name) in filterTemplate(econ.货币体系)" :key="name" class="ac-card mini">
                  <div class="ac-card-header gold-text">{{ name }}</div>
                  <div class="ac-card-body">
                    <p>VAL: {{ curr.价值 }}</p>
                    <p class="dim-text">{{ curr.描述 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 社会阶层 -->
            <div class="sub-section">
              <h4 class="ac-sub-title">SOCIAL_HIERARCHY</h4>
              <div class="list-container ac-list-style">
                <div v-for="(cls, name) in filterTemplate(econ.社会阶层)" :key="name" class="info-row">
                  <span class="row-label">{{ name }}</span>
                  <div class="row-content">
                    <span class="income">AVG_INC: {{ cls.平均收入 }}</span>
                    <span class="source">SRC: {{ normalizeArray(cls.收入来源).join(' / ') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. 势力 (UI重构版) -->
      <section v-if="currentTab === 'faction'" class="tab-pane faction-pane">
        <div class="ac-section-header">
          <span class="line"></span>
          <span class="title">FACTION_DATABASE // 势力档案</span>
          <span class="line"></span>
        </div>

        <div class="masonry-layout">
          <div v-for="(faction, name, index) in factionData" :key="name" class="ac-card faction-card">
            <!-- 装饰性角标 -->
            <div class="corner-mark top-right"></div>
            <div class="corner-mark bottom-left"></div>

            <div class="ac-card-header faction-header">
              <span class="card-title">{{ name }}</span>
              <span class="faction-id">ID: 0x{{ (index + 10).toString(16).toUpperCase() }}</span>
            </div>

            <div class="ac-card-body">
              <div class="desc-block">
                <p v-for="(desc, i) in normalizeArray(faction.描述)" :key="i">{{ desc }}</p>
              </div>

              <!-- 势力详情折叠 (按钮式) -->
              <div v-if="faction.详情 && faction.详情.length" class="faction-footer">
                <button
                  class="ac-decrypt-btn"
                  :class="{ active: isSectionOpen('fac_' + name) }"
                  @click="toggleSection('fac_' + name)"
                >
                  <span class="icon">{{ isSectionOpen('fac_' + name) ? '🔓' : '🔒' }}</span>
                  <span class="text">{{ isSectionOpen('fac_' + name) ? 'CLOSE_FILE' : 'ACCESS_RESTRICTED_DATA' }}</span>
                  <div class="scan-line"></div>
                </button>

                <div v-if="isSectionOpen('fac_' + name)" class="details-terminal">
                  <ul class="details-list">
                    <li v-for="(detail, k) in faction.详情" :key="k">
                      <span class="bullet">█</span> {{ detail }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. 种族 -->
      <section v-if="currentTab === 'race'" class="tab-pane race-pane">
        <div v-for="(races, category) in raceData" :key="category" class="ac-group-wrapper">
          <!-- 种族分类折叠头 -->
          <button class="ac-accordion-btn category-btn" @click="toggleSection('race_' + category)">
            <span class="btn-text">CLASS: {{ category }}</span>
            <span class="btn-icon">{{ isSectionOpen('race_' + category) ? '▼' : '▶' }}</span>
          </button>

          <div v-if="isSectionOpen('race_' + category)" class="ac-accordion-content">
            <div class="race-grid">
              <div v-for="(traits, raceName) in filterTemplate(races)" :key="raceName" class="ac-card race-card">
                <div class="ac-card-header">{{ raceName }}</div>
                <div class="ac-card-body">
                  <div class="tags">
                    <span v-for="(trait, t) in traits" :key="t" class="ac-tag">{{ trait }}</span>
                  </div>
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
  import { ref, computed, inject } from 'vue';
  import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
  const statStore = useStatStore();

  // --- 状态管理 ---
  const currentTab = ref('time');
  const expandedKeys = ref({}); // 存储所有折叠区域的状态

  const tabs = [
    { name: 'TIMELINE', key: 'time' },
    { name: 'ECONOMY', key: 'economy' },
    { name: 'FACTIONS', key: 'faction' },
    { name: 'SPECIES', key: 'race' },
  ];

  // --- 辅助函数：通用过滤 $template ---
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

  // --- 折叠控制 ---
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

  // --- 数据计算属性 (应用过滤) ---
  const worldData = computed(() => statStore.stat_data?.["世界"] || {});
  const economyData = computed(() => filterTemplate(statStore.stat_data?.["世界经济"]));
  const factionData = computed(() => filterTemplate(statStore.stat_data?.["势力"]));
  const raceData = computed(() => filterTemplate(statStore.stat_data?.["种族"]));
  const rawFestivalData = computed(() => statStore.stat_data?.["季节与节日"] || {});

  // --- 辅助函数 ---
  const normalizeArray = (val) => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  // --- 核心逻辑：节日时间计算 ---
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

  const createSafeDate = (year, month, day) => {
    const d = new Date(2000, month - 1, day);
    d.setFullYear(year);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // 1. 智能排序与筛选列表 (近期/进行中)
  const sortedEvents = computed(() => {
    const currentLocIndex = worldData.value["地图索引"];
    const currentLocName = worldData.value["地点"];
    const worldTimeStr = worldData.value["时间"];
    const festivals = rawFestivalData.value;

    if (!worldTimeStr) return [];

    let currentWorldDate = null;
    const worldParts = parseDateParts(worldTimeStr);
    if (worldParts && worldParts.yearStr !== 'xxxx') {
      currentWorldDate = createSafeDate(parseInt(worldParts.yearStr), worldParts.month, worldParts.day);
    } else {
      return [];
    }

    const resultList = [];
    const oneDay = 24 * 60 * 60 * 1000;

    for (const key in festivals) {
      if (key === '$template') continue; // 过滤

      const item = festivals[key];
      const areaKeywords = item["区域检索词"];
      if (areaKeywords && areaKeywords.length > 0) {
        const loc = currentLocIndex || currentLocName || "";
        const match = areaKeywords.some(k => loc.includes(k));
        if (!match) continue;
      }

      const startStr = item["开始日期"];
      const endStr = item["截止日期"];

      if (!startStr || !endStr) continue;
      if (startStr.includes("xx-xx")) {
        resultList.push({
          name: key,
          data: item,
          type: item["类型"],
          isActive: true,
          dateStr: "PERMANENT // 常驻"
        });
        continue;
      }

      const sParts = parseDateParts(startStr);
      const eParts = parseDateParts(endStr);
      if (!sParts || !eParts) continue;

      const currentYear = currentWorldDate.getFullYear();
      const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];

      let matched = false;
      let isActive = false;
      let displayDateStr = `${item["开始日期"]} ~ ${item["截止日期"]}`;

      for (let year of yearsToCheck) {
        let startDate = createSafeDate(year, sParts.month, sParts.day);
        let endDate = createSafeDate(year, eParts.month, eParts.day);

        if (endDate < startDate) endDate.setFullYear(year + 1);

        const showStart = new Date(startDate.getTime() - (20 * oneDay));
        const showEnd = new Date(endDate.getTime() + (5 * oneDay));

        if (currentWorldDate >= showStart && currentWorldDate <= showEnd) {
          matched = true;
          if (currentWorldDate >= startDate && currentWorldDate <= endDate) {
            isActive = true;
          }
          break;
        }
      }

      if (matched) {
        resultList.push({
          name: key,
          data: item,
          type: item["类型"],
          isActive: isActive,
          dateStr: displayDateStr
        });
      }
    }

    return resultList.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return 0;
    });
  });

  // 2. 所有节日列表 (年鉴模式)
  const almanacList = computed(() => {
    const festivals = rawFestivalData.value;
    const list = [];

    for (const key in festivals) {
      if (key === '$template') continue; // 过滤

      const item = festivals[key];
      const startStr = item["开始日期"] || "";
      let sortVal = 9999;
      let dateShort = "UNKNOWN";

      const parts = parseDateParts(startStr);
      if (parts) {
        sortVal = parts.month * 100 + parts.day;
        dateShort = `${parts.month.toString().padStart(2,'0')}-${parts.day.toString().padStart(2,'0')}`;
      } else if (startStr.includes("xx-xx")) {
        sortVal = 0;
        dateShort = "PERM";
      }

      list.push({
        name: key,
        data: item,
        type: item["类型"],
        sortVal: sortVal,
        dateShort: dateShort
      });
    }
    return list.sort((a, b) => a.sortVal - b.sortVal);
  });
</script>

<style scoped>
  /* --- 刺客信条风格主题变量 --- */
  .ac-theme {
    --ac-gold: #cda45e;
    --ac-gold-dim: rgba(205, 164, 94, 0.3);
    --ac-bg-dark: rgba(10, 10, 10, 0.85);
    --ac-bg-card: rgba(0, 0, 0, 0.6);
    --ac-border: rgba(255, 255, 255, 0.15);
    --ac-text-main: #eeeeee;
    --ac-text-dim: #888888;
    --ac-red: #b93a3a;
    --font-ac: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0;
    box-sizing: border-box;
    font-family: var(--font-ac);
    color: var(--ac-text-main);
    background: radial-gradient(circle at center, rgba(20,20,20,0.9) 0%, rgba(0,0,0,1) 100%);
  }

  /* 滚动条 */
  .scroll-container::-webkit-scrollbar { width: 4px; }
  .scroll-container::-webkit-scrollbar-track { background: transparent; }
  .scroll-container::-webkit-scrollbar-thumb { background: var(--ac-gold); }

  /* --- 头部 --- */
  .wi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    border-bottom: 1px solid var(--ac-border);
    background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
  }

  .wi-title {
    font-size: 1.5rem;
    color: var(--ac-text-main);
    letter-spacing: 2px;
    display: flex;
    align-items: center;
    gap: 15px;
    font-weight: 300;
  }

  .icon-animus {
    width: 12px;
    height: 12px;
    background: var(--ac-red);
    box-shadow: 0 0 10px var(--ac-red);
    transform: rotate(45deg);
  }

  .wi-tabs { display: flex; gap: 20px; }

  .tab-btn {
    background: transparent;
    border: none;
    color: var(--ac-text-dim);
    font-size: 0.9rem;
    font-weight: bold;
    letter-spacing: 1px;
    cursor: pointer;
    padding: 5px 0;
    position: relative;
    transition: color 0.3s;
  }

  .tab-btn:hover { color: var(--ac-text-main); }
  .tab-btn.active { color: var(--ac-text-main); }
  .tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -21px;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--ac-gold);
    box-shadow: 0 -2px 10px var(--ac-gold);
  }

  /* --- 内容区 --- */
  .wi-content {
    flex: 1;
    overflow-y: auto;
    padding: 30px 40px;
  }

  /* --- AC 状态栏 --- */
  .ac-status-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--ac-border);
    padding: 15px;
    margin-bottom: 40px;
    backdrop-filter: blur(5px);
  }

  .ac-stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 30px;
  }

  .ac-stat-item .label {
    font-size: 0.7rem;
    letter-spacing: 2px;
    color: var(--ac-text-dim);
    margin-bottom: 5px;
  }

  .ac-stat-item .value {
    font-size: 1.2rem;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .ac-stat-item .value.highlight { color: var(--ac-gold); text-shadow: 0 0 5px var(--ac-gold-dim); }
  .separator { width: 1px; height: 30px; background: var(--ac-border); }

  /* --- 标题分割线 --- */
  .ac-section-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    gap: 15px;
  }
  .ac-section-header .line { flex: 1; height: 1px; background: var(--ac-border); }
  .ac-section-header .title {
    color: var(--ac-gold);
    font-size: 0.9rem;
    letter-spacing: 3px;
    font-weight: bold;
  }

  /* --- 卡片通用 --- */
  .ac-card {
    background: var(--ac-bg-card);
    border-left: 2px solid var(--ac-gold);
    border-top: 1px solid rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    border-right: 1px solid rgba(255,255,255,0.05);
    padding: 20px;
    margin-bottom: 15px;
    position: relative;
    transition: all 0.2s;
  }

  .ac-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-left-width: 4px;
    padding-left: 18px;
  }

  .ac-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 1.1rem;
    color: var(--ac-text-main);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .ac-card-meta {
    font-size: 0.8rem;
    color: var(--ac-gold);
    margin-bottom: 10px;
    font-family: monospace;
  }

  .ac-card-body {
    font-size: 0.95rem;
    color: #ccc;
    line-height: 1.6;
  }

  /* 徽章 */
  .ac-badges { display: flex; gap: 5px; }
  .ac-badge {
    font-size: 0.7rem;
    padding: 2px 6px;
    border: 1px solid var(--ac-border);
    text-transform: uppercase;
  }
  .ac-badge.live { background: var(--ac-gold); color: #000; border-color: var(--ac-gold); font-weight: bold; }
  .ac-badge.soon { background: transparent; color: var(--ac-text-dim); }

  /* --- 折叠区域通用样式 --- */
  .ac-group-wrapper { margin-bottom: 15px; }

  .ac-accordion-wrapper { margin-top: 50px; }

  .ac-accordion-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0,0,0,0.5);
    border: 1px solid var(--ac-border);
    border-left: 4px solid var(--ac-text-dim);
    padding: 15px 20px;
    color: var(--ac-text-main);
    cursor: pointer;
    transition: all 0.3s;
  }

  .ac-accordion-btn:hover, .ac-accordion-btn.active {
    background: rgba(205, 164, 94, 0.1);
    color: var(--ac-gold);
    border-color: var(--ac-gold);
  }

  .btn-text { letter-spacing: 2px; font-weight: bold; font-size: 0.9rem; text-transform: uppercase; }

  .ac-accordion-content {
    background: rgba(0,0,0,0.3);
    border: 1px solid var(--ac-border);
    border-top: none;
    padding: 20px;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* --- 经济面板样式 --- */
  .ac-sub-title {
    color: var(--ac-text-main);
    border-left: 3px solid var(--ac-red);
    padding-left: 10px;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
  .info-row {
    display: flex; justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding: 8px 0;
  }
  .row-label { color: var(--ac-gold); }
  .row-content { color: var(--ac-text-dim); font-size: 0.9rem; }

  /* --- 势力面板样式 (增强版) --- */
  .masonry-layout { column-count: 2; column-gap: 20px; }

  .faction-card {
    break-inside: avoid;
    display: inline-block;
    width: 100%;
    border: 1px solid rgba(255,255,255,0.05);
    background: linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(10,10,10,0.95) 100%);
    padding: 0; /* 重置padding，由内部元素控制 */
  }

  /* 角标装饰 */
  .corner-mark {
    position: absolute;
    width: 10px; height: 10px;
    border: 2px solid var(--ac-gold);
    opacity: 0.5;
    transition: all 0.3s;
  }
  .corner-mark.top-right { top: 0; right: 0; border-bottom: none; border-left: none; }
  .corner-mark.bottom-left { bottom: 0; left: 0; border-top: none; border-right: none; }
  .faction-card:hover .corner-mark { width: 15px; height: 15px; opacity: 1; }

  .faction-header {
    padding: 15px 20px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 0;
  }
  .faction-id {
    font-family: monospace;
    font-size: 0.7rem;
    color: var(--ac-text-dim);
    letter-spacing: 1px;
  }

  .faction-card .ac-card-body {
    padding: 20px;
  }

  /* 解密按钮 */
  .faction-footer { margin-top: 20px; }
  .ac-decrypt-btn {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    background: rgba(0,0,0,0.5);
    border: 1px solid var(--ac-border);
    color: var(--ac-gold);
    padding: 8px;
    cursor: pointer;
    font-family: monospace;
    letter-spacing: 2px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
  }
  .ac-decrypt-btn:hover {
    background: rgba(205, 164, 94, 0.1);
    box-shadow: 0 0 10px rgba(205, 164, 94, 0.1);
  }
  .ac-decrypt-btn.active {
    background: var(--ac-gold);
    color: #000;
    font-weight: bold;
  }

  /* 扫描线动画 */
  .scan-line {
    position: absolute;
    top: 0; left: -100%;
    width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: skewX(-20deg);
    transition: left 0.5s;
  }
  .ac-decrypt-btn:hover .scan-line {
    left: 150%;
    transition: left 1s;
  }

  /* 详情终端样式 */
  .details-terminal {
    background: rgba(0,0,0,0.6);
    border: 1px solid var(--ac-border);
    border-top: none;
    padding: 15px;
    font-family: monospace;
    font-size: 0.85rem;
    color: #aaa;
    animation: slideDown 0.2s ease-out;
  }
  .details-list {
    list-style: none;
    padding: 0; margin: 0;
  }
  .details-list li {
    margin-bottom: 5px;
    display: flex;
    gap: 8px;
  }
  .bullet { color: var(--ac-gold); font-size: 0.7rem; line-height: 1.5; }

  /* --- 种族面板样式 --- */
  .race-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
  .ac-tag {
    background: rgba(255,255,255,0.1);
    padding: 2px 8px;
    font-size: 0.8rem;
    margin-right: 5px;
    border: 1px solid transparent;
    display: inline-block; margin-bottom: 5px;
  }
  .ac-tag:hover { border-color: var(--ac-gold); }

  /* --- 节庆年鉴小卡片 --- */
  .ac-grid-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
  }
  .ac-mini-card {
    border: 1px solid var(--ac-border);
    padding: 10px;
    background: rgba(0,0,0,0.4);
    transition: border-color 0.2s;
  }
  .ac-mini-card:hover { border-color: var(--ac-gold); }
  .mini-header {
    display: flex; justify-content: space-between;
    margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;
  }
  .mini-title { color: var(--ac-gold); font-size: 0.9rem; font-weight: bold; }
  .mini-date { font-family: monospace; font-size: 0.8rem; color: var(--ac-text-dim); }
  .mini-type { font-size: 0.7rem; color: var(--ac-text-dim); text-transform: uppercase; margin-bottom: 3px; }
  .mini-desc { font-size: 0.8rem; color: #aaa; }
  .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* 响应式 */
  @media (max-width: 768px) {
    .wi-header { flex-direction: column; align-items: flex-start; gap: 15px; padding: 15px; }
    .wi-content { padding: 15px; }
    .ac-status-bar { flex-direction: column; gap: 15px; }
    .separator { width: 30px; height: 1px; }
    .masonry-layout { column-count: 1; }
  }
</style>
