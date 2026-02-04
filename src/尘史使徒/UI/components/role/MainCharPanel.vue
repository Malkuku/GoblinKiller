<!-- components/role/MainCharPanel.vue -->
<template>
  <div class="char-panel main-char-panel">
    <header class="panel-header">
      <h2 class="char-name">{{ data.姓名 }}</h2>
      <!-- 普通模式只显示基础身份，全视模式显示更多 -->
      <div class="char-identity">
        {{ data.当前身份 }} | {{ data.年龄 }}
        <span v-if="isOmniscient" class="omni-tag">【全视开启】</span>
      </div>
    </header>

    <div class="sub-nav">
      <button
        v-for="tab in visibleTabs"
        :key="tab"
        :class="['sub-nav-item', { active: currentTab === tab }]"
        @click="currentTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div class="panel-content scroll-container">

      <!-- 概览 (所有模式可见，但内容不同) -->
      <div v-if="currentTab === '概览'" class="tab-content">
        <section class="info-block">
          <h3>基础信息</h3>
          <p><strong>外貌:</strong> {{ data.外貌?.join('，') }}</p>
          <p><strong>背景:</strong> {{ data.背景?.join('。') }}</p>

          <!-- 全视模式特有 -->
          <template v-if="isOmniscient">
            <p><strong>检索词:</strong> {{ data.名称检索词?.join(', ') }}</p>
            <p><strong>区域:</strong> {{ data.区域检索词?.join(', ') }}</p>
            <p><strong>当前位置:</strong> {{ formatLoc(data.当前位置) }}</p>
            <p><strong>当前行动:</strong> {{ data.当前行动 }}</p>
            <p><strong>当前想法:</strong> {{ data.当前想法 }}</p>
          </template>
        </section>

        <section class="info-block">
          <h3>性格</h3>
          <!-- 普通模式：只显示总结 -->
          <p v-if="!isOmniscient">{{ data.性格?.性格总结?.join('；') }}</p>
          <!-- 全视模式：显示详细数值 -->
          <div v-else class="personality-detail">
            <div v-for="(val, key) in data.性格" :key="key">
              <span v-if="typeof val === 'number'">{{ key }}: {{ val }}</span>
            </div>
            <p class="summary">总结: {{ data.性格?.性格总结?.join('；') }}</p>
            <p><strong>爱好:</strong> {{ formatHobbies(data.爱好) }}</p>
          </div>
        </section>

        <section class="info-block">
          <h3>状态</h3>
          <div class="stat-grid">
            <div class="stat-item"><span>生命:</span> {{ data.生命状态?.生命力 }}</div>
            <div class="stat-item"><span>体力:</span> {{ data.生命状态?.体力 }}</div>
            <div class="stat-item"><span>精神:</span> {{ data.生命状态?.精神力 }}</div>
          </div>
          <div v-if="data.特殊状态" class="mt-2">
            <strong>特殊状态:</strong>
            <ul class="status-list">
              <li v-for="(val, k) in data.特殊状态" :key="k">{{ k }}</li>
            </ul>
          </div>
        </section>
      </div>

      <!-- 详细 (仅全视模式) -->
      <div v-if="currentTab === '详细' && isOmniscient" class="tab-content">
        <section class="info-block">
          <h3>语料库</h3>
          <div v-for="(lines, mood) in data.语料" :key="mood">
            <strong>{{ mood }}:</strong> {{ lines.join(' | ') }}
          </div>
        </section>
        <section class="info-block">
          <h3>性经验</h3>
          <div v-if="typeof data.性经验 === 'object'">
            <div v-for="(exp, k) in data.性经验" :key="k">{{ k }}: {{ exp }}</div>
          </div>
          <div v-else>{{ data.性经验 }}</div>
        </section>
      </div>

      <!-- 人际 (逻辑复杂) -->
      <div v-if="currentTab === '人际'" class="tab-content">
        <div class="relation-list">
          <template v-for="(rel, targetName) in data.人际关系" :key="targetName">
            <!--
              显示条件：
              1. 全视模式：全部显示
              2. 普通模式：只显示“在场”的目标角色的关系总结
            -->
            <div v-if="shouldShowRelation(targetName)" class="rel-card">
              <div class="rel-header">
                <strong>{{ targetName }}</strong>
              </div>

              <!-- 普通模式：只显示总结 -->
              <p v-if="!isOmniscient">{{ rel.关系总结 }}</p>

              <!-- 全视模式：显示详细数值 -->
              <div v-else class="rel-details">
                <div class="rel-stat"><span>好感:</span> {{ rel.好感度 }}</div>
                <div class="rel-stat"><span>信任:</span> {{ rel.信任度 }}</div>
                <div class="rel-stat"><span>情欲:</span> {{ rel.情欲 }}</div>
                <p class="rel-summary">{{ rel.关系总结 }}</p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 物品与术 -->
      <div v-if="currentTab === '能力与物品'" class="tab-content">
        <section class="info-block">
          <h3>术之等级</h3>
          <div v-if="typeof data.术之等级 === 'object'">
            <div v-for="(art, name) in data.术之等级" :key="name">
              {{ name }}: Lv.{{ art.当前等级 }}
            </div>
          </div>
          <div v-else>{{ data.术之等级 }}</div>
        </section>

        <section class="info-block">
          <h3>物品</h3>
          <button class="action-btn" @click="openItemModal">查看物品 (弹窗)</button>
          <!-- 全视模式可以直接看列表 -->
          <div v-if="isOmniscient" class="simple-inventory mt-2">
            <div v-for="(item, key) in data.物品" :key="key">{{ key }}</div>
          </div>
        </section>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';

const props = defineProps(['data']);
const store = useStatStore();

// 判断全视模式：系统设置开启
const isOmniscient = computed(() => store.stat_data?.system?.['全知视角'] === true);

const tabs = ['概览', '人际', '能力与物品'];
const visibleTabs = computed(() => {
  if (isOmniscient.value) {
    return ['概览', '详细', '人际', '能力与物品'];
  }
  return tabs;
});
const currentTab = ref('概览');

const formatLoc = (loc) => loc ? `[${loc.x}, ${loc.y}, ${loc.z}]` : '未知';
const formatHobbies = (hobbies) => {
  if (!hobbies) return '无';
  if (Array.isArray(hobbies)) return hobbies.join(', ');
  return Object.keys(hobbies).join(', ');
};

// 核心逻辑：普通模式下，人际关系是否可见
const shouldShowRelation = (targetName) => {
  if (isOmniscient.value) return true;

  // 检查目标是否在场
  const mainChars = store.stat_data?.角色?.['主要角色'] || {};
  const minorChars = store.stat_data?.角色?.['次要角色'] || {};
  const user = store.stat_data?.角色?.user;

  if (targetName === user?.姓名) return true; // 与玩家的关系总是可见
  if (mainChars[targetName]?.['在场']) return true;
  if (minorChars[targetName]?.['在场']) return true;

  return false;
};

const openItemModal = () => { alert('物品弹窗接口预留'); };
</script>

<style scoped>
/* 复用 UserPanel 的样式，增加特定样式 */
.omni-tag { color: #ff4444; font-size: 0.8em; margin-left: 10px; border: 1px solid #ff4444; padding: 2px 5px; }
.rel-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; font-size: 0.9em; color: var(--c-text-dim); margin-top: 5px; }
.rel-summary { grid-column: 1 / -1; color: var(--c-text-main); margin-top: 5px; font-style: italic; }
.mt-2 { margin-top: 10px; }
</style>
