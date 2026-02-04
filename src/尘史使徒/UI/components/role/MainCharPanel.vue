<template>
  <div class="char-panel main-char-panel">
    <header class="panel-header">
      <div class="header-content">
        <div>
          <h2 class="char-name">{{ data.姓名 || '未知角色' }}</h2>
          <div class="char-identity">{{ data.当前身份 }} | {{ data.年龄 }}</div>
        </div>
        <!-- 详情模式开关按钮 -->
        <button
          class="detail-toggle-btn"
          :class="{ active: showDetails }"
          title="切换详情模式"
          @click="toggleDetails"
        >
          <span class="icon">👁️</span>
          <span class="text">{{ showDetails ? '详情开启' : '详情关闭' }}</span>
        </button>
      </div>
    </header>

    <!-- 内部导航 (与User模块一致) -->
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
          <LifeStatusModule :data="data.生命状态" />
        </section>

        <!-- 详情模式下显示的实时监控信息 -->
        <section v-if="showDetails" class="info-block detail-block">
          <h3>实时监控</h3>
          <p><strong>当前位置:</strong> {{ formatLoc(data.当前位置) }}</p>
          <p><strong>当前行动:</strong> {{ data.当前行动 || '无' }}</p>
          <p><strong>当前想法:</strong> <span class="thought-text">{{ data.当前想法 || '...' }}</span></p>
          <p><strong>检索区域:</strong> {{ data.区域检索词?.join(', ') }}</p>
        </section>

        <section class="info-block" v-if="data.特殊状态">
          <h3>特殊状态</h3>
          <SpecialStatusModule :data="data.特殊状态" />
        </section>
      </div>

      <!-- ================= 属性页 ================= -->
      <div v-if="currentTab === '属性'" class="tab-content">
        <section class="info-block">
          <h3>性格倾向</h3>
          <PersonalityModule :data="data.性格" />
          <p v-if="showDetails" class="mt-2"><strong>爱好:</strong> {{ formatHobbies(data.爱好) }}</p>
        </section>

        <section class="info-block">
          <ArtsModule :arts-data="data.术之等级" />
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

        <!-- 详情模式下显示的私密档案 -->
        <template v-if="showDetails">
          <section class="info-block detail-block">
            <h3>语料库</h3>
            <div v-for="(lines, mood) in data.语料" :key="mood" class="corpus-row">
              <span class="mood-tag">{{ mood }}</span>
              <span class="corpus-text">{{ lines.join(' | ') }}</span>
            </div>
          </section>

          <section class="info-block detail-block">
            <h3>性经验</h3>
            <div v-if="typeof data.性经验 === 'object'">
              <div v-for="(exp, k) in data.性经验" :key="k">{{ k }}: {{ exp }}</div>
            </div>
            <div v-else>{{ data.性经验 }}</div>
          </section>
        </template>

        <section class="info-block">
          <h3>人际关系</h3>
          <RelationshipModule :data="data.人际关系" />
        </section>
      </div>

      <!-- ================= 物品页 ================= -->
      <div v-if="currentTab === '物品'" class="tab-content">
        <InventoryModule :data="data.物品" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ArtsModule from './ArtsModule.vue';
import PersonalityModule from '@/尘史使徒/UI/components/role/PersonalityModule.vue';
import SpecialStatusModule from '@/尘史使徒/UI/components/role/SpecialStatusModule.vue';
import LifeStatusModule from '@/尘史使徒/UI/components/role/LifeStatusModule.vue';
import RelationshipModule from '@/尘史使徒/UI/components/role/RelationshipModule.vue';
import InventoryModule from '@/尘史使徒/UI/view/InventoryModule.vue';

const props = defineProps(['data']);
const tabs = ['状态', '属性', '档案', '物品'];
const currentTab = ref('状态');

// 详情模式（原全视视角）控制
const showDetails = ref(false);
const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};

// 辅助函数
const formatLoc = (loc) => loc ? `[${loc.x}, ${loc.y}, ${loc.z}]` : '未知';
const formatHobbies = (hobbies) => {
  if (!hobbies) return '无';
  if (Array.isArray(hobbies)) return hobbies.join(', ');
  return Object.keys(hobbies).join(', ');
};
</script>

<style scoped>
/* --- 基础变量 (与UserPanel保持一致) --- */
.char-panel {
  --c-gold: #d4af37;
  --c-text: #e0e0e0;
  --c-text-dim: #a0a0a0;
  --c-bg-dark: rgba(0, 0, 0, 0.4);
  --c-detail-bg: rgba(50, 20, 20, 0.3); /* 详情块的背景色 */
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;

  height: 100%; display: flex; flex-direction: column; padding: 20px; color: var(--c-text);
  font-family: var(--font-body);
}

/* 头部布局调整 */
.panel-header { border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 15px; margin-bottom: 15px; }
.header-content { display: flex; justify-content: space-between; align-items: flex-start; }
.char-name { font-family: var(--font-title); color: var(--c-gold); font-size: 2rem; margin: 0; }
.char-identity { color: var(--c-text-dim); margin-top: 5px; }

/* 详情开关按钮 */
.detail-toggle-btn {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--c-text-dim);
  color: var(--c-text-dim);
  padding: 5px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
  font-family: var(--font-title);
  font-size: 0.8rem;
}
.detail-toggle-btn:hover { border-color: var(--c-gold); color: var(--c-gold); }
.detail-toggle-btn.active {
  background: rgba(212, 175, 55, 0.1);
  border-color: var(--c-gold);
  color: var(--c-gold);
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.2);
}

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

/* 详情模式专用块样式 */
.detail-block {
  border: 1px dashed rgba(212, 175, 55, 0.3);
  background: linear-gradient(to right, rgba(0,0,0,0.4), rgba(30,30,30,0.4));
}
.thought-text { font-style: italic; color: #aaa; }
.corpus-row { margin-bottom: 8px; font-size: 0.9em; }
.mood-tag { color: var(--c-gold); font-weight: bold; margin-right: 8px; }

/* --- 通用 --- */
.text-content { white-space: pre-wrap; line-height: 1.6; color: #ccc; }
.mt-2 { margin-top: 10px; }
.action-btn { width: 100%; padding: 10px; background: rgba(255,215,0,0.1); border: 1px solid #FFD700; color: #FFD700; cursor: pointer; transition: 0.2s; }
.action-btn:hover { background: #FFD700; color: #000; }
.simple-inventory .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.simple-inventory .item-count { color: #888; }
</style>
