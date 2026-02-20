<template>
  <div class="diary-container">
    <div class="diary-book">
      <transition :name="transitionName" mode="out-in">

        <!-- 封面 (经过UI优化) -->
        <div v-if="currentPage === 0" class="page cover-page" key="cover">
          <div class="cover-texture"></div>
          <div class="cover-content-wrapper">
            <div class="cover-corner top-left"></div>
            <div class="cover-corner top-right"></div>
            <div class="cover-corner bottom-left"></div>
            <div class="cover-corner bottom-right"></div>

            <div class="cover-header">
              <span class="cover-rune">NOX</span>
            </div>

            <h1 class="cover-title">异界<br>见闻录</h1>

            <div class="cover-divider">
              <span class="diamond">❖</span>
              <span class="line"></span>
              <span class="diamond">❖</span>
            </div>

            <div class="cover-symbol-container">
              <div class="cover-symbol">👁</div>
              <div class="cover-circle"></div>
            </div>

            <div class="cover-footer">
              <div class="cover-subtitle">—— 记录者：C ——</div>
              <div class="cover-warning">非请勿入 · 阅后即焚</div>
            </div>
          </div>
        </div>

        <!-- 日记内容页 -->
        <div v-else-if="currentPage <= pages.length" class="page content-page" :key="currentPage">
          <h2 class="chapter-title">{{ pages[currentPage - 1].title }}</h2>
          <div class="chapter-content" v-html="highlightText(pages[currentPage - 1].content)"></div>
          <div class="page-number">- {{ currentPage }} -</div>
        </div>

        <!-- 最后一页：撕裂的残页 -->
        <div v-else class="page torn-page" key="torn">
          <div class="torn-content">
            <div class="torn-edge"></div>
            <h2 class="to-be-continued">未完待续...</h2>
          </div>
        </div>

      </transition>
    </div>

    <!-- 翻页控制 -->
    <div class="diary-controls">
      <button
        class="control-btn"
        @click="prevPage"
        :disabled="currentPage === 0"
      >
        <span>◂</span> 上一页
      </button>
      <span class="progress">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="control-btn"
        @click="nextPage"
        :disabled="currentPage === totalPages"
      >
        下一页 <span>▸</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 页面状态
const currentPage = ref(0);
const transitionName = ref('page-next');

// 关键字分类定义
const goldKeywords = [
  '灯', '铸', '杯', '刃', '术', '辉光', '准则','蛾'
];

const redKeywords = [
  '飞蛾', '林地', '仪式', '密传', '漫宿', '纯白之门', '器具', '献祭', '攥升','委托'
];

