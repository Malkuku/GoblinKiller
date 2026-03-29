<template>
  <div class="status-bar">
    <!-- 左侧：世界与角色信息 -->
    <div class="status-info">
      <!-- 所在地 -->
      <div class="status-group" title="所在地">
        <svg class="status-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span class="status-text">{{ location }}</span>
      </div>
      <div class="status-divider"></div>

      <!-- 当前时间 -->
      <div class="status-group" title="当前时间">
        <svg class="status-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4z"/>
        </svg>
        <span class="status-text">{{ currentTime }}</span>
      </div>
      <div class="status-divider"></div>

      <!-- 金钱数量 -->
      <div class="status-group money-group" title="金钱">
        <div class="money-item">
          <svg class="money-svg" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
            <text x="12" y="16" font-size="12" text-anchor="middle" fill="#B8860B" font-weight="bold" font-family="sans-serif">G</text>
          </svg>
          <span>{{ money }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧：控制按钮 -->
    <div class="status-controls">
      <button class="control-btn icon-btn" @click="$emit('toggle-variable-panel')" title="变量监控">
        <svg class="control-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
      </button>
      <button class="control-btn icon-btn" @click="$emit('toggle-edit-panel')" title="编辑正文">
        <svg class="control-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
      </button>
      <button class="control-btn icon-btn" @click="$emit('toggle-log-panel')" title="事件日志">
        <svg class="control-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 12H9V5h10v9z"/></svg>
      </button>

      <div class="status-divider"></div>

      <button class="control-btn text-btn" @click="$emit('toggle-font-size')" title="切换字体大小">A±</button>
      <button class="control-btn text-btn theme-btn" @click="$emit('toggle-theme')">
        {{ isDarkMode ? '☀ 晨光' : '☾ 夜幕' }}
      </button>
      <button class="control-btn text-btn close-btn" @click="$emit('close')">✕</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStatStore } from '@/哥杀/UI/store/StatStore';

const props = defineProps({
  isDarkMode: Boolean
});

defineEmits([
  'toggle-font-size',
  'toggle-theme',
  'close',
  'toggle-variable-panel',
  'toggle-edit-panel',
  'toggle-log-panel'
]);

const statStore = useStatStore();

// 适配 StatData.d.ts
const location = computed(() => statStore.stat_data?.['主角']?.['所在地'] || '漂泊中');
const currentTime = computed(() => statStore.stat_data?.['世界']?.['当前时间'] || '未知时间');
const money = computed(() => {
  const m = statStore.stat_data?.['主角']?.['背包']?.['金钱'];
  if (!m) return '0金 0银 0铜';
  return `${m['金币'] || 0}金 ${m['银币'] || 0}银 ${m['铜币'] || 0}铜`;
});
</script>

<style scoped>
.status-bar {
  width: 100%; min-height: 44px; background: var(--status-bar-bg);
  border-bottom: 1px solid var(--scroll-border);
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  backdrop-filter: blur(4px); z-index: 15; flex-wrap: wrap; gap: 10px;
}

.status-info {
  display: flex; align-items: center; gap: 15px; flex-shrink: 1; min-width: 0;
}

.status-group {
  display: flex; align-items: center; gap: 6px; overflow: hidden;
}

.status-svg {
  width: 18px; height: 18px; color: var(--accent-gold); opacity: 0.9; flex-shrink: 0;
}

.status-text {
  font-weight: bold; letter-spacing: 1px; font-size: 0.9rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.status-divider {
  width: 1px; height: 16px; background: var(--scroll-border); opacity: 0.6;
}

.money-group { gap: 12px; margin-left: 5px; }
.money-item { display: flex; align-items: center; gap: 4px; font-size: 0.9rem; font-weight: bold; }
.money-svg { width: 16px; height: 16px; flex-shrink: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); }

.status-controls {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
}

.control-btn {
  background: none; border: 1px solid var(--scroll-border);
  color: var(--text-main); cursor: pointer; border-radius: 4px;
  font-family: inherit; transition: all 0.3s; display: flex; align-items: center; justify-content: center;
}
.control-btn:hover {
  border-color: var(--accent-gold); color: var(--accent-gold);
}
.icon-btn { width: 30px; height: 30px; padding: 4px; }
.text-btn { padding: 4px 12px; font-size: 0.85rem; height: 30px; }
.control-svg { width: 18px; height: 18px; }

@media (max-width: 768px) {
  .status-bar {
    padding: 10px 15px;
    flex-direction: column;
    align-items: flex-start;
  }
  .status-controls {
    width: 100%;
    justify-content: space-between;
    overflow-x: auto;
    padding-bottom: 5px;
  }
}
</style>
