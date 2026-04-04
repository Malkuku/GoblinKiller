<template>
  <transition name="slide-down-edit">
    <div class="edit-panel variable-panel">
      <div class="edit-header">
        <span>变量监控</span>
        <button class="close-edit" @click="$emit('close')">✕</button>
      </div>

      <div class="edit-body ac-content">
        <div v-if="parsedLogs.length === 0" class="ac-empty">
          <span class="blink">SEARCHING MEMORY BLOCKS...</span>
          <div class="sub-text">No variable modifications detected.</div>
        </div>

        <div v-for="(log, index) in parsedLogs" :key="index" class="ac-log-entry" :class="{ 'is-think': log.type === 'variablethink' }">
          <div class="ac-log-header" :class="log.type">
            <span class="log-index">0x{{ String(index).padStart(4, '0') }}</span>
            <span class="log-action">{{ formatType(log.type) }}</span>
          </div>
          <div class="ac-log-body">
            <div v-if="log.type === 'variablethink'" class="ac-think-text">
              {{ log.data }}
            </div>
            <div v-else class="ac-json-wrapper">
              <JsonNode :value="log.data" :name="''" :is-last="true" :depth="0" :force-open="false" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useMessageStore } from '@/尘史使徒/UI/store/MessageStore';
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue';

const messageStore = useMessageStore();
const parsedLogs = ref<Array<{ type: string, data: any }>>([]);

const formatType = (type: string) => {
  const map: Record<string, string> = {
    'variableinsert': 'ALLOCATE',
    'variableedit': 'OVERWRITE',
    'variabledelete': 'DEALLOCATE',
    'variablethink': '>> SYNAPTIC PROCESS'
  };
  return map[type] || type.toUpperCase();
};

function parsePath(path: string): string[] {
  if (!path) return [];
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return normalized.split('/').filter(seg => seg !== '');
}

function isNumericIndex(str: string): boolean {
  return /^\d+$/.test(str);
}

function ensureParent(root: any, segments: string[], createMissing = true): { parent: any; key: string } | null {
  let current = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];
    if (!(seg in current)) {
      if (!createMissing) return null;
      if (nextSeg && (nextSeg === '-' || isNumericIndex(nextSeg))) {
        current[seg] = [];
      } else {
        current[seg] = {};
      }
    }
    current = current[seg];
  }
  return { parent: current, key: segments[segments.length - 1] };
}

function setAtPath(root: any, segments: string[], value: any, isAppend = false) {
  if (segments.length === 0) {
    Object.assign(root, value);
    return;
  }
  const parentInfo = ensureParent(root, segments, true);
  if (!parentInfo) return;
  const { parent, key } = parentInfo;

  if (isAppend && key === '-') {
    if (Array.isArray(parent)) parent.push(value);
  } else {
    parent[key] = value;
  }
}

function removeAtPath(root: any, segments: string[]) {
  if (segments.length === 0) return;
  const parentInfo = ensureParent(root, segments, false);
  if (!parentInfo) return;
  const { parent, key } = parentInfo;
  if (Array.isArray(parent)) {
    const index = Number(key);
    if (!isNaN(index) && index >= 0 && index < parent.length) {
      parent.splice(index, 1);
    }
  } else {
    delete parent[key];
  }
}

function deltaAtPath(root: any, segments: string[], delta: number) {
  const parentInfo = ensureParent(root, segments, false);
  if (!parentInfo) {
    setAtPath(root, segments, 0);
    deltaAtPath(root, segments, delta);
    return;
  }
  const { parent, key } = parentInfo;
  let currentValue = parent[key];
  if (typeof currentValue === 'number') {
    parent[key] = currentValue + delta;
  } else {
    parent[key] = delta;
  }
}

function applyJSONPatch(patchArray: any[]): any {
  const root = {};
  for (const op of patchArray) {
    const { op: type, path, value } = op;
    const segments = parsePath(path);
    try {
      switch (type) {
        case 'replace':
        case 'insert':
          setAtPath(root, segments, value, type === 'insert' && segments[segments.length - 1] === '-');
          break;
        case 'delta':
          deltaAtPath(root, segments, value);
          break;
        case 'remove':
          removeAtPath(root, segments);
          break;
      }
    } catch (e) {
      console.error('Error applying patch operation:', op, e);
    }
  }
  return root;
}
const parseMessageContent = () => {
  const text = messageStore.message;
  if (!text) {
    parsedLogs.value = [];
    return;
  }

  const results = [];

  // 1. 匹配 <variable...> 系列标签
  const varRegex = /<(variable(?:insert|edit|delete|think))>(.*?)<\/\1>/gsi;
  let varMatch;
  while ((varMatch = varRegex.exec(text)) !== null) {
    const type = varMatch[1].toLowerCase();
    const content = varMatch[2];
    let parsedData = type === 'variablethink' ? content.trim() : content;
    try { if (type !== 'variablethink') parsedData = JSON.parse(content); } catch (e) {}
    results.push({ type, data: parsedData });
  }

  // 2. 匹配 <UpdateVariable> 标签及其内部的 <Analysis> 和 <JSONPatch>
  const updateVarRegex = /<UpdateVariable>([\s\S]*?)<\/UpdateVariable>/gi;
  let updateMatch;
  while ((updateMatch = updateVarRegex.exec(text)) !== null) {
    const updateContent = updateMatch[1];

    const analysisRegex = /<Analysis>([\s\S]*?)<\/Analysis>/i;
    const analysisMatch = analysisRegex.exec(updateContent);
    if (analysisMatch) {
      const analysisText = analysisMatch[1].trim();
      results.push({ type: 'variablethink', data: analysisText });
    }

    const patchRegex = /<JSONPatch>([\s\S]*?)<\/JSONPatch>/i;
    const patchMatch = patchRegex.exec(updateContent);
    if (patchMatch) {
      const patchContent = patchMatch[1].trim();
      try {
        const patchArray = JSON.parse(patchContent);
        if (Array.isArray(patchArray)) {
          const finalTree = applyJSONPatch(patchArray);
          results.push({ type: 'variableedit', data: finalTree });
        } else {
          results.push({ type: 'jsonpatch', data: patchArray });
        }
      } catch (e) {
        results.push({ type: 'jsonpatch', data: patchContent });
      }
    }
  }

  parsedLogs.value = results;
};


