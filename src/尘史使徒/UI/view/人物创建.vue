<template>
  <div class="creation-layout theme-forgotten">

    <!-- 页面一：主要表单内容 (当不显示地图时显示) -->
    <div class="main-page-view" v-show="!showMapModal">
      <header class="creation-header">
        <h1 class="title">重塑自我</h1>
        <div class="subtitle">WHO ARE YOU IN THE MIRROR?</div>
      </header>

      <div class="creation-container">
        <!-- 左侧：基础设定与外貌 -->
        <div class="column left-col">
          <section class="form-group">
            <h3 class="section-title">基础认知</h3>
            <div class="input-row">
              <label>性别</label>
              <div class="radio-group">
                <label :class="{ active: formData.gender === '男性' }">
                  <input type="radio" v-model="formData.gender" value="男性"> 男性
                </label>
                <label :class="{ active: formData.gender === '女性' }">
                  <input type="radio" v-model="formData.gender" value="女性"> 女性
                </label>
              </div>
            </div>
            <div class="input-row">
              <label>年龄</label>
              <input type="text" v-model="formData.age" placeholder="例如：25岁" class="text-input">
            </div>
            <div class="input-row">
              <label>出生地</label>
              <div class="location-selector" @click="openMapSelector">
                <span v-if="formData.location" class="location-value">{{ formData.location }}</span>
                <span v-else class="placeholder">点击选择地图位置...</span>
                <span class="map-icon">🗺️</span>
              </div>
            </div>
          </section>

          <section class="form-group">
            <h3 class="section-title">外貌特征</h3>
            <p class="desc">镜中的你是什么模样？</p>

            <div class="appearance-grid">
              <div class="app-field">
                <label>发色</label>
                <input type="text" v-model="appearanceDetails.hairColor" class="text-input mini">
              </div>
              <div class="app-field">
                <label>发型</label>
                <input type="text" v-model="appearanceDetails.hairStyle" class="text-input mini">
              </div>
              <div class="app-field">
                <label>脸型</label>
                <input type="text" v-model="appearanceDetails.face" class="text-input mini">
              </div>
              <div class="app-field">
                <label>眼睛</label>
                <input type="text" v-model="appearanceDetails.eyes" class="text-input mini">
              </div>
              <div class="app-field">
                <label>肤色</label>
                <input type="text" v-model="appearanceDetails.skin" class="text-input mini">
              </div>
              <div class="app-field">
                <label>身材</label>
                <input type="text" v-model="appearanceDetails.body" class="text-input mini">
              </div>
              <div class="app-field full-width">
                <label>特殊特征 (可选)</label>
                <input type="text" v-model="appearanceDetails.feature" placeholder="如：眼角有泪痣、左手有伤疤" class="text-input">
              </div>
            </div>

            <!-- 新增：初始身份 -->
            <div class="input-row" style="margin-top: 15px;">
              <label>初始身份</label>
              <input type="text" v-model="formData.identity" placeholder="例如：落魄贵族、流浪骑士、学徒" class="text-input">
            </div>
          </section>

          <section class="form-group">
            <h3 class="section-title">特殊状态</h3>
            <textarea v-model="formData.specialStatus" rows="2" placeholder="例如：指尖总是冰冷..."></textarea>
          </section>
        </div>

        <!-- 中间：性格倾向 (优化版) -->
        <div class="column mid-col">
          <h3 class="section-title">心性倾向</h3>
          <div class="personality-sliders">
            <div class="slider-item" v-for="(val, key) in formData.personality" :key="key">
              <div class="slider-header">
                <span class="trait-name">{{ key }}</span>
                <!-- 动态显示当前区间的具体描述 -->
                <span class="trait-status" :class="getTraitColorClass(val)">
                  {{ getTraitDetail(key, val).label }}
                </span>
              </div>

              <div class="slider-container">
                <span class="limit-label left">{{ getTraitExtremes(key).min }}</span>
                <!-- 范围调整为 -100 到 100 -->
                <input type="range" v-model.number="formData.personality[key]" min="-100" max="100" step="1" class="styled-slider">
                <span class="limit-label right">{{ getTraitExtremes(key).max }}</span>
              </div>

              <div class="trait-desc-text">
                {{ getTraitDetail(key, val).desc }}
              </div>
            </div>
          </div>

          <div class="personality-summary-box">
            <label>性格侧写</label>
            <div class="summary-text">{{ generatedPersonalitySummary }}</div>
          </div>
        </div>

        <!-- 右侧：术之等级 (优化布局) -->
        <div class="column right-col">
          <h3 class="section-title">秘史造诣</h3>
          <div class="points-header">
            <div class="points-label">剩余点数</div>
            <div class="points-display">
              <span class="points-val" :class="{ 'error': remainingPoints < 0 }">{{ remainingPoints }}</span>
              <span class="points-total">/ 100</span>
            </div>
          </div>

          <div class="arts-list-scroll">
            <div class="art-point-item" v-for="(data, key) in formData.arts" :key="key" :class="{ 'active': data.当前等级 > 0 }">
              <div class="art-icon-placeholder">{{ key }}</div>
              <div class="art-point-info">
                <span class="art-lv-label">等级</span>
                <span class="art-lv-val">Lv.{{ data.当前等级 }}</span>
              </div>
              <div class="art-controls">
                <button class="ctrl-btn" @click="changeArtLevel(key, -1)" :disabled="data.当前等级 <= 0">-</button>
                <div class="cost-preview">
                  <span v-if="data.当前等级 < 10" class="cost-val">
                    消耗 {{ getUpgradeCost(key, data.当前等级) }}
                  </span>
                  <span v-else class="cost-val">MAX</span>
                </div>
                <button class="ctrl-btn" @click="changeArtLevel(key, 1)" :disabled="remainingPoints < getUpgradeCost(key, data.当前等级) || data.当前等级 >= 10">+</button>
              </div>
            </div>
          </div>

          <!-- 引用术之详情组件 -->
          <div class="arts-preview-wrapper">
            <ArtsModule :artsData="formData.arts" mode="creation" />
          </div>
        </div>
      </div>

      <footer class="action-footer">
        <button class="confirm-btn" :disabled="submitting || remainingPoints < 0" @click="submitCreation">
          <span v-if="!submitting">铭刻真实</span>
          <span v-else>正在生成...</span>
        </button>
      </footer>
    </div>

    <!-- 页面二：地图选择页面 (不再是模态框，而是全屏页面) -->
    <transition name="page-slide">
      <div v-if="showMapModal" class="map-page-view">
        <header class="map-page-header">
          <button class="back-btn" @click="showMapModal = false">
            <span class="arrow">←</span> 返回设定
          </button>
          <h2>选择出生地</h2>
          <div class="header-spacer"></div> <!-- 占位，保持标题居中 -->
        </header>
        <div class="map-page-content">
          <Vision mode="selection" @select="onLocationSelected" />
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
// ... (Script 部分保持不变，逻辑完全兼容) ...
import { reactive, ref, computed, watch, onMounted } from 'vue';
import { ERAUtil } from '@/Utils/ERAUtil';
import { MessageUtil } from '@/Utils/MessageUtil';
import Vision from './世界信息.vue';
// eslint-disable-next-line import-x/no-cycle
import { router } from '@/尘史使徒/UI/router/router';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import ArtsModule from '@/尘史使徒/UI/components/role/ArtsModule.vue';

