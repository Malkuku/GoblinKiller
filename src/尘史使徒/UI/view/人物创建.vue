<template>
  <div class="creation-layout theme-forgotten">

    <!-- 主视图容器 -->
    <div class="main-page-view" v-show="!showMapModal">

      <!-- 顶部标题 (始终显示) -->
      <header class="creation-header">
        <h1 class="title">重塑自我</h1>
        <div class="subtitle">WHO ARE YOU IN THE MIRROR?</div>
        <!-- 步骤指示器 -->
        <div class="step-indicator">
          <span :class="{ active: currentPage >= 1 }">倒影</span>
          <span class="line"></span>
          <span :class="{ active: currentPage >= 2 }">登阶</span>
          <span class="line"></span>
          <span :class="{ active: currentPage >= 3 }">铭刻</span>
        </div>
      </header>

      <!-- 内容区域：使用 Transition 实现翻页效果 -->
      <div class="content-viewport">
        <transition name="fade-slide" mode="out-in">

          <!-- 第一页：基础认知与性格 -->
          <div v-if="currentPage === 1" key="page1" class="page-container page-one">
            <div class="split-layout">
              <!-- 左半部分：基础设定与外貌 -->
              <div class="split-col">
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
                  <div class="input-row two-col">
                    <div>
                      <label>年龄</label>
                      <input type="text" v-model="formData.age" placeholder="例如：25岁" class="text-input">
                    </div>
                    <div>
                      <label>初始身份</label>
                      <input type="text" v-model="formData.identity" placeholder="例如：流浪骑士" class="text-input">
                    </div>
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
                  <div class="appearance-grid">
                    <div class="app-field"><label>发色</label><input type="text" v-model="appearanceDetails.hairColor" class="text-input mini"></div>
                    <div class="app-field"><label>发型</label><input type="text" v-model="appearanceDetails.hairStyle" class="text-input mini"></div>
                    <div class="app-field"><label>脸型</label><input type="text" v-model="appearanceDetails.face" class="text-input mini"></div>
                    <div class="app-field"><label>眼睛</label><input type="text" v-model="appearanceDetails.eyes" class="text-input mini"></div>
                    <div class="app-field"><label>肤色</label><input type="text" v-model="appearanceDetails.skin" class="text-input mini"></div>
                    <div class="app-field"><label>身材</label><input type="text" v-model="appearanceDetails.body" class="text-input mini"></div>
                    <div class="app-field full-width">
                      <label>特殊特征</label>
                      <input type="text" v-model="appearanceDetails.feature" placeholder="如：眼角有泪痣" class="text-input mini">
                    </div>
                  </div>
                </section>

                <section class="form-group">
                  <h3 class="section-title">特殊状态</h3>
                  <textarea v-model="formData.specialStatus" rows="2" placeholder="例如：指尖总是冰冷..." class="text-input"></textarea>
                </section>
              </div>

              <!-- 右半部分：性格倾向 -->
              <div class="split-col">
                <h3 class="section-title">心性倾向</h3>
                <div class="personality-sliders">
                  <div class="slider-item" v-for="(val, key) in formData.personality" :key="key">
                    <div class="slider-header">
                      <span class="trait-name">{{ key }}</span>
                      <span class="trait-status" :class="getTraitColorClass(val)">
                        {{ getTraitDetail(key, val).label }}
                      </span>
                    </div>
                    <div class="slider-container">
                      <span class="limit-label left">{{ getTraitExtremes(key).min }}</span>
                      <input type="range" v-model.number="formData.personality[key]" min="-100" max="100" step="1" class="styled-slider">
                      <span class="limit-label right">{{ getTraitExtremes(key).max }}</span>
                    </div>
                    <div class="trait-desc-text">{{ getTraitDetail(key, val).desc }}</div>
                  </div>
                </div>

                <div class="personality-summary-box">
                  <div class="summary-header-row">
                    <label>性格侧写</label>
                    <span v-if="isManualSummary" class="reset-btn" @click="resetSummary">↺ 重置自动</span>
                  </div>
                  <textarea v-model="finalPersonalitySummary" @input="handleSummaryInput" class="summary-textarea" rows="3"></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- 第二页：术的能力 -->
          <div v-else-if="currentPage === 2" key="page2" class="page-container page-two">
            <div class="arts-layout">
              <h3 class="section-title center">秘史造诣</h3>

              <div class="points-header-large">
                <div class="points-info-group">
                  <div class="points-label">{{ isInfiniteMode ? '总消耗点数' : '剩余可用点数' }}</div>
                  <div class="points-display">
                    <template v-if="!isInfiniteMode">
                      <span class="points-val" :class="{ 'error': remainingPoints < 0 }">{{ remainingPoints }}</span>
                      <span class="points-total">/ 100</span>
                    </template>
                    <template v-else>
                      <span class="points-val text-gold">{{ totalSpentPoints }}</span>
                      <span class="points-total" style="font-size: 1.5rem;">∞</span>
                    </template>
                  </div>
                </div>
                <div class="infinite-toggle">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="isInfiniteMode">
                    <span class="toggle-text">无限制</span>
                  </label>
                </div>
              </div>

              <div class="arts-content-row">
                <!-- 左侧列表 -->
                <div class="arts-list-scroll large">
                  <div class="art-point-item" v-for="(data, key) in formData.arts" :key="key" :class="{ 'active': data.当前等级 > 0 }">
                    <div class="art-icon-placeholder">{{ key }}</div>
                    <div class="art-point-info">
                      <span class="art-lv-label">等级</span>
                      <span class="art-lv-val">Lv.{{ data.当前等级 }}</span>
                    </div>
                    <div class="art-controls">
                      <button class="ctrl-btn" @click="changeArtLevel(key, -1)" :disabled="data.当前等级 <= 0">-</button>
                      <div class="cost-preview">
                        <span v-if="data.当前等级 < maxArtLevel" class="cost-val">消耗 {{ getUpgradeCost(key, data.当前等级) }}</span>
                        <span v-else class="cost-val">MAX</span>
                      </div>
                      <button class="ctrl-btn" @click="changeArtLevel(key, 1)"
                              :disabled="(!isInfiniteMode && remainingPoints < getUpgradeCost(key, data.当前等级)) || data.当前等级 >= maxArtLevel">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 右侧预览 -->
                <div class="arts-preview-large">
                  <div class="preview-title">能力预览</div>
                  <ArtsModule :artsData="formData.arts" mode="creation" />
                </div>
              </div>
            </div>
          </div>

          <!-- 第三页：叙事风格与确认 -->
          <div v-else-if="currentPage === 3" key="page3" class="page-container page-three">
            <div class="confirmation-layout">

              <section class="form-group narrative-section">
                <h3 class="section-title center">叙事风格</h3>
                <p class="desc center">故事将以何种节奏展开？</p>
                <div class="narrative-wrapper">
                  <NarrativePaceSelector v-model="formData.narrativePace" />
                </div>
              </section>

              <section class="form-group summary-section">
                <h3 class="section-title center">铭刻确认</h3>
                <div class="final-card">
                  <div class="card-row">
                    <span class="label">身份：</span>
                    <span class="value">{{ formData.location }} 的 {{ formData.identity }} ({{ formData.age }})</span>
                  </div>
                  <div class="card-row">
                    <span class="label">外貌：</span>
                    <span class="value">{{ finalAppearance }}</span>
                  </div>
                  <div class="card-row">
                    <span class="label">性格：</span>
                    <span class="value highlight">{{ finalPersonalitySummary }}</span>
                  </div>
                  <div class="card-row">
                    <span class="label">掌握技艺：</span>
                    <div class="arts-tags">
                      <span v-for="(art, key) in activeArts" :key="key" class="art-tag">
                        {{ key }} Lv.{{ art.当前等级 }}
                      </span>
                      <span v-if="Object.keys(activeArts).length === 0" class="value dim">无</span>
                    </div>
                  </div>
                  <div class="card-row">
                    <span class="label">叙事风格：</span>
                    <span class="value text-gold">{{ formData.narrativePace }}</span>
                  </div>
                </div>
              </section>

              <div class="submit-area">
                <button class="confirm-btn large" :disabled="submitting || (!isInfiniteMode && remainingPoints < 0)" @click="submitCreation">
                  <span v-if="!submitting">铭刻真实 · 开始旅程</span>
                  <span v-else>正在生成世界...</span>
                </button>
              </div>
            </div>
          </div>

        </transition>
      </div>

      <!-- 底部导航栏 -->
      <footer class="nav-footer">
        <button class="nav-btn prev" @click="prevPage" :disabled="currentPage === 1">
          ← 上一步
        </button>

        <div class="page-dots">
          <span :class="{ active: currentPage === 1 }"></span>
          <span :class="{ active: currentPage === 2 }"></span>
          <span :class="{ active: currentPage === 3 }"></span>
        </div>

        <button class="nav-btn next" @click="nextPage" v-if="currentPage < 3">
          下一步 →
        </button>
        <div class="nav-placeholder" v-else></div> <!-- 占位符，保持布局平衡 -->
      </footer>
    </div>

    <!-- 地图选择页面 (保持不变) -->
    <transition name="page-slide">
      <div v-if="showMapModal" class="map-page-view">
        <header class="map-page-header">
          <button class="back-btn" @click="showMapModal = false">
            <span class="arrow">←</span> 返回设定
          </button>
          <h2>选择出生地</h2>
          <div class="header-spacer"></div>
        </header>
        <div class="map-page-content">
          <Vision mode="selection" @select="onLocationSelected" />
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue';
import { ERAUtil } from '@/Utils/ERAUtil';
import { MessageUtil } from '@/Utils/MessageUtil';
import Vision from './世界信息.vue';
// eslint-disable-next-line import-x/no-cycle
import { router } from '@/尘史使徒/UI/router/router';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import ArtsModule from '@/尘史使徒/UI/components/role/ArtsModule.vue';
import NarrativePaceSelector from '@/尘史使徒/UI/components/story/NarrativePaceSelector.vue';

