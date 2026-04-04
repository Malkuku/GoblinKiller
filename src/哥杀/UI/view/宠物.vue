<template>
  <div class="fantasy-module pet-module">
    <div class="module-header">
      <span class="ornament">✧</span>
      <h2 class="title">灵兽伴侣</h2>
      <span class="ornament">✧</span>
    </div>

    <div v-if="!pets || Object.keys(pets).length === 0" class="empty-state">
      暂无灵兽相伴...
    </div>

    <div class="card-grid" v-else>
      <div class="fantasy-card" v-for="(pet, name) in pets" :key="name">
        <div class="card-header">
          <h3 class="entity-name">{{ name }}</h3>
          <span class="entity-badge">{{ pet.品类 || '未知品类' }}</span>
        </div>

        <div class="card-body">
          <div class="desc-row">
            <span class="label">内在：</span>
            <span class="value">{{ pet.内在 || '无' }}</span>
          </div>
          <div class="desc-row">
            <span class="label">外在：</span>
            <span class="value">{{ pet.外在 || '无' }}</span>
          </div>
          <div class="desc-row">
            <span class="label">评价：</span>
            <span class="value italic">{{ pet.评价 || '暂无评价' }}</span>
          </div>

          <!-- 词条 -->
          <div class="tags-section" v-if="pet.词条 && Object.keys(pet.词条).length > 0">
            <div class="section-title">特性词条</div>
            <div class="tags-container">
              <span class="fantasy-tag" v-for="(val, key) in pet.词条" :key="key">
                {{ key }}
              </span>
            </div>
          </div>

          <!-- 装备 -->
          <div class="equip-section" v-if="pet.装备 && Object.keys(pet.装备).length > 0">
            <div class="section-title">佩戴装备</div>
            <ul class="equip-list">
              <li v-for="(equip, eName) in pet.装备" :key="eName">
                <span class="equip-icon">⚚</span> {{ eName }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatStore } from '@/哥杀/UI/store/StatStore';
const statStore = useStatStore();
const pets = computed(() => statStore.stat_data?.宠物);
</script>

<style scoped>
/* 基础模块样式复用 layout.vue 的 CSS 变量 */
.fantasy-module {
  color: var(--text-main);
  margin-bottom: 40px;
}

.module-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--scroll-border);
  padding-bottom: 10px;
}

.module-header .title {
  font-size: 1.5rem;
  color: var(--accent-gold);
  margin: 0;
  letter-spacing: 2px;
}

.module-header .ornament {
  color: var(--accent-gold);
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  padding: 20px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.fantasy-card {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--scroll-border);
  border-radius: 8px;
  padding: 15px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.02), 0 4px 6px rgba(0,0,0,0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.dark-mode .fantasy-card {
  background: rgba(255, 255, 255, 0.03);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.2);
}

.fantasy-card:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.02), 0 6px 12px rgba(0,0,0,0.1);
  border-color: var(--accent-gold);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed var(--scroll-border);
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.entity-name {
  margin: 0;
  font-size: 1.2rem;
  color: var(--accent-gold-hover);
}

.entity-badge {
  font-size: 0.8rem;
  background-color: var(--flag-bg);
  color: var(--flag-text);
  padding: 2px 8px;
  border-radius: 12px;
}

.desc-row {
  margin-bottom: 8px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.desc-row .label {
  color: var(--text-muted);
  font-weight: bold;
}

.desc-row .italic {
  font-style: italic;
}

.section-title {
  font-size: 0.9rem;
  color: var(--accent-gold);
  margin: 15px 0 8px 0;
  border-bottom: 1px solid rgba(198, 166, 100, 0.3);
  display: inline-block;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fantasy-tag {
  font-size: 0.8rem;
  border: 1px solid var(--accent-gold);
  color: var(--text-main);
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(198, 166, 100, 0.1);
}

.equip-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.9rem;
}

.equip-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.equip-icon {
  color: var(--text-muted);
}
</style>