// 日记数据
const pages = [
  {
    title: '【关于“术”的异质性记录】',
    content: `我曾以为这世界的奇迹遵循着某种能量守恒，直到我亲眼目睹那盏灯燃起。<br><br>没有燃料，没有灯芯。那是一个低阶的灯术士，他仅仅是念诵了一段关于“光与理性”的悖论，指尖便剥落下一片惨白的光屑。那光不是辐射，是一种纯粹的“揭示”。它照在墙角，原本空无一物的阴影里竟显出无数重叠的眼球涂鸦。<br><br>这就是“术”。它不是魔法，是漫宿墙皮上掉落的灰。那些被称作“准则”的东西——灯的理性、铸的毁灭、杯的欲望……它们根本不关心物理法则。术士们像窃贼，从高维的餐桌上偷取残羹冷炙。<br><br>但我看见那个术士的手指在颤抖。使用“术”是对现实的强行扭曲，而现实的反作用力会作用于大脑。即使是点燃这一点光，他的瞳孔也因为在那一瞬间窥见了过多的真理而处于涣散边缘。<br><br>力量是借来的，利息是理智。`
  },
  {
    title: '【无墙之屋的梦呓】',
    content: `入梦不再是休息。自从那次高烧后，我就能在睡眠的边缘瞥见那片森林。<br><br>他们称之为“漫宿”，世界的表皮之下。没有墙壁，只有层层叠叠的门扉。<br><br>我最初只能在“林地”徘徊。那里的树木不是植物，是黑色气流凝固的狂乱线条。风声像死者的窃窃私语，那是“飞蛾”在振翅。我必须小心翼翼，因为林地是所有渴望飞升者的必经之路，也是疯子的乱葬岗。<br><br>昨夜，我试着向上走。穿过林地那令人窒息的黑色植被，我看见了那扇门。<br><br>纯白之门。<br><br>它伫立在虚空中，散发着比冬夜月光更冷冽的辉光。靠近它，体温在流失，思维却像被液氮冷冻般清晰。我想叩门，但直觉在尖叫——我的灵魂重量还不足以推开它。<br><br>我醒来时，枕头湿透了，不是汗，是融化的霜。`
  },
  {
    title: '【锈蚀的交易】',
    content: `黑市的空气里弥漫着发霉的香料味，那是为了掩盖更深层的腐臭。<br><br>那个瞎了一只眼的商人推给我一把匕首。锈迹斑斑，刃口却泛着一种不详的暗红。<br><br>“这东西吃过五个人的血，全是因爱生恨的情杀。”商人的声音像砂纸摩擦，“它是天然形成的‘器具’。这上面固化了‘杯’的准则。”<br><br>我握住刀柄。那一瞬间，我不觉得冷，反而感到一阵燥热的脉动从掌心钻入血管。它在渴望，渴望切开皮肤，渴望温热的液体。这不是金属，这是某种欲望的尸体。<br><br>人工制造的那些炼金产品与之相比，就像是拙劣的玩具。那些量产的护符力量死板且易逝，但这把匕首……它活着，且充满恶意。<br><br>我买下了它。虽然我知道，把这种东西带在身边，就像揣着一条毒蛇。长期接触这些器具，心智会被那种单一的准则侵染。我也许会变得嗜血，或者对血肉产生病态的迷恋。<br><br>但在这个世界，没有牙齿的人活不过第一章。`
  },
  {
    title: '【阴沟里的金币】',
    content: `那枚金币在桌面上旋转，最终倒下，发出沉闷的声响。它的边缘磨损严重，刻着前代君主的侧脸，那张脸已经被无数只肮脏的手摸得模糊不清。<br><br>
这就是报酬。<br><br>
委托人是黑市那个总是咳嗽的老头。任务地点在东区的下水道网格，代号“溃烂点”。有人在那里倾倒了炼金废料，导致一群老鼠发生了畸变。它们不再是啮齿动物，而是长着人指甲的肉球，会像水蛭一样吸附在管道壁上，等待路过的检修工。<br><br>
我的工作是清理它们，并带回一颗完整的“鼠王”心脏。<br><br>
多么体面。<br><br>
我想起今天在街角看到的那些年轻人。他们穿着学院的深蓝制服，胸口别着银质的徽章，谈论着关于“以太”和“星轨”的高深理论。他们的手干净、干燥，握着的是精装的羊皮纸书卷，而不是沾满污泥的短刀。<br><br>
如果我是他们中的一员，我现在应该坐在图书馆里练习最初级的照明术。我的委托会是“协助整理星图”或者“照看温室里的发光植物”。哪怕失误，也就是被扣掉几分学分，而不是被下水道里的怪物咬断喉咙。<br><br>
但我还是收起了金币。它很脏，带着一股铁锈味，但这正是这个世界的味道。<br><br>
而且，那颗“鼠王”的心脏……如果处理得当，或许能提炼出一点微弱的“蛾”之准则。`
  },
  {
    title: '【破碎的地图】',
    content: `在废纸堆里翻出这本书时，我的手指被纸页边缘割破了。<br><br>
这是一本关于“灯”的密传。残缺不全，封皮是用某种不知名生物的皮制成的。文字不是写上去的，而是烧灼上去的。<br><br>
阅读它是一种折磨。每一个字都在脑海里尖叫，试图把一段关于“辉光”的记忆强行塞进我的海马体。我不得不每读一页就停下来，盯着烛火发呆十分钟，以确认自己还处在三维空间。<br><br>
但我发现了文字排列的诡计。当把书页对着强光透视，那些烧灼的孔洞便不再是文字，而是星图与地貌的重叠。<br><br>
它指向龙牙山脉的北坡。<br><br>
不是那座显眼的红龙主峰，而是侧面那片终年被雾气笼罩的“盲区”。地图在这里标记了一个坐标——在两座如狼牙交错的山岩之间，有一条并不存在的山谷。只有在正午阳光垂直射入时，阴影才会显露出入口。`
  },
  {
    title: '【龙牙山脉的余烬】',
    content: `我不该去的。贪婪是比疯狂更致命的毒药。<br><br>
龙牙山脉的深处没有风。那里安静得像是一幅静止的油画。但我听到了呼吸声，沉重、灼热，带着硫磺的味道。<br><br>
那是一只红龙。或者说，是一座由鳞片和火焰构成的山丘。它仅仅是翻了个身，释放出的威压就让我全身的骨骼都在呻吟。那是属于神话生物的力场，凡人在其面前渺小如尘埃。<br><br>
它守护着某种东西，也许是高阶的铸造器具，也许是通往漫宿深处的裂隙。但我根本不敢细看。在那一刻，我的“刃”属性也好，我的“灯”理性也罢，全都失效了。只有生物本能的恐惧支配了双腿。<br><br>
我逃了。连滚带爬，丢掉了所有的补给。那是对生命层次差距的直观体验。在这个世界，有些存在不是用来挑战的，是用来敬畏的。`
  },
  {
    title: '【晋升的代价】',
    content: `瓶颈期像是一堵看不见的墙。<br><br>
无论我如何练习那些低阶的戏法，我的术都不再有任何精进。那种感觉就像是试图用勺子挖穿地球。经验在积累，但质变遥遥无期。<br><br>
直到我解析出了那个仪式的含义。<br><br>从14级继续向上跨越，不是量的积累，是质的飞跃。凡人的模仿到此为止了。要想继续向上，必须接触禁忌。<br><br>
仪式图谱上画着复杂的循环：用“灯”照亮“铸”的熔炉，用“铸”锻造“刃”的锋芒……这是一个闭环。但这只是理论。<br><br>
真正的一行小字写在角落里：“唯有献祭，方能攥升。”<br><br>
献祭什么？理智？情感？还是更具体的东西？比如一个活生生的祭品，或者我自己的一部分人性。<br><br>
我看着镜子里的自己。眼底的青黑像两团散不开的墨。为了获得在这个世界站直的力量，我已经准备好支付代价了吗？`
  }
];

