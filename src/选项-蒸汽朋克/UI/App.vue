<template>
  <div
    v-if="!uiStore.showUI"
    ref="draggableBtn"
    class="ac-toggle-btn"
    :class="{ 'has-branch': hasBranches }"
    :style="btnPositionStyle"
    title="展开命运分歧"
    @click="handleBtnClick"
  >
    <!-- 蒸汽朋克风格：命运罗盘 SVG -->
    <!-- [修改] 增加 !hasActed 判断，点击后停止呼吸灯 -->
    <svg viewBox="0 0 100 100" class="ac-logo-svg" :class="{ 'is-pulsing': hasBranches && !hasActed }">
      <defs>
        <linearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e5c07b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8a6d3b;stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g transform="translate(50, 50)" filter="url(#glow)">
        <!-- 外环 -->
        <circle cx="0" cy="0" r="42" fill="none" stroke="url(#compassGradient)" stroke-width="3" />
        <circle cx="0" cy="0" r="36" fill="none" stroke="url(#compassGradient)" stroke-width="1" stroke-dasharray="2 4" />

        <!-- 刻度 -->
        <path d="M 0 -42 L 0 -30 M 0 42 L 0 30 M -42 0 L -30 0 M 42 0 L 30 0" stroke="url(#compassGradient)" stroke-width="2" />
        <path d="M 28 -28 L 20 -20 M -28 28 L -20 20 M -28 -28 L -20 -20 M 28 28 L 20 20" stroke="url(#compassGradient)" stroke-width="1.5" />

        <!-- 指针 (若有新分支，指针会旋转) -->
        <!-- [修改] 增加 !hasActed 判断，点击后停止旋转 -->
        <g class="compass-needle" :class="{ 'spinning': hasBranches && !hasActed }">
          <polygon points="0,-25 6,0 0,25 -6,0" fill="url(#compassGradient)" />
          <circle cx="0" cy="0" r="3" fill="#1a1511" />
        </g>
      </g>
    </svg>

    <!-- 提示红点 -->
    <!-- [修改] 增加 !hasActed 判断，并显示具体选项数量 -->
    <div v-if="hasBranches && !hasActed" class="notification-dot">
      {{ currentBranchData.options.length }}
    </div>
  </div>

  <!-- 模式 2: 展开状态 - 剧情分支选择器 -->
  <div
    v-if="uiStore.showUI"
    ref="draggableWindow"
    class="ac-window"
    :class="{ 'is-dragging': isDragging }"
    :style="windowStyle"
  >
    <!-- 顶部装饰 -->
    <div class="ac-window-border-top"></div>

    <!-- 标题栏 -->
    <div class="ac-header">
      <div class="ac-header-left">
        <span class="ac-icon">◈</span>
        <span class="ac-title">命运分歧终端</span>
      </div>
      <div class="ac-controls">
        <button @click.stop="refreshData" title="重新扫描">↻</button>
        <button @click.stop="toggleUI" title="收起">_</button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="ac-content">
      <div class="ac-background-grid"></div>

      <!-- 空状态 -->
      <div v-if="!currentBranchData" class="ac-empty">
        <span class="blink">等待命运指引...</span>
      </div>

      <!-- 分支列表 -->
      <div v-else class="branch-container">
        <div class="branch-summary">
          <span class="summary-label">当前情境:</span>
          <span class="summary-text">{{ currentBranchData.summary || '未知分支' }}</span>
        </div>

        <div class="options-list">
          <div
            v-for="(opt, idx) in currentBranchData.options"
            :key="idx"
            class="option-card"
            @click="selectOption(opt.fullText)"
          >
            <div class="option-letter">{{ opt.letter }}</div>
            <div class="option-content">
              <div class="option-tag" v-if="opt.tag">{{ opt.tag }}</div>
              <div class="option-desc">{{ opt.desc }}</div>
            </div>
            <div class="option-action">✎</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <div class="ac-footer">
      <span>检测到 {{ currentBranchData?.options.length || 0 }} 条世界线</span>

      <!-- [新增] 直接发送勾选框 -->
      <label class="auto-send-label">
        <input type="checkbox" v-model="uiStore.autoSend" @change="saveSettings" />
        直接发送
      </label>

      <span class="resize-handle-icon">◢</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, reactive } from 'vue';