const submitting = ref(false);
const showMapModal = ref(false);
const statStore = useStatStore();
const isInfiniteMode = ref(false);
const currentPage = ref(1); // 当前页码控制

onMounted(() => {
  if (!statStore.stat_data) {
    statStore.initData();
  }
});

// 翻页逻辑
const nextPage = () => {
  if (currentPage.value === 1) {
    if (!formData.location) {
      if (window.toastr) window.toastr.warning("请先选择出生地");
      return;
    }
  }
  if (currentPage.value < 3) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

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
  narrativePace: '诡异现实',
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

// 计算属性：获取已激活的技艺（用于确认页展示）
const activeArts = computed(() => {
  const active = {};
  for (const key in formData.arts) {
    if (formData.arts[key].当前等级 > 0) {
      active[key] = formData.arts[key];
    }
  }
  return active;
});

// --- 性格相关逻辑 (保持原样) ---
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

const finalPersonalitySummary = ref("");
const isManualSummary = ref(false);

watch(generatedPersonalitySummary, (newVal) => {
  if (!isManualSummary.value) {
    finalPersonalitySummary.value = newVal;
  }
}, { immediate: true });

const handleSummaryInput = () => { isManualSummary.value = true; };
const resetSummary = () => {
  isManualSummary.value = false;
  finalPersonalitySummary.value = generatedPersonalitySummary.value;
};

// --- 术之等级逻辑 (保持原样) ---
const maxArtLevel = computed(() => isInfiniteMode.value ? 21 : 10);

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
  if (newLevel < 0 || newLevel > maxArtLevel.value) return;

  if (delta > 0) {
    art.当前等级 = newLevel;
    if (!isInfiniteMode.value && remainingPoints.value < 0) {
      art.当前等级 -= delta;
      if (window.toastr) window.toastr.warning("点数不足");
    }
  } else {
    art.当前等级 = newLevel;
  }
};

