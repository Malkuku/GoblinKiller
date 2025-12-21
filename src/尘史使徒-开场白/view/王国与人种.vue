<template>
  <div class="concept-page-container">
    <transition name="slide-fade" mode="out-in">

      <!-- ================================= -->
      <!--       第一页: 王国与人种          -->
      <!-- ================================= -->
      <div v-if="internalPage === 0" key="kingdom" class="subpage kingdom-page">
        <!-- 特效1: 卷轴展开效果 -->
        <div class="scroll-content animate-unroll">
          <h2 class="concept-title">埃布尔王国</h2>
          <p>一个多人种混合的国家，位于大陆东南，背靠山脉，面向迷雾之海。政体为君主立宪，实权由代表四大基石准则（灯、铸、刃、心）的“四席议会”掌握。</p>

          <h3 class="sub-title">主要人种</h3>
          <div class="races-grid">
            <div class="race-card"><strong>纯种人类</strong><p>数量最多，适应性强。</p></div>
            <div class="race-card"><strong>兽耳人</strong><p>保留动物特征，天赋各异。</p></div>
            <div class="race-card"><strong>长生种</strong><p>寿命极长，亲和“灯”与“冬”。</p></div>
            <div class="race-card"><strong>石筑者</strong><p>敦实强壮，天生的“铸”之工匠。</p></div>
          </div>
        </div>
      </div>

      <!-- ================================= -->
      <!--         第二页: 启明教会          -->
      <!-- ================================= -->
      <div v-else-if="internalPage === 1" key="church" class="subpage church-page">
        <!-- 特效2: 神圣光照效果 -->
        <div class="holy-light-effect"></div>
        <h2 class="concept-title">启明教会</h2>
        <p>王国唯一的合法宗教，信奉“灯”之准则与伟大存在“守夜人”。教会垄断知识，仲裁道德，并视另外四种准则为“虚无异端”。</p>
        <div class="inquisition-box">
          <h3>秘密机构：审判庭</h3>
          <p>其唯一任务是追捕、审判并“净化”所有禁忌之术的研习者。他们的行动酷烈无情，不受地方法律约束。</p>
        </div>
      </div>

      <!-- ================================= -->
      <!--         第三页: 四艺学院          -->
      <!-- ================================= -->
      <div v-else-if="internalPage === 2" key="academy" class="subpage academy-page">
        <h2 class="concept-title">王家四艺学院</h2>
        <p>由王室与议会直辖的最高学府，为王国培养四大基石准则的精英人才。下设四个相互竞争的分院。</p>
        <!-- 特效3: 卡片式网格动画 -->
        <div class="academy-grid">
          <div class="academy-card" style="animation-delay: 0.2s;"><strong>启明之塔 (灯)</strong><span>学者与顾问的摇篮</span></div>
          <div class="academy-card" style="animation-delay: 0.4s;"><strong>熔炉之心 (铸)</strong><span>工匠与攻城专家的熔炉</span></div>
          <div class="academy-card" style="animation-delay: 0.6s;"><strong>利刃之庭 (刃)</strong><span>战士与执法官的训练场</span></div>
          <div class="academy-card" style="animation-delay: 0.8s;"><strong>活水之泉 (心)</strong><span>医师与外交官的源头</span></div>
        </div>
      </div>

      <!-- ================================= -->
      <!--          第四页: 大敌            -->
      <!-- ================================= -->
      <div v-else-if="internalPage === 3" key="enemy" class="subpage enemy-page">
        <!-- 特效4: 扭曲噪点背景 -->
        <div class="noise-background"></div>
        <h2 class="concept-title2 animate-shake">王国的大敌</h2>
        <ul class="enemy-list">
          <li><strong>内在的崩坏:</strong> <span class="danger-text">失控者</span>与<span class="danger-text">堕落者</span>，他们是术法力量的牺牲品或滥用者。</li>
          <li><strong>现实的疮疤:</strong> 来自漫宿的<span class="danger-text">灵体</span>与<span class="danger-text">孽物</span>，是扭曲法则的具象化。</li>
          <li><strong>存在的叛徒:</strong> 试图“飞升”漫宿的<span class="danger-text">飞升教团</span>，他们是王国最隐秘、最危险的敌人。</li>
        </ul>
      </div>

    </transition>

    <!-- 内部翻页按钮 (最后一页不显示) -->
    <button v-if="!isLastSubPage" class="internal-next-btn" @click="showNextSubPage">
      下一篇章
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const internalPage = ref(0);
const totalPages = 4;

