<template>
  <div class="quest-board">
    <header class="board-header">
      <h2 class="board-title">委托布告栏</h2>
      <p class="board-subtitle">"命运标好了价格，而勇气决定归属"</p>
    </header>

    <transition-group v-if="hasData" name="paper" tag="div" class="quest-grid">
      <div
        v-for="(quest, name) in questData"
        :key="name"
        class="quest-paper"
        :class="{ 'is-selected': selectedQuests.has(name as string) }"
        @click="toggleQuest(name as string)"
      >
        <!-- 钉子装饰 -->
        <div class="pin"></div>

        <div class="paper-content">
          <h3 class="quest-name">{{ name }}</h3>

          <div class="section">
            <span class="label">【详情】</span>
            <p class="text">{{ quest['描述'] }}</p>
          </div>

          <div class="section warning">
            <span class="label">【要求】</span>
            <p class="text">{{ quest['要求'] }}</p>
          </div>

          <div class="section reward">
            <span class="label">【报酬】</span>
            <!-- 这里使用格式化函数显示 -->
            <p class="text">{{ formatReward(quest['报酬']) }}</p>
          </div>
        </div>

        <!-- 选中时的印章效果 -->
        <div v-if="selectedQuests.has(name as string)" class="stamp">
          <span>ACCEPTED</span>
        </div>

        <div class="selection-overlay">
          <span class="select-hint">{{ selectedQuests.has(name as string) ? '点击取消' : '点击接取' }}</span>
        </div>
      </div>
    </transition-group>

    <div v-else class="empty-board">
      <p>今日暂无委托...</p>
    </div>

    <!-- 底部操作栏 -->
    <transition name="slide-up">
      <div v-if="selectedQuests.size > 0" class="action-bar">
        <div class="action-info">
          已接取: <span class="highlight">{{ selectedQuests.size }}</span> 件委托
        </div>
        <button class="sign-btn" @click="confirmQuests">签署契约</button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuestStore } from '@/尘史使徒/store/QuestStore'; // 请确保路径正确

const questStore = useQuestStore();
const questData = computed(() => questStore.questData);
const hasData = computed(() => questStore.hasQuestData);

// 使用 Set 存储选中的任务名
const selectedQuests = ref<Set<string>>(new Set());

// --- 货币格式化逻辑 (复用自商店逻辑) ---
const formatReward = (reward: string | number) => {
  // 如果报酬是数字，默认单位为银里弗，进行转换
  if (typeof reward === 'number') {
    const totalCopper = reward * 10; // 1银 = 10铜
    const gold = Math.floor(totalCopper / 1000);
    const silver = Math.floor((totalCopper % 1000) / 10);
    const copper = Math.floor(totalCopper % 10);

    let text = [];
    if (gold > 0) text.push(`${gold}金索尔`);
    if (silver > 0) text.push(`${silver}银里弗`);
    if (copper > 0) text.push(`${copper}铜便士`);

    return text.length > 0 ? text.join(' ') : '无金钱报酬';
  }
  // 如果是字符串（例如物品名称），直接返回
  return reward;
};

const toggleQuest = (name: string) => {
  if (selectedQuests.value.has(name)) {
    selectedQuests.value.delete(name);
  } else {
    selectedQuests.value.add(name);
  }
};

const confirmQuests = () => {
  if (selectedQuests.value.size === 0) return;

  // 构建完整日志
  const logs = Array.from(selectedQuests.value).map(name => {
    const quest = questData.value[name];
    return {
      名称: name,
      描述: quest['描述'],
      要求: quest['要求'],
      报酬: formatReward(quest['报酬']),
    };
  });

  try {
    const input = window.parent.document.querySelector('#send_textarea') as HTMLTextAreaElement;
    if (input) {
      const jsonStr = JSON.stringify(logs, null, 2); // 格式化 JSON 增加可读性
      // 使用特定标签包裹，明确意图
      const outputText = `<user>希望接取以下委托\n<list>\n${jsonStr}\n</list>\n如果顺利，则离开当前场景\n`;

      const currentVal = input.value;
      input.value = currentVal ? currentVal + outputText : outputText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();

      // 清空选择
      selectedQuests.value.clear();
    }
  } catch (e) {
    console.error('委托提交失败', e);
  }
};
</script>

<style scoped>
/* 样式保持不变，复用之前的羊皮纸风格 */
.quest-board {
  padding-bottom: 100px;
}

