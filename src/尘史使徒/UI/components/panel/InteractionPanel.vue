<template>
  <div class="interaction-panel">
    <!-- 移动端工具栏切换按钮 -->
    <div v-show="!isTavernBusy" class="mobile-toolbar-toggle" @click="showMobileToolbar = !showMobileToolbar">
      <span class="toggle-line"></span>
      <span class="toggle-text">{{ showMobileToolbar ? '▲ 收起控制台' : '▼ 展开控制台' }}</span>
      <span class="toggle-line"></span>
    </div>

    <!-- 控制台区域 (包含状态栏和工具按钮) -->
    <transition name="fade-toolbar">
      <div v-show="!isTavernBusy" class="dashboard-console" :class="{ 'mobile-hidden': !showMobileToolbar }">
        <!-- 左侧：用户状态与策略 -->
        <UserShortcutBar
          :life-status="userLifeStatus"
          :strategy="combatStrategy"
          :custom-content="combatStrategyCustom"
          @update:strategy="newStrategy => $emit('update:strategy', newStrategy)"
          @update:custom-content="newContent => $emit('update:customContent', newContent)"
        />

        <!-- 右侧：附加工具栏 (变量重算 / 重roll) -->
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
                @click="handleOptionClick(option)"
              >
                <span class="option-index">{{ index + 1 }}.</span>
                <span class="option-text">{{ option }}</span>
              </button>
            </div>
          </div>
        </transition>

        <!-- 按钮本体 -->
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
          <span class="toggle-icon">{{ isTavernBusy ? '۞' : '❖' }}</span>
          <span v-if="cachedOptions.length > 0 && !isTavernBusy" class="options-badge">{{ cachedOptions.length }}</span>
        </button>
      </div>

      <!-- 输入框区域 -->
      <div class="input-area-stack">
        <transition name="fade-input" mode="out-in">
          <!-- 等待回复动画 -->
          <div v-if="isTavernBusy" class="story-input busy-state" key="busy">
            <span class="busy-icon">✒</span>
            <span class="busy-text">历史正在等候命运回应...</span>
          </div>
          <!-- 正常输入框 -->
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
      </div>

      <!-- 发送/停止按钮 (分离层级，保证停止按钮的最高优先级) -->
      <div class="action-btn-container">
        <!-- 默认发送按钮 -->
        <button class="send-btn" :class="{'is-hidden': isTavernBusy}" @click="!isTavernBusy && $emit('send-or-stop')">
          <span class="send-icon">➤</span>
        </button>

        <!-- 最高优先级：停止按钮覆盖层 -->
        <transition name="pop-stop">
          <button v-if="isTavernBusy" class="send-btn is-busy priority-stop-btn" @click="$emit('send-or-stop')">
            <div class="stop-icon">■</div>
          </button>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import UserShortcutBar from '@/尘史使徒/UI/components/tool/UserShortcutBar.vue';

const props = defineProps<{
  isTavernBusy: boolean;
  userInput: string;
  cachedOptions: string[];
  userLifeStatus: any;
  combatStrategy: string;
  combatStrategyCustom: string;
}>();

const emit = defineEmits<{
  (e: 'update:userInput', value: string): void;
  (e: 'update:strategy', value: string): void;
  (e: 'update:customContent', value: string): void;
  (e: 'send-or-stop'): void;
  (e: 'recalculate-variables'): void;
  (e: 'reroll-current'): void;
}>();

