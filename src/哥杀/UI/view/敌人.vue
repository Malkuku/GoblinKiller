<template>
  <div class="fantasy-module enemy-module">
    <div class="module-header">
      <span class="ornament">⚔</span>
      <h2 class="title">敌对目标</h2>
      <span class="ornament">⚔</span>
    </div>

    <div v-if="!enemies || Object.keys(enemies).length === 0" class="empty-state">
      四周一片寂静，暂无威胁...
    </div>

    <div class="card-grid" v-else>
      <div class="fantasy-card enemy-card" v-for="(enemy, name) in enemies" :key="name">

        <!-- 待初始化状态 -->
        <template v-if="enemy === '待初始化'">
          <div class="card-header">
            <h3 class="entity-name">{{ name }}</h3>
            <span class="entity-badge uninit">迷雾笼罩</span>
          </div>
          <div class="card-body uninit-body">
            <p>该目标的情报尚未探明 (待初始化)...</p>
          </div>
        </template>

        <!-- 已初始化状态 -->
        <template v-else>
          <div class="card-header">
            <h3 class="entity-name">{{ name }}</h3>
            <span class="entity-badge danger">{{ enemy.类型 || '未知生物' }}</span>
          </div>

          <div class="card-body">
            <!-- 资源条 (生命/护甲) -->
            <div class="resource-bars">
              <div class="res-bar-container">
                <div class="res-label">生命值</div>
                <div class="res-track">
                  <div class="res-fill hp-fill" :style="{ width: getPercentage(enemy.生命值) + '%' }"></div>
                  <span class="res-text">{{ enemy.生命值.当前值 ?? '?' }} / {{ enemy.生命值.最大值 ?? '?' }}</span>
                </div>
              </div>
              <div class="res-bar-container">
                <div class="res-label">护甲值</div>
                <div class="res-track">
                  <div class="res-fill armor-fill" :style="{ width: getPercentage(enemy.护甲值) + '%' }"></div>
                  <span class="res-text">{{ enemy.护甲值.当前值 ?? '?' }} / {{ enemy.护甲值.最大值 ?? '?' }}</span>
                </div>
              </div>
            </div>

            <!-- 能力属性网格 -->
            <div class="stats-section" v-if="enemy.能力 && Object.keys(enemy.能力).length > 0">
              <div class="section-title">能力评估</div>
              <div class="stats-grid">
                <div class="stat-item" v-for="(val, key) in enemy.能力" :key="key">
                  <span class="stat-key">{{ key }}</span>
                  <span class="stat-val">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- 备注 -->
            <div class="notes-section" v-if="enemy.备注">
              <div class="section-title">战术备注</div>
              <p class="notes-text">{{ enemy.备注 }}</p>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EnemyEntry, Resource } from '@/哥杀/UI/types/StatData';
import { ref } from 'vue';

// 模拟数据注入
const enemies = ref<Record<string, EnemyEntry>>({
  "哥布林萨满": {
    "类型": "类人邪恶生物",
    "生命值": { "当前值": 45, "最大值": 60 },
    "护甲值": { "当前值": 5, "最大值": 15 },
    "能力": { "力量": 8, "敏捷": 12, "魔力": 18, "感知": 14 },
    "备注": "躲在后排施放火球术，优先击杀目标。"
  },
  "潜伏的黑影": "待初始化"
});

// 计算进度条百分比
const getPercentage = (res: Resource) => {
  if (!res || res.当前值 === null || res.最大值 === null || res.最大值 === 0) return 0;
  return Math.max(0, Math.min(100, (res.当前值 / res.最大值) * 100));
};
</script>

<style scoped>
/* 基础模块样式复用 */
.fantasy-module {
  color: var(--text-main);
  margin-bottom: 40px;
}

.module-header {
  display: flex; align-items: center; justify-content: center; gap: 15px;
  margin-bottom: 25px; border-bottom: 1px solid var(--scroll-border); padding-bottom: 10px;
}
.module-header .title { font-size: 1.5rem; color: var(--flag-close-bg); margin: 0; letter-spacing: 2px; }
.module-header .ornament { color: var(--flag-close-bg); opacity: 0.7; }
.empty-state { text-align: center; color: var(--text-muted); font-style: italic; padding: 20px; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

.fantasy-card {
  background: rgba(0, 0, 0, 0.02); border: 1px solid var(--scroll-border);
  border-radius: 8px; padding: 15px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.02), 0 4px 6px rgba(0,0,0,0.05);
  transition: transform 0.3s ease, border-color 0.3s ease;
}
.dark-mode .fantasy-card {
  background: rgba(255, 255, 255, 0.03);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.2);
}
.enemy-card:hover { transform: translateY(-2px); border-color: var(--flag-close-bg); }

.card-header {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px dashed var(--scroll-border); padding-bottom: 10px; margin-bottom: 15px;
}
.entity-name { margin: 0; font-size: 1.2rem; color: var(--text-main); font-weight: bold; }

.entity-badge { font-size: 0.8rem; padding: 2px 8px; border-radius: 12px; color: #fff; }
.entity-badge.danger { background-color: var(--flag-close-bg); }
.entity-badge.uninit { background-color: var(--text-muted); }

.uninit-body { color: var(--text-muted); font-style: italic; text-align: center; padding: 20px 0; }

/* 资源条样式 */
.resource-bars { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
.res-bar-container { display: flex; align-items: center; gap: 10px; }
.res-label { width: 50px; font-size: 0.9rem; font-weight: bold; color: var(--text-muted); }
.res-track {
  flex: 1; height: 16px; background-color: rgba(0,0,0,0.1);
  border-radius: 8px; position: relative; overflow: hidden;
  border: 1px solid var(--scroll-border);
}
.res-fill { height: 100%; transition: width 0.3s ease; }
.hp-fill { background: linear-gradient(90deg, #8c3a3a, #b33939); }
.armor-fill { background: linear-gradient(90deg, #5c6bc0, #7986cb); }
.res-text {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; color: #fff; text-shadow: 0 0 2px #000; font-weight: bold;
}

.section-title {
  font-size: 0.9rem; color: var(--accent-gold); margin: 10px 0 8px 0;
  border-bottom: 1px solid rgba(198, 166, 100, 0.3); display: inline-block;
}

/* 能力网格 */
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.stat-item {
  display: flex; justify-content: space-between;
  background: rgba(255,255,255,0.3); padding: 4px 8px; border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.05); font-size: 0.9rem;
}
.dark-mode .stat-item { background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.05); }
.stat-key { color: var(--text-muted); }
.stat-val { font-weight: bold; color: var(--text-main); }

.notes-text { font-size: 0.9rem; line-height: 1.5; color: var(--text-main); margin: 0; background: rgba(198, 166, 100, 0.05); padding: 8px; border-left: 3px solid var(--accent-gold); }
</style>
