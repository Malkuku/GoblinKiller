<template>
  <div class="page-container page-one">
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
            <div class="location-selector" @click="$emit('open-map')">
              <span v-if="formData.location" class="location-value">{{ formData.location }}</span>
              <span v-else class="placeholder">点击选择地图位置...</span>
              <span class="map-icon">🗺️</span>
            </div>
          </div>
        </section>

        <section class="form-group">
          <h3 class="section-title">外貌特征</h3>
          <div class="appearance-grid">
            <!-- 使用 defineModel 后，这里直接绑定即可，不会报错 -->
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
          <!-- 增加了 rows 以适应多行文本 -->
          <textarea v-model="finalPersonalitySummary" @input="handleSummaryInput" class="summary-textarea" rows="8"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

// --- 核心修改：使用 defineModel 替代 props ---
// 这会创建一个双向绑定的 ref，修改它会自动触发 update:xxx 事件
const formData = defineModel('formData', { required: true });
const appearanceDetails = defineModel('appearanceDetails', { required: true });

const emit = defineEmits(['open-map', 'update-summary']);

// 性格定义常量
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
  const ranges = traitDefinitions[key] || [{ min: -100, max: 100, label: "未知", desc: "" }];
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

// 自动生成性格总结 (包含每点数值及最终总结)
const generatedPersonalitySummary = computed(() => {
  const p = formData.value.personality;
  if (!p) return "";

  const details = [];
  const parts = [];

  for (const key in p) {
    const val = p[key];
    const traitDetail = getTraitDetail(key, val);
    // 记录每个维度的数值和标签
    details.push(`【${key}】: ${val} (${traitDetail.label})`);

    // 提取极端性格用于总结
    if (Math.abs(val) >= 40) {
      parts.push(traitDetail.label);
    }
  }

  const summaryText = parts.length === 0 ? "一位性格平衡、中庸的旅人。" : `一位${parts.join("、")}的旅人。`;

  // 拼接详细数值与总结
  return `${details.join('\n')}\n\n总结：${summaryText}`;
});

const finalPersonalitySummary = ref("");
const isManualSummary = ref(false);

watch(generatedPersonalitySummary, (newVal) => {
  if (!isManualSummary.value) {
    finalPersonalitySummary.value = newVal;
    emit('update-summary', newVal);
  }
}, { immediate: true });

const handleSummaryInput = () => {
  isManualSummary.value = true;
  emit('update-summary', finalPersonalitySummary.value);
};
const resetSummary = () => {
  isManualSummary.value = false;
  finalPersonalitySummary.value = generatedPersonalitySummary.value;
  emit('update-summary', finalPersonalitySummary.value);
};

// 监听性别变化自动调整外貌预设
watch(() => formData.value.gender, (newVal) => {
  if (newVal === '男性') {
    appearanceDetails.value.hairStyle = '利落短发';
    appearanceDetails.value.face = '棱角分明';
    appearanceDetails.value.skin = '粗糙';
    appearanceDetails.value.body = '结实';
  } else {
    appearanceDetails.value.hairStyle = '柔顺长发';
    appearanceDetails.value.face = '柔和';
    appearanceDetails.value.skin = '细腻';
    appearanceDetails.value.body = '纤细';
  }
}, { immediate: true });
</script>

<style scoped>
/* --- 修复点 1：全局应用 box-sizing 防止 padding 撑破宽度 --- */
.page-container, .page-container * {
  box-sizing: border-box;
}

.page-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 20px; overflow-y: auto; }
.split-layout { display: flex; gap: 30px; height: 100%; }
.split-col { flex: 1; display: flex; flex-direction: column; }
.section-title { font-family: 'Cinzel', serif; color: var(--c-gold); border-bottom: 1px solid rgba(197, 160, 89, 0.2); padding-bottom: 5px; margin-bottom: 15px; font-size: 1.2rem; }
.input-row { margin-bottom: 15px; }
.input-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.text-input, textarea { width: 100%; background: var(--c-input-bg); border: 1px solid #444; color: #fff; padding: 8px; font-family: inherit; margin-top: 5px; }
.radio-group { display: flex; gap: 15px; margin-top: 5px; }
.radio-group label { cursor: pointer; padding: 5px 15px; border: 1px solid #444; transition: all 0.3s; font-size: 0.9rem; }
.radio-group label.active { border-color: var(--c-gold); color: var(--c-gold); background: rgba(197, 160, 89, 0.1); }
.location-selector { background: var(--c-input-bg); border: 1px solid #444; padding: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.appearance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.app-field label { font-size: 0.75rem; color: #888; display: block; }
.app-field.full-width { grid-column: span 2; }
.slider-item { margin-bottom: 20px; }
.slider-header { display: flex; justify-content: space-between; }
.slider-container { display: flex; align-items: center; gap: 10px; }
.styled-slider { flex: 1; accent-color: var(--c-gold); cursor: pointer; height: 4px; background: #333; }
.personality-summary-box { margin-top: auto; padding: 15px; background: rgba(197, 160, 89, 0.05); border: 1px solid rgba(197, 160, 89, 0.3); }

/* 补充了 header-row 的样式以防错位 */
.summary-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.reset-btn { font-size: 0.8rem; color: var(--c-gold); cursor: pointer; text-decoration: underline; }

/* 调整了 textarea 的样式，改为左对齐，并优化了多行显示的行高和字体 */
.summary-textarea { color: var(--c-gold); font-weight: bold; font-family: 'Cinzel', serif; font-size: 0.9rem; background: transparent; border: none; resize: none; text-align: left; width: 100%; line-height: 1.5; }
.text-gold { color: var(--c-gold); }
.text-blue { color: var(--c-blue); }
.text-gray { color: #777; }

/* --- 移动端适配 --- */
@media (max-width: 768px) {
  .page-container {
    padding: 15px;
    /* --- 修复点 2：移除 height: auto; 和 min-height: 100%; --- */
    /* 保持 height: 100% 才能让绝对定位的容器在内部产生 overflow-y: auto 滚动条 */
  }

  .split-layout {
    flex-direction: column;
    gap: 20px;
    height: auto;
  }

  .split-col {
    width: 100%;
    flex: none;
  }

  .input-row.two-col {
    grid-template-columns: 1fr;
  }

  .appearance-grid {
    gap: 8px;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .personality-summary-box {
    margin-top: 20px;
  }
}
</style>
