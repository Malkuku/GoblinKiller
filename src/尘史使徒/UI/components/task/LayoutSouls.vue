<template>
  <div class="layout-souls">
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
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: Object });

const getSoulClass = (soulName) => {
  const map = {
    '渊饕难盈': 'soul-abyss',
    '逐光之蛾': 'soul-light',
    '光与影': 'soul-contrast',
    '不融之霜': 'soul-frost',
    '不休之鼓': 'soul-blood',
    '铸魂遗物': 'soul-relic',
    '狮齿镂印': 'soul-lion',
    '蚁母的疤痕': 'soul-earth',
  };
  return map[soulName] || 'soul-default';
};
</script>

<style scoped>
.soul-grid { display: flex; flex-wrap: wrap; gap: 15px; }
.soul-item {
  position: relative; padding: 8px 16px; border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.4); cursor: default; transition: transform 0.3s;
}
.soul-item:hover { transform: translateY(-2px); }
.soul-inner { display: flex; align-items: center; gap: 8px; position: relative; z-index: 2; }
.soul-icon { font-size: 1.2rem; }
.soul-name { font-family: serif; font-weight: bold; letter-spacing: 1px; }

/* 魂质特效样式 (这里省略具体颜色代码，与之前一致，可直接复制) */
.soul-abyss { border-color: #4a148c; color: #e1bee7; }
.soul-abyss .soul-icon { color: #aa00ff; }

/* --- 布局 B: 魂质 (神秘/特效) --- */
.type-power { border-left: 4px solid #9c27b0; background: linear-gradient(135deg, rgba(20,20,20,0.8), rgba(40,10,40,0.3)); }
.type-power .quest-title { color: #e1bee7; text-shadow: 0 0 5px rgba(156, 39, 176, 0.5); }
.soul-grid { display: flex; flex-wrap: wrap; gap: 15px; }
.soul-item {
  position: relative; padding: 8px 16px; border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.4); cursor: default; transition: transform 0.3s;
}
.soul-item:hover { transform: translateY(-2px); }
.soul-inner { display: flex; align-items: center; gap: 8px; position: relative; z-index: 2; }
.soul-icon { font-size: 1.2rem; }
.soul-name { font-family: var(--font-title, serif); font-weight: bold; letter-spacing: 1px; }

/* 魂质特效 (保持原样) */
.soul-abyss { border-color: #4a148c; color: #e1bee7; box-shadow: inset 0 0 15px rgba(74, 20, 140, 0.5); }
.soul-abyss .soul-icon { color: #aa00ff; text-shadow: 0 0 5px #000; }
.soul-light { border-color: #fff9c4; color: #fffde7; background: rgba(255, 255, 255, 0.05); }
.soul-light:hover { box-shadow: 0 0 15px rgba(255, 255, 200, 0.4); }
.soul-light .soul-icon { color: #fff59d; }
.soul-contrast { background: linear-gradient(90deg, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.8) 50%); border-color: #9e9e9e; color: #f5f5f5; }
.soul-contrast .soul-icon { color: #fff; mix-blend-mode: difference; }
.soul-frost { border-color: #80deea; color: #e0f7fa; box-shadow: 0 0 5px rgba(128, 222, 234, 0.2); }
.soul-frost .soul-icon { color: #00bcd4; text-shadow: 0 0 8px #00bcd4; }
.soul-blood { border-color: #b71c1c; color: #ffcdd2; }
.soul-blood .soul-icon { color: #f44336; animation: pulse 1.5s infinite; }
.soul-relic { border-color: #ffb300; color: #ffecb3; background: rgba(255, 179, 0, 0.1); }
.soul-relic .soul-icon { color: #ffd740; text-shadow: 0 0 5px #ff6f00; }
.soul-lion { border-color: #ff6f00; color: #ffe0b2; border-width: 2px; }
.soul-lion .soul-icon { color: #ff8f00; }
.soul-earth { border-color: #33691e; color: #dcedc8; border-style: dashed; }
.soul-earth .soul-icon { color: #7cb342; }
</style>
