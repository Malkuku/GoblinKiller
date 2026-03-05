<template>
  <div class="app-container animus-theme">
    <!-- 全局扫描线遮罩 -->
    <div class="scanlines"></div>

    <div class="gallery-card active">
      <!-- HUD 边角装饰 -->
      <div class="hud-corner top-left"></div>
      <div class="hud-corner top-right"></div>
      <div class="hud-corner bottom-left"></div>
      <div class="hud-corner bottom-right"></div>

      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="header-title">
          <span class="tech-prefix">//</span>
          路遇险敌 <span class="separator">::</span>
          <span class="entity-red">威胁检测</span>
        </div>
        <div class="status-indicator scanning">
          <span class="status-dot"></span>
          数据同步中
        </div>
      </div>

      <!-- 卡片内容 -->
      <div class="card-content">

        <!-- 敌人选择器 (多目标时显示) -->
        <div class="tab-controller" v-if="enemyNames.length > 0">
          <div
            v-for="name in enemyNames"
            :key="name"
            class="tab-btn"
            :class="{ active: currentEnemyName === name }"
            @click="currentEnemyName = name"
          >
            <span class="icon">▧</span> {{ name }}
          </div>
          <div class="tab-line"></div>
        </div>

        <!-- 实体详细数据展示 -->
        <transition name="fade-slide" mode="out-in">
          <div v-if="currentEnemy" :key="currentEnemyName" class="data-view">
            <div class="data-grid-layout">

              <!-- 模块 1: 生命状态 -->
              <div class="data-box vitals-box">
                <div class="box-header">
                  <span class="box-icon"></span>
                  <h4>生命体征</h4>
                </div>
                <div class="vitals-list">
                  <!-- 生命 -->
                  <div class="vital-item">
                    <div class="vital-labels">
                      <span class="vital-name">生命</span>
                      <span class="vital-value red">{{ currentEnemy.生命状态.生命.当前 }} / {{ currentEnemy.生命状态.生命.最大值 }}</span>
                    </div>
                    <div class="progress-bg">
                      <div class="progress-fill fill-red" :style="{ width: getPercentage(currentEnemy.生命状态.生命) + '%' }"></div>
                    </div>
                  </div>
                  <!-- 体力 -->
                  <div class="vital-item">
                    <div class="vital-labels">
                      <span class="vital-name">体力</span>
                      <span class="vital-value gold">{{ currentEnemy.生命状态.体力.当前 }} / {{ currentEnemy.生命状态.体力.最大值 }}</span>
                    </div>
                    <div class="progress-bg">
                      <div class="progress-fill fill-gold" :style="{ width: getPercentage(currentEnemy.生命状态.体力) + '%' }"></div>
                    </div>
                  </div>
                  <!-- 精神 -->
                  <div class="vital-item">
                    <div class="vital-labels">
                      <span class="vital-name">精神</span>
                      <span class="vital-value gray">{{ currentEnemy.生命状态.精神.当前 }} / {{ currentEnemy.生命状态.精神.最大值 }}</span>
                    </div>
                    <div class="progress-bg">
                      <div class="progress-fill fill-gray" :style="{ width: getPercentage(currentEnemy.生命状态.精神) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 模块 2: 基础数值 -->
              <div class="data-box attributes-box">
                <div class="box-header">
                  <span class="box-icon"></span>
                  <h4>基础参数</h4>
                </div>
                <div class="attr-grid">
                  <div class="attr-item" v-for="(val, key) in currentEnemy.基础数值" :key="key">
                    <div class="attr-label">{{ key }}</div>
                    <div class="attr-value">{{ val }}</div>
                  </div>
                </div>
              </div>

              <!-- 模块 3: 术之等级 -->
              <div class="data-box arts-box">
                <div class="box-header">
                  <span class="box-icon"></span>
                  <h4>神秘学识</h4>
                </div>
                <div class="arts-container">
                  <div v-if="Object.keys(currentEnemy.术之等级).length === 0" class="empty-hint">
                    [ 未检测到神秘学识波动 ]
                  </div>
                  <div class="art-badge" v-for="(data, artName) in currentEnemy.术之等级" :key="artName">
                    <div class="art-name">{{ artName }}</div>
                    <div class="art-level">Lv.{{ data.等级 }}</div>
                    <div class="art-exp">经验: {{ data.经验 }}</div>
                  </div>
                </div>
              </div>

              <!-- 模块 4: 战斗策略 -->
              <div class="data-box strategy-box">
                <div class="box-header">
                  <span class="box-icon"></span>
                  <h4>行为预测</h4>
                </div>
                <div class="strategy-content">
                  <p class="terminal-text">> {{ currentEnemy.战斗策略 || '暂无可用战术情报...' }}</p>
                  <span class="cursor">_</span>
                </div>
              </div>

            </div>
          </div>
        </transition>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 1. 获取注入的 JSON 数据
