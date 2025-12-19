<template>
  <div class="concept-page-container">
    <transition name="subpage-swap" mode="out-in">

      <!-- ================================= -->
      <!--       第一页: 兄妹 (The Siblings)   -->
      <!-- ================================= -->
      <div v-if="internalPage === 0" key="siblings" class="subpage siblings-page">
        <h2 class="concept-title animate-fade-in">流亡之人？</h2>

        <p class="summary-text animate-fade-up" style="animation-delay: 1s;">
          从荒芜之地流亡至此的兄妹，依靠“蛾”之术法编织的谎言藏身于学院。
        </p>

        <div class="character-cards-container">
          <!-- 特效1: 角色卡片与“伪装”揭示 -->
          <!-- 主角卡片 -->
          <div class="character-card animate-card-enter" style="animation-delay: 1.5s;">
            <div class="card-body">
              <h3>你</h3>
              <p>利刃之庭的学生，游走于众人间的“多情者”。</p>
              <p class="secret-info">
                ——亦是背负着秘密，为唯一的家人提供“食粮”的守护者。
              </p>
            </div>
          </div>

          <!-- 莉莉丝卡片 -->
          <div class="character-card animate-card-enter" style="animation-delay: 1.8s;">
            <div class="card-body">
              <h3>莉莉丝</h3>
              <p>启明之塔的学生，安静而有礼的“优等生”。</p>
              <p class="secret-info">
                ——亦是潜藏着魅魔血脉，极度依赖兄长的“饥渴者”。
              </p>
            </div>
          </div>
        </div>



        <button class="reveal-button animate-fade-in" style="animation-delay: 2.5s;" @click="showNextSubPage">
          是谁在暗中引导...
        </button>
      </div>

      <!-- ================================= -->
      <!--     第二页: 白尘女士 (The Guide)    -->
      <!-- ================================= -->
      <div v-else-if="internalPage === 1" key="guide" class="subpage guide-page">
        <!-- 特效2: 梦境尘埃粒子背景 -->
        <div class="particle-container">
          <div
v-for="i in 50" :key="i" class="particle" :style="{
  left: `${i * 2}%`,
  animationDelay: `${i * 0.2}s`,
  '--drift-x': `${((i % 2) - 0.5) * 100}px`
}"></div>
        </div>

        <!-- 特效3: 形态不定的“存在”感 -->
        <div class="presence-shimmer animate-fade-in"></div>

        <h2 class="concept-title animate-fade-in" style="animation-delay: 0.5s;">引导者：白尘女士</h2>

        <div class="concept-body">
          <p class="animate-fade-up" style="animation-delay: 3.5s;">
            一位自称侍奉“飞蛾”的神秘存在，飞升于漫宿的具名者。她以玩世不恭的姿态出现，用模棱两可的言语引导着你。她的目的、她的过去、她为何选中你——一切都笼罩在由“蛾”之准则编织的、轻纱般的迷雾之后。
          </p>
        </div>
      </div>

    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const internalPage = ref(0);
const showNextSubPage = () => {
  internalPage.value = 1;
};

</script>

<style scoped lang="scss">
.concept-page-container {
  width: 100%;
  max-width: 900px;
  padding: 2rem;
  box-sizing: border-box;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 450px;
  text-align: center;
}

.subpage {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* --- 第一页: 兄妹 --- */
.character-cards-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 3rem;
  margin: 2rem 0;
  width: 100%;
}

