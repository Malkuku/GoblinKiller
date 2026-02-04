<!-- components/role/MinorCharPanel.vue -->
<template>
  <div class="char-panel minor-panel">
    <header class="panel-header">
      <h2 class="char-name">{{ data.姓名 }}</h2>
      <div class="char-intro">{{ data.简介 || '暂无简介' }}</div>
    </header>

    <div class="panel-content scroll-container">
      <section class="info-block">
        <h3>特征</h3>
        <div class="tags-container">
          <span v-for="tag in data.性格标签" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <p class="mt-2" v-if="data.当前想法"><strong>当前想法:</strong> {{ data.当前想法 }}</p>
      </section>

      <section class="info-block">
        <h3>状态</h3>
        <div class="stat-grid">
          <div class="stat-item"><span>生命:</span> {{ data.生命状态?.生命力 }}</div>
          <div class="stat-item"><span>体力:</span> {{ data.生命状态?.体力 }}</div>
        </div>
        <div v-if="data.特殊状态" class="mt-2">
          <strong>特殊状态:</strong>
          <ul class="status-list">
            <li v-for="(val, k) in data.特殊状态" :key="k">{{ k }}</li>
          </ul>
        </div>
      </section>

      <section class="info-block">
        <h3>能力与物品</h3>
        <p><strong>术之等级:</strong> {{ typeof data.术之等级 === 'string' ? data.术之等级 : '未知' }}</p>
        <button class="action-btn" @click="openItemModal">查看物品</button>
      </section>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['data']);
const openItemModal = () => { alert('物品弹窗接口预留'); };
</script>

<style scoped>
.tag { display: inline-block; background: var(--c-hover-bg); border: 1px solid var(--c-border); padding: 2px 8px; margin-right: 5px; margin-bottom: 5px; font-size: 0.9rem; color: var(--c-text-dim); }
.char-intro { font-style: italic; color: var(--c-text-dim); margin-top: 5px; }
</style>
