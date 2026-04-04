<template>
  <div class="user-shortcut-bar">
    <!-- 生命状态五维 (卷轴复古风格) -->
    <div class="status-group">
      <div class="stat-pill hp" :title="`生命: ${lifeStatus?.['生命值']?.['当前值'] || 0} / ${lifeStatus?.['生命值']?.['最大值'] || 0}`">
        <span class="icon">❤</span>
        <div class="bar-bg"><div class="bar-fill" :style="{ width: getPercent(lifeStatus?.['生命值']) + '%' }"></div></div>
      </div>
      <div class="stat-pill armor" :title="`护甲: ${lifeStatus?.['护甲值']?.['当前值'] || 0} / ${lifeStatus?.['护甲值']?.['最大值'] || 0}`">
        <span class="icon">🛡️</span>
        <div class="bar-bg"><div class="bar-fill" :style="{ width: getPercent(lifeStatus?.['护甲值']) + '%' }"></div></div>
      </div>
      <div class="stat-pill sp" :title="`体力: ${lifeStatus?.['体力值']?.['当前值'] || 0} / ${lifeStatus?.['体力值']?.['最大值'] || 0}`">
        <span class="icon">⚡</span>
        <div class="bar-bg"><div class="bar-fill" :style="{ width: getPercent(lifeStatus?.['体力值']) + '%' }"></div></div>
      </div>
      <div class="stat-pill mp" :title="`魔力: ${lifeStatus?.['魔力值']?.['当前值'] || 0} / ${lifeStatus?.['魔力值']?.['最大值'] || 0}`">
        <span class="icon">✧</span>
        <div class="bar-bg"><div class="bar-fill" :style="{ width: getPercent(lifeStatus?.['魔力值']) + '%' }"></div></div>
      </div>
      <div class="stat-pill faith" :title="`信仰: ${lifeStatus?.['信仰力值']?.['当前值'] || 0} / ${lifeStatus?.['信仰力值']?.['最大值'] || 0}`">
        <span class="icon">🕊️</span>
        <div class="bar-bg"><div class="bar-fill" :style="{ width: getPercent(lifeStatus?.['信仰力值']) + '%' }"></div></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  lifeStatus: any;
}>();

const getPercent = (stat: any) => {
  if (!stat || !stat['最大值']) return 0;
  return Math.min(100, Math.max(0, (stat['当前值'] / stat['最大值']) * 100));
};
</script>

<style scoped>
.user-shortcut-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif; /* 契合卷轴字体 */
}

/* --- 状态条样式 (卷轴复古风格) --- */
.status-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  /* 使用全局卷轴变量，自动适配明暗模式 */
  background-color: var(--scroll-paper, #fffcf5);
  border: 1px solid var(--scroll-border, #d4c4a8);
  padding: 4px 8px;
  border-radius: 4px; /* 降低圆角，增加纸张/木牌感 */
  height: 32px;
  box-sizing: border-box;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-pill:hover {
  border-color: var(--accent-gold, #c6a664);
  box-shadow: 0 2px 8px rgba(198, 166, 100, 0.2);
  transform: translateY(-1px);
}

.stat-pill .icon {
  font-size: 0.85rem;
  line-height: 1;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

/* 图标颜色调整为低饱和度的复古色系 */
.hp .icon { color: #8c3a3a; }      /* 对应 --flag-bg */
.armor .icon { color: #6b7280; }   /* 灰铁色 */
.sp .icon { color: #c6a664; }      /* 对应 --accent-gold */
.mp .icon { color: #3b5998; }      /* 对应 --flag-theme-bg */
.faith .icon { color: #b8a98d; }   /* 褪色金/羊皮纸白 */

.bar-bg {
  width: 45px;
  height: 6px;
  /* 进度条底槽使用边框色，自然融入明暗模式 */
  background-color: var(--scroll-border, rgba(0, 0, 0, 0.1));
  border-radius: 2px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.bar-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 进度条填充色改为复古沉稳的微渐变 */
.hp .bar-fill { background: linear-gradient(90deg, #6b2c2c, #8c3a3a); }
.armor .bar-fill { background: linear-gradient(90deg, #4b5563, #6b7280); }
.sp .bar-fill { background: linear-gradient(90deg, #a3854b, #c6a664); }
.mp .bar-fill { background: linear-gradient(90deg, #2a406d, #3b5998); }
.faith .bar-fill { background: linear-gradient(90deg, #8f8168, #b8a98d); }

.dark-mode .hp .icon { color: #ef5350; }
.dark-mode .armor .icon { color: #9e9e9e; }
.dark-mode .sp .icon { color: #ffd54f; }
.dark-mode .mp .icon { color: #64b5f6; }
.dark-mode .faith .icon { color: #ffe082; }

.dark-mode .hp .bar-fill { background: linear-gradient(90deg, #c62828, #ef5350); }
.dark-mode .armor .bar-fill { background: linear-gradient(90deg, #616161, #9e9e9e); }
.dark-mode .sp .bar-fill { background: linear-gradient(90deg, #f9a825, #ffd54f); }
.dark-mode .mp .bar-fill { background: linear-gradient(90deg, #1976d2, #64b5f6); }
.dark-mode .faith .bar-fill { background: linear-gradient(90deg, #f9a825, #ffe082); }
</style>
