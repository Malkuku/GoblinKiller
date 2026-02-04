<template>
  <div class="char-panel user-panel">
    <header class="panel-header">
      <h2 class="char-name">{{ data.姓名 || '无名氏' }}</h2>
      <div class="char-identity">{{ data.当前身份 }} | {{ data.年龄 }}</div>
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
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">生命</span>
              <div class="bar-container">
                <div class="bar-fill hp-flow" :style="{width: (data.生命状态?.生命力 || 0) + '%'}"></div>
                <div class="bar-glare"></div>
                <span class="bar-text">{{ data.生命状态?.生命力 }}/100</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">体力</span>
              <div class="bar-container">
                <div class="bar-fill sp-flow" :style="{width: (data.生命状态?.体力 || 0) + '%'}"></div>
                <div class="bar-glare"></div>
                <span class="bar-text">{{ data.生命状态?.体力 }}/100</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">精神</span>
              <div class="bar-container">
                <div class="bar-fill mp-flow" :style="{width: (data.生命状态?.精神力 || 0) + '%'}"></div>
                <div class="bar-glare"></div>
                <span class="bar-text">{{ data.生命状态?.精神力 }}/100</span>
              </div>
            </div>
          </div>
        </section>

        <section class="info-block" v-if="data.特殊状态">
          <h3>特殊状态</h3>
          <ul class="status-list-styled">
            <template v-for="(status, name) in data.特殊状态" :key="name">
              <li :class="getStatusClass(name)">
                <div class="status-header">
                  <strong class="status-title">
                    {{ name }}
                    <span v-if="status.不可移除" class="unremovable-tag" title="此状态不可移除">[不可移除]</span>
                  </strong>
                </div>
                <div class="status-body">
                  <p class="status-desc">{{ typeof status === 'string' ? status : status.描述 }}</p>
                  <p v-if="typeof status !== 'string' && status.效果" class="status-effect">
                    效果：{{ status.效果 }}
                  </p>
                </div>
              </li>
            </template>
          </ul>
        </section>
      </div>

      <!-- ================= 属性页 ================= -->
      <div v-if="currentTab === '属性'" class="tab-content">
        <section class="info-block">
          <h3>性格倾向</h3>
          <div class="personality-container">
            <div class="radar-chart-wrapper" v-if="radarPoints">
              <svg viewBox="0 0 200 200" class="radar-svg">
                <polygon :points="radarGrid.outer" class="radar-grid" />
                <polygon :points="radarGrid.mid" class="radar-grid" />
                <polygon :points="radarGrid.inner" class="radar-grid" />
                <line v-for="(point, idx) in radarGrid.axes" :key="'axis-'+idx" x1="100" y1="100" :x2="point.x" :y2="point.y" class="radar-axis" />
                <polygon :points="radarPoints" class="radar-area" />
                <g v-for="(point, idx) in radarDataPoints" :key="'pt-'+idx">
                  <circle :cx="point.x" :cy="point.y" r="3" class="radar-point" />
                  <text :x="point.lx" :y="point.ly" class="radar-label" text-anchor="middle">{{ point.label }}</text>
                </g>
              </svg>
            </div>
            <p class="summary text-center">{{ data.性格?.性格总结?.join('，') }}</p>
          </div>
        </section>

        <!-- 引入独立的术之等级模块 -->
        <section class="info-block">
          <ArtsModule :artsData="data.术之等级" />
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
          <div class="relation-list">
            <div v-for="(rel, name) in data.人际关系" :key="name" class="rel-card">
              <strong>{{ name }}</strong>
              <p>{{ rel.关系总结 }}</p>
            </div>
          </div>
        </section>
      </div>

      <!-- ================= 物品页 ================= -->
      <div v-if="currentTab === '物品'" class="tab-content">
        <button class="action-btn" @click="openItemModal">查看物品详情</button>
        <div class="simple-inventory">
          <div v-for="(item, key) in data.物品" :key="key" class="item-row">
            <span class="item-name">{{ key }}</span>
            <span v-if="typeof item === 'object'" class="item-count">x{{ item.数量 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ArtsModule from './ArtsModule.vue'; // 引入新组件

const props = defineProps(['data']);
const tabs = ['状态', '属性', '档案', '物品'];
const currentTab = ref('状态');

// --- 特殊状态逻辑 ---
const getStatusClass = (name) => {
  const n = name.toString();
  return {
    'status-item': true,
    'status-soul-quality': n.includes('魂质'),
    'status-pact': n.includes('印记') || n.includes('契约'),
    'status-blessing': n.includes('祝福'),
    'status-curse': n.includes('诅咒') || n.includes('侵染'),
    'status-injury': n.includes('伤病')
  };
};

// --- 雷达图逻辑 ---
const radarDataPoints = computed(() => {
  if (!props.data.性格 || typeof props.data.性格 !== 'object') return [];
  const keys = Object.keys(props.data.性格).filter(k => k !== '性格总结');
  if (keys.length < 3) return [];

  const total = keys.length;
  const radius = 70;
  const centerX = 100;
  const centerY = 100;

  return keys.map((key, i) => {
    const value = parseFloat(props.data.性格[key]) || 0;
    const normalized = Math.min(value / 20, 1);

    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    const x = centerX + radius * normalized * Math.cos(angle);
    const y = centerY + radius * normalized * Math.sin(angle);
    const labelRadius = radius + 15;
    const lx = centerX + labelRadius * Math.cos(angle);
    const ly = centerY + labelRadius * Math.sin(angle);

    return { x, y, lx, ly, label: key };
  });
});

const radarPoints = computed(() => radarDataPoints.value.map(p => `${p.x},${p.y}`).join(' '));

const radarGrid = computed(() => {
  const count = radarDataPoints.value.length;
  if (count < 3) return { outer: '', mid: '', inner: '', axes: [] };
  const makePoly = (r) => {
    let points = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      points.push(`${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`);
    }
    return points.join(' ');
  };
  const axes = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    axes.push({ x: 100 + 70 * Math.cos(angle), y: 100 + 70 * Math.sin(angle) });
  }
  return { outer: makePoly(70), mid: makePoly(46), inner: makePoly(23), axes };
});