const isLastSubPage = computed(() => internalPage.value === totalPages - 1);

const showNextSubPage = () => {
  if (!isLastSubPage.value) {
    internalPage.value++;
  }
};
</script>

<style scoped>
/* --- 通用容器与按钮 --- */
.concept-page-container {
  width: 100%;
  max-width: 900px;
  padding: 2rem;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}
.subpage {
  width: 100%;
  text-align: center;
}
.subpage p {
  font-size: 1.1rem;
  line-height: 1.7;
  max-width: 700px;
  margin: 0 auto 1.5rem auto;
}
.concept-title {
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  color: var(--accent-primary);
  margin-bottom: 2rem;
}
.concept-title2 {
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  color: var(--accent-danger);
  margin-bottom: 2rem;
}
.internal-next-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 8px 16px;
  font-family: 'Cinzel', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 30px;
  margin-bottom: 40px;
  position: relative;
  bottom: auto;
}
.internal-next-btn:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

/* --- 内部页面切换动画 --- */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: scale(1.05) translateY(-20px);
}

/* --- 1. 王国页特效 --- */
.kingdom-page .scroll-content {
  background-color: rgba(0,0,0,0.1);
  border: 1px solid var(--border-color);
  padding: 2rem;
  border-radius: 4px;
}
.animate-unroll {
  animation: unroll 1s ease-out forwards;
  transform-origin: left;
}
@keyframes unroll {
  from { transform: scaleY(0); opacity: 0; }
  to { transform: scaleY(1); opacity: 1; }
}
.sub-title {
  font-family: 'Cinzel', serif;
  font-weight: 400;
  color: var(--text-primary);
  margin: 2rem 0 1rem 0;
}
.races-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}
.race-card {
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: 4px;
}
.race-card strong { color: var(--accent-primary); }
.race-card p { font-size: 0.9rem; margin: 0.5rem 0 0 0; color: var(--text-secondary); }

/* --- 2. 教会页特效 --- */
.church-page {
  position: relative;
  overflow: hidden;
}
.holy-light-effect {
  position: absolute;
  top: -50%;
  left: 50%;
  width: 200%;
  height: 200%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at top, rgba(164, 139, 87, 0.25) 0%, transparent 50%);
  animation: breathing-light 8s ease-in-out infinite;
  z-index: -1;
}
@keyframes breathing-light {
  0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
}
.inquisition-box {
  margin-top: 2rem;
  border: 1px solid var(--accent-danger);
  background: rgba(176, 58, 72, 0.05);
  padding: 1.5rem;
  border-radius: 4px;
}
.inquisition-box h3 {
  font-family: 'Cinzel', serif;
  color: var(--accent-danger);
  margin: 0 0 0.5rem 0;
}
.inquisition-box p {
  color: var(--text-primary);
  margin-bottom: 0;
}

/* --- 3. 学院页特效 --- */
.academy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
  max-width: 700px;
  margin: 2rem auto 0 auto;
}
.academy-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  border-radius: 4px;
  opacity: 0;
  animation: card-reveal 0.6s forwards cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
@keyframes card-reveal {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.academy-card strong {
  display: block;
  font-family: 'Cinzel', serif;
  color: var(--accent-primary);
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}
.academy-card span {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* --- 4. 大敌页特效 --- */
.enemy-page {
  position: relative;
}
.noise-background {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url('data:image/svg+xml,...'); /* Inlined noise SVG */
  opacity: 0.05;
  animation: noise-anim 0.2s infinite;
  z-index: -1;
}
@keyframes noise-anim {
  0% { transform: translate(0,0); } 25% { transform: translate(-2px, 2px); }
  50% { transform: translate(2px, -2px); } 75% { transform: translate(2px, 2px); }
  100% { transform: translate(-2px, -2px); }
}
.animate-shake {
  animation: shake 0.5s infinite;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}
.enemy-list {
  list-style: none;
  padding: 0;
  text-align: left;
  max-width: 600px;
  margin: 2rem auto 0 auto;
}
.enemy-list li {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}
.danger-text {
  color: var(--accent-danger);
  font-weight: bold;
}
</style>
