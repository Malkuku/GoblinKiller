<template>
  <div class="layout-alertness">
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
    </div>
  </div>
</template>

<script setup>
defineProps({ data: Object });
</script>

<style scoped>
.alert-container { background: rgba(0,0,0,0.3); padding: 15px; border: 1px solid rgba(211, 47, 47, 0.3); margin-bottom: 15px; }
.alert-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.8rem; color: #ef9a9a; }
.progress-track { height: 8px; background: rgba(0,0,0,0.5); position: relative; overflow: hidden; }
.progress-fill { height: 100%; background: #81c784; transition: width 0.5s; position: relative; }
.progress-fill.high-alert { background: #d32f2f; box-shadow: 0 0 10px #d32f2f; }
.scan-line {
  position: absolute; top: 0; bottom: 0; width: 20px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
  animation: scan 2s infinite linear;
}
@keyframes scan { from { left: -20px; } to { left: 100%; } }
</style>
