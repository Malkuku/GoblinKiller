<template>
  <div class="ability-scores-display" :class="[`display-mode-${mode}`]">
    <!-- 模式1: 六边形网格 -->
    <div v-if="mode === 'hexagon'" class="hexagon-grid">
      <div
        v-for="(val, key) in abilities"
        :key="key"
        class="hex-item"
        :style="getHexStyle(key)"
      >
        <svg class="hex-svg" viewBox="0 0 100 115" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient :id="`hex-grad-${key}`" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" :stop-color="getAbilityColor(key)" stop-opacity="0.3"/>
              <stop offset="100%" :stop-color="getAbilityColor(key)" stop-opacity="0.1"/>
            </linearGradient>
            <filter :id="`hex-glow-${key}`">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <polygon
            points="50,5 95,30 95,85 50,110 5,85 5,30"
            :fill="`url(#hex-grad-${key})`"
            :stroke="getAbilityColor(key)"
            stroke-width="2"
            :filter="`url(#hex-glow-${key})`"
          />
          <text x="50" y="45" text-anchor="middle" class="hex-icon">{{ getAbilityIcon(key) }}</text>
          <text x="50" y="70" text-anchor="middle" class="hex-value">{{ val }}</text>
        </svg>
        <div class="hex-label">{{ key }}</div>
      </div>
    </div>

    <!-- 模式2: 进度条 -->
    <div v-else-if="mode === 'bar'" class="bar-container">
      <div
        v-for="(val, key) in abilities"
        :key="key"
        class="bar-item"
      >
        <div class="bar-header">
          <span class="bar-icon">{{ getAbilityIcon(key) }}</span>
          <span class="bar-name">{{ key }}</span>
          <span class="bar-value">{{ val }}</span>
        </div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{
              width: getBarWidth(val) + '%',
              backgroundColor: getAbilityColor(key)
            }"
          >
            <div class="bar-shine"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模式3: 雷达图 -->
    <div v-else-if="mode === 'radar'" class="radar-container">
      <svg class="radar-svg" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="radar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--accent-gold)" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="var(--accent-gold)" stop-opacity="0.2"/>
          </linearGradient>
        </defs>
        <!-- 背景网格 -->
        <g class="radar-grid" v-for="level in [20, 40, 60, 80, 100]" :key="level">
          <polygon
            :points="getRadarPolygon(level)"
            fill="none"
            stroke="var(--scroll-border)"
            stroke-width="1"
            opacity="0.5"
          />
        </g>
        <!-- 轴线 -->
        <line
          v-for="(val, key, index) in abilities"
          :key="`axis-${key}`"
          x1="150" y1="150"
          :x2="getRadarPoint(index, 100).x"
          :y2="getRadarPoint(index, 100).y"
          stroke="var(--scroll-border)"
          stroke-width="1"
          opacity="0.3"
        />
        <!-- 数据区域 -->
        <polygon
          :points="getRadarDataPolygon()"
          fill="url(#radar-grad)"
          stroke="var(--accent-gold)"
          stroke-width="2"
        />
        <!-- 数据点 -->
        <circle
          v-for="(val, key, index) in abilities"
          :key="`point-${key}`"
          :cx="getRadarPoint(index, val).x"
          :cy="getRadarPoint(index, val).y"
          r="5"
          :fill="getAbilityColor(key)"
          stroke="#fff"
          stroke-width="2"
        />
        <!-- 标签与数值 -->
        <g v-for="(val, key, index) in abilities" :key="`label-group-${key}`">
          <text
            :x="getRadarLabelPosition(index).x"
            :y="getRadarLabelPosition(index).y"
            text-anchor="middle"
            class="radar-label"
          >
            {{ key }}
          </text>
          <text
            :x="getRadarLabelPosition(index).x"
            :y="getRadarLabelPosition(index).y + 14"
            text-anchor="middle"
            class="radar-value"
            :fill="getAbilityColor(key)"
          >
            {{ val }}
          </text>
        </g>
      </svg>
    </div>

    <!-- 模式4: 圆形仪表盘 -->
    <div v-else-if="mode === 'gauge'" class="gauge-grid">
      <div
        v-for="(val, key) in abilities"
        :key="key"
        class="gauge-item"
      >
        <svg class="gauge-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient :id="`gauge-grad-${key}`" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" :stop-color="getAbilityColor(key)" stop-opacity="0.8"/>
              <stop offset="100%" :stop-color="getAbilityColor(key)" stop-opacity="0.4"/>
            </linearGradient>
          </defs>
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke="var(--scroll-border)"
            stroke-width="8"
          />
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            :stroke="`url(#gauge-grad-${key})`"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="getGaugeDash(val)"
            stroke-dashoffset="0"
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="55" text-anchor="middle" class="gauge-value">{{ val }}</text>
          <text x="60" y="72" text-anchor="middle" class="gauge-label">{{ key }}</text>
        </svg>
        <div class="gauge-icon">{{ getAbilityIcon(key) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AbilityScores } from '@/哥杀/UI/types/StatData.d.ts';

type DisplayMode = 'hexagon' | 'bar' | 'radar' | 'gauge';

const props = withDefaults(defineProps<{
  abilities: AbilityScores;
  mode?: DisplayMode;
  maxValue?: number;
}>(), {
  mode: 'hexagon',
  maxValue: 20
});

const abilityConfig: Record<string, { color: string; darkColor: string; icon: string }> = {
  '力量': { color: '#c0392b', darkColor: '#e74c3c', icon: '⚔' },
  '敏捷': { color: '#27ae60', darkColor: '#2ecc71', icon: '⚡' },
  '感知': { color: '#2980b9', darkColor: '#3498db', icon: '👁' },
  '知识': { color: '#8e44ad', darkColor: '#9b59b6', icon: '📖' },
  '魅力': { color: '#e84393', darkColor: '#f06292', icon: '❤' },
  '魔力': { color: '#3498db', darkColor: '#5dade2', icon: '✦' },
  '信仰力': { color: '#f39c12', darkColor: '#f1c40f', icon: '✧' }
};

const getAbilityColor = (name: string): string => {
  const config = abilityConfig[name];
  if (!config) return 'var(--accent-gold)';
  const isDark = document.documentElement.classList.contains('dark-mode');
  return isDark ? config.darkColor : config.color;
};

const getAbilityIcon = (name: string): string => {
  return abilityConfig[name]?.icon || '◆';
};

const getHexStyle = (name: string) => {
  return {
    '--ability-color': getAbilityColor(name)
  };
};

const getBarWidth = (value: number): number => {
  return Math.min(100, Math.max(0, (value / props.maxValue) * 100));
};

const getGaugeDash = (value: number): string => {
  const circumference = 2 * Math.PI * 50;
  const progress = (value / props.maxValue) * circumference;
  return `${progress} ${circumference}`;
};

const abilityKeys = computed(() => Object.keys(props.abilities));

const getRadarPoint = (index: number, value: number) => {
  const angle = (index * 2 * Math.PI) / abilityKeys.value.length - Math.PI / 2;
  const radius = (value / props.maxValue) * 100;
  return {
    x: 150 + radius * Math.cos(angle),
    y: 150 + radius * Math.sin(angle)
  };
};

const getRadarPolygon = (level: number): string => {
  return abilityKeys.value
    .map((_, i) => {
      const point = getRadarPoint(i, level);
      return `${point.x},${point.y}`;
    })
    .join(' ');
};

const getRadarDataPolygon = (): string => {
  return abilityKeys.value
    .map((key, i) => {
      const val = props.abilities[key as keyof AbilityScores];
      const point = getRadarPoint(i, val);
      return `${point.x},${point.y}`;
    })
    .join(' ');
};

const getRadarLabelPosition = (index: number) => {
  const angle = (index * 2 * Math.PI) / abilityKeys.value.length - Math.PI / 2;
  const radius = 125;
  return {
    x: 150 + radius * Math.cos(angle),
    y: 150 + radius * Math.sin(angle) + 5
  };
};
</script>

<style scoped>
.ability-scores-display {
  width: 100%;
}

/* ================= 六边形模式 ================= */
.hexagon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 15px;
  justify-items: center;
}

