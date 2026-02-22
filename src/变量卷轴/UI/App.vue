<template>
  <!--
    模式 1: 收起状态 - 变量分析核心 (可拖拽)
  -->
  <div
    v-if="!uiStore.showUI"
    ref="draggableBtn"
    class="ac-toggle-btn"
    :style="btnPositionStyle"
    title="Initialize Variable Sequence"
    @click="handleBtnClick"
  >
    <!-- 变量分析风格 SVG 图标 -->
    <svg viewBox="0 0 100 100" class="ac-logo-svg">
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8a7847;stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- 外圈：数据环 -->
      <circle cx="50" cy="50" r="46" stroke="url(#goldGradient)" stroke-width="1" fill="rgba(0,0,0,0.8)" stroke-dasharray="10 5" opacity="0.6" />
      <circle cx="50" cy="50" r="40" stroke="var(--ac-gold)" stroke-width="0.5" fill="none" opacity="0.3" />

      <!-- 核心：代码/变量分析符号 -->
      <g transform="translate(50, 50) scale(0.8)" filter="url(#glow)">
        <path d="M-15 -25 C-25 -25 -25 -15 -25 -5 L-30 0 L-25 5 C-25 15 -25 25 -15 25" fill="none" stroke="url(#goldGradient)" stroke-width="4" stroke-linecap="round" />
        <path d="M15 -25 C25 -25 25 -15 25 -5 L30 0 L25 5 C25 15 25 25 15 25" fill="none" stroke="url(#goldGradient)" stroke-width="4" stroke-linecap="round" />
        <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill="url(#goldGradient)" />
        <line x1="-35" y1="0" x2="35" y2="0" stroke="var(--ac-blue)" stroke-width="1" opacity="0.8">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="0" y1="-30" x2="0" y2="-45" stroke="url(#goldGradient)" stroke-width="2" />
        <circle cx="0" cy="-48" r="3" fill="var(--ac-gold)" />
      </g>
    </svg>
    <div class="animus-pulse"></div>
  </div>

  <!--
    模式 2: 展开状态 - 变量监控窗口 (可拖拽、可调整大小)
    增加 :class="{'is-dragging': isDragging}" 用于优化性能
  -->
  <div
    v-if="uiStore.showUI"
    ref="draggableWindow"
    class="ac-window"
    :class="{ 'is-dragging': isDragging }"
    :style="windowStyle"
  >
    <!-- 顶部装饰条 -->
    <div class="ac-window-border-top"></div>

    <!-- 窗口标题栏 -->
    <div class="ac-header">
      <div class="ac-header-left">
        <span class="ac-icon">⟡</span>
        <span class="ac-title">ANIMUS // VARIABLE_DEBUGGER</span>
      </div>
      <div class="ac-controls">
        <button @click.stop="refreshData" title="Resynchronize">↻</button>
        <button @click.stop="toggleUI" title="Minimize">_</button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="ac-content">
      <div class="ac-background-grid"></div>

      <div v-if="parsedLogs.length === 0" class="ac-empty">
        <span class="blink">SEARCHING MEMORY BLOCKS...</span>
        <div class="sub-text">No variable modifications detected.</div>
      </div>

      <!-- 循环渲染匹配到的正则结果 -->
      <div v-for="(log, index) in parsedLogs" :key="index" class="ac-log-entry" :class="{ 'is-think': log.type === 'variablethink' }">

        <!-- 头部：显示类型 -->
        <div class="ac-log-header" :class="log.type">
          <span class="log-index">0x{{ String(index).padStart(4, '0') }}</span>
          <span class="log-action">{{ formatType(log.type) }}</span>
        </div>

        <!-- 内容：根据类型区分渲染 -->
        <div class="ac-log-body">

          <!-- 情况A: 思考过程 (纯文本) -->
          <div v-if="log.type === 'variablethink'" class="ac-think-text">
            {{ log.data }}
          </div>

          <!-- 情况B: 变量操作 (JSON) -->
          <div v-else class="ac-json-wrapper">
            <JsonNode
              :value="log.data"
              :name="''"
              :is-last="true"
              :depth="0"
              :force-open="false"
            />
          </div>

        </div>
      </div>
    </div>

    <!-- 底部装饰 -->
    <div class="ac-footer">
      <span>SYSTEM STABLE // MEMORY: {{ parsedLogs.length }} BLOCKS</span>
      <!-- 增加一个右下角的调整大小手柄提示 -->
      <span class="resize-handle-icon">◢</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h, defineComponent, computed, onMounted, watch, nextTick, reactive } from 'vue';
