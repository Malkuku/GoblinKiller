<template>
  <div class="player-assets-view">
    <h2 class="page-title">资产与能力</h2>

    <!-- 子模块1：装备与背包 -->
    <InventoryEquipment />

    <div class="module-divider"></div>

    <!-- 子模块2：技能列表 -->
    <SkillList />
  </div>
</template>

<script setup>
import InventoryEquipment from '@/哥杀/UI/components/item/InventoryEquipment.vue';
import SkillList from '@/哥杀/UI/components/item/SkillList.vue';
</script>

<style scoped>
.player-assets-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.5s ease;
}
.page-title {
  text-align: center;
  color: var(--text-main);
  font-size: 1.8rem;
  margin-bottom: 10px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}
.module-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-gold), transparent);
  opacity: 0.3;
  margin: 10px 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
