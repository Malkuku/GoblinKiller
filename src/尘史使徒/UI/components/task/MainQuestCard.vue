<template>
  <div class="main-quest-card" :class="cardTypeClass">
    <!-- 头部：通用 -->
    <div class="card-header">
      <div class="quest-type-label">{{ typeLabel }}</div>
      <h2 class="quest-title">{{ title }}</h2>
    </div>

    <!-- 内容区 -->
    <div class="card-body">
      <p class="description">{{ data.描述 }}</p>

      <!-- 布局 A: 警惕度模式 (存在 '警惕度' 字段) -->
      <div v-if="hasAlertness" class="layout-alertness">
        <div class="alert-container">
          <div class="alert-header">
            <span class="label">当前警惕度 / ALERT LEVEL</span>
            <span class="value" :class="{ danger: data.警惕度 > 0.8 }">{{ (data.警惕度 * 100).toFixed(0) }}%</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :class="{ 'high-alert': data.警惕度 > 0.5 }"
              :style="{ width: (data.警惕度 * 100) + '%' }"
            >
              <div class="scan-line"></div>
            </div>
          </div>
          <p class="alert-tip" v-if="data.警惕度 > 0">注意：异常行为已被察觉</p>
        </div>

        <!-- 详情列表 -->
        <ul v-if="data.详细" class="detail-list">
          <li v-for="(item, idx) in data.详细" :key="idx">{{ item }}</li>
        </ul>
      </div>

      <!-- 布局 B: 魂质收集模式 (存在 '已交融的魂质' 字段) -->
      <div v-else-if="hasSouls" class="layout-souls">
        <div class="soul-grid">
          <div
            v-for="soul in data.已交融的魂质"
            :key="soul"
            class="soul-item"
            :class="getSoulClass(soul)"
          >
            <div class="soul-inner">
              <span class="soul-icon">✦</span>
              <span class="soul-name">{{ soul }}</span>
            </div>
            <div class="soul-glow"></div>
          </div>
        </div>
      </div>

      <!-- 布局 C: 默认通用模式 -->
      <div v-else class="layout-default">
        <ul v-if="data.详细" class="detail-list">
          <li v-for="(item, idx) in data.详细" :key="idx">{{ item }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: String,
  data: Object
});

// 判断布局类型
const hasAlertness = computed(() => props.data.警惕度 !== undefined);
const hasSouls = computed(() => props.data.已交融的魂质 && props.data.已交融的魂质.length > 0);

const cardTypeClass = computed(() => {
  if (hasAlertness.value) return 'type-stealth';
  if (hasSouls.value) return 'type-power';
  return 'type-normal';
});

const typeLabel = computed(() => {
  if (hasAlertness.value) return 'SURVIVAL PROTOCOL';
  if (hasSouls.value) return 'SOUL RESONANCE';
  return 'MEMORY SEQUENCE';
});

// 魂质特效映射
const getSoulClass = (soulName) => {
  const map = {
    '渊饕难盈': 'soul-abyss',      // 深渊/吞噬
    '逐光之蛾': 'soul-light',      // 光/飞蛾
    '光与影': 'soul-contrast',     // 黑白
    '不融之霜': 'soul-frost',      // 冰蓝
    '不休之鼓': 'soul-blood',      // 血红/心跳
    '铸魂遗物': 'soul-relic',      // 金色/金属
    '狮齿镂印': 'soul-lion',       // 琥珀/力量
    '蚁母的疤痕': 'soul-earth',    // 墨绿/大地
  };
  return map[soulName] || 'soul-default';
};
</script>

