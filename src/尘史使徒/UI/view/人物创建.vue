<template>
  <div class="creation-layout theme-forgotten">
    <!-- 主视图容器 -->
    <div class="main-page-view" v-show="!showMapModal">
      <!-- 顶部标题 -->
      <header class="creation-header">
        <h1 class="title">重塑自我</h1>
        <div class="subtitle">WHO ARE YOU IN THE MIRROR?</div>
        <!-- 步骤指示器 -->
        <div class="step-indicator">
          <span :class="{ active: currentPage >= 1 }">倒影</span>
          <span class="line"></span>
          <span :class="{ active: currentPage >= 2 }">登阶</span>
          <span class="line"></span>
          <span :class="{ active: currentPage >= 3 }">羁绊</span>
          <span class="line"></span>
          <span :class="{ active: currentPage >= 4 }">铭刻</span>
        </div>
      </header>

      <!-- 内容区域 -->
      <div class="content-viewport">
        <transition name="fade-slide" mode="out-in">

          <!-- 第一页：基础认知 -->
          <CreationBasic
            v-if="currentPage === 1"
            key="page1"
            v-model:formData="formData"
            v-model:appearanceDetails="appearanceDetails"
            @open-map="showMapModal = true"
          />

          <!-- 第二页：术的能力 -->
          <CreationArts
            v-else-if="currentPage === 2"
            key="page2"
            v-model:formData="formData"
            v-model:isInfiniteMode="isInfiniteMode"
            :artsRemainingPoints="artsRemainingPoints"
            :artsSpentPoints="artsSpentPoints"
            :maxArtLevel="maxArtLevel"
          />

          <!-- 第三页：人际关系 -->
          <CreationRelations
            v-else-if="currentPage === 3"
            key="page3"
            v-model:formData="formData"
            :isInfiniteMode="isInfiniteMode"
            :globalRemainingPoints="globalRemainingPoints"
          />

          <!-- 第四页：确认与资源 -->
          <CreationConfirm
            v-else-if="currentPage === 4"
            key="page4"
            v-model:formData="formData"
            :isInfiniteMode="isInfiniteMode"
            :globalRemainingPoints="globalRemainingPoints"
            :finalAppearance="finalAppearance"
            :finalPersonalitySummary="finalPersonalitySummary"
            :submitting="submitting"
            @submit="submitCreation"
            @import-config="triggerImport"
            @export-config="exportConfig"
          />

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
          <span :class="{ active: currentPage === 4 }"></span>
        </div>

        <button class="nav-btn next" @click="nextPage" v-if="currentPage < 4">
          下一步 →
        </button>
        <div class="nav-placeholder" v-else></div>
      </footer>
    </div>

    <!-- 地图选择页面 (模态框) -->
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

    <!-- 隐藏的文件输入 -->
    <input type="file" ref="fileInput" style="display:none" @change="importConfig" accept=".json">
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { MvuUtil } from '@/Utils/MvuUtil';
import { MessageUtil } from '@/Utils/MessageUtil';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import Vision from './世界信息.vue';
import CreationBasic from '@/尘史使徒/UI/components/start/CreationBasic.vue';
import CreationArts from '@/尘史使徒/UI/components/start/CreationArts.vue';
import CreationRelations from '@/尘史使徒/UI/components/start/CreationRelations.vue';
import CreationConfirm from '@/尘史使徒/UI/components/start/CreationConfirm.vue';
// eslint-disable-next-line import-x/no-cycle
import { router } from '@/尘史使徒/UI/router/router';

const statStore = useStatStore();
const submitting = ref(false);
const showMapModal = ref(false);
const isInfiniteMode = ref(false);
const currentPage = ref(1);
const fileInput = ref(null);

onMounted(() => {
  if (!statStore.stat_data) {
    statStore.initData();
  }
});

// --- 数据状态 ---
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
  specialStatus: '无特殊之处',
  narrativePace: '诡异现实',
  personality: {
    "社交取向": 0, "决策模式": 0, "思维倾向": 0, "人际姿态": 0, "人性温度": 0
  },
  术之等级: {
    "灯": { "等级": 0, "经验": 0 },
    "铸": { "等级": 0, "经验": 0 },
    "刃": { "等级": 0, "经验": 0 },
    "冬": { "等级": 0, "经验": 0 },
    "心": { "等级": 0, "经验": 0 },
    "杯": { "等级": 0, "经验": 0 },
    "蛾": { "等级": 0, "经验": 0 },
    "启": { "等级": 0, "经验": 0 }
  },
  relationships: []
});

// --- 计算属性 (跨组件逻辑) ---

// 外貌拼接
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

