<template>
  <div class="player-assets-view">
    <h2 class="page-title">资产与能力</h2>

    <!-- 标签页导航 -->
    <div class="tabs-container">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'inventory' }"
        @click="activeTab = 'inventory'"
      >
        装备与背包
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'skills' }"
        @click="activeTab = 'skills'"
      >
        技能列表
      </button>
    </div>

    <div class="module-divider"></div>

    <!-- 内容展示区 -->
    <div class="content-area">
      <!-- 使用 v-if 实现按需渲染和切换 -->
      <InventoryEquipment v-if="activeTab === 'inventory'" class="fade-in-content" />

      <SkillList v-if="activeTab === 'skills'" class="fade-in-content" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import InventoryEquipment from '@/哥杀/UI/components/item/InventoryEquipment.vue';
import SkillList from '@/哥杀/UI/components/item/SkillList.vue';

// 定义当前激活的标签页，默认显示 'inventory' (背包)
const activeTab = ref('inventory');
</script>

<style scoped>
.player-assets-view {
  display: flex;
  flex-direction: column;
  gap: 15px;
  /* 移除了外层的动画，将其移至内部内容区，让每次切换都有动画效果 */
}

.page-title {
  text-align: center;
  color: var(--text-main);
  font-size: 1.8rem;
  margin-bottom: 5px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

/* 标签页样式 */
.tabs-container {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.tab-btn {
  padding: 8px 24px;
  font-size: 1.1rem;
  background: transparent;
  border: 1px solid var(--accent-gold, #d4af37); /* 如果没有定义变量，给个默认金色 */
  color: var(--text-main, #333);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(212, 175, 55, 0.1); /* 悬浮时的浅色背景 */
}

.tab-btn.active {
  background: var(--accent-gold, #d4af37);
  color: #fff; /* 激活时的文字颜色 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.module-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-gold, #d4af37), transparent);
  opacity: 0.3;
  margin: 5px 0;
}

.content-area {
  min-height: 300px; /* 建议给个最小高度，防止切换时页面高度跳动 */
}

/* 切换时的淡入动画 */
.fade-in-content {
  animation: fadeIn 0.4s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
