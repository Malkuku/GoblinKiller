<template>
  <div class="interaction-wrapper">
    <!-- 移动端默认收起时的羽毛笔触发器 (仅移动端可见) -->
    <div class="quill-trigger mobile-only-flex" :class="{ 'is-hidden': isExpanded }" @click="toggleExpand">
      <svg class="quill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
        <line x1="16" y1="8" x2="2" y2="22"></line>
        <line x1="17.5" y1="15" x2="9" y2="15"></line>
      </svg>
    </div>

    <!-- 展开后的交互面板 -->
    <div class="interaction-panel" :class="{ 'is-expanded': isExpanded }">
      <div class="panel-collapse-btn mobile-only" @click="toggleExpand">
        <span>▼ 收起卷轴</span>
      </div>

      <!-- 控制台区域 -->
      <transition name="fade-toolbar">
        <div v-show="!isTavernBusy" class="dashboard-console">
          <UserShortcutBar
            :life-status="userLifeStatus"
          />

          <div class="extra-toolbar">
            <button class="toolbar-btn" @click="$emit('recalculate-variables')" title="重新计算当前变量">
              <span class="icon">⟳</span> 变量重算
            </button>
            <button class="toolbar-btn" @click="$emit('reroll-current')" title="重新生成当前回复">
              <span class="icon">🎲</span> 重塑命运
            </button>
          </div>
        </div>
      </transition>

      <div class="input-wrapper">
        <!-- 选项菜单按钮 -->
        <div class="options-container">
          <transition name="slide-up">
            <div v-if="showOptionsPanel && cachedOptions.length > 0 && !isTavernBusy" class="options-popup-menu">
              <div class="options-header">
                <span>命运分支 ({{ cachedOptions.length }})</span>
                <button class="close-options" @click="showOptionsPanel = false">×</button>
              </div>
              <div class="options-list">
                <button
                  v-for="(option, index) in cachedOptions"
                  :key="index"
                  class="option-item"
                  :style="{ animationDelay: `${index * 0.08}s` }"
                  @click="handleOptionClick(option)"
                >
                  <span class="option-index">{{ index + 1 }}.</span>
                  <span class="option-text">{{ option }}</span>
                </button>
              </div>
            </div>
          </transition>

          <button
            class="options-toggle-btn"
            :class="{
              'has-options': cachedOptions.length > 0 && !isTavernBusy,
              'active': showOptionsPanel,
              'is-rolling': isTavernBusy
            }"
            @click="toggleOptionsPanel"
            :disabled="isTavernBusy"
          >
            <span class="toggle-icon" :class="{'spin-animation': isTavernBusy}">{{ isTavernBusy ? '۞' : '❖' }}</span>
            <span v-if="cachedOptions.length > 0 && !isTavernBusy" class="options-badge">{{ cachedOptions.length }}</span>
          </button>
        </div>

        <!-- 输入框区域 -->
        <div class="input-area-stack">
          <transition name="fade-input" mode="out-in">
            <div v-if="isTavernBusy" class="story-input busy-state" key="busy">
              <span class="busy-icon">
                <svg class="quill-busy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                  <line x1="16" y1="8" x2="2" y2="22"></line>
                  <line x1="17.5" y1="15" x2="9" y2="15"></line>
                </svg>
              </span>
              <span class="busy-text">命运正在书写你的旅途...</span>
            </div>
            <textarea
              v-else
              key="input"
              :value="userInput"
              @input="$emit('update:userInput', ($event.target as HTMLTextAreaElement).value)"
              class="story-input normal-state"
              placeholder="书写你的命运..."
              @keydown.enter.exact.prevent="$emit('send-or-stop')"
            ></textarea>
          </transition>
          <!-- 卷轴风格的底部装饰线 -->
          <div class="input-decorative-line"></div>
        </div>

        <!-- 发送/停止按钮 -->
        <button class="send-btn" :class="{'is-busy': isTavernBusy}" @click="$emit('send-or-stop')">
          <span v-if="!isTavernBusy" class="send-icon">➤</span>
          <div v-else class="stop-icon">■</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import UserShortcutBar from '@/哥杀/UI/components/tool/UserShortcutBar.vue';

const props = defineProps<{
  isTavernBusy: boolean;
  userInput: string;
  cachedOptions: string[];
  userLifeStatus: any;
}>();

const emit = defineEmits<{
  (e: 'update:userInput', value: string): void;
  (e: 'update:strategy', value: string): void;
  (e: 'update:customContent', value: string): void;
  (e: 'send-or-stop'): void;
  (e: 'recalculate-variables'): void;
  (e: 'reroll-current'): void;
}>();

const isExpanded = ref(true);
const showOptionsPanel = ref(false);