onMounted(() => {
  parseMessageContent();
});

watch(() => messageStore.message, () => {
  parseMessageContent();
});

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
.edit-panel {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 65%; height: 90%; background: var(--scroll-paper);
  border: 1px solid var(--scroll-border); border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 10000;
  display: flex; flex-direction: column; color: var(--text-main);
}
.edit-header {
  padding: 12px 20px; background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid var(--scroll-border);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--accent-gold); font-weight: bold; font-size: 1rem; flex-shrink: 0;
}
.close-edit { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; transition: color 0.3s; }
.close-edit:hover { color: var(--accent-gold); }
.edit-body { flex: 1; padding: 15px; overflow-y: auto; scrollbar-width: thin; }

.ac-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); }
.blink { animation: blinker 2s linear infinite; font-size: 1.2em; }
@keyframes blinker { 50% { opacity: 0.3; } }
.sub-text { font-family: monospace; font-size: 0.9em; margin-top: 10px; opacity: 0.7; }

.ac-log-entry {
  margin-bottom: 12px; border-left: 3px solid var(--scroll-border);
  background: rgba(0, 0, 0, 0.02); transition: border-color 0.3s;
}
.ac-log-entry:hover { border-left-color: var(--accent-gold); background: rgba(0, 0, 0, 0.04); }
.ac-log-entry.is-think { border-left-color: var(--text-muted); }

.ac-log-header {
  display: flex; justify-content: space-between; padding: 6px 12px; font-size: 12px; font-weight: bold;
  background: rgba(0, 0, 0, 0.03); border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.ac-log-header.variableinsert { color: #2e7d32; }
.ac-log-header.variableedit { color: #0277bd; }
.ac-log-header.variabledelete { color: #c62828; }
.ac-log-header.variablethink { color: var(--text-muted); font-style: italic; }

.log-index { font-family: monospace; opacity: 0.7; }
.log-action { letter-spacing: 1px; }
.ac-log-body { padding: 12px; font-size: 13px; overflow-x: auto; }
.ac-think-text { font-family: 'Courier New', Courier, monospace; color: var(--text-muted); white-space: pre-wrap; line-height: 1.5; font-size: 13px; }

/* JSON Tree 适配明亮主题 */
:deep(.jv-node) { position: relative; font-family: 'Consolas', monospace; }
:deep(.jv-line) { display: flex; align-items: flex-start; flex-wrap: wrap; white-space: pre-wrap; }
:deep(.jv-clickable) { cursor: pointer; }
:deep(.jv-clickable:hover) { background-color: rgba(0, 0, 0, 0.05); }
:deep(.jv-toggle) { display: inline-block; width: 16px; text-align: center; margin-right: 4px; color: var(--accent-gold); transition: transform 0.2s; }
:deep(.jv-toggle.open) { transform: rotate(90deg); }
:deep(.jv-key) { color: #0277bd; }
:deep(.jv-string) { color: #c62828; }
:deep(.jv-number) { color: #2e7d32; }
:deep(.jv-boolean) { color: #1565c0; }
:deep(.jv-null) { color: #7f8c8d; }
:deep(.jv-bracket), :deep(.jv-comma) { color: var(--text-main); }
:deep(.jv-ellipsis) { background: rgba(0,0,0,0.1); padding: 0 4px; border-radius: 2px; color: var(--text-muted); }
:deep(.jv-count) { color: var(--text-muted); font-style: italic; margin-left: 8px; }

.slide-down-edit-enter-active, .slide-down-edit-leave-active { transition: all 0.3s ease; }
.slide-down-edit-enter-from, .slide-down-edit-leave-to { opacity: 0; transform: translate(-50%, -55%); }

@media (max-width: 1000px) {
  .edit-panel {
    top: 50px;
    left: 0;
    right: 0;
    margin: 0 auto;
    transform: none;
    width: 95%;
    height: 80dvh;
    border-radius: 6px;
    border: 1px solid var(--scroll-border);
  }
  .slide-down-edit-enter-from, .slide-down-edit-leave-to { opacity: 0; transform: translateY(-10px); }
}
</style>