const submitting = ref(false);
const showMapModal = ref(false);
const statStore = useStatStore();

onMounted(() => {
  if (!statStore.stat_data) {
    statStore.initData();
  }
});

// 外貌细节数据
const appearanceDetails = reactive({
  hairColor: '黑色',
  hairStyle: '短发',
  face: '棱角分明',
  eyes: '深邃',
  skin: '粗糙',
  body: '匀称',
  feature: ''
});

const formData = reactive({
  gender: '男性',
  age: '18',
  identity: '王家四艺学院学生',
  location: '艾斯特拉',
  specialStatus: '',
  personality: {
    "社交取向": 0,
    "决策模式": 0,
    "思维倾向": 0,
    "人际姿态": 0,
    "人性温度": 0
  },
  arts: {
    "灯": { "当前等级": 0, "累计经验值": 0, "下一级需求经验": -1 },
    "铸": { "当前等级": 0, "累计经验值": 0, "下一级需求经验": -1 },
    "刃": { "当前等级": 0, "累计经验值": 0, "下一级需求经验": -1 },
    "冬": { "当前等级": 0, "累计经验值": 0, "下一级需求经验": -1 },
    "心": { "当前等级": 0, "累计经验值": 0, "下一级需求经验": -1 },
    "杯": { "当前等级": 0, "累计经验值": 0, "下一级需求经验": -1 },
    "蛾": { "当前等级": 0, "累计经验值": 0, "下一级需求经验": -1 },
    "启": { "当前等级": 0, "累计经验值": 0, "下一级需求经验": -1 }
  }
});