const totalPages = computed(() => pages.length + 1);

// 关键字高亮处理函数 (优化版)
const highlightText = (text) => {
  let processedText = text;

  // 处理金色关键字
  goldKeywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'g');
    processedText = processedText.replace(regex, `<span class="highlight-gold">$1</span>`);
  });

  // 处理红色关键字
  redKeywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'g');
    processedText = processedText.replace(regex, `<span class="highlight-red">$1</span>`);
  });

  return processedText;
};

// 翻页逻辑
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    transitionName.value = 'page-next';
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 0) {
    transitionName.value = 'page-prev';
    currentPage.value--;
  }
};
</script>

<style scoped>
/* 颜色变量定义 */
.diary-container {
  --c-text-main: #d0d0d0;
  --c-text-dim: #8a92a0;
  --c-gold: #e2c068;
  --c-gold-dim: #8a7b50;
  --c-red: #ff4d4d;
  --c-red-dim: #8a3232;
  --c-border: #4a4a4a;
  --c-bg-book: #0f1218;
  --c-hover-bg: rgba(226, 192, 104, 0.1);
  --font-title: 'Georgia', 'SimSun', serif;
  --font-body: 'Helvetica Neue', 'Arial', sans-serif;

  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  color: var(--c-text-main);
  font-family: var(--font-body);
}

/* 书本主体 */
.diary-book {
  width: 100%;
  max-width: 600px;
  height: 70vh;
  min-height: 550px;
  background: var(--c-bg-book);
  border: 1px solid #333;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.8),
    inset 0 0 60px rgba(0, 0, 0, 0.9),
    0 0 0 2px #1a1a1a;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

/* 页面通用样式 */
.page {
  position: absolute;
  inset: 0;
  padding: 40px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-y: auto;
  scrollbar-width: none;
}
.page::-webkit-scrollbar { display: none; }

/* ================= 封面样式优化 ================= */
.cover-page {
  justify-content: center;
  align-items: center;
  text-align: center;
  background-color: #0a0c10;
  color: var(--c-gold);
  padding: 20px;
}

/* 封面背景纹理 */
.cover-texture {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 50% 30%, rgba(50, 40, 20, 0.15), transparent 60%),
    repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px);
  opacity: 0.5;
  pointer-events: none;
}

.cover-content-wrapper {
  width: 100%;
  height: 100%;
  border: 3px double var(--c-gold-dim);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
  box-sizing: border-box;
}

/* 角落装饰 */
.cover-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: var(--c-gold);
  border-style: solid;
  transition: all 0.3s ease;
}
.top-left { top: 10px; left: 10px; border-width: 2px 0 0 2px; }
.top-right { top: 10px; right: 10px; border-width: 2px 2px 0 0; }
.bottom-left { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; }
.bottom-right { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }

.cover-header {
  margin-bottom: 20px;
  opacity: 0.6;
}
.cover-rune {
  font-size: 0.8rem;
  letter-spacing: 8px;
  border-bottom: 1px solid var(--c-gold-dim);
  padding-bottom: 5px;
}

.cover-title {
  font-family: var(--font-title);
  color: var(--c-gold);
  font-size: 3.5rem;
  line-height: 1.2;
  margin: 0;
  letter-spacing: 8px;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(226, 192, 104, 0.2);
  background: linear-gradient(to bottom, #fff5d6, #c4a055);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cover-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60%;
  margin: 20px 0;
  opacity: 0.8;
}
.cover-divider .line {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-gold), transparent);
  flex-grow: 1;
  margin: 0 10px;
}
.cover-divider .diamond {
  font-size: 12px;
  color: var(--c-gold);
}

