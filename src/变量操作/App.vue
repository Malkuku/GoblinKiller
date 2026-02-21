<template>
  <!--
    修改点 1:
    外层容器不再是全屏 fixed，而是类似文件二的卡片容器。
    添加 :class="{ active: isExpanded }" 用于处理展开时的边框高亮等样式
  -->
  <div class="ac-layout" :class="{ active: isExpanded }">

    <!-- 背景：现在它只填充在这个卡片容器内部，而不是全屏 -->
    <div class="animus-background"></div>

    <!-- 顶部标题栏 -->
    <div class="content-header" @click="toggleExpand">
      <div class="header-row">
        <span class="header-arrow" :class="{ open: isExpanded }">▶</span>
        <h1 class="header-title">变量更新结果</h1>
      </div>
      <!-- 装饰线 -->
      <div class="header-line"></div>
    </div>

    <!-- JSON 内容区 -->
    <div v-show="isExpanded" class="json-scroll-container">
      <div class="json-wrapper">
        <JsonNode
          :value="parsedData"
          name="stat_data"
          :is-last="true"
          :depth="0"
          :force-open="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, h, defineComponent, computed } from 'vue';

const isExpanded = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// 接收原始数据
const rawInput = $2;

const parsedData = computed(() => {
  // 1. 如果已经是对象，直接返回
  if (typeof rawInput === 'object' && rawInput !== null) {
    return rawInput;
  }

  // 2. 如果是字符串，尝试解析
  if (typeof rawInput === 'string') {
    try {
      const cleaned = rawInput.replace(/\n/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      return {
        error: "Invalid JSON String",
        raw: rawInput,
        message: e.message
      };
    }
  }

  // 3. 其他情况（如 null 或 undefined）
  return {
    error: "Unknown Data Type",
    type: typeof rawInput,
    raw: rawInput
  };
});

// ============================================================
// JsonNode 组件保持不变
// ============================================================
const JsonNode = defineComponent({
  name: 'JsonNode',
  props: {
    name: { type: [String, Number], default: '' },
    value: { type: [Object, Array, String, Number, Boolean, null], default: null },
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
      if (props.value === null) return 'null';
      if (typeof props.value === 'string') return `"${props.value}"`;
      return String(props.value);
    });

    return () => {
      const { name, value, isLast, depth } = props;
      const indent = { paddingLeft: `${depth * 20}px` };

      if (isObject.value) {
        const keys = Object.keys(value);
        const isEmpty = keys.length === 0;
        const openBracket = isArray.value ? '[' : '{';
        const closeBracket = isArray.value ? ']' : '}';
        const itemCount = keys.length;
        const itemLabel = itemCount === 1 ? 'item' : 'items';

        const headerContent = [
          !isEmpty && h('span', {
            class: ['jv-toggle', { open: isOpen.value }],
            onClick: (e) => { e.stopPropagation(); toggle(); }
          }, '▶'),
          name !== '' && h('span', { class: 'jv-key' }, `${name}: `),
          h('span', { class: 'jv-bracket' }, openBracket),
          !isOpen.value && !isEmpty && h('span', { class: 'jv-ellipsis', onClick: toggle }, ` ... `),
          (!isOpen.value || isEmpty) && h('span', { class: 'jv-bracket' }, closeBracket),
          (!isLast && (!isOpen.value || isEmpty)) && h('span', { class: 'jv-comma' }, ','),
          !isOpen.value && !isEmpty && h('span', { class: 'jv-count' }, ` // ${itemCount} ${itemLabel}`)
        ];

        const children = [];
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
/*
  修改点 2: CSS 变量调整，去掉了全屏背景色，改用组件级变量
*/
.ac-layout {
  --c-bg-overlay: #1a1a1a; /* 改为实色背景，类似文件二的 --bg-secondary */
  --c-gold: #a48b57;
  --c-gold-dim: #7a6640;
  --c-text-main: #e0e0e0;
  --c-text-dim: #8a92a0;
  --c-border: rgba(164, 139, 87, 0.3);

  --j-string: #ce9178;
  --j-number: #b5cea8;
  --j-boolean: #569cd6;
  --j-null: #569cd6;
  --j-key: #a48b57;

  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', monospace;

  /*
     关键修改：
     1. position: relative (不再是 fixed)
     2. 去掉 height: 100dvh (高度由内容撑开)
     3. 增加 margin, max-width, border-radius (卡片化)
  */
  position: relative;
  display: flex;
  flex-direction: column;
  font-family: var(--font-body);
  color: var(--c-text-main);
  background: var(--c-bg-overlay); /* 基础背景色 */

  /* 卡片样式 */
  margin: 10px auto;
  max-width: 800px;
  border: 1px solid var(--c-border);
  border-radius: 4px;
  overflow: hidden; /* 确保圆角生效 */
  box-shadow: 0 4px 6px rgba(0,0,0,0.5);
  transition: border-color 0.3s, margin-bottom 0.3s;
}

/* 激活状态（展开时）高亮边框 */
.ac-layout.active {
  border-color: var(--c-gold);
  margin-bottom: 15px;
}

/* 背景层：现在它是 absolute 填充在 .ac-layout 内部 */
.animus-background {
  position: absolute;
  inset: 0;
  /* 稍微调整透明度，让它作为纹理存在 */
  background-image: radial-gradient(circle at center, rgba(164, 139, 87, 0.05) 0%, transparent 70%);
  z-index: 0; /* 放在最底层 */
  pointer-events: none;
}

.content-header {
  position: relative; /* 确保在背景之上 */
  z-index: 1;
  padding: 2px 12px; /* 进一步减少内边距 */
  border-bottom: 1px solid transparent; /* 默认透明 */
  background: rgba(0,0,0,0.2);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

/* 展开时给标题栏加个底边框，区分内容 */
.ac-layout.active .content-header {
  border-bottom-color: var(--c-border);
}

.content-header:hover {
  background: rgba(164, 139, 87, 0.1);
}

.header-row {
  display: flex;
  align-items: center;
}

.header-arrow {
  display: inline-block;
  margin-right: 6px; /* 进一步减少右边距 */
  color: var(--c-gold);
  font-size: 0.6rem; /* 进一步减小箭头 */
  transition: transform 0.3s ease;
}

.header-arrow.open {
  transform: rotate(90deg);
}

.header-title {
  margin: 0;
  font-family: var(--font-title);
  color: var(--c-gold);
  font-size: 0.8rem; /* 进一步减小字体 */
  letter-spacing: 0.5px; /* 进一步减少字间距 */
  line-height: 1; /* 最小化行高 */
}

.header-line {
  margin-top: 1px; /* 进一步减少上边距 */
  height: 1px;
  width: 40px; /* 进一步缩短装饰线 */
  background: linear-gradient(90deg, var(--c-gold), transparent);
}

/* 滚动区域 */
.json-scroll-container {
  position: relative; /* 确保在背景之上 */
  z-index: 1;
  overflow: auto;
  padding: 20px 30px;
  scrollbar-width: thin;
  max-height: 600px; /* 限制最大高度，内部滚动 */
  scrollbar-color: var(--c-gold-dim) transparent;
  background: rgba(0, 0, 0, 0.3); /* 内容区稍微深一点的背景 */
}

.json-wrapper {
  font-family: 'Consolas', 'Monaco', var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  color: var(--c-text-dim);
}

/* JSON Tree 样式 (保持不变) */
:deep(.jv-node) { position: relative; }
:deep(.jv-line) {
  display: flex; align-items: flex-start; flex-wrap: wrap;
  white-space: pre-wrap; transition: background 0.2s; border-radius: 4px;
}
:deep(.jv-clickable) { cursor: pointer; }
:deep(.jv-clickable:hover) { background-color: rgba(255, 255, 255, 0.05); }
:deep(.jv-toggle) {
  display: inline-block; width: 16px; text-align: center; margin-right: 4px;
  font-size: 0.8em; color: var(--c-gold); transition: transform 0.2s; user-select: none;
}
:deep(.jv-toggle.open) { transform: rotate(90deg); }
:deep(.jv-key) { color: var(--j-key); font-weight: bold; }
:deep(.jv-bracket), :deep(.jv-comma) { color: var(--c-text-dim); opacity: 0.7; }
:deep(.jv-ellipsis) {
  color: var(--c-text-dim); background: rgba(255,255,255,0.1);
  padding: 0 4px; border-radius: 2px; margin: 0 2px; font-size: 0.8em; cursor: pointer;
}
:deep(.jv-ellipsis:hover) { background: var(--c-gold); color: #000; }
:deep(.jv-count) { color: #5a6270; font-style: italic; font-size: 0.9em; margin-left: 8px; }
:deep(.jv-string) { color: var(--j-string); word-break: break-all; }
:deep(.jv-number) { color: var(--j-number); }
:deep(.jv-boolean) { color: var(--j-boolean); }
:deep(.jv-null) { color: var(--j-null); font-style: italic; }
</style>
