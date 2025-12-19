<template>
  <div class="concept-page-container">
    <!--
      页面切换容器：
      我们使用一个自定义的 transition "subpage-swap" 来处理两个内部页面间的切换动画。
    -->
    <transition name="subpage-swap" mode="out-in">

      <!-- ================================= -->
      <!--         第一页: 漫宿 (Mansus)       -->
      <!-- ================================= -->
      <div v-if="internalPage === 0" key="mansus" class="subpage mansus-page">
        <!-- 特效1: 动态背景 - 模拟精神世界的扭曲与不稳定 -->
        <div class="background-distortion"></div>

        <h2 class="concept-title animate-fade-in">「漫宿」</h2>

        <div class="concept-body">
          <!-- 特效2: 文本逐行浮现 -->
          <div class="quote-section animate-fade-up" style="animation-delay: 0.5s;">
            <p class="quote-text">“林地生长于漫宿墙外。每一个研习诸史的人都知道，漫宿无墙。”</p>
            <p class="quote-author">—— 克里斯托弗·伊利奥波里《夜游漫记》</p>
          </div>

          <!-- 特效3: 禁忌知识的"故障"/"闪烁"效果 -->
          <div class="secret-text-container animate-fade-up" style="animation-delay: 1.2s;">
            <p class="secret-text animate-glitch" style="animation-delay: 2s;">
              <span data-text="虚界蠕动，蚕食世壳">
                虚界蠕动，蚕食世壳
              </span>
            </p>
            <p class="secret-text animate-glitch" style="animation-delay: 2s;">
              <span data-text="漫宿门闭，众神遁藏">
                 漫宿门闭，众神遁藏
              </span>
            </p>
            <p class="secret-text animate-glitch" style="animation-delay: 2s;">
              <span data-text="入者寥寥，疯险俱尝">
                 入者寥寥，疯险俱尝
              </span>
            </p>
            <p class="secret-text animate-glitch" style="animation-delay: 2s;">
              <span data-text="林地死寂，蛾蜈横僵">
                林地死寂，蛾蜈横僵
              </span>
            </p>
            <p class="secret-text animate-glitch" style="animation-delay: 2s;">
              <span data-text="鼹鼠陈尸，蠕虫翻浆">
                 鼹鼠陈尸，蠕虫翻浆
              </span>
            </p>
            <p class="secret-text animate-glitch" style="animation-delay: 2s;">
              <span data-text="啃噬无尽，惊惧滋狂">
                啃噬无尽，惊惧滋狂
              </span>
            </p>
          </div>
        </div>

        <!-- 内部翻页触发器 -->
        <button class="reveal-button animate-fade-in" style="animation-delay: 3s;" @click="showNextSubPage">
          窥视那根源之后...
        </button>
      </div>

      <!-- ================================= -->
      <!--       第二页: 伟大存在 (Great Ones) -->
      <!-- ================================= -->
      <div v-else-if="internalPage === 1" key="greatones" class="subpage greatones-page">
        <h2 class="concept-title animate-fade-in">「伟大存在」</h2>

        <div class="concept-body">
          <p class="animate-fade-up" style="animation-delay: 0.5s;">人们相信，术的力量最终来自于被尊称为"伟大存在"的神明。每一个准则，都对应着一位伟大存在，祂们拥有远超凡人想象的伟力。</p>

          <!-- 特效4: 众神名讳如星辰般逐个闪现 -->
          <ul class="gods-list">
            <li
v-for="(god, index) in greatOnes"
                :key="god.name"
                class="animate-star-appear"
                :class="god.themeClass"
                :style="{ animationDelay: `${0.8 + index * 0.2}s` }">
              <span class="god-principle">【{{ god.principle }}】</span>
              <strong class="god-name">{{ god.name }}</strong>
              <span class="god-title"> - {{ god.title }}</span>
            </li>
          </ul>
        </div>
      </div>

    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 内部页面状态，0 代表"漫宿"，1 代表"伟大存在"
const internalPage = ref(0);

// 切换到下一个内部页面的方法
const showNextSubPage = () => {
  internalPage.value = 1;
};

// 从设定中提取的数据
const greatOnes = ref([
  { principle: '灯', name: '守夜人', title: '照明驱暗之神', themeClass: 'theme-lamp' },
  { principle: '铸', name: '白日铸炉', title: '再造不变之神', themeClass: 'theme-forge' },
  { principle: '刃', name: '狮子匠', title: '无懈可击之神', themeClass: 'theme-blade' },
  { principle: '冬', name: '悼歌诗人', title: '通晓亡者、无可剥夺之神', themeClass: 'theme-winter' },
  { principle: '心', name: '轰雷之皮', title: '不允终局之神', themeClass: 'theme-heart' },
  { principle: '杯', name: '赤杯', title: '永无餍足之神', themeClass: 'theme-cup' },
  { principle: '蛾', name: '树中牝马', title: '浪许虚辞之神', themeClass: 'theme-moth' },
  { principle: '启', name: '蚁母', title: '洞开门扉之神', themeClass: 'theme-key' },
]);
</script>