.character-card {
  width: 280px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

/* 为主角卡片添加特殊颜色效果 */
.character-card:first-of-type {
  background: linear-gradient(145deg, rgba(70, 130, 180, 0.2), rgba(255, 255, 255, 0.03));
  border: 1px solid #4682b4;
}

/* 为莉莉丝卡片添加特殊颜色效果 */
.character-card:last-of-type {
  background: linear-gradient(145deg, rgba(218, 112, 214, 0.2), rgba(255, 255, 255, 0.03));
  border: 1px solid #da70d6;
}

.card-portrait {
  height: 150px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

/* 角色“肖像”的简单表示 */
.portrait-user {
  background-color: #333;
  background-image: linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%);
  background-size: 20px 20px;
}
.portrait-lilith {
  background-color: #4a424f;
  background-image: radial-gradient(circle, #5c5268 10%, transparent 10%);
  background-size: 30px 30px;
}

.card-body {
  padding: 1rem;
}
.card-body h3 {
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  font-family: 'Cinzel', serif;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.character-card:first-of-type .card-body h3 {
  color: #87ceeb;
  text-shadow: 0 0 8px rgba(135, 206, 235, 0.5);
}

.character-card:last-of-type .card-body h3 {
  color: #dda0dd;
  text-shadow: 0 0 8px rgba(221, 160, 221, 0.5);
}

.card-body p {
  font-size: 0.9rem;
  margin: 0.3rem 0;
  color: var(--text-secondary);
}

.character-card:first-of-type .card-body p {
  color: #b0c4de;
}

.character-card:last-of-type .card-body p {
  color: #d8bfd8;
}

.secret-info {
  color: var(--accent-danger);
  font-style: italic;
  opacity: 0.8;
  font-weight: 500;
}

.character-card:first-of-type .secret-info {
  color: #cd5c5c;
  text-shadow: 0 0 4px rgba(205, 92, 92, 0.3);
}

.character-card:last-of-type .secret-info {
  color: #ff69b4;
  text-shadow: 0 0 4px rgba(255, 105, 180, 0.3);
}

.summary-text {
  max-width: 600px;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* 特效1a: 身份闪烁 */
.identity-glitch {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  animation: identity-flicker 5s infinite step-end;
}
@keyframes identity-flicker {
  0%, 100% { box-shadow: inset 0 0 0 0 transparent; }
  2% { box-shadow: inset 0 0 20px 5px rgba(164, 139, 87, 0.7); }
  2.2% { box-shadow: inset 0 0 0 0 transparent; }
  5% { box-shadow: inset 0 0 30px 10px rgba(164, 139, 87, 0.5); }
  5.3% { box-shadow: inset 0 0 0 0 transparent; }
}

/* 特效1b: 血脉闪烁 */
.bloodline-flash {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: #ff7eb9; /* 粉色 */
  opacity: 0;
  animation: bloodline-reveal 6s infinite ease-in-out;
  animation-delay: 1s;
}
@keyframes bloodline-reveal {
  0%, 100% { opacity: 0; }
  3% { opacity: 0.4; }
  3.5% { opacity: 0; }
}

.animate-card-enter {
  opacity: 0;
  animation: card-enter 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
@keyframes card-enter {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* --- 第二页: 白尘女士 --- */
.guide-page {
  overflow: hidden; /* 隐藏溢出的粒子 */
}

/* 特效2: 梦境尘埃粒子 */
.particle-container {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: -1;
}
.particle {
  position: absolute;
  bottom: -20px;
  background: var(--accent-primary);
  border-radius: 50%;
  opacity: 0;
  animation: drift 10s infinite linear;
}
@keyframes drift {
  from { transform: translateY(0) translateX(0); opacity: 0.7; }
  to { transform: translateY(-120vh) translateX(var(--drift-x, 0)); opacity: 0; }
}
/* 随机化粒子效果 */
.particle:nth-child(5n) { width: 3px; height: 3px; animation-duration: 12s; }
.particle:nth-child(5n+1) { width: 1px; height: 1px; animation-duration: 8s; }
.particle:nth-child(5n+2) { width: 2px; height: 2px; animation-duration: 15s; }
.particle:nth-child(5n+3) { width: 1.5px; height: 1.5px; animation-duration: 10s; }
.particle:nth-child(5n+4) { width: 2.5px; height: 2.5px; animation-duration: 18s; }

/* 特效3: 形态不定的“存在”感 */
.presence-shimmer {
  width: 150px;
  height: 150px;
  margin-bottom: 2rem;
  position: relative;
}
.presence-shimmer::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 100%; height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
  transform: translate(-50%, -50%);
  animation: pulse 4s infinite ease-in-out;
}
@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

/* 特效4: 逐字浮现 */
.quote-text {
  max-width: 600px;
  font-size: 1.1rem;
  font-style: italic;
  color: var(--text-secondary);
  line-height: 1.8;
  min-height: 100px; /* 防止文字出现时布局跳动 */
}
.animate-char-appear {
  display: inline-block;
  text-align: center;
  opacity: 0;
  animation: char-appear 0.5s forwards;
}
@keyframes char-appear {
  to { opacity: 1; }
}

/* --- 通用动画 & 按钮 --- */
.animate-fade-in { animation: fadeIn 1s ease-out forwards; opacity: 0; }
@keyframes fadeIn { to { opacity: 1; } }
.animate-fade-up { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.reveal-button { margin-top: 2.5rem; background: none; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 10px 20px; font-family: 'Cinzel', serif; cursor: pointer; transition: all 0.3s ease; }
.reveal-button:hover { color: var(--accent-primary); border-color: var(--accent-primary); background: rgba(164, 139, 87, 0.1); }

.subpage-swap-enter-active { transition: opacity 0.5s ease-in 0.3s, transform 0.5s ease-in-out 0.3s; }
.subpage-swap-leave-active { transition: opacity 0.3s ease-out, transform 0.3s ease-in; }
.subpage-swap-enter-from { opacity: 0; transform: translateY(30px); }
.subpage-swap-leave-to { opacity: 0; transform: translateY(-30px); }
</style>