const rawJson = $1;

// 2. 状态管理
const enemyNames = Object.keys(rawJson);
const currentEnemyName = ref(enemyNames.length > 0 ? enemyNames[0] : null);

// 3. 计算属性：获取当前选中的敌人数据
const currentEnemy = computed(() => {
  if (!currentEnemyName.value) return null;
  return rawJson[currentEnemyName.value];
});

// 4. 辅助函数：计算进度条百分比
const getPercentage = (stat) => {
  if (!stat || stat.最大值 === 0) return 0;
  const percent = (stat.当前 / stat.最大值) * 100;
  return Math.max(0, Math.min(100, percent)); // 限制在 0-100 之间
};
</script>

<style scoped>
/* --- 核心色彩与变量 (暗金主题) --- */
.animus-theme {
  --ac-bg-dark: #080705;
  --ac-bg-panel: rgba(20, 18, 12, 0.9);
  --ac-gold: #d4af37;
  --ac-gold-dim: #8a7035;
  --ac-gold-light: #f9d77e;
  --ac-red: #cc2929;
  --ac-white: #e8e0c5;
  --ac-gray: #7d7560;
  --ac-line: rgba(212, 175, 55, 0.2);
  --ac-font-main: 'Rajdhani', 'Microsoft YaHei', sans-serif;
  --ac-font-mono: 'Fira Code', monospace;

  background-color: var(--ac-bg-dark);
  color: var(--ac-white);
  font-family: var(--ac-font-main);
  padding: 20px; /* 减小外边距 */
  position: relative;
}

.scanlines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0) 50%, rgba(50,40,0,0.05) 50%, rgba(50,40,0,0.05));
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 999;
  opacity: 0.4;
}

.gallery-card {
  position: relative;
  background-color: var(--ac-bg-panel);
  border: 1px solid var(--ac-line);
  max-width: 900px;
  margin: 0 auto;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
  transition: border-color 0.3s;
}

.gallery-card.active {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
}

/* 边角装饰 */
.hud-corner { position: absolute; width: 15px; height: 15px; border: 2px solid transparent; z-index: 10; }
.top-left { top: -1px; left: -1px; border-top-color: var(--ac-gold); border-left-color: var(--ac-gold); }
.top-right { top: -1px; right: -1px; border-top-color: var(--ac-gold); border-right-color: var(--ac-gold); }
.bottom-left { bottom: -1px; left: -1px; border-bottom-color: var(--ac-gold); border-left-color: var(--ac-gold); }
.bottom-right { bottom: -1px; right: -1px; border-bottom-color: var(--ac-gold); border-right-color: var(--ac-gold); }

/* 头部 */
.card-header {
  padding: 10px 16px; /* 紧凑 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--ac-line);
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%);
}

.header-title { font-size: 1rem; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; font-weight: bold; }
.tech-prefix { color: var(--ac-gold-dim); }
.separator { color: var(--ac-line); }
.entity-red { color: var(--ac-red); text-shadow: 0 0 5px rgba(204, 41, 41, 0.4); animation: pulse-red 2s infinite; }

.status-indicator { font-family: var(--ac-font-mono); font-size: 0.75rem; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; color: var(--ac-gold-light); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background-color: var(--ac-gold-light); box-shadow: 0 0 5px var(--ac-gold-light); animation: blink 1s infinite; }

/* 内容区与标签 */
.card-content { padding: 16px; } /* 紧凑 */

.tab-controller { display: flex; gap: 2px; margin-bottom: 12px; position: relative; flex-wrap: wrap; } /* 紧凑 */
.tab-btn {
  padding: 6px 16px; /* 紧凑 */
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--ac-line);
  border-bottom: none;
  color: var(--ac-gray);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex; align-items: center; gap: 6px;
  clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px);
}
.tab-btn:hover { background: rgba(212, 175, 55, 0.05); color: var(--ac-white); }
.tab-btn.active {
  background: rgba(204, 41, 41, 0.15);
  color: var(--ac-red);
  border-color: var(--ac-red);
  text-shadow: 0 0 8px rgba(204, 41, 41, 0.3);
}
.tab-line { position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: var(--ac-gold); opacity: 0.3; z-index: 0; }