onMounted(() => {
  if (window.innerWidth <= 768) {
    isExpanded.value = false;
  }
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

watch(() => props.cachedOptions, (newVal) => {
  if (newVal.length === 0) {
    showOptionsPanel.value = false;
  }
});

const toggleOptionsPanel = () => {
  if (props.isTavernBusy) return;
  if (props.cachedOptions.length > 0) {
    showOptionsPanel.value = !showOptionsPanel.value;
  }
};

const handleOptionClick = (option: string) => {
  emit('update:userInput', option);
  showOptionsPanel.value = false;
  setTimeout(() => {
    const textarea = document.querySelector('.story-input.normal-state') as HTMLTextAreaElement;
    if (textarea) textarea.focus();
  }, 50);
};
</script>

<style scoped>
.interaction-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

/* 交互面板 (卷轴风格) */
.interaction-panel {
  width: 100%;
  background: transparent;
  padding: 20px 10px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: bottom;
  position: relative;
}

/* 卷轴古典双线分割 */
.interaction-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 5%;
  right: 5%;
  height: 3px;
  border-top: 1px solid var(--scroll-border, #d4c4a8);
  border-bottom: 1px solid var(--scroll-border, #d4c4a8);
  opacity: 0.6;
}

.panel-collapse-btn {
  width: 100%;
  text-align: center;
  padding-bottom: 10px;
  color: var(--accent-gold, #c6a664);
  font-size: 0.9rem;
  cursor: pointer;
  border-bottom: 1px dashed rgba(212, 196, 168, 0.3);
  margin-bottom: 15px;
  font-family: 'Cinzel', serif;
}

.dashboard-console {
  width: 100%; max-width: 1024px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 15px;
  gap: 15px;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-border, #d4c4a8) transparent;
  padding-bottom: 5px;
}

.dashboard-console::-webkit-scrollbar {
  height: 6px;
}

.dashboard-console::-webkit-scrollbar-track {
  background: transparent;
}

.dashboard-console::-webkit-scrollbar-thumb {
  background-color: var(--scroll-border, #d4c4a8);
  border-radius: 3px;
  opacity: 0.6;
}

.dashboard-console::-webkit-scrollbar-thumb:hover {
  background-color: var(--accent-gold, #c6a664);
  opacity: 1;
}

.extra-toolbar { display: flex; gap: 10px; justify-content: flex-start;}
.toolbar-btn {
  background: transparent;
  border: 1px solid var(--scroll-border, #d4c4a8);
  color: var(--text-muted, #8b7e70);
  padding: 6px 12px;
  border-radius: 2px;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.3s ease; height: 32px;
}
.toolbar-btn:hover {
  background: rgba(198, 166, 100, 0.1);
  color: var(--text-main, #4a3f35);
  border-color: var(--accent-gold, #c6a664);
}

.input-wrapper { position: relative; width: 100%; max-width: 1024px; display: flex; align-items: flex-end; gap: 15px; }

/* 选项印章按钮 */
.options-toggle-btn {
  width: 50px; height: 50px;
  background: transparent;
  border: 1px solid var(--scroll-border, #d4c4a8);
  border-radius: 50%;
  color: var(--text-muted, #8b7e70);
  font-size: 1.5rem;
  cursor: pointer; transition: all 0.3s ease;
  display: flex; align-items: center; justify-content: center; position: relative;
}
.options-toggle-btn.has-options {
  color: var(--accent-gold, #c6a664);
  border-color: var(--accent-gold, #c6a664);
  box-shadow: inset 0 0 10px rgba(198, 166, 100, 0.1);
}
.options-toggle-btn.active {
  background: var(--accent-gold, #c6a664);
  color: var(--scroll-paper, #fffcf5);
}

/* 旋转动画 (共用) */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin-animation {
  display: inline-block;
  animation: spin-slow 4s linear infinite;
}

/* 选项角标浮动动画 */
@keyframes float-badge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.options-badge {
  position: absolute; top: -2px; right: -2px;
  background: var(--flag-bg, #8c3a3a);
  color: #fff; font-size: 0.7rem; font-weight: bold;
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--scroll-paper, #fffcf5);
  animation: float-badge 2s ease-in-out infinite;
}

/* 选项菜单 - 羊皮纸风格 */
.options-popup-menu {
  position: absolute; bottom: 65px; left: 0; width: 600px; max-height: 400px;
  background: var(--scroll-paper, #fffcf5);
  border: 1px solid var(--accent-gold, #c6a664);
  border-radius: 2px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15), inset 0 0 20px rgba(198, 166, 100, 0.05);
  display: flex; flex-direction: column; z-index: 50; overflow: hidden;
}
.options-header {
  padding: 12px 15px;
  background: rgba(198, 166, 100, 0.15);
  border-bottom: 1px solid var(--scroll-border, #d4c4a8);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--text-main, #4a3f35); font-family: 'Cinzel', serif; font-size: 0.95rem; font-weight: bold;
}
.close-options { background: none; border: none; color: var(--text-muted, #8b7e70); cursor: pointer; font-size: 1.4rem; transition: color 0.2s; }
.close-options:hover { color: var(--flag-bg, #8c3a3a); }
.options-list { overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }

/* 选项依次滑入动画 */
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(-15px); }
  to { opacity: 1; transform: translateX(0); }
}
.option-item {
  background: transparent;
  border: 1px dashed var(--scroll-border, #d4c4a8);
  padding: 12px; color: var(--text-main, #4a3f35);
  text-align: left; cursor: pointer;
  font-family: 'EB Garamond', serif; font-size: 1.05rem;
  transition: all 0.2s; display: flex; gap: 10px; border-radius: 2px;
  opacity: 0;
  animation: slide-in-right 0.4s ease-out forwards;
}
.option-index { color: var(--accent-gold, #c6a664); font-weight: bold; font-family: 'Cinzel', serif; }
.option-item:hover {
  background: rgba(198, 166, 100, 0.08);
  border-color: var(--accent-gold, #c6a664);
  border-style: solid;
  transform: translateX(4px);
}

/* 输入框区域 - 融入纸张 */
.input-area-stack { flex: 1; position: relative; height: 50px; }

.story-input {
  width: 100%; height: 100%;
  background: transparent !important;
  border: none !important;
  color: var(--text-main, #4a3f35) !important;
  padding: 10px 15px;
  font-family: 'EB Garamond', serif; font-size: 1.15rem;
  resize: none; transition: all 0.3s; display: block;
  line-height: 1.5;
}
.story-input::placeholder {
  color: var(--text-muted, #8b7e70) !important;
  font-style: italic;
  opacity: 0.6;
}
.story-input:focus {
  outline: none !important;
  background: rgba(198, 166, 100, 0.03) !important;
}

/* 底部墨迹装饰线 */
.input-decorative-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-gold, #c6a664), transparent);
  opacity: 0.5;
  transition: opacity 0.3s;
}
.story-input:focus + .input-decorative-line {
  opacity: 1;
  box-shadow: 0 1px 5px rgba(198, 166, 100, 0.4);
}

/* 输入框忙碌状态动画 */
@keyframes breathe-text {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* 优化后的羽毛笔顺滑连笔动画 */
@keyframes write-quill {
  0%, 100% { transform: rotate(0deg) translate(0, 0); }
  33% { transform: rotate(-8deg) translate(-2px, 1px); }
  66% { transform: rotate(8deg) translate(2px, -1px); }
}
.story-input.busy-state {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  color: var(--text-muted, #8b7e70) !important; cursor: default; user-select: none;
  font-style: italic;
}
.busy-text {
  animation: breathe-text 2s infinite ease-in-out;
}
.quill-busy-icon {
  width: 22px;
  height: 22px;
  animation: write-quill 1.5s infinite ease-in-out;
  transform-origin: bottom left;
}

/* 发送按钮 - 符文印章风格 */
.send-btn {
  width: 50px; height: 50px;
  background: transparent;
  border: 1px solid var(--accent-gold, #c6a664);
  border-radius: 50%;
  color: var(--accent-gold, #c6a664);
  font-size: 1.2rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
}
.send-btn::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px dashed var(--accent-gold, #c6a664);
  border-radius: 50%;
  opacity: 0.5;
  transition: all 0.3s;
}
.send-btn:hover {
  background: var(--accent-gold, #c6a664);
  color: var(--scroll-paper, #fffcf5);
  box-shadow: 0 0 15px rgba(198, 166, 100, 0.4);
}
.send-btn:hover::before {
  border-color: var(--scroll-paper, #fffcf5);
  transform: rotate(45deg);
}

/* 停止按钮忙碌状态动画 (仅虚线圈旋转) */
.send-btn.is-busy {
  border-color: var(--flag-bg, #8c3a3a);
  color: var(--flag-bg, #8c3a3a);
}
.send-btn.is-busy::before {
  border-color: var(--flag-bg, #8c3a3a);
  animation: spin-slow 3s linear infinite;
}

/* 桌面端隐藏控制 */
.mobile-only { display: none; }
.mobile-only-flex { display: none; }

@media (max-width: 768px) {
  .mobile-only { display: block; }
  .mobile-only-flex { display: flex; }

  .interaction-panel {
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 10px 15px 20px;
    background: var(--scroll-paper, #fffcf5);
    border-top: 2px dashed var(--scroll-border, #d4c4a8);
    border-radius: 12px 12px 0 0;
    z-index: 40;
    box-shadow: 0 -10px 30px rgba(0,0,0,0.05);
  }
  .interaction-panel::before { display: none; }

  .interaction-panel:not(.is-expanded) {
    transform: translateY(100%);
    opacity: 0;
    pointer-events: none;
  }

  /* 羽毛笔悬浮按钮 (仅移动端) */
  .quill-trigger {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: var(--scroll-paper, #fffcf5);
    border: 2px solid var(--accent-gold, #c6a664);
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    color: var(--text-main, #4a3f35);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    z-index: 50;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  .quill-trigger:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(198, 166, 100, 0.4);
  }
  .quill-trigger.is-hidden {
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
  }
  .quill-icon {
    width: 28px;
    height: 28px;
  }

  .dashboard-console {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    overflow-x: visible;
  }
  .extra-toolbar {
    width: 100%;
    justify-content: space-between;
    overflow-x: auto;
    flex-wrap: nowrap;
  }
  .toolbar-btn {
    flex: 0 0 auto;
    justify-content: center;
  }
  .options-popup-menu { width: calc(100vw - 30px); }
}
</style>