// ... (省略中间的 traitDefinitions, getTraitDetail, getTraitExtremes, getTraitColorClass, generatedPersonalitySummary, getUpgradeCost, totalSpentPoints, remainingPoints, changeArtLevel, watch, finalAppearance 逻辑，均保持不变) ...
// 为了节省篇幅，这里假设中间逻辑代码与原文件一致
// 请保留原文件中的所有 JS 逻辑代码

const traitDefinitions = {
  "社交取向": [
    { min: -100, max: -80, label: "社交壁垒", desc: "主动回避接触，人群引发不适" },
    { min: -79, max: -40, label: "独处偏好", desc: "倾向单独行动，社交是消耗" },
    { min: -39, max: -10, label: "内敛", desc: "不主动发起对话，被动回应" },
    { min: -9, max: 9, label: "中性", desc: "社交场合自然，不刻意寻求或回避" },
    { min: 10, max: 40, label: "友好参与", desc: "享受小群体互动" },
    { min: 41, max: 80, label: "活跃组织者", desc: "乐于组织，带动气氛" },
    { min: 81, max: 100, label: "社交核心", desc: "无法独处，频繁社交获取能量" }
  ],
  "决策模式": [
    { min: -100, max: -80, label: "纯粹直觉", desc: "完全依据本能，拒绝逻辑" },
    { min: -79, max: -40, label: "情绪主导", desc: "情感波动决定行动" },
    { min: -39, max: -10, label: "情感倾向", desc: "逻辑为情感需求服务" },
    { min: -9, max: 9, label: "平衡", desc: "理性与感性寻求平衡" },
    { min: 10, max: 40, label: "逻辑优先", desc: "基于事实推理，考虑情感" },
    { min: 41, max: 80, label: "系统分析", desc: "严格逻辑推演，视情感为干扰" },
    { min: 81, max: 100, label: "极致理性", desc: "简化为公式模型，只求最优解" }
  ],
  "思维倾向": [
    { min: -100, max: -80, label: "顽固排斥", desc: "拒绝新观念，强烈抵触" },
    { min: -79, max: -40, label: "固执", desc: "紧守传统，对改变持怀疑" },
    { min: -39, max: -10, label: "谨慎", desc: "对新事物观望，需时间验证" },
    { min: -9, max: 9, label: "中立", desc: "对新旧观念开放" },
    { min: 10, max: 40, label: "乐于尝试", desc: "愿接触新想法体验" },
    { min: 41, max: 80, label: "积极探索", desc: "主动寻找新知识，追求创新" },
    { min: 81, max: 100, label: "颠覆创新", desc: "打破框架，拥抱所有可能性" }
  ],
  "人际姿态": [
    { min: -100, max: -80, label: "主动攻击", desc: "视人为威胁，主动冲突" },
    { min: -79, max: -40, label: "竞争优先", desc: "零和博弈，损人利己" },
    { min: -39, max: -10, label: "防御反击", desc: "不主动挑衅，受损即反击" },
    { min: -9, max: 9, label: "适时调整", desc: "灵活选择合作或竞争" },
    { min: 10, max: 40, label: "合作倾向", desc: "愿共同完成目标，友好理解" },
    { min: 41, max: 80, label: "协同者", desc: "寻求共赢，擅长调和" },
    { min: 81, max: 100, label: "无条件奉献", desc: "他人需求高于自身，利他主义" }
  ],
  "人性温度": [
    { min: -100, max: -80, label: "极端冷酷", desc: "对痛苦无动于衷，甚至制造痛苦" },
    { min: -79, max: -40, label: "无情", desc: "缺乏共情，唯利是图" },
    { min: -39, max: -10, label: "冷漠", desc: "旁观苦难，保持距离" },
    { min: -9, max: 9, label: "原则主义", desc: "依据个人准则行事" },
    { min: 10, max: 40, label: "有限同情", desc: "能感受痛苦，提供有限帮助" },
    { min: 41, max: 80, label: "善良", desc: "关注弱势，愿伸援手" },
    { min: 81, max: 100, label: "至善", desc: "普世价值，愿为良善牺牲" }
  ]
};

