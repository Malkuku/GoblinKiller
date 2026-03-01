<template>
  <div class="char-panel user-panel">
    <header class="panel-header">
      <h2 class="char-name">{{ username }}</h2>
      <div class="char-identity">{{ data.当前身份 }}</div>
    </header>

    <!-- 内部导航 -->
    <div class="sub-nav">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['sub-nav-item', { active: currentTab === tab }]"
        @click="currentTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div class="panel-content scroll-container">
      <!-- ================= 状态页 ================= -->
      <div v-if="currentTab === '状态'" class="tab-content">
        <section class="info-block">
          <h3>生命状态</h3>
          <!-- 引入独立的生命状态模块 -->
          <LifeStatusModule :data="data.生命状态" />
        </section>

        <section v-if="data.特殊状态" class="info-block">
          <h3>特殊状态</h3>
          <!-- 注意：这里传入 :stats="data" 以支持解析 ${属性} -->
          <SpecialStatusModule :data="data.特殊状态" :stats="data" />
        </section>
      </div>

      <!-- ================= 属性页 ================= -->
      <div v-if="currentTab === '属性'" class="tab-content">
        <section class="info-block">
          <h3>性格倾向</h3>
          <PersonalityModule :data="data.性格" />
        </section>

        <section class="info-block">
          <ArtsModule :arts-data="data.术之等级" />
        </section>
      </div>

      <!-- ================= 技能页 (新增) ================= -->
      <div v-if="currentTab === '技能'" class="tab-content">
        <section class="info-block">
          <h3>战斗技能</h3>
          <!-- 传入 data.技能 以及 完整的 data (用于解析公式) -->
          <SkillModule :data="data.技能" :stats="data" />
        </section>
      </div>

      <!-- ================= 档案页 ================= -->
      <div v-if="currentTab === '档案'" class="tab-content">
        <section class="info-block">
          <h3>外貌</h3>
          <p>{{ data.外貌?.join('。') }}</p>
        </section>
        <section class="info-block">
          <h3>背景</h3>
          <p class="text-content">{{ data.背景?.join('\n') }}</p>
        </section>
        <section class="info-block">
          <h3>人际关系</h3>
          <RelationshipModule :data="data.人际关系" />
        </section>
      </div>

      <!-- ================= 物品页 ================= -->
      <div v-if="currentTab === '物品'" class="tab-content">
        <!-- 金钱显示区域 (不显示缥缈异质) -->
        <section class="info-block" v-if="data.金钱 !== undefined">
          <h3>持有金</h3>
          <div class="currency-row">
            <span class="currency-value">{{ data.金钱 }}</span>
            <span class="currency-unit">g</span>
          </div>
        </section>

        <InventoryModule :data="data.物品" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 引入拆分后的模块
import LifeStatusModule from './LifeStatusModule.vue';
import ArtsModule from './ArtsModule.vue';
import PersonalityModule from '@/尘史使徒/UI/components/role/PersonalityModule.vue';
import SpecialStatusModule from '@/尘史使徒/UI/components/role/SpecialStatusModule.vue';
import RelationshipModule from '@/尘史使徒/UI/components/role/RelationshipModule.vue';
import InventoryModule from '@/尘史使徒/UI/components/role/InventoryModule.vue';
// 新增技能模块引入 (假设文件名叫 SkillModule.vue，请根据实际情况调整路径)
import SkillModule from '@/尘史使徒/UI/components/role/SkillModule.vue';

const props = defineProps(['data']);
const username = substitudeMacros('{{user}}');
// 更新 Tabs 列表，加入 '技能'
const tabs = ['状态', '属性', '技能', '档案', '物品'];
const currentTab = ref('状态');
</script>

<style scoped>
/* --- 基础变量 --- */
.char-panel {
  --c-gold: #d4af37;
  --c-text: #e0e0e0;
  --c-text-dim: #a0a0a0;
  --c-bg-dark: rgba(0, 0, 0, 0.4);
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;

  height: 100%; display: flex; flex-direction: column; padding: 20px; color: var(--c-text);
  font-family: var(--font-body);
}

.panel-header { border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 15px; margin-bottom: 15px; }
.char-name { font-family: var(--font-title); color: var(--c-gold); font-size: 2rem; margin: 0; }
.char-identity { color: var(--c-text-dim); margin-top: 5px; }

/* 导航 */
.sub-nav { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.sub-nav-item { background: none; border: none; color: var(--c-text-dim); padding: 8px 16px; cursor: pointer; font-family: var(--font-title); transition: 0.3s; border-bottom: 2px solid transparent; font-size: 1.1rem; }
.sub-nav-item.active { color: var(--c-gold); border-bottom-color: var(--c-gold); }
.sub-nav-item:hover { color: #fff; }

.scroll-container { flex: 1; overflow-y: auto; padding-right: 10px; }
.scroll-container::-webkit-scrollbar { width: 6px; }
.scroll-container::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 3px; }

.info-block { margin-bottom: 25px; background: var(--c-bg-dark); padding: 20px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
.info-block h3 { color: var(--c-gold); border-left: 3px solid var(--c-gold); padding-left: 10px; margin-top: 0; font-family: var(--font-title); margin-bottom: 15px; }

/* --- 金钱样式 --- */
.currency-row { display: flex; align-items: baseline; gap: 5px; }
.currency-value { font-family: var(--font-title); font-size: 1.8rem; color: var(--c-gold); font-weight: bold; text-shadow: 0 0 10px rgba(212, 175, 55, 0.3); }
.currency-unit { font-family: var(--font-title); font-size: 1.2rem; color: var(--c-text-dim); }

/* --- 其他通用 --- */
.text-content { white-space: pre-wrap; line-height: 1.6; color: #ccc; }
.action-btn { width: 100%; padding: 10px; background: rgba(255,215,0,0.1); border: 1px solid #FFD700; color: #FFD700; cursor: pointer; transition: 0.2s; }
.action-btn:hover { background: #FFD700; color: #000; }
.simple-inventory .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.simple-inventory .item-count { color: #888; }
</style>
