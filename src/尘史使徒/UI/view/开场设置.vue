<template>
  <div class="scenario-layout">
    <header class="scenario-header">
      <h1 class="title">剧本选择</h1>
      <div class="subtitle">CHOOSE YOUR DESTINY</div>
    </header>

    <div class="scenario-list">
      <div
        v-for="item in scenarios"
        :key="item.id"
        class="scenario-card"
        :class="[item.theme, { active: selectedScenario === item.id }]"
        @click="selectScenario(item.id)"
      >
        <!-- 背景特效层 -->
        <div class="art-bg-effect"></div>

        <div class="card-content">
          <!-- SVG 图标 -->
          <div class="scenario-icon-wrapper">
            <svg viewBox="0 0 64 64" class="scenario-svg" v-html="item.iconPath"></svg>
          </div>

          <!-- 标题 -->
          <h2 class="scenario-title art-name">{{ item.name }}</h2>

          <!-- 详情区域 (点击选中后显示) -->
          <div class="scenario-details" v-show="selectedScenario === item.id">
            <!-- 标签区域已移除 -->

            <p class="scenario-desc" v-html="item.desc"></p>

            <!-- 启程按钮 / 开发中按钮 -->
            <button
              class="action-btn start-btn"
              :class="{ 'btn-disabled': !item.isReady }"
              :disabled="loading || !item.isReady"
              @click.stop="confirmStart(item)"
            >
              <!-- 状态 1: 加载中 -->
              <span v-if="loading && loadingId === item.id">
                <i class="loading-spinner"></i> 读取中...
              </span>

              <!-- 状态 2: 开发中 (预留接口) -->
              <span v-else-if="!item.isReady">
                🚧 开发中，敬请期待
              </span>

              <!-- 状态 3: 正常启程 -->
              <span v-else>
                启程
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { WorldInfoUtil } from '@/Utils/WorldInfoUtil';
import { router } from '@/尘史使徒/UI/router/router';
import { ERAEvents } from '@/Constants/ERAEvent';

const selectedScenario = ref('');
const loading = ref(false);
const loadingId = ref('');

const scenarios = [
  {
    id: 'satiated',
    name: '餮足之人',
    worldBookEntry: '<剧本>餮足之人',
    isReady: true,
    theme: 'theme-cup',
    desc: `扮演一位“多情”的兄长，用谎言与真实喂养妹妹。\n然而饥饿永无餮止，迷雾中的困惑尚未解开。\n行走于城市之间，要当心阴影中狩猎异类的眼睛......`,
    iconPath: `
      <path fill="currentColor" d="M18 8 C18 8, 16 32, 32 32 C48 32, 46 8, 46 8 H18 Z" opacity="0.8"/>
      <path fill="none" stroke="currentColor" stroke-width="3" d="M32 32 V 52 M20 52 H44"/>
      <ellipse cx="32" cy="12" rx="12" ry="3" fill="rgba(255,0,0,0.3)"/>
    `
  },
  {
    id: 'lantern',
    name: '辉光学徒',
    worldBookEntry: '<剧本>辉光学徒',
    isReady: true,
    theme: 'theme-lamp',
    desc: '真理往往伴随着灼烧双目的光芒。你提着灯笼，行走在理智与疯狂的边缘。',
    iconPath: `
      <path fill="none" stroke="currentColor" stroke-width="3" d="M22 16 L18 48 L46 48 L42 16 Z"/>
      <path fill="none" stroke="currentColor" stroke-width="3" d="M22 16 L32 6 L42 16"/>
      <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.8"/>
      <line x1="32" y1="6" x2="32" y2="2" stroke="currentColor" stroke-width="3"/>
    `
  },
  {
    id: 'folly',
    name: '虚妄愚行',
    worldBookEntry: '<剧本>虚妄愚行',
    isReady: true,
    theme: 'theme-moth',
    desc: '如同飞蛾扑火，我们在混乱中寻求某种不存在的答案。你被困在命运的网中。',
    iconPath: `
      <path fill="none" stroke="currentColor" stroke-width="2" d="M32 32 L32 2 M32 32 L60 18 M32 32 L54 56 M32 32 L10 56 M32 32 L4 18"/>
      <path fill="none" stroke="currentColor" stroke-width="1.5" d="M26 12 Q32 16 38 12 M48 24 Q42 32 46 42 M20 48 Q32 40 44 48 M12 30 Q20 32 26 12" opacity="0.6"/>
      <circle cx="32" cy="32" r="4" fill="currentColor"/>
    `
  },
  {
    id: 'forgotten',
    name: '被遗忘者',
    worldBookEntry: '<剧本>被遗忘者',
    isReady: true,
    theme: 'theme-forgotten',
    desc: '镜中映出的不再是完整的面容。你已被世界遗忘，唯有破碎的记忆指引前路。',
    iconPath: `
      <path fill="none" stroke="currentColor" stroke-width="3" d="M16 8 H48 V56 H16 Z"/>
      <path fill="currentColor" d="M16 8 L30 20 L25 35 L40 30 L48 56 L48 8 Z" opacity="0.3"/>
      <path fill="none" stroke="currentColor" stroke-width="1" d="M20 12 L35 28 L28 40 L44 36"/>
    `
  },
  {
    id: 'homecoming',
    name: '长路归乡',
    worldBookEntry: '<剧本>长路归乡',
    isReady: false,
    theme: 'theme-winter',
    desc: '寒风呼啸，背包里装着仅剩的温暖。这是一场漫长的告别，也是归乡的旅途。',
    iconPath: `
      <rect x="18" y="14" width="28" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
      <path fill="none" stroke="currentColor" stroke-width="3" d="M18 24 H46 M28 14 V10 C28 8 36 8 36 10 V14"/>
      <rect x="22" y="32" width="8" height="10" fill="currentColor" opacity="0.5"/>
      <rect x="34" y="32" width="8" height="10" fill="currentColor" opacity="0.5"/>
    `
  }
];

