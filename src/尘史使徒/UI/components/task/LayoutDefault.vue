<template>
  <div class="layout-default">
    <ul v-if="data.详细" class="detail-list">
      <li v-for="(item, idx) in data.详细" :key="idx">{{ item }}</li>
    </ul>
  </div>
</template>

<script setup>
defineProps({ data: Object });
</script>

<style scoped>
.detail-list { list-style: none; padding: 0; color: #888; font-size: 0.9rem; }
.detail-list li::before { content: '>'; margin-right: 8px; color: #d4af37; }
</style>
