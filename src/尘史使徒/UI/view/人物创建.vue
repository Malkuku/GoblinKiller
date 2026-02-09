<template>
  <div class="creation-layout theme-forgotten">
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
            <input type="text" v-model="formData.age" placeholder="例如：25岁 / 不详" class="text-input">
          </div>

          <!-- 新增：出生地选择 -->
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
          <p class="desc">镜中的你是什么模样？（将写入故事正文）</p>
          <textarea v-model="formData.appearance" rows="4" placeholder="描述你的发色、瞳色、伤痕或衣着..."></textarea>
        </section>

        <section class="form-group">
          <h3 class="section-title">特殊状态</h3>
          <p class="desc">你是否背负着某种诅咒或印记？（将写入故事正文）</p>
          <textarea v-model="formData.specialStatus" rows="3" placeholder="例如：指尖总是冰冷 / 影子偶尔会自行移动..."></textarea>
        </section>
      </div>

      <!-- 中间：性格倾向 -->
      <div class="column mid-col">
        <h3 class="section-title">心性倾向</h3>
        <div class="personality-sliders">
          <div class="slider-item" v-for="(val, key) in formData.personality" :key="key">
            <div class="slider-label">
              <span>{{ getPersonalityLabel(key, 'low') }}</span>
              <span class="center-label">{{ key }}</span>
              <span>{{ getPersonalityLabel(key, 'high') }}</span>
            </div>
            <input type="range" v-model.number="formData.personality[key]" min="-50" max="50" step="10">
            <div class="value-display">{{ val }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：术之等级 -->
      <div class="column right-col">
        <h3 class="section-title">秘史造诣</h3>
        <div class="arts-grid">
          <div class="art-item" v-for="(data, key) in formData.arts" :key="key">
            <span class="art-name">{{ key }}</span>
            <input type="number" v-model.number="data.当前等级" min="0" max="10" class="art-input">
          </div>
        </div>
      </div>
    </div>

    <footer class="action-footer">
      <button class="confirm-btn" @click="submitCreation" :disabled="submitting">
        <span v-if="!submitting">铭刻真实</span>
        <span v-else>正在生成...</span>
      </button>
    </footer>

    <!-- === 新增：地图选择模态框 === -->
    <transition name="modal-fade">
      <div v-if="showMapModal" class="map-modal-overlay">
        <div class="map-modal-content">
          <header class="map-modal-header">
            <h2>选择出生地</h2>
            <button class="close-btn" @click="showMapModal = false">关闭</button>
          </header>

          <div class="map-wrapper">
            <!-- 复用 Vision 组件，模式设为 selection -->
            <Vision mode="selection" @select="onLocationSelected" />
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { ERAUtil } from '@/Utils/ERAUtil';
import { MessageUtil } from '@/Utils/MessageUtil';
import Vision from './世界信息.vue';
import { router } from '@/尘史使徒/UI/router/router';

const submitting = ref(false);
const showMapModal = ref(false);

// 初始数据结构，基于提供的 user JSON
const formData = reactive({
  gender: '男性',
  age: '20',
  location: '', // 新增 location 字段
  appearance: '',
  specialStatus: '',
  personality: {
    "社交取向": 0,
    "决策模式": 0,
    "思维倾向": 0,
    "人际姿态": 0,
    "人性温度": 0
  },
  // 默认值参考了 prompt 中的数据
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

// 性格滑块两端文案辅助函数
const getPersonalityLabel = (key, side) => {
  const map = {
    "社交取向": { low: "孤僻", high: "外向" },
    "决策模式": { low: "感性", high: "理性" },
    "思维倾向": { low: "保守", high: "激进" },
    "人际姿态": { low: "利己", high: "利他" },
    "人性温度": { low: "冷漠", high: "热情" }
  };
  return map[key] ? map[key][side] : '';
};

// 打开地图选择器
const openMapSelector = () => {
  showMapModal.value = true;
};

// 处理地图选择回调
const onLocationSelected = (locationName) => {
  formData.location = locationName;
  showMapModal.value = false;
};

const submitCreation = async () => {
  // 校验
  if (!formData.location) {
    if (window.toastr) window.toastr.warning("请选择一个出生地点");
    return;
  }

  submitting.value = true;
  try {
    // 1. 构建要更新的 ERA 数据对象
    const updatePayload = {
      "世界": {
        "地图索引": formData.location, // 更新地图位置
        "地点": formData.location      // 同步更新地点描述
      },
      "角色": {
        "user": {
          "年龄": formData.age,
          "性格": {
            ...formData.personality,
            "性格总结": []
          },
          "术之等级": formData.arts,
        }
      },
      "system": {
        "插图模式": formData.gender // 关键：更新插图模式
      }
    };

    // 2. 更新 ERA 数据
    await ERAUtil.UpdateByObject(updatePayload);

    // 3. 将描述性文本注入到当前正文 (Message)
    const msgId = getLastMessageId();
    let injectionText = `与破碎的镜面之中，{{user}}看到了自己：\n`;
    injectionText += `\n`;
    injectionText += `性别：${formData.gender}\n`;
    injectionText += `出生地：${formData.location}\n`; // 写入正文
    if (formData.appearance) injectionText += `外貌：${formData.appearance}\n`;
    if (formData.specialStatus) injectionText += `特殊状态：${formData.specialStatus}\n`;
    injectionText += `随后伴随着一阵天旋地转，{{user}}的意识又陷入的混沌\n`;


    await MessageUtil.mergeContentToMessage(msgId, injectionText);

    // 4. 发送生成事件
    await eventEmit("生成user人设");

    // 5. 跳转到选项界面
    await router.push('/选项');

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

  padding: 40px;
  background: radial-gradient(circle at 50% 20%, rgba(197, 160, 89, 0.1) 0%, #0a0a0a 80%);
  color: #e0e0e0;
  font-family: 'EB Garamond', serif;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.creation-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(197, 160, 89, 0.3);
  padding-bottom: 15px;
}

.title {
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  color: var(--c-gold);
  margin: 0;
}

.subtitle {
  font-size: 0.9rem;
  color: #888;
  letter-spacing: 3px;
}

.creation-container {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  justify-content: center;
  flex: 1;
}

.column {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(197, 160, 89, 0.2);
  padding: 20px;
  border-radius: 4px;
}

.left-col { flex: 1; min-width: 300px; }
.mid-col { flex: 1; min-width: 300px; }
.right-col { flex: 0 0 250px; }

.section-title {
  font-family: 'Cinzel', serif;
  color: var(--c-gold);
  border-bottom: 1px solid rgba(197, 160, 89, 0.2);
  padding-bottom: 5px;
  margin-bottom: 15px;
}

.input-row {
  margin-bottom: 15px;
}

.text-input, textarea, .art-input {
  width: 100%;
  background: var(--c-input-bg);
  border: 1px solid #444;
  color: #fff;
  padding: 8px;
  font-family: inherit;
  margin-top: 5px;
}

.radio-group {
  display: flex;
  gap: 15px;
  margin-top: 5px;
}

.radio-group label {
  cursor: pointer;
  padding: 5px 10px;
  border: 1px solid #444;
  transition: all 0.3s;
}

.radio-group label.active {
  border-color: var(--c-gold);
  color: var(--c-gold);
  background: rgba(197, 160, 89, 0.1);
}

.slider-item {
  margin-bottom: 20px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 5px;
}

.center-label { color: var(--c-gold); }

input[type=range] {
  width: 100%;
  accent-color: var(--c-gold);
}

.arts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.art-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--c-input-bg);
  padding: 5px 10px;
}

.action-footer {
  margin-top: 30px;
  text-align: center;
}

.confirm-btn {
  background: transparent;
  border: 1px solid var(--c-gold);
  color: var(--c-gold);
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  padding: 10px 40px;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-btn:hover:not(:disabled) {
  background: var(--c-gold);
  color: #000;
  box-shadow: 0 0 15px var(--c-gold);
}

/* 新增样式：位置选择器 */
.location-selector {
  background: var(--c-input-bg);
  border: 1px solid #444;
  padding: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}
.location-selector:hover {
  border-color: var(--c-gold);
  background: rgba(197, 160, 89, 0.1);
}
.location-value { color: var(--c-gold); font-weight: bold; }
.placeholder { color: #666; font-style: italic; }

/* 地图模态框样式 */
.map-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(5px);
}

.map-modal-content {
  width: 90%; height: 90%;
  background: #1a1d24;
  border: 2px solid var(--c-gold);
  display: flex; flex-direction: column;
  box-shadow: 0 0 30px rgba(0,0,0,0.8);
}

.map-modal-header {
  padding: 15px 20px;
  background: rgba(0,0,0,0.5);
  border-bottom: 1px solid #333;
  display: flex; justify-content: space-between; align-items: center;
}

.map-modal-header h2 { margin: 0; color: var(--c-gold); font-family: 'Cinzel', serif; }

.close-btn {
  background: transparent; border: 1px solid #666; color: #ccc;
  padding: 5px 15px; cursor: pointer; transition: all 0.2s;
}
.close-btn:hover { border-color: #fff; color: #fff; }

.map-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