const selectScenario = (id) => {
  selectedScenario.value = id;
};

const confirmStart = async (item) => {
  // 安全检查：如果未开发完成，直接返回（虽然按钮已禁用，但双重保险）
  if (!item.isReady) {
    if (window.toastr) window.toastr.info(`剧本 [${item.name}] 正在锐意制作中...`);
    return;
  }

  loading.value = true;
  loadingId.value = item.id;

  try {
    // 调用通用加载函数，传入配置好的条目名
    await loadScenarioContent(item.worldBookEntry);

    // 触发同步并跳转
    await eventEmit(ERAEvents.FORCE_SYNC);
    await router.push('/选项');
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
    loadingId.value = '';
  }
};

/**
 * 通用剧本加载函数
 * @param {string} entryName - 世界书中的条目名称
 */
const loadScenarioContent = async (entryName) => {
  if (!entryName) throw new Error('Entry name is missing');

  // 1. 读取世界书内容
  const content = await WorldInfoUtil.getWorldBookContent([entryName]);

  if (!content) {
    if (window.toastr) window.toastr.error(`未找到世界书条目: ${entryName}`);
    throw new Error(`Worldbook entry not found: ${entryName}`);
  }

  // 2. 获取当前消息ID
  const msgId = getLastMessageId();
  if (msgId === undefined || msgId === null) {
    if (window.toastr) window.toastr.error('无法获取当前消息ID');
    throw new Error('No message ID');
  }

  console.log(`正在加载剧本 [${entryName}] 到消息 ID: ${msgId}`);

  // 3. 替换当前楼层文本
  await setChatMessages([{
    message_id: msgId,
    message: content
  }], { refresh: 'affected' });

  if (window.toastr) window.toastr.success('剧本加载成功，世界已重塑。');
};
</script>

<style scoped>
/* 保持之前的 CSS 变量和布局样式不变，仅增加/修改按钮相关样式 */

.scenario-layout {
  --c-gold: #a48b57;
  --c-gold-dim: rgba(164, 139, 87, 0.3);
  --c-text-main: #e0e0e0;
  --c-text-dim: #8a92a0;
  --c-bg-card: rgba(0, 0, 0, 0.6);
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;

  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 40px;
  color: var(--c-text-main);
  font-family: var(--font-body);
  overflow-y: auto;
  background: #0a0a0a;
}

.scenario-header {
  text-align: center;
  margin-bottom: 40px;
  border-bottom: 1px solid var(--c-gold-dim);
  padding-bottom: 20px;
  z-index: 10;
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: 40px;
}

.scenario-card {
  position: relative;
  background: var(--c-bg-card);
  border: 1px solid var(--c-gold-dim);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 220px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.scenario-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border-color: var(--theme-color, var(--c-gold));
}

.scenario-card.active {
  border-color: var(--theme-color, var(--c-gold));
  box-shadow: 0 0 20px var(--theme-glow, var(--c-gold-dim));
  min-height: 400px;
  background: rgba(0, 0, 0, 0.8);
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;
}

.scenario-icon-wrapper {
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
  color: var(--theme-color, var(--c-gold));
  filter: drop-shadow(0 0 5px var(--theme-glow, rgba(0,0,0,0)));
  transition: transform 0.3s ease;
}

.scenario-card:hover .scenario-icon-wrapper {
  transform: scale(1.1);
}

.scenario-title {
  font-family: var(--font-title);
  font-size: 1.6rem;
  margin: 0 0 10px 0;
  transition: color 0.3s;
}