import { useUiStore } from '@/变量卷轴/UI/store/UIStore';
import { useMessageStore } from '@/变量卷轴/UI/store/MessageStore';

// 引入 Store
const uiStore = useUiStore();
const messageStore = useMessageStore();

const draggableBtn = ref<HTMLElement | null>(null);
const draggableWindow = ref<HTMLElement | null>(null);
const parsedLogs = ref<Array<{ type: string, data: any }>>([]);
const isDragging = ref(false);

// 按钮位置状态
const btnPosition = reactive({
  top: 100,
  left: 100
});

// 窗口状态 (增加宽高)
const windowState = reactive({
  top: 100,
  left: 100,
  width: 600,
  height: 500
});

const btnPositionStyle = computed(() => ({
  top: `${btnPosition.top}px`,
  left: `${btnPosition.left}px`
}));

const windowStyle = computed(() => ({
  top: `${windowState.top}px`,
  left: `${windowState.left}px`,
  width: `${windowState.width}px`,
  height: `${windowState.height}px`
}));

const toggleUI = () => {
  if (isDragging.value) return;
  uiStore.showUI = !uiStore.showUI;
};

const handleBtnClick = () => {
  if (!isDragging.value) {
    toggleUI();
  }
};

const formatType = (type: string) => {
  const map: Record<string, string> = {
    'variableinsert': 'ALLOCATE',
    'variableedit': 'OVERWRITE',
    'variabledelete': 'DEALLOCATE',
    'variablethink': '>> SYNAPTIC PROCESS'
  };
  return map[type] || type.toUpperCase();
};

const parseMessageContent = () => {
  const text = messageStore.message;
  if (!text) {
    parsedLogs.value = [];
    return;
  }

  const regex = /<(variable(?:insert|edit|delete|think))>(.*?)<\/\1>/gsi;
  const results = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const type = match[1].toLowerCase();
    const content = match[2];
    let parsedData;

    if (type === 'variablethink') {
      parsedData = content.trim();
    } else {
      try {
        parsedData = JSON.parse(content);
      } catch (e) {
        parsedData = content;
      }
    }
    results.push({ type: type, data: parsedData });
  }
  parsedLogs.value = results;
};

const refreshData = () => {
  messageStore.getMessage();
  parseMessageContent();
};