// 性格描述动态计算：直接展示 personality 对象的键值对
const finalPersonalitySummary = computed(() => {
  if (!formData.personality || typeof formData.personality !== 'object') {
    return "性格信息缺失";
  }
  // 将 personality 对象转换为 "键: 值" 格式的字符串数组，然后用 "，" 连接
  return Object.entries(formData.personality)
    .map(([key, value]) => `${key}: ${value}`)
    .join('，');
});

// 术之点数计算
const maxArtLevel = computed(() => isInfiniteMode.value ? 21 : 10);
const artsSpentPoints = computed(() => {
  let total = 0;
  let unlockedCount = 0;
  for (const key in formData.术之等级) {
    if (formData.术之等级[key].等级 > 0) unlockedCount++;
  }
  for (let i = 0; i < unlockedCount; i++) {
    total += 2 * Math.pow(4, i);
  }
  for (const key in formData.术之等级) {
    const lv = formData.术之等级[key].等级;
    if (lv > 1) total += lv * (lv - 1);
  }
  return total;
});
const artsRemainingPoints = computed(() => 100 - artsSpentPoints.value);

// 羁绊点数计算
const relationshipSpentPoints = computed(() => formData.relationships.length * 30);

// 全局剩余点数
const globalRemainingPoints = computed(() => 130 - artsSpentPoints.value - relationshipSpentPoints.value);

// --- 导航逻辑 ---
const nextPage = () => {
  if (currentPage.value === 1 && !formData.location) {
    if(window.toastr) window.toastr.warning("请先选择出生地");
    return;
  }
  if (currentPage.value < 4) currentPage.value++;
};
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

// --- 地图逻辑 ---
const onLocationSelected = (loc) => {
  formData.location = loc;
  showMapModal.value = false;
};

