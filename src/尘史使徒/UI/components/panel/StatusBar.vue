<template>
  <div class="world-status-bar">
    <!-- 左侧：世界信息 (时间/地点) -->
    <div class="status-info">
      <div class="status-group">
        <svg class="status-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span class="status-text">{{ location || '未知地点' }}</span>
      </div>
      <div class="status-divider"></div>
      <div class="status-group">
        <svg class="status-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4z"/>
        </svg>
        <span class="status-text time-display" v-html="formattedWorldTime"></span>
      </div>
    </div>

    <!-- 右侧：工具控件 (日志/字体) -->
    <div class="top-bar-controls">
      <!-- 事件日志按钮 -->
      <div class="log-control-group">
        <button class="control-icon log-btn" @click="$emit('toggle-log-panel')" title="事件日志">
          <svg class="control-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 12H9V5h10v9z"/>
          </svg>
          <span v-if="unreadLogCount > 0" class="log-badge">{{ unreadLogCount }}</span>
        </button>
      </div>

      <!-- 字体控制 -->
      <div class="font-control-group">
        <button class="control-icon" @click="$emit('change-font-size', -1)">A-</button>
        <span class="font-size-display">{{ fontSize }}</span>
        <button class="control-icon" @click="$emit('change-font-size', 1)">A+</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  location: string;
  time: string;
  fontSize: number;
  unreadLogCount: number;
}>();

defineEmits<{
  (e: 'toggle-log-panel'): void;
  (e: 'change-font-size', delta: number): void;
}>();

const formattedWorldTime = computed(() => {
  if (!props.time) return '??-??-??T??:??[?]';
  try {
    const date = new Date(props.time);
    if (isNaN(date.getTime())) return props.time;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear().toString().padStart(4, '0');
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    let weekDay = date.getDay();
    if (weekDay === 0) weekDay = 7;
    // 严格复刻原有的 HTML 结构
    const dSep = `<span class="d-sep">-</span>`;
    const dtSep = `<span class="dt-sep">♦</span>`;
    const tSep = `<span class="t-sep">:</span>`;
    const wOpen = `<span class="w-sep">[</span>`;
    const wClose = `<span class="w-sep">]</span>`;
    return `${year}${dSep}${month}${dSep}${day} ${dtSep} ${hours}${tSep}${minutes} ${wOpen}${weekDay}${wClose}`;
  } catch (e) {
    return props.time;
  }
});
</script>

<style scoped>
/* 仅包含与此组件相关的样式 */
.world-status-bar {
  display: flex; justify-content: space-between; align-items: center; gap: 15px;
  padding: 10px 20px; background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(164, 139, 87, 0.2); font-family: 'Cinzel', serif;
  color: var(--c-gold); font-size: 0.9rem; z-index: 15; flex-shrink: 0; position: relative;
}
.status-info { display: flex; align-items: center; gap: 15px; flex-shrink: 1; min-width: 0; }
.status-group { display: flex; align-items: center; gap: 8px; overflow: hidden; }
.status-svg { width: 18px; height: 18px; color: var(--c-gold); opacity: 0.9; filter: drop-shadow(0 0 2px rgba(164, 139, 87, 0.5)); flex-shrink: 0; }
.status-text { letter-spacing: 0.5px; text-shadow: 0 0 5px rgba(0,0,0,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status-divider { width: 1px; height: 14px; background: rgba(164, 139, 87, 0.4); }
.top-bar-controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.font-control-group, .log-control-group { display: flex; align-items: center; background: rgba(0,0,0,0.6); padding: 4px; border-radius: 20px; border: 1px solid var(--c-border); }
.log-control-group { padding: 0; }
.control-icon { background: none; border: none; color: var(--c-text-main); cursor: pointer; font-family: var(--font-title); padding: 0 5px; height: 28px; display: flex; align-items: center; justify-content: center; transition: color 0.3s; }
.control-icon:hover { color: var(--c-gold); }
.font-size-display { font-size: 0.85rem; color: var(--c-gold); min-width: 28px; text-align: center; }
.log-btn { position: relative; width: 36px; height: 36px; padding: 0; border-radius: 50%; color: var(--c-text-dim); }
.log-btn:hover { color: var(--c-gold); }
.control-svg { width: 20px; height: 20px; }
.log-badge { position: absolute; top: 0; right: 0; background: #8b0000; color: #fff; font-size: 0.7rem; font-weight: bold; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.5); border: 1px solid #1a1a1a; }
.time-display :deep(.d-sep), .time-display :deep(.t-sep), .time-display :deep(.w-sep) { color: rgba(164, 139, 87, 0.6); margin: 0 1px; font-weight: normal; }
.time-display :deep(.dt-sep) { color: var(--c-gold); margin: 0 6px; font-size: 0.7em; vertical-align: middle; opacity: 0.8; }
@media (max-width: 768px) {
  .world-status-bar {
    display: grid;
    /* 定义两列：左侧占满剩余空间(1fr)，右侧根据按钮大小自适应(auto) */
    grid-template-columns: 1fr auto;
    /* 定义两行 */
    grid-template-rows: auto auto;
    gap: 12px 15px; /* 行间距 12px，列间距 15px */
    padding: 12px 15px;
  }

  /* 使用 contents 让包裹层"消失"，让内部的子元素直接参与 Grid 布局 */
  .status-info,
  .top-bar-controls {
    display: contents;
  }

  /* 隐藏移动端不需要的竖线分隔符 */
  .status-divider {
    display: none;
  }

  /* --- 第一行 --- */
  /* 地点 */
  .status-group:nth-child(1) {
    grid-column: 1;
    grid-row: 1;
    align-self: center;
  }
  /* 字体大小 */
  .font-control-group {
    grid-column: 2;
    grid-row: 1;
    justify-self: end; /* 靠右对齐 */
    align-self: center;
  }

  /* --- 第二行 --- */
  /* 时间 */
  .status-group:nth-child(3) {
    grid-column: 1;
    grid-row: 2;
    align-self: center;
  }
  /* 任务日志 */
  .log-control-group {
    grid-column: 2;
    grid-row: 2;
    justify-self: end; /* 靠右对齐 */
    align-self: center;
  }
}
</style>