const openItemModal = () => { alert('物品弹窗接口预留'); };
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
/* --- 生命状态 (极简平面 + 末端浪头) --- */
.stat-grid { display: flex; flex-direction: column; gap: 15px; }
.stat-item { display: flex; align-items: center; gap: 15px; }
.stat-item .label { width: 40px; font-family: var(--font-title); color: var(--c-text-dim); font-weight: bold; }

.bar-container {
  flex: 1; height: 16px; /* 稍微变细，符合平面化审美 */
  background: rgba(255, 255, 255, 0.1); /* 纯平背景，无边框无阴影 */
  border-radius: 2px; /* 微圆角或直角 */
  position: relative;
  overflow: visible; /* 允许末端特效溢出一点点 */
}

/* 彻底移除玻璃反光 */
.bar-glare { display: none; }

.bar-text {
  position: absolute; width: 100%; text-align: right; right: 5px; top: -18px; /* 文字移到进度条上方，保持条的纯净 */
  font-size: 0.75rem; color: var(--c-text-dim);
  font-family: monospace; letter-spacing: 0.5px;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  position: relative;
  transition: width 0.3s ease-out;
  /* 纯色背景，稍后在各属性中定义 */
}

/* --- 末端流水特效 (平面版) --- */
/* 这是进度条末端的“浪头” */
.bar-fill::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  right: 0;
  width: 15px; /* 浪头长度 */

  /* 关键：使用渐变模拟水流冲刷的半透明尾巴 */
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6) 80%, rgba(255,255,255,0.9) 100%);

  /* 稍微一点点外发光，增加能量感，但不做立体 */
  box-shadow: 2px 0 5px currentColor;

  /* 修正圆角，只在右侧 */
  border-radius: 0 2px 2px 0;

  /* 动画：模拟水流的不稳定抖动 */
  animation: water-tip-flicker 2s infinite;
}

