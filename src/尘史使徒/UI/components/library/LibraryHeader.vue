<template>
  <header class="library-header">
    <div class="header-content">
      <h2 class="title">
        <span class="icon">🏛️</span> 漫宿书库
      </h2>

      <div v-if="currentMode !== '对话'" class="asset-display">
        <span class="asset-label">持有异质:</span>
        <span class="asset-value">{{ userHeterogeneity }}</span>
      </div>

      <div class="nav-tabs">
        <div
          v-for="mode in modes"
          :key="mode"
          :class="['nav-item', { active: currentMode === mode }]"
          @click="$emit('switchMode', mode)"
        >
          {{ mode }}
          <span v-if="redDots[mode]" class="notification-dot"></span>
        </div>
        <div class="nav-indicator" :style="indicatorStyle"></div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentMode: String,
  modes: Array,
  redDots: Object,
  userHeterogeneity: Number
});

defineEmits(['switchMode']);

const indicatorStyle = computed(() => {
  const index = props.modes.indexOf(props.currentMode);
  return {
    transform: `translateX(${index * 100}%)`,
    width: `${100 / props.modes.length}%`
  };
});
</script>

<style scoped>
.library-header {
  background: linear-gradient(180deg, #111 0%, #1a1a1a 100%);
  border-bottom: 1px solid var(--c-gold);
  padding: 15px 20px 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  z-index: 10;
}
.header-content { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 15px; }
.title { color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 1.5rem; margin: 0; display: flex; align-items: center; gap: 10px; text-shadow: 0 0 10px var(--c-gold-dim); }
.asset-display { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.4); padding: 5px 12px; border-radius: 20px; border: 1px solid var(--c-gold-dim); font-size: 0.9rem; }
.asset-value { color: var(--c-gold-light); font-weight: bold; margin-left: 5px; }
.nav-tabs { display: flex; position: relative; border-bottom: 2px solid rgba(255,255,255,0.05); }
.nav-item { flex: 1; text-align: center; padding: 12px 0; cursor: pointer; color: #888; transition: color 0.3s; position: relative; font-weight: bold; font-size: 0.95rem; }
.nav-item:hover { color: var(--c-text); background: rgba(255,255,255,0.02); }
.nav-item.active { color: var(--c-gold); }
.nav-indicator { position: absolute; bottom: -2px; left: 0; height: 2px; background: var(--c-gold); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 -2px 10px var(--c-gold); }
.notification-dot { position: absolute; top: 8px; right: 20%; width: 6px; height: 6px; background: var(--c-danger); border-radius: 50%; box-shadow: 0 0 5px var(--c-danger); }
</style>