const initDraggable = () => {
  // 1. 初始化按钮拖拽
  if (draggableBtn.value) {
    const $btn = $(draggableBtn.value);
    if ($btn.data('ui-draggable')) $btn.draggable('destroy'); // 防止重复初始化

    $btn.draggable({
      containment: 'window',
      scroll: false,
      start: () => { isDragging.value = true; },
      stop: (event, ui) => {
        btnPosition.top = ui.position.top;
        btnPosition.left = ui.position.left;
        setTimeout(() => { isDragging.value = false; }, 100);
      }
    });
  }

  // 2. 初始化窗口拖拽和缩放
  if (draggableWindow.value) {
    const $win = $(draggableWindow.value);

    // 清理旧实例
    if ($win.data('ui-draggable')) $win.draggable('destroy');
    if ($win.data('ui-resizable')) $win.resizable('destroy');

    // 拖拽配置
    $win.draggable({
      handle: '.ac-header',
      containment: 'window',
      scroll: false,
      start: () => {
        isDragging.value = true;
      },
      stop: (event, ui) => {
        isDragging.value = false;
        windowState.top = ui.position.top;
        windowState.left = ui.position.left;
      }
    });

    // 调整大小配置
    $win.resizable({
      minHeight: 300,
      minWidth: 400,
      handles: 'all', // 允许所有方向调整，或者用 'n, e, s, w, ne, se, sw, nw'
      start: () => {
        isDragging.value = true; // 调整大小时也视为交互中，禁用特效
      },
      stop: (event, ui) => {
        isDragging.value = false;
        // 同步大小
        windowState.width = ui.size.width;
        windowState.height = ui.size.height;
        // 同步位置 (因为向左/上调整大小时，top/left 也会变)
        windowState.top = ui.position.top;
        windowState.left = ui.position.left;
      }
    });
  }
};

watch(() => uiStore.showUI, () => {
  nextTick(() => {
    initDraggable();
  });
});

watch(() => messageStore.message, () => {
  parseMessageContent();
});

onMounted(() => {
  refreshData();
  nextTick(() => {
    initDraggable();
  });
});

// ============================================================
// JsonNode 组件 (保持不变)
// ============================================================
const JsonNode = defineComponent({
  name: 'JsonNode',
  props: {
    name: { type: [String, Number], default: '' },
    value: { type: [Object, Array, String, Number, Boolean, null] as any, default: null },
    isLast: { type: Boolean, default: true },
    depth: { type: Number, default: 0 },
    forceOpen: { type: Boolean, default: true }
  },
  setup(props) {
    const isOpen = ref(props.forceOpen);
    const toggle = () => { isOpen.value = !isOpen.value; };

    const isObject = computed(() => props.value !== null && typeof props.value === 'object');
    const isArray = computed(() => Array.isArray(props.value));

    const valueClass = computed(() => {
      if (props.value === null) return 'jv-null';
      if (typeof props.value === 'string') return 'jv-string';
      if (typeof props.value === 'number') return 'jv-number';
      if (typeof props.value === 'boolean') return 'jv-boolean';
      return '';
    });

    const formattedValue = computed(() => {
      if (props.value === null) return 'NULL';
      if (typeof props.value === 'string') return `"${props.value}"`;
      return String(props.value);
    });

    return () => {
      const { name, value, isLast, depth } = props;
      const indent = { paddingLeft: `${depth * 15}px` };

      if (isObject.value) {
        const keys = Object.keys(value);
        const isEmpty = keys.length === 0;
        const openBracket = isArray.value ? '[' : '{';
        const closeBracket = isArray.value ? ']' : '}';
        const itemCount = keys.length;

        const headerContent = [
          !isEmpty && h('span', {
            class: ['jv-toggle', { open: isOpen.value }],
            onClick: (e: Event) => { e.stopPropagation(); toggle(); }
          }, '▶'),
          name !== '' && h('span', { class: 'jv-key' }, `${name}: `),
          h('span', { class: 'jv-bracket' }, openBracket),
          !isOpen.value && !isEmpty && h('span', { class: 'jv-ellipsis', onClick: toggle }, ` ... `),
          (!isOpen.value || isEmpty) && h('span', { class: 'jv-bracket' }, closeBracket),
          (!isLast && (!isOpen.value || isEmpty)) && h('span', { class: 'jv-comma' }, ','),
          !isOpen.value && !isEmpty && h('span', { class: 'jv-count' }, ` // ${itemCount}`)
        ];

        const children: any[] = [];
        if (isOpen.value && !isEmpty) {
          keys.forEach((key, index) => {
            children.push(h(JsonNode, {
              key: key,
              name: isArray.value ? '' : key,
              value: value[key],
              isLast: index === keys.length - 1,
              depth: depth + 1,
              forceOpen: true
            }));
          });
          children.push(h('div', { class: 'jv-line', style: indent }, [
            h('span', { class: 'jv-bracket' }, closeBracket),
            !isLast && h('span', { class: 'jv-comma' }, ',')
          ]));
        }

        return h('div', { class: 'jv-node' }, [
          h('div', { class: 'jv-line jv-clickable', style: indent, onClick: toggle }, headerContent),
          children
        ]);
      } else {
        return h('div', { class: 'jv-line', style: indent }, [
          name !== '' && h('span', { class: 'jv-key' }, `${name}: `),
          h('span', { class: valueClass.value }, formattedValue.value),
          !isLast && h('span', { class: 'jv-comma' }, ',')
        ]);
      }
    };
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Rajdhani:wght@400;600&display=swap');

.ac-toggle-btn, .ac-window {
  --ac-gold: #d4af37;
  --ac-gold-dim: #8a7847;
  --ac-black: #0f0f0f;
  --ac-text: #e0e0e0;
  --ac-blue: #00a8e8;
  --ac-red: #b91c1c;
  --ac-grey: #888;

  --font-title: 'Cinzel', serif;
  --font-tech: 'Rajdhani', monospace;
}

/* 悬浮按钮 */
.ac-toggle-btn {
  position: fixed;
  width: 64px;
  height: 64px;
  cursor: pointer;
  z-index: 10001;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ac-toggle-btn:hover { transform: scale(1.1); }
.ac-toggle-btn:active { transform: scale(0.95); }

.ac-logo-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.5));
}

.animus-pulse {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 100%; height: 100%;
  border-radius: 50%;
  border: 1px solid var(--ac-gold);
  opacity: 0;
  animation: pulse-ring 3s infinite;
  pointer-events: none;
}

@keyframes pulse-ring {
  0% { width: 60%; height: 60%; opacity: 0; border-width: 2px; }
  50% { opacity: 0.5; }
  100% { width: 140%; height: 140%; opacity: 0; border-width: 0px; }
}

/* 主窗口 */
.ac-window {
  position: fixed;
  /* 移除固定宽高，由 Vue style 控制 */
  /* width: 600px; */
  /* height: 500px; */
  background: rgba(15, 15, 15, 0.95);
  border: 1px solid var(--ac-gold-dim);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8), inset 0 0 50px rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  color: var(--ac-text);
  font-family: var(--font-tech);
  backdrop-filter: blur(5px);
  /* 优化：告诉浏览器这些属性会变化 */
  will-change: top, left, width, height;
}

