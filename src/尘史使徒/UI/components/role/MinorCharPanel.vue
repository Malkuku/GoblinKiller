<template>
  <div class="char-panel minor-panel">
    <header class="panel-header">
      <h2 class="char-name">{{ data.姓名 }}</h2>
      <div class="char-intro">{{ data.简介 || '暂无简介' }}</div>
    </header>

    <div class="panel-content scroll-container">
      <section class="info-block">
        <h3>性格标签</h3>
        <div class="tags-container">
          <span v-for="tag in data.性格标签" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </section>

      <section class="info-block">
        <h3>状态</h3>
        <!-- 生命状态：图形化进度条 -->
        <LifeStatusModule :data="data.生命状态" />

        <!-- 特殊状态模块 -->
        <div class="mt-4" v-if="data.特殊状态">
          <h4>特殊状态</h4>
          <SpecialStatusModule :data="data.特殊状态" />
        </div>
      </section>

      <section class="info-block">
        <h3>能力与物品</h3>
        <!-- 术之等级：如果是对象则使用模块，否则显示文本 -->
        <div class="mb-3">
          <ArtsModule v-if="typeof data.术之等级 === 'object'" :arts-data="data.术之等级" />
          <p v-else><strong>术之等级:</strong> {{ data.术之等级 || '未知' }}</p>
        </div>

        <button class="action-btn" @click="openItemModal">查看物品</button>
      </section>
    </div>
  </div>
</template>

<script setup>
import SpecialStatusModule from './SpecialStatusModule.vue';
import ArtsModule from './ArtsModule.vue';
import LifeStatusModule from '@/尘史使徒/UI/components/role/LifeStatusModule.vue';

const props = defineProps(['data']);
const openItemModal = () => { alert('物品弹窗接口预留'); };
</script>

<style scoped>
/* 基础变量 */
.char-panel {
  --c-gold: #d4af37;
  --c-text: #e0e0e0;
  --c-text-dim: #a0a0a0;
  --c-bg-dark: rgba(0, 0, 0, 0.4);
  --c-hover-bg: rgba(255, 255, 255, 0.1);
  --c-border: rgba(255, 255, 255, 0.2);
  --font-title: 'Cinzel', serif;

  height: 100%; display: flex; flex-direction: column; padding: 20px; color: var(--c-text);
}

.panel-header { border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 15px; margin-bottom: 15px; }
.char-name { font-family: var(--font-title); color: var(--c-gold); font-size: 1.8rem; margin: 0; }
.char-intro { font-style: italic; color: var(--c-text-dim); margin-top: 5px; }

.scroll-container { flex: 1; overflow-y: auto; padding-right: 10px; }
.info-block { margin-bottom: 25px; background: var(--c-bg-dark); padding: 20px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
.info-block h3 { color: var(--c-gold); border-left: 3px solid var(--c-gold); padding-left: 10px; margin-top: 0; font-family: var(--font-title); margin-bottom: 15px; }
.info-block h4 { color: var(--c-text-dim); margin-top: 15px; margin-bottom: 10px; font-size: 0.95rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; }

.tag { display: inline-block; background: var(--c-hover-bg); border: 1px solid var(--c-border); padding: 2px 8px; margin-right: 5px; margin-bottom: 5px; font-size: 0.9rem; color: var(--c-text-dim); }

/* --- 生命状态条样式 (复用) --- */
.stat-grid { display: flex; flex-direction: column; gap: 15px; }
.stat-item { display: flex; align-items: center; gap: 15px; }
.stat-item .label { width: 40px; font-family: var(--font-title); color: var(--c-text-dim); font-weight: bold; }

.bar-container {
  flex: 1; height: 16px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; position: relative; overflow: visible;
}
.bar-text {
  position: absolute; width: 100%; text-align: right; right: 5px; top: -18px;
  font-size: 0.75rem; color: var(--c-text-dim); font-family: monospace; letter-spacing: 0.5px;
}
.bar-fill {
  height: 100%; border-radius: 2px; position: relative; transition: width 0.3s ease-out;
}
.bar-fill::after {
  content: ''; position: absolute; top: 0; bottom: 0; right: 0; width: 15px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6) 80%, rgba(255,255,255,0.9) 100%);
  box-shadow: 2px 0 5px currentColor; border-radius: 0 2px 2px 0; animation: water-tip-flicker 2s infinite;
}
@keyframes water-tip-flicker { 0%, 100% { opacity: 0.8; width: 15px; } 50% { opacity: 1; width: 20px; } }

.hp-flow { background-color: #e74c3c; color: #ffadad; }
.sp-flow { background-color: #f1c40f; color: #fff5cc; }

/* 其他 */
.mt-2 { margin-top: 10px; }
.mt-4 { margin-top: 20px; }
.mb-3 { margin-bottom: 15px; }
.action-btn { width: 100%; padding: 10px; background: rgba(255,215,0,0.1); border: 1px solid #FFD700; color: #FFD700; cursor: pointer; transition: 0.2s; }
.action-btn:hover { background: #FFD700; color: #000; }
</style>