/* 增加一点内部的粒子流动感（可选，非常淡） */
.bar-fill::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-image: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: flat-flow 3s infinite linear;
  z-index: 1;
}

@keyframes water-tip-flicker {
  0%, 100% { opacity: 0.8; width: 15px; }
  50% { opacity: 1; width: 20px; } /* 浪头伸缩 */
}

@keyframes flat-flow {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

/* --- 纯平配色 (Flat UI Colors) --- */
/* HP: 纯红 */
.hp-flow {
  background-color: #e74c3c;
  color: #ffadad; /* 用于末端光晕 */
}

/* SP: 纯金 */
.sp-flow {
  background-color: #f1c40f;
  color: #fff5cc; /* 用于末端光晕 */
}

/* MP: 纯蓝 */
.mp-flow {
  background-color: #3498db;
  color: #b3e0ff; /* 用于末端光晕 */
}



/* --- 特殊状态 (带特效) --- */
.status-list-styled { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.status-item { padding: 10px 15px; border-left: 4px solid #555; background: rgba(255, 255, 255, 0.03); transition: all 0.3s ease; position: relative; overflow: hidden; }
.status-title { display: flex; justify-content: space-between; font-size: 1.05rem; margin-bottom: 5px; }
.unremovable-tag { font-size: 0.7em; color: #ff6b6b; opacity: 0.8; }
.status-desc { margin: 0; font-size: 0.95rem; color: var(--c-text-dim); }
.status-effect { margin: 5px 0 0 0; font-size: 0.9rem; color: #ffb74d; }

@keyframes streaming-light { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
.status-soul-quality { color: #0096FF; border-left-color: #0096FF; background-image: linear-gradient(90deg, transparent, rgba(0, 150, 255, 0.2), transparent); background-size: 200% 100%; animation: streaming-light 4s ease-in-out infinite; }
.status-pact { color: #FFD700; border-left-color: #FFD700; background-image: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.2), transparent); background-size: 200% 100%; animation: streaming-light 3.5s linear infinite; }
.status-blessing { color: #4CAF50; border-left-color: #4CAF50; background-image: linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.2), transparent); background-size: 200% 100%; animation: streaming-light 6s ease-in-out infinite; }
.status-curse { color: #9C27B0; border-left-color: #9C27B0; background-image: linear-gradient(90deg, transparent, rgba(156, 39, 176, 0.25), transparent); background-size: 200% 100%; animation: streaming-light 5s ease-in infinite; }
.status-injury { color: #2E7D32; border-left-color: #2E7D32; background-image: linear-gradient(90deg, transparent, rgba(46, 125, 50, 0.3), transparent); background-size: 200% 100%; animation: streaming-light 4.5s linear infinite; }

/* --- 雷达图 --- */
.personality-container { display: flex; flex-direction: column; align-items: center; }
.radar-chart-wrapper { width: 220px; height: 220px; margin-bottom: 10px; }
.radar-svg { width: 100%; height: 100%; overflow: visible; }
.radar-grid { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 1; }
.radar-axis { stroke: rgba(255,255,255,0.1); stroke-width: 1; stroke-dasharray: 4; }
.radar-area { fill: rgba(212, 175, 55, 0.2); stroke: var(--c-gold); stroke-width: 2; }
.radar-point { fill: var(--c-gold); }
.radar-label { fill: var(--c-text-dim); font-size: 10px; }
.summary { font-style: italic; color: var(--c-gold); margin-top: 10px; }

/* --- 其他通用 --- */
.text-content { white-space: pre-wrap; line-height: 1.6; color: #ccc; }
.action-btn { width: 100%; padding: 10px; background: rgba(255,215,0,0.1); border: 1px solid #FFD700; color: #FFD700; cursor: pointer; transition: 0.2s; }
.action-btn:hover { background: #FFD700; color: #000; }
.simple-inventory .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.simple-inventory .item-count { color: #888; }
</style>