.board-header {
  text-align: center;
  margin-bottom: 1.5rem; /* 略微减小头部间距 */
  border-bottom: 2px solid var(--accent-primary);
  padding-bottom: 0.8rem;
}

.board-title {
  font-family: 'Cinzel', serif;
  font-size: 2rem; /* 略微减小标题 */
  color: var(--text-primary);
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.board-subtitle {
  font-family: 'EB Garamond', serif;
  font-style: italic;
  color: var(--text-secondary);
  margin-top: 0.3rem;
  font-size: 0.9rem;
}

.quest-grid {
  display: grid;
  /* 修改为一行4个，使用 minmax 允许在极小屏幕下自动调整，但主要目标是缩小以适应4个 */
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem; /* 间距从 2rem 减小到 1rem */
  padding: 0.5rem;
}

/* 针对极小屏幕的适配，如果屏幕实在太窄，回退到2列 */
@media (max-width: 768px) {
  .quest-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.quest-paper {
  background-color: #e3dccb;
  color: #2c241b;
  padding: 1rem; /* 内边距从 1.5rem 减小到 1rem */
  position: relative;
  box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  transform: rotate(-1deg);
  border: 1px solid #d1c8b6;
  font-size: 0.9rem; /* 基础字体减小 */
}

.quest-paper:nth-child(2n) {
  transform: rotate(1deg);
}
.quest-paper:nth-child(3n) {
  transform: rotate(-0.5deg);
}

.quest-paper:hover {
  transform: scale(1.02) rotate(0deg);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.quest-paper.is-selected {
  border: 2px solid var(--accent-primary);
  background-color: #f0eadd;
  transform: scale(1.02);
}

.pin {
  position: absolute;
  top: -8px; /* 调整位置 */
  left: 50%;
  transform: translateX(-50%);
  width: 10px; /* 尺寸减小 */
  height: 10px;
  background: radial-gradient(circle at 30% 30%, #555, #000);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.quest-name {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem; /* 字体从 1.4rem 减小 */
  font-weight: bold;
  border-bottom: 1px solid #8a7a61;
  padding-bottom: 0.3rem;
  margin: 0 0 0.6rem 0; /* 间距减小 */
  text-align: center;
  line-height: 1.2;
}

.section {
  margin-bottom: 0.5rem; /* 间距减小 */
  font-family: 'EB Garamond', serif;
}

.label {
  font-weight: bold;
  font-size: 0.8rem; /* 字体减小 */
  color: #5a4a31;
}

.text {
  margin: 0.1rem 0 0 0;
  font-size: 0.85rem; /* 字体减小 */
  line-height: 1.3;
}

.section.warning .text {
  color: #8b0000;
}

.section.reward .text {
  color: #8a6f3e;
  font-weight: bold;
}

.stamp {
  position: absolute;
  bottom: 10px; /* 位置调整 */
  right: 10px;
  border: 2px solid var(--accent-danger); /* 边框变细 */
  color: var(--accent-danger);
  font-family: 'Cinzel', serif;
  font-weight: bold;
  font-size: 1rem; /* 字体从 1.5rem 减小 */
  padding: 0.1rem 0.5rem;
  transform: rotate(-15deg);
  opacity: 0.8;
  pointer-events: none;
  animation: stamp-in 0.3s ease-out forwards;
}

@keyframes stamp-in {
  0% {
    transform: scale(2) rotate(-15deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(-15deg);
    opacity: 0.8;
  }
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.quest-paper:hover .selection-overlay {
  opacity: 1;
}
.select-hint {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.action-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-secondary);
  border: 1px solid var(--accent-primary);
  padding: 0.8rem 1.5rem; /* 尺寸略微减小 */
  border-radius: 50px;
  display: flex;
  gap: 1.5rem;
  align-items: center;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.6);
  z-index: 100;
}

.action-info {
  font-family: 'Cinzel', serif;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.highlight {
  color: var(--accent-primary);
  font-size: 1.1rem;
  font-weight: bold;
}

.sign-btn {
  background: var(--accent-primary);
  color: #1a1d24;
  border: none;
  padding: 0.5rem 1.2rem;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  font-size: 1rem;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s;
}

.sign-btn:hover {
  background: #c4a76a;
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(164, 139, 87, 0.5);
}

.paper-enter-active,
.paper-leave-active {
  transition: all 0.5s ease;
}
.paper-enter-from,
.paper-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