const getTraitDetail = (key, value) => {
  const ranges = traitDefinitions[key];
  if (!ranges) return { label: "未知", desc: "" };
  const found = ranges.find(r => value >= r.min && value <= r.max);
  return found || { label: "未知", desc: "" };
};

const getTraitExtremes = (key) => {
  const map = {
    "社交取向": { min: "孤僻", max: "核心" },
    "决策模式": { min: "直觉", max: "理性" },
    "思维倾向": { min: "顽固", max: "颠覆" },
    "人际姿态": { min: "利己", max: "利他" },
    "人性温度": { min: "冷酷", max: "至善" }
  };
  return map[key] || { min: "-100", max: "100" };
};

const getTraitColorClass = (val) => {
  if (val > 40) return 'text-gold';
  if (val < -40) return 'text-blue';
  return 'text-gray';
};

const generatedPersonalitySummary = computed(() => {
  const p = formData.personality;
  const parts = [];
  for (const key in p) {
    const val = p[key];
    if (Math.abs(val) >= 40) {
      parts.push(getTraitDetail(key, val).label);
    }
  }
  if (parts.length === 0) return "一位性格平衡、中庸的旅人。";
  return `一位${parts.join("、")}的旅人。`;
});

const getUpgradeCost = (artKey, currentLevel) => {
  if (currentLevel === 0) {
    let unlockedCount = 0;
    for (const key in formData.arts) {
      if (formData.arts[key].当前等级 > 0) unlockedCount++;
    }
    return 2 * Math.pow(4, unlockedCount);
  } else {
    return currentLevel * 2;
  }
};

const totalSpentPoints = computed(() => {
  let total = 0;
  let unlockedCount = 0;
  for (const key in formData.arts) {
    if (formData.arts[key].当前等级 > 0) unlockedCount++;
  }
  for (let i = 0; i < unlockedCount; i++) {
    total += 2 * Math.pow(4, i);
  }
  for (const key in formData.arts) {
    const lv = formData.arts[key].当前等级;
    if (lv > 1) {
      total += lv * (lv - 1);
    }
  }
  return total;
});

const remainingPoints = computed(() => {
  return 100 - totalSpentPoints.value;
});

const changeArtLevel = (key, delta) => {
  const art = formData.arts[key];
  const newLevel = art.当前等级 + delta;
  if (newLevel < 0 || newLevel > 10) return;

  if (delta > 0) {
    art.当前等级 = newLevel;
    if (remainingPoints.value < 0) {
      art.当前等级 -= delta;
      if (window.toastr) window.toastr.warning("点数不足");
    }
  } else {
    art.当前等级 = newLevel;
  }
};