// --- 导入导出 ---
const exportConfig = () => {
  const config = { formData: JSON.parse(JSON.stringify(formData)), appearanceDetails: JSON.parse(JSON.stringify(appearanceDetails)) };
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `character_config_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
};
const triggerImport = () => fileInput.value.click();
const importConfig = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target.result);
      // 使用 Object.assign 来触发响应式更新
      if (config.formData) Object.assign(formData, config.formData);
      if (config.appearanceDetails) Object.assign(appearanceDetails, config.appearanceDetails);
      if(window.toastr) window.toastr.success("配置导入成功");
    } catch (err) { if(window.toastr) window.toastr.error("配置文件格式错误"); }
  };
  reader.readAsText(file);
};

// --- 提交逻辑 ---
const submitCreation = async (payload) => {
  const { finalMoney, finalHeterogeneity } = payload;

  if (!formData.location) return;
  submitting.value = true;

  try {
    // 1. 构建主要角色更新数据
    const mainRolesUpdate = {};
    formData.relationships.forEach(npc => {
      if (!npc.roleId) return;
      const roleData = statStore.stat_data["角色"]["主要角色"][npc.roleId] || {};
      const currentKeywords = roleData["区域检索词"] || [];
      const existingRelationships = roleData["人际关系"] || {};
      const newKeywords = currentKeywords.includes(formData.location) ? currentKeywords : [...currentKeywords, formData.location];
      mainRolesUpdate[npc.roleId] = {
        "区域检索词": newKeywords,
        "人际关系": {
          ...existingRelationships,
          "user": {
            "认知了解": `熟悉度(${npc.matrix.familiarity})`,
            "情感羁绊": `好感:${npc.matrix.affection}, 浪漫:${npc.matrix.romantic}`,
            "利益纽带": `利用:${npc.matrix.utility}, 依赖:${npc.matrix.dependency}`
          }
        }
      };
    });

    // 2. 过滤 0 级的术之等级
    const artsToInsert = {};
    for (const key in formData.术之等级) {
      if (formData.术之等级[key].等级 > 0) {
        artsToInsert[key] = { ...formData.术之等级[key] };
      }
    }

    // 3. 构建基础更新 Payload
    const updatePayload = {
      "世界": { "地图索引": formData.location, "地点": formData.location },
      "角色": {
        "user": {
          "年龄": formData.age,
          "当前身份": formData.identity,
          // 直接使用原始 personality 对象，性格总结也使用计算出的字符串
          "性格": { ...formData.personality, "性格总结": [finalPersonalitySummary.value] },
          "外貌": [finalAppearance.value],
          "金钱": finalMoney,
          "缥缈异质": finalHeterogeneity,
          "术之等级": artsToInsert
        }
      },
      "system": { "插图模式": formData.gender, "叙事节奏": formData.narrativePace }
    };

    if (formData.基础数值) updatePayload["角色"]["user"]["基础数值"] = formData.基础数值;
    if (formData.生命状态) updatePayload["角色"]["user"]["生命状态"] = formData.生命状态;
    if (Object.keys(mainRolesUpdate).length > 0) updatePayload["角色"]["主要角色"] = mainRolesUpdate;

    // 4. 一次性提交所有数据
    await MvuUtil.updateMvuDataByDiff(updatePayload);

    // 5. 注入正文
    const msgId = getLastMessageId(); // 假设全局有此函数
    let injectionText = `于破碎的镜面之中，{{user}}看到了自己\n<mirror>\n`;
    injectionText += `姓名：{{user}}\n性别：${formData.gender}\n出生地：${formData.location}\n`;
    if (formData.identity) injectionText += `身份：${formData.identity}\n`;
    injectionText += `外貌：${finalAppearance.value}\n性格：${finalPersonalitySummary.value}\n`;
    if (formData.specialStatus) injectionText += `特殊状态：${formData.specialStatus}\n`;

    if (formData.fullRelationshipText && formData.fullRelationshipText !== "孤身一人，没有额外羁绊") {
      injectionText += `\n[命运羁绊]\n${formData.fullRelationshipText}\n`;
    }

    injectionText += `</mirror>\n随后伴随着一阵天旋地转，{{user}}的意识又陷入一片混沌...`;

    await MessageUtil.mergeContentToMessage(msgId, injectionText);
    await router.push('/选项');
    if(window.toastr) toastr.info("准备初始化故事...");
    setTimeout(async () => { await eventEmit("生成user人设"); }, 2000);

  } catch (e) {
    console.error(e);
    if (window.toastr) window.toastr.error("铭刻失败");
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
/* 引入全局布局样式，保留原文件中的 .creation-layout, .main-page-view 等样式 */
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
  box-sizing: border-box;
}
.main-page-view { height: 100%; display: flex; flex-direction: column; padding: 20px 40px; box-sizing: border-box; }
.creation-header { text-align: center; margin-bottom: 20px; flex-shrink: 0; box-sizing: border-box; }
.title { font-family: 'Cinzel', serif; font-size: 2.2rem; color: var(--c-gold); margin: 0; text-shadow: 0 0 10px rgba(197, 160, 89, 0.3); }
.subtitle { font-size: 0.8rem; color: #888; letter-spacing: 3px; margin-bottom: 15px; }
.step-indicator { display: flex; justify-content: center; align-items: center; gap: 10px; font-family: 'Cinzel', serif; font-size: 0.9rem; color: #555; }
.step-indicator span.active { color: var(--c-gold); text-shadow: 0 0 5px var(--c-gold); }
.step-indicator .line { width: 30px; height: 1px; background: #333; }
.step-indicator span.active + .line { background: linear-gradient(90deg, var(--c-gold), #333); }
.content-viewport { flex: 1; position: relative; overflow: hidden; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(197, 160, 89, 0.2); border-radius: 4px; margin-bottom: 15px; display: flex; flex-direction: column; box-sizing: border-box; }
.nav-footer { height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; border-top: 1px solid rgba(197, 160, 89, 0.2); background: rgba(0,0,0,0.3); flex-shrink: 0; box-sizing: border-box; }
.nav-btn { background: transparent; border: 1px solid #444; color: #aaa; padding: 8px 20px; cursor: pointer; font-family: 'Cinzel', serif; transition: all 0.3s; }
.nav-btn:hover:not(:disabled) { border-color: var(--c-gold); color: var(--c-gold); background: rgba(197, 160, 89, 0.1); }
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.nav-placeholder { width: 100px; }
.page-dots { display: flex; gap: 8px; }
.page-dots span { width: 8px; height: 8px; background: #333; border-radius: 50%; transition: all 0.3s; }
.page-dots span.active { background: var(--c-gold); transform: scale(1.2); }
/* 动画 */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(30px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-30px); }
.page-slide-enter-active, .page-slide-leave-active { transition: all 0.3s ease; }
.page-slide-enter-from, .page-slide-leave-to { transform: translateX(100%); opacity: 0; }
/* 地图页面 */
.map-page-view { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #1a1d24; z-index: 100; display: flex; flex-direction: column; box-sizing: border-box; }
.map-page-header { padding: 15px 20px; background: rgba(0,0,0,0.5); border-bottom: 1px solid var(--c-gold); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; box-sizing: border-box; }
.map-page-header h2 { margin: 0; color: var(--c-gold); font-family: 'Cinzel', serif; font-size: 1.2rem; }
.back-btn { background: transparent; border: 1px solid #444; color: #ccc; padding: 4px 12px; cursor: pointer; display: flex; align-items: center; gap: 3px; border-radius: 3px; transition: all 0.3s; }
.back-btn:hover { border-color: var(--c-gold); color: var(--c-gold); }
.map-page-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  /* 新增以下属性修复溢出 */
  height: 0; /* 强制高度由 flex 决定，解决内部 height: 100% 溢出问题 */
  display: flex;
  flex-direction: column;
}

/* 确保地图组件完全填满容器且不溢出 */
.map-page-content > * {
  flex: 1;
  width: 100%;
  height: 100%;
}
</style>
