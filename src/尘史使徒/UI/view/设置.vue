<template>
  <div class="settings-layout">
    <header class="settings-header">
      <h1 class="title">祈奉</h1>
      <div class="subtitle">SYSTEM SETTINGS</div>
    </header>

    <div class="settings-content">
      <!-- 版本信息 -->
      <div class="info-row">
        <span class="label">当前版本</span>
        <span class="value">Ver. {{ systemSettings?.当前版本 || '1.0.0' }}</span>
      </div>

      <!-- 当前剧本展示 (复用剧本样式) -->
      <div class="scenario-display-section" v-if="currentScenario">
        <div class="section-title">当前剧本</div>

        <!-- 复用 Card 样式，但移除点击交互 -->
        <div class="scenario-card active" :class="currentScenario.theme">
          <!-- 背景特效层 -->
          <div class="art-bg-effect"></div>

          <div class="card-content">
            <!-- SVG 图标 -->
            <div class="scenario-icon-wrapper">
              <svg viewBox="0 0 64 64" class="scenario-svg" v-html="currentScenario.iconPath"></svg>
            </div>

            <!-- 标题 -->
            <h2 class="scenario-title art-name">{{ currentScenario.name }}</h2>
          </div>
        </div>
      </div>

      <div class="scenario-display-section" v-else>
        <div class="section-title">当前剧本</div>
        <div class="no-scenario">
          <span>暂无进行中的剧本</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { ScenariosMetadata } from '@/尘史使徒/UI/types/剧本数据';

const statStore = useStatStore();
const { stat_data } = storeToRefs(statStore);

// 获取系统设置数据
const systemSettings = computed(() => stat_data.value?.system);


// 计算当前匹配的剧本信息
const currentScenario = computed(() => {
  const currentName = systemSettings.value?.当前剧本;
  if (!currentName) return null;
  return ScenariosMetadata.find(s => s.name === currentName);
});

</script>

<style scoped>
/* 引入基础变量，保持风格一致 */
.settings-layout {
  --c-gold: #a48b57;
  --c-gold-dim: rgba(164, 139, 87, 0.3);
  --c-text-main: #e0e0e0;
  --c-text-dim: #8a92a0;
  --c-bg-card: rgba(0, 0, 0, 0.6);
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;

  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 40px;
  color: var(--c-text-main);
  font-family: var(--font-body);
  overflow-y: auto;
}

.settings-header {
  text-align: center;
  margin-bottom: 40px;
  border-bottom: 1px solid var(--c-gold-dim);
  padding-bottom: 20px;
}

.title {
  font-family: var(--font-title);
  font-size: 2.5rem;
  color: var(--c-gold);
  margin: 0;
  text-shadow: 0 0 10px rgba(164, 139, 87, 0.3);
}

.subtitle {
  font-family: var(--font-title);
  font-size: 0.9rem;
  color: var(--c-text-dim);
  letter-spacing: 4px;
  margin-top: 10px;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 版本信息行样式 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-gold-dim);
  border-radius: 4px;
}

.label {
  font-family: var(--font-title);
  color: var(--c-gold);
  font-size: 1.1rem;
}

.value {
  font-family: var(--font-body);
  color: var(--c-text-main);
  font-size: 1.2rem;
}

