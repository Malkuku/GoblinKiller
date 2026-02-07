<template>
  <div class="scenario-layout">
    <header class="scenario-header">
      <h1 class="title">剧本选择</h1>
      <div class="subtitle">CHOOSE YOUR DESTINY</div>
    </header>

    <div class="scenario-list">
      <!-- 剧本卡片：餮足之人 -->
      <div
        class="scenario-card"
        :class="{ active: selectedScenario === 'satiated' }"
        @click="selectScenario('satiated')"
      >
        <div class="card-border"></div>
        <div class="card-content">
          <div class="scenario-icon">♟</div>
          <h2 class="scenario-title">餮足之人</h2>
          <div class="scenario-tags">
            <span class="tag">ARPG</span>
            <span class="tag">黑暗幻想</span>
            <span class="tag">探索</span>
          </div>
          <p class="scenario-desc">
            饥饿是最初的动力，也是最终的归宿。在这个支离破碎的世界中，你将扮演一名寻求"饱腹"的流浪者。
            <br><br>
            <i>点击加载此剧本，重置当前对话为初始状态。</i>
          </p>
        </div>
      </div>

      <!-- 更多剧本占位符 -->
      <div class="scenario-card disabled">
        <div class="card-content">
          <div class="scenario-icon">🔒</div>
          <h2 class="scenario-title">未知的篇章</h2>
          <p class="scenario-desc">更多命运尚未揭示...</p>
        </div>
      </div>
    </div>

    <footer class="scenario-actions">
      <button
        class="action-btn start-btn"
        :disabled="!selectedScenario || loading"
        @click="confirmStart"
      >
        <span v-if="loading">读取中...</span>
        <span v-else>开启旅程</span>
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil';
import { router } from '@/尘史使徒/UI/router/router';
import { ERAEvents } from '@/Constants/ERAEvent'; // 假设路径

const selectedScenario = ref('');
const loading = ref(false);

const selectScenario = (id) => {
  selectedScenario.value = id;
};

const confirmStart = async () => {
  if (selectedScenario.value === 'satiated') {
    await loadSatiatedOne();
    await eventEmit(ERAEvents.FORCE_SYNC);
    await router.push('/选项');
  }
};

/**
 * 加载 <剧本>餮足之人
 */
const loadSatiatedOne = async () => {
  loading.value = true;
  try {
    const bookName = '<剧本>餮足之人';

    // 1. 读取世界书内容
    // 注意：getWorldBookContent 接受数组
    const content = await WorldInfoUtil.getWorldBookContent([bookName]);

    if (!content) {
      if (window.toastr) window.toastr.error(`未找到世界书: ${bookName}`);
      console.error(`Worldbook not found: ${bookName}`);
      return;
    }

    // 2. 获取当前消息ID
    const msgId = getLastMessageId();
    if (msgId === undefined || msgId === null) {
      if (window.toastr) window.toastr.error('无法获取当前消息ID');
      return;
    }

    // 3. 替换当前楼层文本
    // 直接使用 setChatMessages 进行覆盖，而不是 merge
    console.log(`正在加载剧本 [${bookName}] 到消息 ID: ${msgId}`);
    await setChatMessages([{
      message_id: msgId,
      message: content
    }], { refresh: 'affected' });

    if (window.toastr) window.toastr.success('剧本加载成功，世界已重塑。');


  } catch (e) {
    console.error('加载剧本失败', e);
    if (window.toastr) window.toastr.error('加载剧本时发生错误: ' + e.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 复用附件中的 CSS 变量 */
.scenario-layout {
  --c-gold: #a48b57;
  --c-gold-dim: rgba(164, 139, 87, 0.3);
  --c-text-main: #e0e0e0;
  --c-text-dim: #8a92a0;
  --c-bg-card: rgba(0, 0, 0, 0.4);
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;

  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 40px;
  color: var(--c-text-main);
  font-family: var(--font-body);
  overflow-y: auto;
}

.scenario-header {
  text-align: center;
  margin-bottom: 40px;
  border-bottom: 1px solid var(--c-gold-dim);
  padding-bottom: 20px;
}

.title {
  font-family: var(--font-title);
  font-size: 2.5rem;
  color: var(--c-gold);
  margin: 0;
  text-shadow: 0 0 10px rgba(164, 139, 87, 0.3);
}

.subtitle {
  font-family: var(--font-title);
  font-size: 0.9rem;
  color: var(--c-text-dim);
  letter-spacing: 4px;
  margin-top: 10px;
}

.scenario-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.scenario-card {
  position: relative;
  background: var(--c-bg-card);
  border: 1px solid var(--c-gold-dim);
  padding: 2px; /* For double border effect */
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 300px;
}

.scenario-card:hover:not(.disabled) {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  border-color: var(--c-gold);
}

.scenario-card.active {
  border-color: var(--c-gold);
  background: rgba(164, 139, 87, 0.1);
  box-shadow: 0 0 15px var(--c-gold-dim);
}

.card-content {
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;
}

.scenario-icon {
  font-size: 3rem;
  color: var(--c-gold);
  margin-bottom: 20px;
}

.scenario-title {
  font-family: var(--font-title);
  font-size: 1.5rem;
  margin: 0 0 15px 0;
  color: var(--c-text-main);
}

.scenario-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag {
  font-size: 0.8rem;
  padding: 2px 8px;
  border: 1px solid var(--c-text-dim);
  color: var(--c-text-dim);
  border-radius: 2px;
}

.scenario-desc {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--c-text-dim);
}

.scenario-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.scenario-actions {
  margin-top: 50px;
  display: flex;
  justify-content: center;
}

.action-btn {
  background: transparent;
  border: 1px solid var(--c-gold);
  color: var(--c-gold);
  font-family: var(--font-title);
  font-size: 1.2rem;
  padding: 12px 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.action-btn:hover:not(:disabled) {
  background: var(--c-gold);
  color: #000;
  box-shadow: 0 0 15px var(--c-gold);
}

.action-btn:disabled {
  border-color: var(--c-text-dim);
  color: var(--c-text-dim);
  cursor: not-allowed;
}
</style>