const showMobileToolbar = ref(false);
const showOptionsPanel = ref(false);

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
/* 仅包含与此组件相关的样式 */
.interaction-panel {
  flex-shrink: 0;
  background: linear-gradient(to top, rgba(10, 12, 16, 1) 20%, rgba(10, 12, 16, 0.8) 80%, transparent);
  padding: 15px 30px 30px;
  display: flex; flex-direction: column; align-items: center;
  border-top: 1px solid rgba(164, 139, 87, 0.1);
  backdrop-filter: blur(5px);
}
.dashboard-console {
  width: 100%; max-width: 1024px; display: flex; justify-content: space-between;
  align-items: flex-end; margin-bottom: 12px; gap: 15px; flex-wrap: wrap;
  transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
  max-height: 500px; opacity: 1; overflow: hidden;
}
.mobile-toolbar-toggle { display: none; }
.extra-toolbar { display: flex; gap: 10px; }
.toolbar-btn {
  background: rgba(20, 22, 28, 0.8); border: 1px solid rgba(164, 139, 87, 0.3);
  color: var(--c-gold); padding: 6px 12px; border-radius: 4px;
  font-family: 'Cinzel', serif; font-size: 0.85rem; cursor: pointer;
  display: flex; align-items: center; gap: 6px; transition: all 0.3s ease; height: 32px;
}
.toolbar-btn:hover { background: rgba(164, 139, 87, 0.15); border-color: var(--c-gold); box-shadow: 0 0 8px rgba(164, 139, 87, 0.3); }
.input-wrapper { position: relative; width: 100%; max-width: 1024px; display: flex; align-items: flex-end; gap: 12px; }
.options-container { position: relative; display: flex; align-items: flex-end; }
.options-toggle-btn {
  width: 56px; height: 56px; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--c-border);
  border-radius: 4px; color: var(--c-text-dim); font-size: 1.5rem;
  cursor: pointer; transition: all 0.3s ease;
  display: flex; align-items: center; justify-content: center;
}
.options-toggle-btn.has-options { color: var(--c-gold); border-color: var(--c-gold); box-shadow: 0 0 10px rgba(164, 139, 87, 0.2); animation: pulse-border 2s infinite; }
.options-toggle-btn.active { background: var(--c-gold); color: #1a1a1a; }
.options-toggle-btn.is-rolling { border-color: var(--c-gold); color: var(--c-gold); cursor: default; animation: none; }
.options-toggle-btn.is-rolling .toggle-icon { display: inline-block; animation: spin 2s linear infinite; }
.options-badge { position: absolute; top: -5px; right: -5px; background: #8b0000; color: #fff; font-size: 0.7rem; font-weight: bold; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
.options-popup-menu {
  position: absolute; bottom: 70px; left: 0; width: 600px; max-height: 400px;
  background: rgba(20, 22, 28, 0.95); border: 1px solid var(--c-gold);
  border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; z-index: 50;
  backdrop-filter: blur(10px); overflow: hidden;
}
.options-header { padding: 10px 15px; background: rgba(164, 139, 87, 0.1); border-bottom: 1px solid rgba(164, 139, 87, 0.3); display: flex; justify-content: space-between; align-items: center; color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 0.9rem; }
.close-options { background: none; border: none; color: var(--c-text-dim); cursor: pointer; font-size: 1.2rem; }
.options-list { overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; scrollbar-color: var(--c-gold) transparent; }
.option-item { background: rgba(255, 255, 255, 0.03); border: 1px solid transparent; padding: 10px; color: var(--c-text-main); text-align: left; cursor: pointer; font-family: 'EB Garamond', serif; font-size: 1rem; transition: all 0.2s; display: flex; gap: 10px; }
.option-index { color: var(--c-gold); font-weight: bold; opacity: 0.7; }
.option-item:hover { background: rgba(164, 139, 87, 0.15); border-color: rgba(164, 139, 87, 0.5); transform: translateX(5px); }
.input-area-stack { flex: 1; position: relative; height: 56px; }
.story-input { width: 100%; height: 100%; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255,255,255,0.1); border-bottom: 2px solid var(--c-border); color: var(--c-text-main); padding: 12px 15px; border-radius: 4px 4px 0 0; font-family: 'EB Garamond', serif; font-size: 1.1rem; resize: none; transition: all 0.3s; display: block; }
.story-input:focus { outline: none; background: rgba(0, 0, 0, 0.4); border-bottom-color: var(--c-gold); }
.story-input.busy-state { display: flex; align-items: center; justify-content: center; gap: 10px; background: rgba(0, 0, 0, 0.1); border-color: transparent; border-bottom-color: rgba(164, 139, 87, 0.3); color: var(--c-gold); cursor: default; user-select: none; }
.busy-icon { font-size: 1.2rem; animation: write 1s ease-in-out infinite alternate; }
.busy-text { font-family: 'Cinzel', serif; font-size: 0.95rem; letter-spacing: 1px; animation: pulse-text 2s infinite; }

/* 按钮容器与发送/停止按钮样式 */
.action-btn-container { position: relative; width: 56px; height: 56px; flex-shrink: 0; }
.send-btn { width: 100%; height: 100%; background: transparent; border: 1px solid var(--c-border); border-radius: 50%; color: var(--c-gold); font-size: 1.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
.send-btn:hover { background: var(--c-gold); color: #1a1a1a; box-shadow: 0 0 15px var(--c-gold); }
.send-btn.is-hidden { opacity: 0; pointer-events: none; }

/* 停止按钮独立图层与最高层级 */
.priority-stop-btn { position: absolute; top: 0; left: 0; z-index: 999; box-shadow: 0 0 10px rgba(139, 0, 0, 0.3); }
.send-btn.is-busy { border-color: #8b0000; color: #8b0000; background: rgba(20, 22, 28, 0.9); }
.send-btn.is-busy:hover { background: rgba(139, 0, 0, 0.2); color: #ff4d4d; box-shadow: 0 0 15px rgba(139, 0, 0, 0.5); }
.stop-icon { font-size: 1.2rem; line-height: 1; }

/* Transitions */
.fade-toolbar-enter-active, .fade-toolbar-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-toolbar-enter-from, .fade-toolbar-leave-to { opacity: 0; transform: translateY(10px); }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }
.fade-input-enter-active, .fade-input-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-input-enter-from { opacity: 0; transform: translateY(5px); }
.fade-input-leave-to { opacity: 0; transform: translateY(-5px); }

/* 停止按钮高优先级出现动画 */
.pop-stop-enter-active, .pop-stop-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-stop-enter-from, .pop-stop-leave-to { opacity: 0; transform: scale(0.5); }

/* Animations */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse-border { 0% { box-shadow: 0 0 0 0 rgba(164, 139, 87, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(164, 139, 87, 0); } 100% { box-shadow: 0 0 0 0 rgba(164, 139, 87, 0); } }
@keyframes write { from { transform: rotate(0deg) translateY(0); } to { transform: rotate(15deg) translateY(-3px); } }
@keyframes pulse-text { 0%, 100% { opacity: 0.6; text-shadow: 0 0 0 var(--c-gold); } 50% { opacity: 1; text-shadow: 0 0 5px var(--c-gold); } }

/* Media Queries */
@media (max-width: 768px) {
  .interaction-panel { padding: 10px 15px 20px; }
  .mobile-toolbar-toggle { display: flex; align-items: center; justify-content: center; width: 100%; padding: 5px 0 10px 0; color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 0.8rem; cursor: pointer; opacity: 0.8; gap: 10px; }
  .toggle-line { flex: 1; height: 1px; background: rgba(164, 139, 87, 0.3); }
  .dashboard-console.mobile-hidden { max-height: 0; opacity: 0; margin-bottom: 0; }
  .dashboard-console { flex-direction: column; align-items: stretch; gap: 10px; }
  .extra-toolbar { width: 100%; justify-content: space-between; }
  .toolbar-btn { flex: 1; justify-content: center; }
  .options-popup-menu { width: calc(100vw - 30px); }
}
@media (max-width: 480px) {
  .options-popup-menu { width: calc(100vw - 20px); }
}
</style>