/* 网格布局 */
.data-grid-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px; /* 紧凑 */
}

/* 通用数据盒样式 */
.data-box {
  position: relative; padding: 12px 16px; /* 紧凑 */
  background: rgba(20, 18, 12, 0.5);
  border: 1px solid var(--ac-line);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  transition: transform 0.3s, box-shadow 0.3s;
}
.data-box:hover {
  background: rgba(30, 25, 15, 0.6);
  border-color: rgba(212, 175, 55, 0.4);
}

.box-header { display: flex; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--ac-line); padding-bottom: 6px; } /* 紧凑 */
.box-icon { width: 5px; height: 5px; background-color: var(--ac-gold); margin-right: 8px; box-shadow: 0 0 5px var(--ac-gold); transform: rotate(45deg); }
.box-header h4 { margin: 0; font-size: 0.9rem; letter-spacing: 1px; color: var(--ac-white); font-weight: normal; }

/* 模块 1: 生命体征 */
.vitals-list { display: flex; flex-direction: column; gap: 10px; } /* 紧凑 */
.vital-item { font-family: var(--ac-font-mono); }
.vital-labels { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.8rem; }
.vital-value { font-weight: bold; }
.vital-value.red { color: #ff6b6b; }
.vital-value.gold { color: var(--ac-gold-light); }
.vital-value.gray { color: #a8b2c1; }

.progress-bg { width: 100%; height: 6px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden; } /* 紧凑 */
.progress-fill { height: 100%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.fill-red { background: linear-gradient(90deg, #8b0000, var(--ac-red)); box-shadow: 0 0 10px rgba(204,41,41,0.5); }
.fill-gold { background: linear-gradient(90deg, var(--ac-gold-dim), var(--ac-gold)); box-shadow: 0 0 10px rgba(212,175,55,0.5); }
.fill-gray { background: linear-gradient(90deg, #4a5568, #a0aec0); }

/* 模块 2: 基础数值 */
.attr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } /* 紧凑 */
.attr-item {
  background: rgba(0,0,0,0.4);
  border: 1px dashed var(--ac-line);
  padding: 6px 10px; /* 紧凑 */
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.attr-label { font-size: 0.85rem; color: var(--ac-gray); }
.attr-value { font-family: var(--ac-font-mono); font-size: 1.1rem; color: var(--ac-gold); font-weight: bold; text-shadow: 0 0 5px rgba(212,175,55,0.3); }

/* 模块 3: 神秘学识 */
.arts-box { grid-column: 1 / -1; }
.arts-container { display: flex; flex-wrap: wrap; gap: 10px; } /* 紧凑 */
.empty-hint { color: var(--ac-gray); font-family: var(--ac-font-mono); font-size: 0.85rem; font-style: italic; }
.art-badge {
  background: linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(0,0,0,0.8) 100%);
  border: 1px solid var(--ac-gold-dim);
  padding: 8px 16px; /* 紧凑 */
  min-width: 100px;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  display: flex; flex-direction: column; align-items: center;
}
.art-name { font-size: 1rem; font-weight: bold; color: var(--ac-white); margin-bottom: 2px; letter-spacing: 1px; }
.art-level { font-family: var(--ac-font-mono); font-size: 0.85rem; color: var(--ac-gold); }
.art-exp { font-family: var(--ac-font-mono); font-size: 0.7rem; color: var(--ac-gray); margin-top: 2px; }

/* 模块 4: 战斗策略 */
.strategy-box { grid-column: 1 / -1; }
.strategy-content {
  background: rgba(0, 0, 0, 0.6);
  padding: 10px 12px; /* 紧凑 */
  border-left: 3px solid var(--ac-red);
  font-family: var(--ac-font-mono);
  font-size: 0.85rem;
  line-height: 1.5;
  color: #e2dac2;
  min-height: 60px; /* 紧凑 */
}
.terminal-text { margin: 0; display: inline; }
.cursor { display: inline-block; width: 8px; height: 1em; background-color: var(--ac-gold); animation: blink 1s step-end infinite; vertical-align: bottom; margin-left: 4px; }

/* 动画 */
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes pulse-red { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; text-shadow: 0 0 12px var(--ac-red); } }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

/* 响应式 */
@media (max-width: 768px) {
  .data-grid-layout { grid-template-columns: 1fr; }
  .attr-grid { grid-template-columns: 1fr; }
}
</style>