.hex-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s ease;
}

.hex-item:hover {
  transform: scale(1.1);
}

.hex-svg {
  width: 70px;
  height: 80px;
}

.hex-icon {
  font-size: 1.2rem;
  fill: var(--text-main);
}

.hex-value {
  font-size: 1.4rem;
  font-weight: bold;
  fill: var(--text-main);
}

.hex-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
  text-align: center;
}

/* ================= 进度条模式 ================= */
.bar-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

.bar-name {
  flex: 1;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.bar-value {
  font-size: 0.9rem;
  font-weight: bold;
  min-width: 30px;
  text-align: right;
}

.bar-track {
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.dark-mode .bar-track {
  background: rgba(255, 255, 255, 0.1);
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  position: relative;
  transition: width 0.5s ease;
}

.bar-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 4px 4px 0 0;
}

/* ================= 雷达图模式 ================= */
.radar-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.radar-svg {
  width: 100%;
  max-width: 300px;
  height: auto;
}

.radar-label {
  font-size: 12px;
  fill: var(--text-main);
  font-weight: bold;
}

.radar-value {
  font-size: 11px;
  font-weight: bold;
}

/* ================= 仪表盘模式 ================= */
.gauge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
  justify-items: center;
}

.gauge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.gauge-svg {
  width: 90px;
  height: 90px;
}

.gauge-value {
  font-size: 1.2rem;
  font-weight: bold;
  fill: var(--text-main);
}

.gauge-label {
  font-size: 0.65rem;
  fill: var(--text-muted);
}

.gauge-icon {
  font-size: 1rem;
  margin-top: 4px;
}

/* ================= 响应式 ================= */
@media (max-width: 768px) {
  .hexagon-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .hex-svg {
    width: 55px;
    height: 65px;
  }

  .hex-icon {
    font-size: 1rem;
  }

  .hex-value {
    font-size: 1.1rem;
  }

  .gauge-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .gauge-svg {
    width: 70px;
    height: 70px;
  }

  .radar-svg {
    max-width: 250px;
  }
}
</style>