// --- 外貌逻辑 ---
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

// --- 提交逻辑 ---
const submitCreation = async () => {
  if (!formData.location) {
    if (window.toastr) window.toastr.warning("请选择一个出生地点");
    return;
  }

  submitting.value = true;
  try {
    const updatePayload = {
      "世界": { "地图索引": formData.location, "地点": formData.location },
      "角色": {
        "user": {
          "年龄": formData.age,
          "当前身份": formData.identity,
          "性格": {
            ...formData.personality,
            "性格总结": [finalPersonalitySummary.value]
          },
          "外貌": [finalAppearance.value]
        }
      },
      "system": {
        "插图模式": formData.gender,
        "叙事节奏": formData.narrativePace
      }
    };

    await ERAUtil.UpdateByObject(updatePayload);

    const artsToInsert = {};
    let hasArts = false;
    for (const key in formData.arts) {
      const art = formData.arts[key];
      const lv = art.当前等级;
      if (lv > 0) {
        artsToInsert[key] = {
          "当前等级": lv,
          "累计经验值": 0,
          "下一级需求经验": lv < 14 ? lv * 100 : -1
        };
        hasArts = true;
      }
    }

    if (hasArts) {
      const insertPayload = {
        "角色": {
          "user": {
            "术之等级": artsToInsert
          }
        }
      };
      await ERAUtil.InsertByObject(insertPayload);
    }

    const msgId = getLastMessageId();
    let injectionText = `于破碎的镜面之中，{{user}}看到了自己\n`;
    injectionText += `<mirror>\n`;
    injectionText += `姓名：{{user}}\n`;
    injectionText += `性别：${formData.gender}\n`;
    injectionText += `出生地：${formData.location}\n`;
    if (formData.identity) injectionText += `身份：${formData.identity}\n`;
    injectionText += `外貌：${finalAppearance.value}\n`;
    injectionText += `性格：${finalPersonalitySummary.value}\n`;
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

  padding: 0;
  background: radial-gradient(circle at 50% 20%, rgba(197, 160, 89, 0.1) 0%, #0a0a0a 80%);
  color: #e0e0e0;
  font-family: 'EB Garamond', serif;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* 主页面视图 */
.main-page-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 40px;
}

/* 顶部 Header */
.creation-header {
  text-align: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.title { font-family: 'Cinzel', serif; font-size: 2.2rem; color: var(--c-gold); margin: 0; text-shadow: 0 0 10px rgba(197, 160, 89, 0.3); }
.subtitle { font-size: 0.8rem; color: #888; letter-spacing: 3px; margin-bottom: 15px; }

/* 步骤指示器 */
.step-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  color: #555;
}
.step-indicator span.active { color: var(--c-gold); text-shadow: 0 0 5px var(--c-gold); }
.step-indicator .line { width: 40px; height: 1px; background: #333; }
.step-indicator span.active + .line { background: linear-gradient(90deg, var(--c-gold), #333); }

/* 内容视口 */
.content-viewport {
  flex: 1;
  position: relative;
  overflow: hidden; /* 隐藏溢出，由内部容器滚动 */
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(197, 160, 89, 0.2);
  border-radius: 4px;
  margin-bottom: 15px;
}

.page-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow-y: auto; /* 页面内部滚动 */
}

/* 第一页布局 */
.split-layout {
  display: flex;
  gap: 30px;
  height: 100%;
}
.split-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 第二页布局 */
.arts-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.points-header-large {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(197, 160, 89, 0.1);
}
.points-val { font-size: 2.5rem; }
.arts-content-row {
  display: flex;
  flex: 1;
  gap: 20px;
  overflow: hidden;
}
.arts-list-scroll.large {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #333;
  background: rgba(0,0,0,0.2);
  padding: 10px;
}
.arts-preview-large {
  flex: 1;
  border: 1px solid #333;
  background: rgba(0,0,0,0.2);
  padding: 10px;
  display: flex;
  flex-direction: column;
}
.preview-title {
  text-align: center;
  color: #666;
  font-family: 'Cinzel', serif;
  border-bottom: 1px solid #333;
  padding-bottom: 5px;
  margin-bottom: 10px;
}

/* 第三页布局 */
.confirmation-layout {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding-top: 20px;
}
.narrative-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
.final-card {
  background: rgba(197, 160, 89, 0.05);
  border: 1px solid var(--c-gold);
  padding: 25px;
  position: relative;
}
.final-card::before {
  content: '';
  position: absolute;
  top: 5px; left: 5px; right: 5px; bottom: 5px;
  border: 1px solid rgba(197, 160, 89, 0.3);
  pointer-events: none;
}
.card-row {
  display: flex;
  margin-bottom: 12px;
  border-bottom: 1px dashed rgba(255,255,255,0.1);
  padding-bottom: 8px;
}
.card-row:last-child { border-bottom: none; }
.card-row .label {
  width: 100px;
  color: #888;
  font-weight: bold;
  flex-shrink: 0;
}
.card-row .value { color: #ddd; }
.card-row .value.highlight { color: var(--c-gold); font-style: italic; }
.card-row .value.dim { color: #555; font-style: italic; }
.arts-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.art-tag {
  background: rgba(0,0,0,0.5);
  border: 1px solid #444;
  padding: 2px 8px;
  font-size: 0.85rem;
  color: var(--c-gold);
}

/* 底部导航 */
.nav-footer {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-top: 1px solid rgba(197, 160, 89, 0.2);
  background: rgba(0,0,0,0.3);
}
.nav-btn {
  background: transparent;
  border: 1px solid #444;
  color: #aaa;
  padding: 8px 20px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  transition: all 0.3s;
}
.nav-btn:hover:not(:disabled) {
  border-color: var(--c-gold);
  color: var(--c-gold);
  background: rgba(197, 160, 89, 0.1);
}
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.nav-placeholder { width: 100px; } /* 与按钮同宽占位 */

.page-dots { display: flex; gap: 8px; }
.page-dots span {
  width: 8px; height: 8px; background: #333; border-radius: 50%; transition: all 0.3s;
}
.page-dots span.active { background: var(--c-gold); transform: scale(1.2); }

/* 通用组件样式调整 */
.section-title { font-family: 'Cinzel', serif; color: var(--c-gold); border-bottom: 1px solid rgba(197, 160, 89, 0.2); padding-bottom: 5px; margin-bottom: 15px; font-size: 1.2rem; }
.section-title.center { text-align: center; border-bottom: none; position: relative; display: inline-block; width: 100%; }
.section-title.center::after { content: ''; display: block; width: 60px; height: 2px; background: var(--c-gold); margin: 5px auto 0; }
.desc.center { text-align: center; color: #666; font-size: 0.9rem; margin-bottom: 15px; }

.input-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.text-input, textarea { width: 100%; background: var(--c-input-bg); border: 1px solid #444; color: #fff; padding: 8px; font-family: inherit; margin-top: 5px; transition: border 0.3s; }
.text-input:focus, textarea:focus { border-color: var(--c-gold); outline: none; }
.radio-group { display: flex; gap: 15px; margin-top: 5px; }
.radio-group label { cursor: pointer; padding: 5px 15px; border: 1px solid #444; transition: all 0.3s; font-size: 0.9rem; }
.radio-group label.active { border-color: var(--c-gold); color: var(--c-gold); background: rgba(197, 160, 89, 0.1); }

.appearance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.app-field label { font-size: 0.75rem; color: #888; display: block; margin-bottom: 2px; }
.app-field.full-width { grid-column: span 2; }

/* 性格滑块 */
.slider-item { margin-bottom: 20px; }
.slider-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.trait-name { font-weight: bold; color: #ccc; font-size: 0.9rem; }
.trait-status { font-size: 0.8rem; font-family: 'Cinzel', serif; }
.slider-container { display: flex; align-items: center; gap: 10px; }
.styled-slider { flex: 1; accent-color: var(--c-gold); cursor: pointer; height: 4px; background: #333; border-radius: 2px; }
.limit-label { font-size: 0.7rem; color: #555; width: 30px; }
.trait-desc-text { font-size: 0.75rem; color: #888; margin-top: 2px; font-style: italic; min-height: 1.2em; }
.personality-summary-box { margin-top: auto; padding: 15px; background: rgba(197, 160, 89, 0.05); border: 1px solid rgba(197, 160, 89, 0.3); text-align: center; }
.summary-textarea { color: var(--c-gold); font-weight: bold; font-family: 'Cinzel', serif; font-size: 1rem; background: transparent; border: none; resize: none; text-align: center; width: 100%; padding: 0; }

/* 术之加点 */
.art-point-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-bottom: 1px solid #333; transition: background 0.2s; }
.art-point-item:hover { background: rgba(255,255,255,0.03); }
.art-point-item.active { background: rgba(197, 160, 89, 0.05); }
.art-icon-placeholder { width: 36px; height: 36px; background: #222; border: 1px solid #444; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: #888; border-radius: 50%; margin-right: 15px; }
.art-point-item.active .art-icon-placeholder { border-color: var(--c-gold); color: var(--c-gold); }
.art-point-info { display: flex; flex-direction: column; flex: 1; }
.art-lv-label { font-size: 0.7rem; color: #666; text-transform: uppercase; }
.art-lv-val { font-size: 1.1rem; color: #ddd; font-weight: bold; }
.art-controls { display: flex; align-items: center; gap: 8px; }
.ctrl-btn { width: 28px; height: 28px; background: #222; border: 1px solid #555; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 2px; transition: all 0.2s; }
.ctrl-btn:hover:not(:disabled) { border-color: var(--c-gold); color: var(--c-gold); }
.cost-preview { width: 70px; text-align: center; }
.cost-val { font-size: 0.75rem; color: #888; background: #111; padding: 2px 6px; border-radius: 2px; }

/* 提交按钮 */
.submit-area { text-align: center; margin-top: 20px; }
.confirm-btn.large { background: rgba(0,0,0,0.5); border: 1px solid var(--c-gold); color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 1.2rem; padding: 15px 60px; cursor: pointer; transition: all 0.3s; letter-spacing: 2px; width: 100%; max-width: 400px; }
.confirm-btn.large:hover:not(:disabled) { background: var(--c-gold); color: #000; box-shadow: 0 0 25px rgba(197, 160, 89, 0.5); }
.confirm-btn:disabled { border-color: #444; color: #444; cursor: not-allowed; }

/* 地图选择器 */
.location-selector { background: var(--c-input-bg); border: 1px solid #444; padding: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s; }
.location-selector:hover { border-color: var(--c-gold); background: rgba(197, 160, 89, 0.1); }
.location-value { color: var(--c-gold); font-weight: bold; }

/* 动画 */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(30px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-30px); }

.page-slide-enter-active, .page-slide-leave-active { transition: all 0.3s ease; }
.page-slide-enter-from, .page-slide-leave-to { transform: translateX(100%); opacity: 0; }

/* 颜色工具类 */
.text-gold { color: var(--c-gold); }
.text-blue { color: var(--c-blue); }
.text-gray { color: #777; }

/* 地图页面 */
.map-page-view { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #1a1d24; z-index: 100; display: flex; flex-direction: column; }
.map-page-header { padding: 15px 20px; background: rgba(0,0,0,0.5); border-bottom: 1px solid var(--c-gold); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.map-page-header h2 { margin: 0; color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 1.2rem; }
.back-btn { background: transparent; border: 1px solid #444; color: #ccc; padding: 4px 12px; cursor: pointer; display: flex; align-items: center; gap: 3px; border-radius: 3px; transition: all 0.3s; }
.back-btn:hover { border-color: var(--c-gold); color: var(--c-gold); }
.map-page-content { flex: 1; position: relative; overflow: hidden; }

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .main-page-view { padding: 10px; }
  .split-layout { flex-direction: column; gap: 20px; }
  .arts-content-row { flex-direction: column; overflow-y: auto; }
  .arts-list-scroll.large { max-height: 300px; flex: none; }
  .arts-preview-large { min-height: 200px; flex: none; }
  .points-header-large { flex-direction: column; gap: 10px; }
  .title { font-size: 1.5rem; }
  .step-indicator { font-size: 0.8rem; }
  .step-indicator .line { width: 20px; }
}
</style>