<style scoped>

.concept-page-container {
  width: 100%;
  max-width: 900px;
  padding: 2rem;
  box-sizing: border-box;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px; /* 给内容一个最小高度 */
}

.subpage {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* --- 特效1: 背景扭曲 (漫宿页) --- */
.background-distortion {
  position: absolute;
  top: -20%; left: -20%;
  width: 140%; height: 140%;
  background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.1;
  animation: warp 20s linear infinite;
  z-index: -1;
}
@keyframes warp {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}

/* --- 通用入场动画 --- */
.animate-fade-in {
  animation: fadeIn 1s ease-out forwards;
  opacity: 0;
}
@keyframes fadeIn {
  to { opacity: 1; }
}

/* --- 特效2: 文本逐行浮现 --- */
.animate-fade-up {
  opacity: 0;
  animation: fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- 引文区域样式 --- */
.quote-section {
  text-align: center;
  margin: 2rem 0;
  padding: 1.5rem;
  border-left: 3px solid var(--accent-primary);
  background: rgba(0, 0, 0, 0.2);
  font-style: italic;
}

.quote-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.quote-author {
  text-align: right;
  font-style: normal;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* --- 禁忌知识容器 --- */
.secret-text-container {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px dashed rgba(255, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* --- 特效3: 禁忌知识的"故障"效果 --- */
.animate-glitch {
  position: relative;
  opacity: 0;
  animation: fadeIn 0.1s 2s forwards; /* 先让它出现 */
}
.animate-glitch span {
  position: relative;
  display: inline-block;
}
.animate-glitch span::before,
.animate-glitch span::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  overflow: hidden;
}
.animate-glitch span::before {
  left: 2px;
  text-shadow: -1px 0 var(--accent-danger);
  animation: glitch-1 0.5s infinite linear alternate-reverse;
}
.animate-glitch span::after {
  left: -2px;
  text-shadow: -1px 0 var(--accent-primary), 1px 0 #00ffff;
  animation: glitch-2 0.5s infinite linear alternate-reverse;
}
@keyframes glitch-1 {
  0%, 2%, 6%, 10%, 100% { clip-path: inset(50% 0 50% 0); }
  4% { clip-path: inset(20% 0 70% 0); }
  8% { clip-path: inset(80% 0 10% 0); }
}
@keyframes glitch-2 {
  0%, 3%, 7%, 100% { clip-path: inset(50% 0 50% 0); }
  5% { clip-path: inset(10% 0 85% 0); }
  9% { clip-path: inset(60% 0 30% 0); }
}

/* --- 内部翻页按钮 --- */
.reveal-button {
  margin-top: 2.5rem;
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 10px 20px;
  font-family: 'Cinzel', serif;
  cursor: pointer;
  transition: all 0.3s ease;
}
.reveal-button:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
  background: rgba(164, 139, 87, 0.1);
}

/* --- 特效4: 众神名讳如星辰般闪现 --- */
.gods-list {
  list-style: none;
  padding: 0;
  margin-top: 1.5rem;
  text-align: center;
}

/* 定义各主题颜色变量 */
.theme-lamp { --theme-color: #FFD700; }
.theme-forge { --theme-color: #FF4500; }
.theme-blade { --theme-color: #C0C0C0; }
.theme-winter { --theme-color: #A3D5D5; }
.theme-heart { --theme-color: #FF69B4; }
.theme-cup { --theme-color: #8B0000; }
.theme-moth { --theme-color: #888888; }
.theme-key { --theme-color: #9400D3; }

.animate-star-appear {
  opacity: 0;
  animation: starAppear 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}
@keyframes starAppear {
  from {
    opacity: 0;
    transform: scale(0.5);
    text-shadow: 0 0 20px var(--accent-primary);
  }
  to {
    opacity: 1;
    transform: scale(1);
    text-shadow: none;
  }
}
.gods-list li {
  font-size: 1.1rem;
  line-height: 2.2;
  color: var(--text-secondary);
  transition: color 0.3s, transform 0.3s;
}
.gods-list li:hover {
  color: var(--text-primary);
  transform: translateX(5px);
}
.god-principle {
  color: var(--theme-color);
  font-family: 'Cinzel', serif;
}
.god-name {
  color: var(--theme-color);
  font-weight: bold;
}
.god-title {
  color: var(--theme-color);
}

/* --- 内部页面切换动画 --- */
.subpage-swap-enter-active {
  transition: opacity 0.5s ease-in 0.3s, transform 0.5s ease-in-out 0.3s;
}
.subpage-swap-leave-active {
  transition: opacity 0.3s ease-out, transform 0.3s ease-in;
}
.subpage-swap-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
.subpage-swap-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}
</style>