import { useUiStore } from '@/选项-蒸汽朋克/UI/store/UIStore';
import { useMessageStore } from '@/选项-蒸汽朋克/UI/store/MessageStore';

// [新增] 假设这是你获取和保存变量的 API，请根据实际路径调整导入
// import { getVariables, getScriptId, updateVariablesWith } from '你的API路径';

// ----------------------------------------------------------------------
// 类型定义
// ----------------------------------------------------------------------
interface BranchOption {
  letter: string;
  tag: string;
  desc: string;
  fullText: string;
}

interface BranchData {
  summary: string;
  options: BranchOption[];
}

// ----------------------------------------------------------------------
// 状态管理
// ----------------------------------------------------------------------
const uiStore = useUiStore();
const messageStore = useMessageStore();

const draggableBtn = ref<HTMLElement | null>(null);
const draggableWindow = ref<HTMLElement | null>(null);
const isDragging = ref(false);

// [新增] 记录是否已经点击过选项
const hasActed = ref(false);

// 解析后的数据
const currentBranchData = ref<BranchData | null>(null);
const hasBranches = computed(() => !!currentBranchData.value);

// 窗口位置状态
const btnPosition = reactive({ top: 100, left: 100 });
const windowState = reactive({ top: 100, left: 100, width: 500, height: 400 });

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

// ----------------------------------------------------------------------
// 持久化设置逻辑 [新增]
// ----------------------------------------------------------------------
const loadSettings = () => {
  try {
    // 请确保 getVariables 和 getScriptId 已正确导入
    const variables = getVariables({ type: 'script', script_id: getScriptId() });
    uiStore.autoSend = variables.autoSend || false;
  } catch (error) {
    console.warn('获取UI设置失败', error);
  }
};

const saveSettings = () => {
  try {
    updateVariablesWith(
      vars => ({
        ...vars,
        autoSend: uiStore.autoSend,
      }),
      { type: 'script', script_id: getScriptId() },
    );
  } catch (error) {
    console.warn('保存UI设置失败', error);
  }
};

// ----------------------------------------------------------------------
// 核心逻辑：解析 <branches>
// ----------------------------------------------------------------------
const parseMessageContent = () => {
  const text = messageStore.message;
  if (!text) {
    currentBranchData.value = null;
    return;
  }

  const branchRegex = /<branches>([\s\S]*?)<\/branches>/i;
  const match = branchRegex.exec(text);

  if (!match) {
    currentBranchData.value = null;
    return;
  }

  const content = match[1];

  let summary = "剧情分支";
  const summaryRegex = /<summary>(.*?)<\/summary>/i;
  const summaryMatch = summaryRegex.exec(content);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  const cleanContent = content
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const options: BranchOption[] = [];
  const optionLineRegex = /^([A-Z])\.\s*(.*)$/;

  cleanContent.forEach(line => {
    const lineMatch = optionLineRegex.exec(line);
    if (lineMatch) {
      const letter = lineMatch[1];
      const rawContent = lineMatch[2];

      let tag = '';
      let desc = rawContent;
      const tagMatch = /^【(.*?)】(.*)$/.exec(rawContent);
      if (tagMatch) {
        tag = tagMatch[1];
        desc = tagMatch[2];
      }

      options.push({
        letter,
        tag,
        desc: desc.trim(),
        fullText: line
      });
    }
  });

  if (options.length > 0) {
    currentBranchData.value = { summary, options };
    // [新增] 成功解析到新分支时，重置操作状态，恢复罗盘旋转和红点
    hasActed.value = false;
  } else {
    currentBranchData.value = null;
  }
};