.section-title {
  font-family: var(--font-title);
  color: var(--c-text-dim);
  margin-bottom: 15px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.no-scenario {
  padding: 40px;
  text-align: center;
  border: 1px dashed var(--c-text-dim);
  color: var(--c-text-dim);
}

/* =========================================
   剧本卡片样式 (复用自第三个文件)
   ========================================= */
.scenario-card {
  position: relative;
  background: rgba(0, 0, 0, 0.8); /* 默认使用 active 背景 */
  border: 1px solid var(--theme-color, var(--c-gold));
  box-shadow: 0 0 20px var(--theme-glow, var(--c-gold-dim));
  min-height: 250px; /* 稍微调小高度，因为没有描述文本 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.4s ease;
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;
}

.scenario-icon-wrapper {
  width: 100px; /* 图标稍微放大一点作为展示 */
  height: 100px;
  margin-bottom: 20px;
  color: var(--theme-color, var(--c-gold));
  filter: drop-shadow(0 0 5px var(--theme-glow, rgba(0,0,0,0)));
}

.scenario-title {
  font-family: var(--font-title);
  font-size: 2rem;
  margin: 0;
  transition: color 0.3s;
}

/* =========================================
   特效样式 (完全复用)
   ========================================= */
.art-bg-effect { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; }

/* 灯 (Lamp) */
.theme-lamp { --theme-color: #FFD700; --theme-glow: rgba(255, 215, 0, 0.3); }
.theme-lamp .art-name { color: var(--theme-color); text-shadow: 0 0 10px var(--theme-color); }
.theme-lamp .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 70%); opacity: 0.15; }

/* 冬 (Winter) */
.theme-winter { --theme-color: #A3D5D5; --theme-glow: rgba(163, 213, 213, 0.3); }
.theme-winter .art-name { color: var(--theme-color); }
.theme-winter .art-bg-effect { background: radial-gradient(circle, #fff 5%, transparent 6%), radial-gradient(circle, #fff 3%, transparent 4%); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: snow 10s linear infinite; opacity: 0.3; }
@keyframes snow { 0% {background-position: 0 0, 25px 25px;} 100% {background-position: 0 300px, 25px 325px;} }

/* 杯 (Cup) */
.theme-cup { --theme-color: #8B0000; --theme-glow: rgba(139, 0, 0, 0.4); }
.theme-cup .art-name { color: var(--theme-color); text-shadow: 0 0 5px rgba(0,0,0,0.5); }
.theme-cup .art-bg-effect { background-image: linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%); background-repeat: no-repeat; background-size: 2px 150%, 3px 200%, 1px 220%; background-position: 10% 0, 50% 0, 90% 0; animation: art-cup-drip-y 6s linear infinite; opacity: 0.4; }
@keyframes art-cup-drip-y { from { background-position-y: -250%; } to { background-position-y: 100%; } }

/* 蛾 (Moth) */
.theme-moth { --theme-color: #a8a8a8; --theme-glow: rgba(168, 168, 168, 0.3); }
.theme-moth .art-name { color: var(--theme-color); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); animation: art-moth-glitch-strong 2s infinite steps(1); }
.theme-moth .art-bg-effect { background: repeating-linear-gradient(45deg, #0001, #0001 1px, transparent 1px, transparent 5px); opacity: 0.2; }
@keyframes art-moth-glitch-strong { 0% { transform: translate(0, 0) skew(0); } 5% { transform: translate(-2px, 1px) skew(-2deg); } 10% { transform: translate(2px, -1px) skew(2deg); } 15% { transform: translate(0, 0) skew(0); } 100% { transform: translate(0, 0) skew(0); } }

/* 被遗忘者 (Forgotten) */
.theme-forgotten { --theme-color: #C5A059; --theme-glow: rgba(197, 160, 89, 0.2); }
.theme-forgotten .art-name { color: var(--theme-color); text-shadow: 0 0 5px rgba(0,0,0,0.8); opacity: 0.8; }
.theme-forgotten .art-bg-effect {
  background: linear-gradient(135deg, transparent 40%, rgba(197, 160, 89, 0.1) 40%, rgba(197, 160, 89, 0.1) 60%, transparent 60%);
  background-size: 20px 20px;
  opacity: 0.3;
}
.theme-forgotten .scenario-svg {
  animation: broken-shake 5s infinite;
}
@keyframes broken-shake {
  0%, 100% { transform: rotate(0deg); }
  90% { transform: rotate(0deg); }
  92% { transform: rotate(2deg); }
  94% { transform: rotate(-2deg); }
  96% { transform: rotate(1deg); }
  98% { transform: rotate(-1deg); }
}
</style>