.cover-symbol-container {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 30px 0;
}
.cover-symbol {
  font-size: 4rem;
  color: var(--c-gold);
  z-index: 2;
  text-shadow: 0 0 15px rgba(226, 192, 104, 0.4);
}
.cover-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 1px dashed var(--c-gold-dim);
  border-radius: 50%;
  animation: spin 20s linear infinite;
}

.cover-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cover-subtitle {
  color: var(--c-text-dim);
  font-size: 1rem;
  letter-spacing: 3px;
  font-style: italic;
}
.cover-warning {
  font-size: 0.7rem;
  color: var(--c-red-dim);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 10px;
}

/* ================= 内容页样式 ================= */
.chapter-title {
  font-family: var(--font-title);
  color: var(--c-gold);
  font-size: 1.6rem;
  margin-bottom: 30px;
  text-align: center;
  border-bottom: 1px solid rgba(226, 192, 104, 0.2);
  padding-bottom: 15px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
.chapter-content {
  font-size: 1.1rem;
  line-height: 1.9;
  color: #d0d0d0;
  text-align: justify;
  flex-grow: 1;
}
.page-number {
  text-align: center;
  color: var(--c-text-dim);
  margin-top: 20px;
  font-family: var(--font-title);
  font-size: 0.9rem;
}

/* ================= 关键字高亮样式 ================= */
/* 金色高亮 */
:deep(.highlight-gold) {
  color: var(--c-gold);
  font-weight: bold;
  text-shadow: 0 0 5px rgba(226, 192, 104, 0.4);
  padding: 0 1px;
}

/* 红色高亮 */
:deep(.highlight-red) {
  color: var(--c-red);
  font-weight: bold;
  text-shadow: 0 0 5px rgba(255, 77, 77, 0.3);
  padding: 0 1px;
}

/* ================= 撕裂页样式 ================= */
.torn-page {
  background: linear-gradient(to bottom, rgba(15, 18, 24, 0.9) 0%, rgba(15, 18, 24, 0.2) 100%);
}
.torn-edge {
  height: 25px;
  width: 100%;
  margin: 30px 0;
  background-color: rgba(255, 255, 255, 0.1);
  clip-path: polygon(0% 20%, 5% 80%, 10% 10%, 15% 90%, 20% 30%, 25% 70%, 30% 10%, 35% 80%, 40% 20%, 45% 90%, 50% 10%, 55% 80%, 60% 30%, 65% 90%, 70% 20%, 75% 80%, 80% 10%, 85% 90%, 90% 20%, 95% 80%, 100% 10%, 100% 100%, 0% 100%);
}
.to-be-continued {
  font-family: var(--font-title);
  color: var(--c-red);
  text-align: center;
  margin-top: 60px;
  font-size: 2.2rem;
  letter-spacing: 6px;
  text-shadow: 0 0 20px rgba(255, 77, 77, 0.6);
  animation: pulse 3s infinite ease-in-out;
}

/* ================= 动画与控制 ================= */
@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.diary-controls {
  margin-top: 25px;
  display: flex;
  align-items: center;
  gap: 25px;
}
.control-btn {
  background: transparent;
  border: 1px solid var(--c-gold-dim);
  color: var(--c-gold);
  padding: 10px 24px;
  font-family: var(--font-title);
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 2px;
  font-size: 0.9rem;
  letter-spacing: 1px;
}
.control-btn:hover:not(:disabled) {
  background: var(--c-hover-bg);
  border-color: var(--c-gold);
  box-shadow: 0 0 15px rgba(226, 192, 104, 0.2);
}
.control-btn:disabled {
  color: #444;
  border-color: #333;
  cursor: not-allowed;
}
.progress {
  color: var(--c-text-dim);
  font-family: var(--font-title);
  min-width: 80px;
  text-align: center;
  letter-spacing: 2px;
}

/* 翻页动画 */
.page-next-enter-active, .page-next-leave-active,
.page-prev-enter-active, .page-prev-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.page-next-enter-from { opacity: 0; transform: translateX(30px) scale(0.95); filter: blur(2px); }
.page-next-leave-to { opacity: 0; transform: translateX(-30px) scale(0.95); filter: blur(2px); }

.page-prev-enter-from { opacity: 0; transform: translateX(-30px) scale(0.95); filter: blur(2px); }
.page-prev-leave-to { opacity: 0; transform: translateX(30px) scale(0.95); filter: blur(2px); }

/* 移动端适配 */
@media (max-width: 768px) {
  .diary-book { height: 65vh; }
  .page { padding: 25px; }
  .cover-title { font-size: 2.5rem; }
  .cover-content-wrapper { border-style: solid; border-width: 1px; }
  .chapter-content { font-size: 1rem; }
}
</style>