// ----------------------------------------------------------------------
// 交互逻辑：写入输入框
// ----------------------------------------------------------------------
const selectOption = (text: string) => {
  const textarea = parent.document.querySelector('#send_textarea') as HTMLTextAreaElement;
  if (textarea) {
    // 1. 写入值
    textarea.value = text;

    // 2. 触发 input 事件
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // 3. 聚焦并调整高度
    textarea.focus();
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';

    // [新增] 4. 标记为已操作，停止罗盘旋转和红点
    hasActed.value = true;

    // [新增] 5. 如果勾选了“直接发送”，则触发发送按钮点击
    if (uiStore.autoSend) {
      // 注意：请确认你页面中发送按钮的实际 ID 或 Class
      const sendBtn = parent.document.querySelector('#send_but') as HTMLButtonElement;
      if (sendBtn) {
        // 稍微延迟一下确保 textarea 的值已经绑定成功
        setTimeout(() => {
          sendBtn.click();
        }, 50);
      }
    }
  }
};

const toggleUI = () => {
  if (isDragging.value) return;
  uiStore.showUI = !uiStore.showUI;
};

const handleBtnClick = () => {
  if (!isDragging.value) {
    toggleUI();
  }
};

const refreshData = () => {
  messageStore.getMessage();
  parseMessageContent();
};

// ----------------------------------------------------------------------
// 拖拽与初始化 (jQuery UI)
// ----------------------------------------------------------------------
const initDraggable = () => {
  if (draggableBtn.value) {
    const $btn = $(draggableBtn.value);
    if ($btn.data('ui-draggable')) $btn.draggable('destroy');

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

  if (draggableWindow.value) {
    const $win = $(draggableWindow.value);
    if ($win.data('ui-draggable')) $win.draggable('destroy');
    if ($win.data('ui-resizable')) $win.resizable('destroy');

    $win.draggable({
      handle: '.ac-header',
      containment: 'window',
      scroll: false,
      start: () => { isDragging.value = true; },
      stop: (event, ui) => {
        isDragging.value = false;
        windowState.top = ui.position.top;
        windowState.left = ui.position.left;
      }
    });

    $win.resizable({
      minHeight: 200,
      minWidth: 300,
      handles: 'all',
      start: () => { isDragging.value = true; },
      stop: (event, ui) => {
        isDragging.value = false;
        windowState.width = ui.size.width;
        windowState.height = ui.size.height;
        windowState.top = ui.position.top;
        windowState.left = ui.position.left;
      }
    });
  }
};

// ----------------------------------------------------------------------
// 生命周期与监听
// ----------------------------------------------------------------------
watch(() => uiStore.showUI, () => {
  nextTick(() => initDraggable());
});

watch(() => messageStore.message, () => {
  parseMessageContent();
});

onMounted(() => {
  loadSettings(); // [新增] 挂载时读取持久化设置
  refreshData();
  nextTick(() => initDraggable());
});
</script>

<style scoped>
/* 原有样式保持不变，新增底部勾选框样式 */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

.ac-toggle-btn, .ac-window {
  --ac-gold: #c5a059;
  --ac-gold-dim: #8a6d3b;
  --ac-black: #1a1511;
  --ac-text: #e8dcc7;
  --ac-highlight: #ffdfba;
  --ac-bg-trans: rgba(26, 21, 17, 0.95);

  --font-title: 'Cinzel', serif;
  --font-body: 'Courier Prime', monospace;
}

/* ================== 悬浮按钮 ================== */
.ac-toggle-btn {
  position: fixed;
  width: 64px;
  height: 64px;
  cursor: pointer;
  z-index: 90001;
  transition: transform 0.2s;
}

.ac-toggle-btn:hover { transform: scale(1.1); }
.ac-toggle-btn:active { transform: scale(0.95); }

.ac-logo-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 5px rgba(0,0,0,0.5));
}

.compass-needle {
  transition: transform 1s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform-origin: 0 0;
}
.compass-needle.spinning {
  animation: needle-spin 4s infinite alternate ease-in-out;
}
@keyframes needle-spin {
  0% { transform: rotate(-45deg); }
  100% { transform: rotate(225deg); }
}

.is-pulsing {
  filter: drop-shadow(0 0 8px var(--ac-gold));
}