<style scoped>
/* --- 基础卡片样式 --- */
.main-quest-card {
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid rgba(164, 139, 87, 0.3);
  padding: 25px;
  margin-bottom: 25px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-header { margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
.quest-type-label { font-size: 0.7rem; letter-spacing: 3px; color: var(--c-text-dim); margin-bottom: 5px; text-transform: uppercase; }
.quest-title { font-family: var(--font-title); font-size: 1.8rem; color: var(--c-text-main); margin: 0; }
.description { font-size: 1.05rem; line-height: 1.6; color: #ccc; margin-bottom: 20px; font-style: italic; }

/* --- 布局 A: 警惕度 (红色/危机感) --- */
.type-stealth { border-left: 4px solid #d32f2f; }
.type-stealth .quest-title { color: #ef9a9a; }

.alert-container { background: rgba(0,0,0,0.3); padding: 15px; border: 1px solid rgba(211, 47, 47, 0.3); margin-bottom: 15px; }
.alert-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.8rem; color: #ef9a9a; }
.progress-track { height: 8px; background: rgba(0,0,0,0.5); position: relative; overflow: hidden; }
.progress-fill { height: 100%; background: #81c784; transition: width 0.5s; position: relative; }
.progress-fill.high-alert { background: #d32f2f; box-shadow: 0 0 10px #d32f2f; }

/* 扫描线动画 */
.scan-line {
  position: absolute; top: 0; bottom: 0; width: 20px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
  animation: scan 2s infinite linear;
}
@keyframes scan { from { left: -20px; } to { left: 100%; } }

.detail-list { list-style: none; padding: 0; color: var(--c-text-dim); font-size: 0.9rem; }
.detail-list li::before { content: '>'; margin-right: 8px; color: var(--c-gold); }

/* --- 布局 B: 魂质 (神秘/特效) --- */
.type-power { border-left: 4px solid #9c27b0; background: linear-gradient(135deg, rgba(20,20,20,0.8), rgba(40,10,40,0.3)); }
.type-power .quest-title { color: #e1bee7; text-shadow: 0 0 5px rgba(156, 39, 176, 0.5); }

.soul-grid { display: flex; flex-wrap: wrap; gap: 15px; }

.soul-item {
  position: relative;
  padding: 8px 16px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.4);
  cursor: default;
  transition: transform 0.3s;
}
.soul-item:hover { transform: translateY(-2px); }

.soul-inner { display: flex; align-items: center; gap: 8px; position: relative; z-index: 2; }
.soul-icon { font-size: 1.2rem; }
.soul-name { font-family: var(--font-title); font-weight: bold; letter-spacing: 1px; }

/* --- 魂质专属特效 --- */

/* 1. 渊饕难盈 (深渊紫黑) */
.soul-abyss { border-color: #4a148c; color: #e1bee7; box-shadow: inset 0 0 15px rgba(74, 20, 140, 0.5); }
.soul-abyss .soul-icon { color: #aa00ff; text-shadow: 0 0 5px #000; }

/* 2. 逐光之蛾 (苍白微光) */
.soul-light { border-color: #fff9c4; color: #fffde7; background: rgba(255, 255, 255, 0.05); }
.soul-light:hover { box-shadow: 0 0 15px rgba(255, 255, 200, 0.4); }
.soul-light .soul-icon { color: #fff59d; }

/* 3. 光与影 (黑白渐变) */
.soul-contrast {
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.8) 50%);
  border-color: #9e9e9e; color: #f5f5f5;
}
.soul-contrast .soul-icon { color: #fff; mix-blend-mode: difference; }

/* 4. 不融之霜 (冰蓝寒气) */
.soul-frost { border-color: #80deea; color: #e0f7fa; box-shadow: 0 0 5px rgba(128, 222, 234, 0.2); }
.soul-frost .soul-icon { color: #00bcd4; text-shadow: 0 0 8px #00bcd4; }

/* 5. 不休之鼓 (血红脉动) */
.soul-blood { border-color: #b71c1c; color: #ffcdd2; }
.soul-blood .soul-icon { color: #f44336; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }

/* 6. 铸魂遗物 (古老黄金) */
.soul-relic { border-color: #ffb300; color: #ffecb3; background: rgba(255, 179, 0, 0.1); }
.soul-relic .soul-icon { color: #ffd740; text-shadow: 0 0 5px #ff6f00; }

/* 7. 狮齿镂印 (琥珀/力量) */
.soul-lion { border-color: #ff6f00; color: #ffe0b2; border-width: 2px; }
.soul-lion .soul-icon { color: #ff8f00; }

/* 8. 蚁母的疤痕 (大地/腐蚀) */
.soul-earth { border-color: #33691e; color: #dcedc8; border-style: dashed; }
.soul-earth .soul-icon { color: #7cb342; }

</style>