/*
  优化：拖拽时禁用高消耗特效
  这能显著减少拖拽时的卡顿
*/
.ac-window.is-dragging {
  backdrop-filter: none; /* 禁用毛玻璃 */
  box-shadow: 0 0 10px rgba(0,0,0,0.8); /* 简化阴影 */
  transition: none !important; /* 禁用所有过渡 */
  opacity: 0.9;
}

.ac-window-border-top {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ac-gold), transparent);
  width: 100%;
}

.ac-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent);
  border-bottom: 1px solid rgba(164, 139, 87, 0.3);
  cursor: move;
  user-select: none;
}

.ac-header-left { display: flex; align-items: center; gap: 10px; }
.ac-icon { color: var(--ac-gold); font-size: 18px; }
.ac-title {
  font-family: var(--font-title);
  color: var(--ac-gold);
  font-size: 14px;
  letter-spacing: 1px;
  text-shadow: 0 0 5px rgba(212, 175, 55, 0.3);
}

.ac-controls button {
  background: transparent;
  border: 1px solid transparent;
  color: var(--ac-gold-dim);
  cursor: pointer;
  font-family: var(--font-tech);
  font-size: 16px;
  margin-left: 5px;
  padding: 0 8px;
  transition: all 0.2s;
}
.ac-controls button:hover {
  color: var(--ac-gold);
  border-color: var(--ac-gold);
  background: rgba(212, 175, 55, 0.1);
}