.notification-dot {
  position: absolute;
  top: 0; right: 0;
  width: 20px; height: 20px;
  background: #a73a3a;
  color: white;
  border-radius: 50%;
  font-size: 12px; /* 稍微调小一点以适应数字 */
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--ac-black);
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* ================== 主窗口 ================== */
.ac-window {
  position: fixed;
  background: var(--ac-bg-trans);
  border: 2px solid var(--ac-gold-dim);
  border-radius: 4px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.9);
  z-index: 90000;
  display: flex;
  flex-direction: column;
  color: var(--ac-text);
  font-family: var(--font-body);
  backdrop-filter: blur(5px);
}

.ac-window-border-top {
  height: 4px;
  background: repeating-linear-gradient(
    45deg,
    var(--ac-gold-dim),
    var(--ac-gold-dim) 10px,
    var(--ac-black) 10px,
    var(--ac-black) 20px
  );
  border-bottom: 1px solid var(--ac-gold);
}

.ac-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: linear-gradient(to bottom, rgba(197, 160, 89, 0.15), transparent);
  border-bottom: 1px solid var(--ac-gold-dim);
  cursor: move;
  user-select: none;
}

.ac-title {
  font-family: var(--font-title);
  color: var(--ac-gold);
  font-weight: bold;
  margin-left: 8px;
  letter-spacing: 1px;
}

.ac-controls button {
  background: transparent;
  border: none;
  color: var(--ac-gold-dim);
  cursor: pointer;
  font-size: 16px;
  margin-left: 5px;
}
.ac-controls button:hover { color: var(--ac-gold); }

.ac-content {
  flex: 1;
  overflow: auto;
  padding: 15px;
  position: relative;
}

.ac-background-grid {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: radial-gradient(rgba(197, 160, 89, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 0;
}

/* ================== 分支内容样式 ================== */
.branch-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.branch-summary {
  border-bottom: 1px dashed var(--ac-gold-dim);
  padding-bottom: 10px;
  margin-bottom: 5px;
}

.summary-label {
  color: var(--ac-gold-dim);
  font-size: 0.9em;
  display: block;
  margin-bottom: 4px;
}

.summary-text {
  color: var(--ac-gold);
  font-family: var(--font-title);
  font-size: 1.1em;
  text-shadow: 0 0 5px rgba(197, 160, 89, 0.2);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-card {
  display: flex;
  align-items: stretch;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--ac-gold-dim);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.option-card:hover {
  background: rgba(197, 160, 89, 0.1);
  border-color: var(--ac-gold);
  transform: translateX(2px);
}

.option-card:active {
  transform: translateX(4px);
  background: rgba(197, 160, 89, 0.2);
}

.option-letter {
  background: rgba(197, 160, 89, 0.1);
  color: var(--ac-gold);
  font-family: var(--font-title);
  font-size: 1.5em;
  font-weight: bold;
  width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--ac-gold-dim);
}

.option-content {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.option-tag {
  color: #5c9ebf;
  font-size: 0.85em;
  font-weight: bold;
  margin-bottom: 4px;
}

.option-desc {
  color: var(--ac-text);
  font-size: 0.95em;
  line-height: 1.4;
}

.option-action {
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ac-gold-dim);
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 1.2em;
}

.option-card:hover .option-action {
  opacity: 1;
}

.ac-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ac-gold-dim);
  position: relative;
  z-index: 1;
}
.blink { animation: blinker 2s linear infinite; }
@keyframes blinker { 50% { opacity: 0.5; } }

.ac-footer {
  padding: 4px 10px;
  font-size: 11px;
  color: #666;
  border-top: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center; /* [修改] 居中对齐 */
  background: #110e0b;
}

/* [新增] 自动发送勾选框样式 */
.auto-send-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--ac-gold-dim);
  transition: color 0.2s;
}
.auto-send-label:hover {
  color: var(--ac-gold);
}
.auto-send-label input[type="checkbox"] {
  accent-color: var(--ac-gold);
  cursor: pointer;
}

.resize-handle-icon { cursor: se-resize; }
</style>
