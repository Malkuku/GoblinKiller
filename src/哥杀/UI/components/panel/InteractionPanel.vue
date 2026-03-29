<template>
  <div class="interaction-wrapper">
    <!-- 移动端默认收起时的羽毛笔触发器 -->
    <div class="quill-trigger" :class="{ 'is-hidden': isExpanded }" @click="toggleExpand">
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
            :strategy="combatStrategy"
            :custom-content="combatStrategyCustom"
            @update:strategy="newStrategy => $emit('update:strategy', newStrategy)"
            @update:custom-content="newContent => $emit('update:customContent', newContent)"
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
            <span class="toggle-icon">{{ isTavernBusy ? '۞' : '❖' }}</span>
            <span v-if="cachedOptions.length > 0 && !isTavernBusy" class="options-badge">{{ cachedOptions.length }}</span>
          </button>
        </div>

        <!-- 输入框区域 -->
        <div class="input-area-stack">
          <transition name="fade-input" mode="out-in">
            <div v-if="isTavernBusy" class="story-input busy-state" key="busy">
              <span class="busy-icon">✒</span>
              <span class="busy-text">历史正在等候命运回应...</span>
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
  }

  /* 羽毛笔悬浮按钮 */
  .quill-trigger {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: var(--scroll-paper, #fffcf5);
    border: 2px solid var(--accent-gold, #c6a664);
    border-radius: 50%;
    display: flex;
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

  /* 交互面板 (卷轴风格) */
  .interaction-panel {
    width: 100%;
    background: var(--scroll-paper, #fffcf5);
    border-top: 2px dashed var(--scroll-border, #d4c4a8);
    padding: 15px 30px 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 -10px 30px rgba(0,0,0,0.05);
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    transform-origin: bottom;
  }

  .panel-collapse-btn {
    width: 100%;
    text-align: center;
    padding-bottom: 10px;
    color: var(--accent-gold, #c6a664);
    font-size: 0.9rem;
    cursor: pointer;
    border-bottom: 1px solid rgba(212, 196, 168, 0.3);
    margin-bottom: 15px;
  }

  .dashboard-console {
    width: 100%; max-width: 1024px; display: flex; justify-content: space-between;
    align-items: flex-end; margin-bottom: 12px; gap: 15px; flex-wrap: wrap;
  }

  .extra-toolbar { display: flex; gap: 10px; }
  .toolbar-btn {
    background: rgba(255, 255, 255, 0.5); border: 1px solid var(--scroll-border, #d4c4a8);
    color: var(--text-main, #4a3f35); padding: 6px 12px; border-radius: 4px;
    font-family: 'Cinzel', serif; font-size: 0.85rem; cursor: pointer;
    display: flex; align-items: center; gap: 6px; transition: all 0.3s ease; height: 32px;
  }
  .toolbar-btn:hover { background: var(--scroll-border, #d4c4a8); }

  .input-wrapper { position: relative; width: 100%; max-width: 1024px; display: flex; align-items: flex-end; gap: 12px; }

  .options-toggle-btn {
    width: 56px; height: 56px; background: rgba(255, 255, 255, 0.5); border: 1px solid var(--scroll-border, #d4c4a8);
    border-radius: 4px; color: var(--text-muted, #8b7e70); font-size: 1.5rem;
    cursor: pointer; transition: all 0.3s ease;
    display: flex; align-items: center; justify-content: center; position: relative;
  }
  .options-toggle-btn.has-options { color: var(--accent-gold, #c6a664); border-color: var(--accent-gold, #c6a664); }
  .options-toggle-btn.active { background: var(--accent-gold, #c6a664); color: #fffcf5; }

  .options-badge { position: absolute; top: -5px; right: -5px; background: #8c3a3a; color: #fff; font-size: 0.7rem; font-weight: bold; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

  .options-popup-menu {
    position: absolute; bottom: 70px; left: 0; width: 600px; max-height: 400px;
    background: var(--scroll-paper, #fffcf5); border: 1px solid var(--accent-gold, #c6a664);
    border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    display: flex; flex-direction: column; z-index: 50; overflow: hidden;
  }
  .options-header { padding: 10px 15px; background: rgba(198, 166, 100, 0.1); border-bottom: 1px solid var(--scroll-border, #d4c4a8); display: flex; justify-content: space-between; align-items: center; color: var(--text-main, #4a3f35); font-family: 'Cinzel', serif; font-size: 0.9rem; font-weight: bold; }
  .close-options { background: none; border: none; color: var(--text-muted, #8b7e70); cursor: pointer; font-size: 1.2rem; }
  .options-list { overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
  .option-item { background: rgba(0, 0, 0, 0.02); border: 1px solid var(--scroll-border, #d4c4a8); padding: 10px; color: var(--text-main, #4a3f35); text-align: left; cursor: pointer; font-family: 'EB Garamond', serif; font-size: 1rem; transition: all 0.2s; display: flex; gap: 10px; border-radius: 4px; }
  .option-index { color: var(--accent-gold, #c6a664); font-weight: bold; }
  .option-item:hover { background: rgba(198, 166, 100, 0.1); border-color: var(--accent-gold, #c6a664); }

  .input-area-stack { flex: 1; position: relative; height: 56px; }
  .story-input { width: 100%; height: 100%; background: rgba(255, 255, 255, 0.6); border: 1px solid var(--scroll-border, #d4c4a8); border-bottom: 2px solid var(--accent-gold, #c6a664); color: var(--text-main, #4a3f35); padding: 12px 15px; border-radius: 4px 4px 0 0; font-family: 'EB Garamond', serif; font-size: 1.1rem; resize: none; transition: all 0.3s; display: block; }
  .story-input:focus { outline: none; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
  .story-input.busy-state { display: flex; align-items: center; justify-content: center; gap: 10px; background: rgba(0, 0, 0, 0.02); border-color: transparent; border-bottom-color: var(--scroll-border, #d4c4a8); color: var(--text-muted, #8b7e70); cursor: default; user-select: none; }

  .send-btn { width: 56px; height: 56px; background: transparent; border: 1px solid var(--scroll-border, #d4c4a8); border-radius: 50%; color: var(--accent-gold, #c6a664); font-size: 1.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
  .send-btn:hover { background: var(--accent-gold, #c6a664); color: #fffcf5; box-shadow: 0 0 10px rgba(198, 166, 100, 0.3); }
  .send-btn.is-busy { border-color: #8c3a3a; color: #8c3a3a; }

  .mobile-only { display: none; }

  @media (max-width: 768px) {
    .mobile-only { display: block; }
    .interaction-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px 15px 20px;
      border-radius: 12px 12px 0 0;
      z-index: 40;
    }
    .interaction-panel:not(.is-expanded) {
      transform: translateY(100%);
      opacity: 0;
      pointer-events: none;
    }
    .dashboard-console { flex-direction: column; align-items: stretch; gap: 10px; }
    .extra-toolbar { width: 100%; justify-content: space-between; }
    .toolbar-btn { flex: 1; justify-content: center; }
    .options-popup-menu { width: calc(100vw - 30px); }
  }
</style>