.ac-content {
  flex: 1;
  overflow: auto;
  padding: 15px;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: var(--ac-gold-dim) #000;
}

.ac-background-grid {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    linear-gradient(rgba(164, 139, 87, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(164, 139, 87, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 0;
}

.ac-empty {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ac-gold-dim);
  font-family: var(--font-title);
}

.blink { animation: blinker 2s linear infinite; font-size: 1.2em; }
@keyframes blinker { 50% { opacity: 0.3; } }
.sub-text { font-family: var(--font-tech); font-size: 0.9em; margin-top: 10px; opacity: 0.7; }

/* 日志条目容器 */
.ac-log-entry {
  position: relative;
  z-index: 1;
  margin-bottom: 12px;
  border-left: 2px solid var(--ac-gold-dim);
  background: rgba(0, 0, 0, 0.4);
  transition: border-color 0.3s;
}

.ac-log-entry:hover {
  border-left-color: var(--ac-gold);
  background: rgba(255, 255, 255, 0.02);
}

/* 思考过程的特殊样式 */
.ac-log-entry.is-think {
  border-left-color: var(--ac-grey);
  background: rgba(0, 0, 0, 0.2);
}

.ac-log-header {
  display: flex;
  justify-content: space-between;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: bold;
  background: rgba(164, 139, 87, 0.1);
  border-bottom: 1px solid rgba(164, 139, 87, 0.1);
}

.ac-log-header.variableinsert { color: #4caf50; }
.ac-log-header.variableedit { color: var(--ac-blue); }
.ac-log-header.variabledelete { color: var(--ac-red); }
.ac-log-header.variablethink { color: var(--ac-grey); font-style: italic; }

.log-index { font-family: var(--font-tech); opacity: 0.7; }
.log-action { font-family: var(--font-title); letter-spacing: 1px; }

/* 内容区域 */
.ac-log-body {
  padding: 10px;
  font-size: 13px;
  overflow-x: auto;
}

/* 思考文本样式 */
.ac-think-text {
  font-family: 'Courier New', Courier, monospace;
  color: #aaa;
  white-space: pre-wrap;
  line-height: 1.4;
  font-size: 12px;
}

.ac-footer {
  padding: 4px 10px;
  font-size: 10px;
  color: #555;
  border-top: 1px solid #333;
  display: flex;
  justify-content: space-between; /* 调整布局以容纳图标 */
  align-items: center;
  background: #0a0a0a;
  user-select: none;
}

.resize-handle-icon {
  color: var(--ac-gold-dim);
  cursor: se-resize;
  font-size: 8px;
}

/* JSON Tree 样式覆盖 */
:deep(.jv-node) { position: relative; font-family: 'Consolas', monospace; }
:deep(.jv-line) { display: flex; align-items: flex-start; flex-wrap: wrap; white-space: pre-wrap; }
:deep(.jv-clickable) { cursor: pointer; }
:deep(.jv-clickable:hover) { background-color: rgba(212, 175, 55, 0.1); }
:deep(.jv-toggle) { display: inline-block; width: 16px; text-align: center; margin-right: 4px; color: var(--ac-gold); transition: transform 0.2s; }
:deep(.jv-toggle.open) { transform: rotate(90deg); }
:deep(.jv-key) { color: var(--ac-blue); }
:deep(.jv-string) { color: #ce9178; }
:deep(.jv-number) { color: #b5cea8; }
:deep(.jv-boolean) { color: #569cd6; }
:deep(.jv-null) { color: var(--ac-red); }
:deep(.jv-bracket), :deep(.jv-comma) { color: #666; }
:deep(.jv-ellipsis) { background: #333; padding: 0 4px; border-radius: 2px; color: #aaa; }
:deep(.jv-count) { color: #555; font-style: italic; margin-left: 8px; }
</style>