.scenario-details {
  margin-top: 20px;
  animation: fadeIn 0.5s ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.scenario-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag {
  font-size: 0.75rem;
  padding: 2px 8px;
  border: 1px solid var(--c-text-dim);
  color: var(--c-text-dim);
  border-radius: 2px;
  background: rgba(0,0,0,0.3);
}

.scenario-desc {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--c-text-dim);
  margin-bottom: 25px;
  max-width: 90%;
}

/* --- 按钮样式更新 --- */
.action-btn {
  background: transparent;
  border: 1px solid var(--theme-color, var(--c-gold));
  color: var(--theme-color, var(--c-gold));
  font-family: var(--font-title);
  font-size: 1.1rem;
  padding: 10px 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: auto;
  min-width: 160px; /* 保证按钮宽度一致 */
}

.action-btn:hover:not(:disabled) {
  background: var(--theme-color, var(--c-gold));
  color: #000;
  box-shadow: 0 0 15px var(--theme-color, var(--c-gold));
}

/* 禁用/开发中状态 */
.action-btn:disabled,
.action-btn.btn-disabled {
  border-color: #555;
  color: #777;
  cursor: not-allowed;
  background: rgba(0,0,0,0.2);
  box-shadow: none;
}

/* 简单的 loading 旋转动画 */
.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 5px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* =========================================
   特效样式 (保持不变)
   ========================================= */
.art-bg-effect { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; }

/* 灯 (Lamp) */
.theme-lamp { --theme-color: #FFD700; --theme-glow: rgba(255, 215, 0, 0.3); }
.theme-lamp .art-name { color: var(--theme-color); text-shadow: 0 0 10px var(--theme-color); }
.theme-lamp .art-bg-effect { background: radial-gradient(circle, var(--theme-color) 0%, transparent 70%); opacity: 0.15; }

/* 冬 (Winter) */
.theme-winter { --theme-color: #A3D5D5; --theme-glow: rgba(163, 213, 213, 0.3); }
.theme-winter .art-name { color: var(--theme-color); }
.theme-winter .art-bg-effect { background: radial-gradient(circle, #fff 5%, transparent 6%), radial-gradient(circle, #fff 3%, transparent 4%); background-size: 30px 30px, 50px 50px; background-position: 0 0, 25px 25px; animation: snow 10s linear infinite; opacity: 0.3; }
@keyframes snow { 0% {background-position: 0 0, 25px 25px;} 100% {background-position: 0 300px, 25px 325px;} }

/* 杯 (Cup) */
.theme-cup { --theme-color: #8B0000; --theme-glow: rgba(139, 0, 0, 0.4); }
.theme-cup .art-name { color: var(--theme-color); text-shadow: 0 0 5px rgba(0,0,0,0.5); }
.theme-cup .art-bg-effect { background-image: linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%), linear-gradient(to bottom, var(--theme-color) 30%, transparent 100%); background-repeat: no-repeat; background-size: 2px 150%, 3px 200%, 1px 220%; background-position: 10% 0, 50% 0, 90% 0; animation: art-cup-drip-y 6s linear infinite; opacity: 0.4; }
@keyframes art-cup-drip-y { from { background-position-y: -250%; } to { background-position-y: 100%; } }

/* 蛾 (Moth) */
.theme-moth { --theme-color: #a8a8a8; --theme-glow: rgba(168, 168, 168, 0.3); }
.theme-moth .art-name { color: var(--theme-color); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); animation: art-moth-glitch-strong 2s infinite steps(1); }
.theme-moth .art-bg-effect { background: repeating-linear-gradient(45deg, #0001, #0001 1px, transparent 1px, transparent 5px); opacity: 0.2; }
@keyframes art-moth-glitch-strong { 0% { transform: translate(0, 0) skew(0); } 5% { transform: translate(-2px, 1px) skew(-2deg); } 10% { transform: translate(2px, -1px) skew(2deg); } 15% { transform: translate(0, 0) skew(0); } 100% { transform: translate(0, 0) skew(0); } }

/* 被遗忘者 (Forgotten) */
.theme-forgotten { --theme-color: #C5A059; --theme-glow: rgba(197, 160, 89, 0.2); }
.theme-forgotten .art-name { color: var(--theme-color); text-shadow: 0 0 5px rgba(0,0,0,0.8); opacity: 0.8; }
.theme-forgotten .art-bg-effect {
  background: linear-gradient(135deg, transparent 40%, rgba(197, 160, 89, 0.1) 40%, rgba(197, 160, 89, 0.1) 60%, transparent 60%);
  background-size: 20px 20px;
  opacity: 0.3;
}
.theme-forgotten.active .scenario-svg {
  animation: broken-shake 5s infinite;
}
@keyframes broken-shake {
  0%, 100% { transform: rotate(0deg); }
  90% { transform: rotate(0deg); }
  92% { transform: rotate(2deg); }
  94% { transform: rotate(-2deg); }
  96% { transform: rotate(1deg); }
  98% { transform: rotate(-1deg); }
}
</style>