watch(() => formData.gender, (newVal) => {
  if (newVal === '男性') {
    appearanceDetails.hairStyle = '利落短发';
    appearanceDetails.face = '棱角分明';
    appearanceDetails.skin = '粗糙';
    appearanceDetails.body = '结实';
  } else {
    appearanceDetails.hairStyle = '柔顺长发';
    appearanceDetails.face = '柔和';
    appearanceDetails.skin = '细腻';
    appearanceDetails.body = '纤细,胸部平坦';
  }
}, { immediate: true });

const finalAppearance = computed(() => {
  const parts = [
    `${appearanceDetails.hairColor}的${appearanceDetails.hairStyle}`,
    `${appearanceDetails.face}的脸庞`,
    `${appearanceDetails.eyes}的眼睛`,
    `${appearanceDetails.skin}的皮肤`,
    `身材${appearanceDetails.body}`
  ];
  if (appearanceDetails.feature) parts.push(appearanceDetails.feature);
  return parts.join('，');
});

const openMapSelector = () => { showMapModal.value = true; };
const onLocationSelected = (loc) => { formData.location = loc; showMapModal.value = false; };

const submitCreation = async () => {
  if (!formData.location) {
    if (window.toastr) window.toastr.warning("请选择一个出生地点");
    return;
  }

  submitting.value = true;
  try {
    const processedArts = {};
    for (const key in formData.arts) {
      const art = formData.arts[key];
      const lv = art.当前等级;
      processedArts[key] = {
        "当前等级": lv,
        "累计经验值": 0,
        "下一级需求经验": (lv === 0) ? -1 : (lv * 100)
      };
    }

    const updatePayload = {
      "世界": { "地图索引": formData.location, "地点": formData.location },
      "角色": {
        "user": {
          "年龄": formData.age,
          "当前身份": formData.identity,
          "性格": {
            ...formData.personality,
            "性格总结": [generatedPersonalitySummary.value]
          },
          "术之等级": processedArts,
          "外貌": [finalAppearance.value]
        }
      },
      "system": { "插图模式": formData.gender }
    };

    await ERAUtil.UpdateByObject(updatePayload);

    const msgId = getLastMessageId();
    let injectionText = `于破碎的镜面之中，{{user}}看到了自己\n`;
    injectionText += `<mirror>\n`;
    injectionText += `姓名：{{user}}\n`;
    injectionText += `性别：${formData.gender}\n`;
    injectionText += `出生地：${formData.location}\n`;
    if (formData.identity) injectionText += `身份：${formData.identity}\n`;
    injectionText += `外貌：${finalAppearance.value}\n`;
    injectionText += `性格：${generatedPersonalitySummary.value}\n`;
    if (formData.specialStatus) injectionText += `特殊状态：${formData.specialStatus}\n`;
    injectionText += `</mirror>\n`;
    injectionText += `随后伴随着一阵天旋地转，{{user}}的意识又陷入一片混沌，当{{user}}再次醒来之时——\n`;

    await MessageUtil.mergeContentToMessage(msgId, injectionText);
    await router.push('/选项');
    toastr.info("准备初始化故事...");
    setTimeout(async () => {
      await eventEmit("生成user人设");
    }, 2000);
  } catch (e) {
    console.error("角色创建失败", e);
    if (window.toastr) window.toastr.error("铭刻失败，请重试");
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.creation-layout {
  --c-gold: #C5A059;
  --c-bg: #0a0a0a;
  --c-input-bg: rgba(255, 255, 255, 0.05);
  --c-danger: #ff4d4d;
  --c-blue: #59a0c5;

  /* 布局调整：作为容器，不直接处理滚动，让子页面处理 */
  padding: 0;
  background: radial-gradient(circle at 50% 20%, rgba(197, 160, 89, 0.1) 0%, #0a0a0a 80%);
  color: #e0e0e0;
  font-family: 'EB Garamond', serif;
  height: 100%;
  overflow: hidden; /* 禁止容器本身滚动 */
  position: relative;
}

/* 主页面视图 */
.main-page-view {
  height: 100%;
  overflow-y: auto; /* 内部滚动 */
  padding: 40px;
  display: flex;
  flex-direction: column;
}

/* 地图页面视图 (全屏覆盖) */
.map-page-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1a1d24; /* 纯色背景防止透视 */
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.map-page-header {
  padding: 15px 20px;
  background: rgba(0,0,0,0.5);
  border-bottom: 1px solid var(--c-gold);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.map-page-header h2 {
  margin: 0;
  color: var(--c-gold);
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
}

.header-spacer {
  width: 80px; /* 与返回按钮大致等宽，保持标题居中 */
}

.back-btn {
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
  padding: 4px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  border-radius: 3px;
  transition: all 0.3s;
  width: 65px;
  font-size: 10px;
  justify-content: center;
}

.back-btn:hover {
  border-color: var(--c-gold);
  color: var(--c-gold);
}

.map-page-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* 动画效果 */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.3s ease;
}

.page-slide-enter-from,
.page-slide-leave-to {
  transform: translateX(100%); /* 从右侧滑入 */
  opacity: 0;
}

/* 原有样式保持不变，仅调整层级关系 */
.creation-header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid rgba(197, 160, 89, 0.3); padding-bottom: 15px; }
.title { font-family: 'Cinzel', serif; font-size: 2.5rem; color: var(--c-gold); margin: 0; }
.subtitle { font-size: 0.9rem; color: #888; letter-spacing: 3px; }

.creation-container { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; flex: 1; align-items: stretch; }
.column { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(197, 160, 89, 0.2); padding: 20px; border-radius: 4px; display: flex; flex-direction: column; }
.left-col { flex: 1; min-width: 280px; max-width: 350px; }
.mid-col { flex: 1.2; min-width: 320px; }
.right-col { flex: 1; min-width: 300px; max-width: 350px; }

.section-title { font-family: 'Cinzel', serif; color: var(--c-gold); border-bottom: 1px solid rgba(197, 160, 89, 0.2); padding-bottom: 5px; margin-bottom: 15px; font-size: 1.2rem; }

/* 输入框通用 */
.input-row { margin-bottom: 15px; }
.text-input, textarea { width: 100%; background: var(--c-input-bg); border: 1px solid #444; color: #fff; padding: 8px; font-family: inherit; margin-top: 5px; transition: border 0.3s; }
.text-input:focus, textarea:focus { border-color: var(--c-gold); outline: none; }
.radio-group { display: flex; gap: 15px; margin-top: 5px; }
.radio-group label { cursor: pointer; padding: 5px 15px; border: 1px solid #444; transition: all 0.3s; font-size: 0.9rem; }
.radio-group label.active { border-color: var(--c-gold); color: var(--c-gold); background: rgba(197, 160, 89, 0.1); }

/* 外貌网格 */
.appearance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.app-field label { font-size: 0.75rem; color: #888; display: block; margin-bottom: 2px; }
.app-field.full-width { grid-column: span 2; }
.text-input.mini { padding: 4px 8px; font-size: 0.9rem; }

/* 性格滑块 (优化) */
.slider-item { margin-bottom: 25px; }
.slider-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.trait-name { font-weight: bold; color: #ccc; font-size: 0.95rem; }
.trait-status { font-size: 0.85rem; font-family: 'Cinzel', serif; }
.text-gold { color: var(--c-gold); }
.text-blue { color: var(--c-blue); }
.text-gray { color: #777; }

.slider-container { display: flex; align-items: center; gap: 10px; }
.styled-slider { flex: 1; accent-color: var(--c-gold); cursor: pointer; height: 4px; background: #333; border-radius: 2px; }
.limit-label { font-size: 0.7rem; color: #555; width: 30px; }
.limit-label.left { text-align: right; }
.limit-label.right { text-align: left; }

.trait-desc-text { font-size: 0.75rem; color: #888; margin-top: 4px; font-style: italic; min-height: 1.2em; }

.personality-summary-box { margin-top: auto; padding: 15px; background: rgba(197, 160, 89, 0.05); border: 1px solid rgba(197, 160, 89, 0.3); text-align: center; }
.summary-text { color: var(--c-gold); font-weight: bold; margin-top: 5px; font-family: 'Cinzel', serif; font-size: 1.1rem; }

/* 术之加点 UI (优化) */
.points-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; }
.points-label { font-family: 'Cinzel', serif; color: #aaa; }
.points-val { font-size: 1.5rem; color: var(--c-gold); font-weight: bold; margin-right: 5px; }
.points-val.error { color: var(--c-danger); }
.points-total { color: #666; font-size: 0.9rem; }

.arts-list-scroll { flex: 1; overflow-y: auto; margin-bottom: 10px; padding-right: 5px; border: 1px solid #222; background: rgba(0,0,0,0.2); }
.art-point-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-bottom: 1px solid #333; transition: background 0.2s; }
.art-point-item:hover { background: rgba(255,255,255,0.03); }
.art-point-item.active { background: rgba(197, 160, 89, 0.05); }

.art-icon-placeholder { width: 30px; height: 30px; background: #222; border: 1px solid #444; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: #888; border-radius: 50%; margin-right: 10px; }
.art-point-item.active .art-icon-placeholder { border-color: var(--c-gold); color: var(--c-gold); }

.art-point-info { display: flex; flex-direction: column; flex: 1; }
.art-lv-label { font-size: 0.65rem; color: #666; text-transform: uppercase; }
.art-lv-val { font-size: 1rem; color: #ddd; font-weight: bold; }
.art-point-item.active .art-lv-val { color: var(--c-gold); }

.art-controls { display: flex; align-items: center; gap: 5px; }
.ctrl-btn { width: 24px; height: 24px; background: #222; border: 1px solid #555; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 2px; transition: all 0.2s; }
.ctrl-btn:hover:not(:disabled) { border-color: var(--c-gold); color: var(--c-gold); background: #333; }
.ctrl-btn:disabled { opacity: 0.2; cursor: not-allowed; border-color: #333; }

.cost-preview { width: 60px; text-align: center; display: flex; justify-content: center; }
.cost-val { font-size: 0.7rem; color: #888; background: #111; padding: 2px 4px; border-radius: 2px; }

.arts-preview-wrapper { margin-top: 10px; border-top: 1px solid #333; padding-top: 10px; min-height: 100px; }

/* 底部按钮 */
.action-footer { margin-top: 20px; text-align: center; padding-bottom: 20px; }
.confirm-btn { background: rgba(0,0,0,0.5); border: 1px solid var(--c-gold); color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 1.1rem; padding: 12px 50px; cursor: pointer; transition: all 0.3s; letter-spacing: 2px; }
.confirm-btn:hover:not(:disabled) { background: var(--c-gold); color: #000; box-shadow: 0 0 20px rgba(197, 160, 89, 0.4); }
.confirm-btn:disabled { border-color: #444; color: #444; cursor: not-allowed; }

/* 地图选择器 */
.location-selector { background: var(--c-input-bg); border: 1px solid #444; padding: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s; }
.location-selector:hover { border-color: var(--c-gold); background: rgba(197, 160, 89, 0.1); }
.location-value { color: var(--c-gold); font-weight: bold; }
.placeholder { color: #666; font-style: italic; font-size: 0.9rem; }

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .main-page-view {
    padding: 15px;
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .title {
    font-size: 1.8rem;
  }

  .creation-container {
    flex-direction: column;
    gap: 15px;
    flex: 0 0 auto;
  }

  .column {
    max-width: 100%;
    min-width: auto;
  }

  .left-col, .mid-col, .right-col {
    flex: none;
    width: 100%;
  }

  .arts-list-scroll {
    max-height: 300px;
  }

  .confirm-btn {
    width: 100%;
    padding: 12px 0;
  }

  .action-footer {
    padding-bottom: 40px;
  }
}
</style>
