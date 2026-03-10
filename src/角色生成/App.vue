<template>
  <div class="app-container animus-theme">
    <!-- 全局扫描线遮罩 -->
    <div class="scanlines"></div>

    <div class="gallery-card active">
      <!-- HUD 边角装饰 -->
      <div class="hud-corner top-left"></div>
      <div class="hud-corner top-right"></div>
      <div class="hud-corner bottom-left"></div>
      <div class="hud-corner bottom-right"></div>

      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="header-title">
          <span class="tech-prefix">//</span>
          实体解析 <span class="separator">::</span>
          <span class="entity-gold">角色档案</span>
        </div>
        <div class="status-indicator scanning">
          <span class="status-dot"></span>
          数据库连接正常
        </div>
      </div>

      <!-- 卡片内容 -->
      <div class="card-content">

        <!-- 角色选择器 (多目标时显示) -->
        <div class="tab-controller" v-if="characterNames.length > 0">
          <div
            v-for="name in characterNames"
            :key="name"
            class="tab-btn"
            :class="{ active: currentCharacterName === name }"
            @click="currentCharacterName = name"
          >
            <span class="icon">▧</span> {{ name }}
          </div>
          <div class="tab-line"></div>
        </div>

        <!-- 实体详细数据展示 -->
        <transition name="fade-slide" mode="out-in">
          <div v-if="currentCharacter" :key="currentCharacterName" class="data-view">

            <!-- 头部信息与操作区 -->
            <div class="profile-header">
              <div class="profile-info">
                <h3 class="char-name">{{ currentCharacter.姓名 }}</h3>
                <p class="char-intro">{{ currentCharacter.简介 }}</p>
                <div class="tag-list">
                  <span class="tag" v-for="tag in currentCharacter.性格标签" :key="tag">#{{ tag }}</span>
                </div>
              </div>
              <div class="profile-actions">
                <button
                  class="action-btn record-btn"
                  :class="{ 'is-recorded': isRecorded }"
                  @click="recordCharacter"
                  :disabled="isRecorded"
                >
                  <span class="btn-icon">{{ isRecorded ? '✔' : '⭳' }}</span>
                  {{ isRecorded ? '档案已收录' : '记录该角色' }}
                </button>
                <div class="location-hint" v-if="!isRecorded">
                  将绑定至: [ {{ currentMapIndex }} ]
                </div>
              </div>
            </div>

            <!-- 核心数据区：单栏流式布局 -->
            <div class="core-data-layout">

              <!-- 异常/特殊状态 (提至全局警告区) -->
              <div class="data-box status-box" v-if="currentCharacter.特殊状态 && Object.keys(currentCharacter.特殊状态).length > 0">
                <div class="box-header">
                  <span class="box-icon"></span>
                  <h4>异常 / 特殊状态</h4>
                </div>
                <div class="status-list">
                  <div class="status-item" v-for="(status, statusName) in currentCharacter.特殊状态" :key="statusName">
                    <div class="status-name">⚠ {{ statusName }}</div>
                    <div class="status-desc">{{ status.描述 }}</div>
                    <div class="status-meta">
                      <span class="meta-label">效果:</span> {{ status.效果 }}<br>
                      <span class="meta-label">持续:</span> {{ status.持续时间 }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 详情面板 (包含基础参数、学识、技能) -->
              <div class="data-box detail-tabs-box">

                <!-- 详情子标签页 -->
                <div class="sub-tab-controller">
                  <div class="sub-tab" :class="{ active: currentDetailTab === '基础参数' }" @click="currentDetailTab = '基础参数'">
                    <span class="tab-icon">⟡</span> 基础参数
                  </div>
                  <div class="sub-tab" :class="{ active: currentDetailTab === '神秘学识' }" @click="currentDetailTab = '神秘学识'">
                    <span class="tab-icon">✧</span> 神秘学识
                  </div>
                  <div class="sub-tab" :class="{ active: currentDetailTab === '掌握技能' }" @click="currentDetailTab = '掌握技能'">
                    <span class="tab-icon">⎈</span> 掌握技能
                  </div>
                </div>

                <!-- 分页内容区 -->
                <div class="tab-content-area">
                  <transition name="fade" mode="out-in">

                    <!-- 分页 1: 基础参数 (生命状态 + 基础数值) -->
                    <div v-if="currentDetailTab === '基础参数'" class="tab-pane" key="tab-attr">

                      <!-- 1.1 生命状态 -->
                      <div class="inner-section">
                        <div class="section-header">
                          <span class="box-icon"></span>
                          <h4>生命体征</h4>
                        </div>
                        <div class="vitals-list">
                          <div class="vital-item" v-for="(stat, key) in currentCharacter.生命状态" :key="key">
                            <div class="vital-labels">
                              <span class="vital-name">{{ key }}</span>
                              <span class="vital-value" :class="getVitalColorClass(key)">
                                {{ stat.当前 }} / {{ stat.最大值 }}
                              </span>
                            </div>
                            <div class="progress-bg">
                              <div class="progress-fill" :class="'fill-' + getVitalColorClass(key)" :style="{ width: getPercentage(stat) + '%' }"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 分割线 -->
                      <div class="section-divider"></div>

                      <!-- 1.2 基础数值 (7维) -->
                      <div class="inner-section">
                        <div class="section-header">
                          <span class="box-icon"></span>
                          <h4>核心属性</h4>
                        </div>
                        <div class="attr-grid">
                          <div class="attr-item" v-for="(val, key) in currentCharacter.基础数值" :key="key">
                            <div class="attr-label">{{ key }}</div>
                            <div class="attr-value">{{ val }}</div>
                          </div>
                        </div>
                      </div>

                    </div>

                    <!-- 分页 2: 神秘学识 -->
                    <div v-else-if="currentDetailTab === '神秘学识'" class="tab-pane" key="tab-arts">
                      <div class="arts-container">
                        <div v-if="!currentCharacter.术之等级 || Object.keys(currentCharacter.术之等级).length === 0" class="empty-hint">
                          [ 未检测到神秘学识波动 ]
                        </div>
                        <div class="art-badge" v-for="(data, artName) in currentCharacter.术之等级" :key="artName">
                          <div class="art-name">{{ artName }}</div>
                          <div class="art-level">Lv.{{ data.等级 }}</div>
                          <div class="art-exp">EXP: {{ data.经验 }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 分页 3: 技能列表 -->
                    <div v-else-if="currentDetailTab === '掌握技能'" class="tab-pane" key="tab-skills">
                      <div class="skills-list">
                        <div v-if="!currentCharacter.技能 || Object.keys(currentCharacter.技能).length === 0" class="empty-hint">
                          [ 暂无技能情报 ]
                        </div>
                        <div class="skill-item" v-for="(skill, skillName) in currentCharacter.技能" :key="skillName">
                          <div class="skill-header">
                            <span class="skill-name">{{ skillName }} <span class="skill-level">Lv.{{ skill.技能等级 }}</span></span>
                            <span class="skill-aspect">[{{ skill.性相 }}]</span>
                          </div>
                          <div class="skill-desc">{{ skill.描述 }}</div>
                          <div class="skill-meta">
                            <span class="meta-label">消耗:</span> {{ skill.消耗 }} |
                            <span class="meta-label">作用:</span> {{ skill.作用 }}
                          </div>
                        </div>
                      </div>
                    </div>

                  </transition>
                </div>

              </div>

            </div>
          </div>
        </transition>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { MvuUtil } from '@/Utils/MvuUtil';

// 1. 获取注入的 JSON 数据
const rawJson = $1 || {};

// 2. 状态管理
const characterNames = Object.keys(rawJson);
const currentCharacterName = ref(characterNames.length > 0 ? characterNames[0] : null);
const globalMvuData = ref(null);

// 详情面板的子标签页状态
const currentDetailTab = ref('基础参数');

// 监听角色切换，自动重置子标签页到“基础参数”
watch(currentCharacterName, () => {
  currentDetailTab.value = '基础参数';
});

// 3. 获取全局 Mvu 数据的辅助函数
const fetchGlobalData = () => {
  globalMvuData.value = Mvu.getMvuData({ type: 'message', message_id: -1 });
};

// 监听全局变量更新事件
const handleMvuUpdate = (e) => {
  if (e.detail && e.detail.newData) {
    globalMvuData.value = e.detail.newData;
  } else {
    fetchGlobalData();
  }
};

onMounted(() => {
  fetchGlobalData();
  window.addEventListener('mag_variable_update_ended', handleMvuUpdate);
});

onUnmounted(() => {
  window.removeEventListener('mag_variable_update_ended', handleMvuUpdate);
});

// 4. 计算属性
const currentCharacter = computed(() => {
  if (!currentCharacterName.value) return null;
  return rawJson[currentCharacterName.value];
});

const currentMapIndex = computed(() => {
  return globalMvuData.value?.stat_data?.世界?.地图索引 || '未知区域';
});

const isRecorded = computed(() => {
  if (!currentCharacterName.value || !globalMvuData.value) return false;
  const minorChars = globalMvuData.value.stat_data?.角色?.次要角色 || {};
  return !!minorChars[currentCharacterName.value];
});

// 5. 核心方法：记录角色
const recordCharacter = async () => {
  if (isRecorded.value || !currentCharacter.value) return;

  const charDataToSave = JSON.parse(JSON.stringify(currentCharacter.value));
  charDataToSave.区域检索词 = [currentMapIndex.value];
  charDataToSave.在场 = true;

  const diffObj = {
    角色: {
      次要角色: {
        [currentCharacterName.value]: charDataToSave
      }
    }
  };

  try {
    await MvuUtil.updateMvuDataByDiff(diffObj);
    setTimeout(fetchGlobalData, 100);
  } catch (error) {
    console.error("记录角色失败:", error);
  }
};

// 6. UI 辅助函数
const getPercentage = (stat) => {
  if (!stat || stat.最大值 === 0) return 0;
  const percent = (stat.当前 / stat.最大值) * 100;
  return Math.max(0, Math.min(100, percent));
};

const getVitalColorClass = (key) => {
  if (key === '生命') return 'red';
  if (key === '体力') return 'gold';
  if (key === '精神') return 'blue';
  return 'gray';
};
</script>

<style scoped>
/* --- 核心色彩与变量 (暗金主题) --- */
.animus-theme {
  --ac-bg-dark: #080705;
  --ac-bg-panel: rgba(20, 18, 12, 0.9);
  --ac-gold: #d4af37;
  --ac-gold-dim: #8a7035;
  --ac-gold-light: #f9d77e;
  --ac-red: #cc2929;
  --ac-blue: #4a90e2;
  --ac-white: #e8e0c5;
  --ac-gray: #7d7560;
  --ac-line: rgba(212, 175, 55, 0.2);
  --ac-font-main: 'Rajdhani', 'Microsoft YaHei', sans-serif;
  --ac-font-mono: 'Fira Code', monospace;

  background-color: transparent;
  color: var(--ac-white);
  font-family: var(--ac-font-main);
  padding: 15px;
  position: relative;
}

.scanlines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0) 50%, rgba(50,40,0,0.05) 50%, rgba(50,40,0,0.05));
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 999;
  opacity: 0.4;
}

.gallery-card {
  position: relative;
  background-color: var(--ac-bg-panel);
  border: 1px solid var(--ac-line);
  max-width: 950px;
  margin: 0 auto;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
}

.gallery-card.active {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
}

/* 边角装饰 */
.hud-corner { position: absolute; width: 15px; height: 15px; border: 2px solid transparent; z-index: 10; }
.top-left { top: -1px; left: -1px; border-top-color: var(--ac-gold); border-left-color: var(--ac-gold); }
.top-right { top: -1px; right: -1px; border-top-color: var(--ac-gold); border-right-color: var(--ac-gold); }
.bottom-left { bottom: -1px; left: -1px; border-bottom-color: var(--ac-gold); border-left-color: var(--ac-gold); }
.bottom-right { bottom: -1px; right: -1px; border-bottom-color: var(--ac-gold); border-right-color: var(--ac-gold); }

/* 头部 */
.card-header {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--ac-line);
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%);
}

.header-title { font-size: 1rem; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; font-weight: bold; }
.tech-prefix { color: var(--ac-gold-dim); }
.separator { color: var(--ac-line); }
.entity-gold { color: var(--ac-gold-light); text-shadow: 0 0 5px rgba(212, 175, 55, 0.4); }

.status-indicator { font-family: var(--ac-font-mono); font-size: 0.75rem; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; color: var(--ac-gold-light); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background-color: var(--ac-gold-light); box-shadow: 0 0 5px var(--ac-gold-light); animation: blink 1s infinite; }

/* 内容区与标签 */
.card-content { padding: 16px; }

.tab-controller { display: flex; gap: 2px; margin-bottom: 16px; position: relative; flex-wrap: wrap; }
.tab-btn {
  padding: 6px 16px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--ac-line);
  border-bottom: none;
  color: var(--ac-gray);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex; align-items: center; gap: 6px;
  clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px);
}
.tab-btn:hover { background: rgba(212, 175, 55, 0.05); color: var(--ac-white); }
.tab-btn.active {
  background: rgba(212, 175, 55, 0.15);
  color: var(--ac-gold-light);
  border-color: var(--ac-gold);
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
}
.tab-line { position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: var(--ac-gold); opacity: 0.3; z-index: 0; }

/* 角色简介与操作区 */
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.4);
  border-left: 3px solid var(--ac-gold);
}
.profile-info { flex: 1; }
.char-name { margin: 0 0 6px 0; font-size: 1.4rem; color: var(--ac-gold-light); letter-spacing: 2px; }
.char-intro { margin: 0 0 10px 0; font-size: 0.9rem; color: #dcdcdc; line-height: 1.4; }
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-family: var(--ac-font-mono); font-size: 0.75rem; padding: 2px 6px; background: rgba(212, 175, 55, 0.1); border: 1px solid var(--ac-gold-dim); color: var(--ac-gold); border-radius: 2px; }

.profile-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; min-width: 140px; }
.action-btn {
  background: linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(0,0,0,0.8) 100%);
  border: 1px solid var(--ac-gold);
  color: var(--ac-gold-light);
  padding: 8px 16px;
  font-family: var(--ac-font-main);
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  display: flex; align-items: center; gap: 6px;
}
.action-btn:hover:not(:disabled) { background: rgba(212, 175, 55, 0.3); box-shadow: 0 0 15px rgba(212, 175, 55, 0.4); }
.action-btn:active:not(:disabled) { transform: scale(0.98); }
.action-btn.is-recorded {
  background: rgba(30, 40, 30, 0.8);
  border-color: #4caf50;
  color: #81c784;
  cursor: not-allowed;
}
.location-hint { font-family: var(--ac-font-mono); font-size: 0.7rem; color: var(--ac-gray); }

/* --- 单栏流式布局 --- */
.core-data-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 通用数据盒样式 */
.data-box {
  position: relative; padding: 12px 16px;
  background: rgba(20, 18, 12, 0.5);
  border: 1px solid var(--ac-line);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  transition: transform 0.3s, box-shadow 0.3s;
}
.data-box:hover { background: rgba(30, 25, 15, 0.6); border-color: rgba(212, 175, 55, 0.4); }

.box-header { display: flex; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--ac-line); padding-bottom: 6px; }
.box-icon { width: 5px; height: 5px; background-color: var(--ac-gold); margin-right: 8px; box-shadow: 0 0 5px var(--ac-gold); transform: rotate(45deg); }
.box-header h4 { margin: 0; font-size: 0.9rem; letter-spacing: 1px; color: var(--ac-white); font-weight: normal; }

/* 内部区块标题 (用于基础参数内部) */
.section-header { display: flex; align-items: center; margin-bottom: 12px; }
.section-header h4 { margin: 0; font-size: 0.95rem; color: var(--ac-gold-light); font-weight: normal; letter-spacing: 1px; }
.section-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--ac-line), transparent); margin: 20px 0; }

/* --- 详情子标签页 --- */
.detail-tabs-box { padding: 0; display: flex; flex-direction: column; min-height: 300px; }
.sub-tab-controller {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid var(--ac-line);
}
.sub-tab {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  font-size: 0.9rem;
  color: var(--ac-gray);
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 2px solid transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
}
.sub-tab:hover { color: var(--ac-white); background: rgba(212, 175, 55, 0.05); }
.sub-tab.active {
  color: var(--ac-gold-light);
  border-bottom: 2px solid var(--ac-gold);
  background: linear-gradient(to top, rgba(212, 175, 55, 0.15), transparent);
  text-shadow: 0 0 5px rgba(212, 175, 55, 0.3);
}
.tab-icon { font-size: 0.8rem; }
.tab-content-area { padding: 20px; flex: 1; }

/* 模块 1.1: 生命体征 (网格排布) */
.vitals-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.vital-item { font-family: var(--ac-font-mono); }
.vital-labels { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; }
.vital-value { font-weight: bold; }
.vital-value.red { color: #ff6b6b; }
.vital-value.gold { color: var(--ac-gold-light); }
.vital-value.blue { color: #64b5f6; }
.vital-value.gray { color: #a8b2c1; }

.progress-bg { width: 100%; height: 6px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden; }
.progress-fill { height: 100%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.fill-red { background: linear-gradient(90deg, #8b0000, var(--ac-red)); box-shadow: 0 0 10px rgba(204,41,41,0.5); }
.fill-gold { background: linear-gradient(90deg, var(--ac-gold-dim), var(--ac-gold)); box-shadow: 0 0 10px rgba(212,175,55,0.5); }
.fill-blue { background: linear-gradient(90deg, #1565c0, var(--ac-blue)); box-shadow: 0 0 10px rgba(74,144,226,0.5); }
.fill-gray { background: linear-gradient(90deg, #4a5568, #a0aec0); }

/* 模块 1.2: 基础数值 (7维) */
.attr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }
.attr-item { background: rgba(0,0,0,0.4); border: 1px dashed var(--ac-line); padding: 10px 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all 0.3s; }
.attr-item:hover { border-color: var(--ac-gold-dim); background: rgba(212, 175, 55, 0.05); transform: translateY(-2px); }
.attr-label { font-size: 0.85rem; color: var(--ac-gray); }
.attr-value { font-family: var(--ac-font-mono); font-size: 1.4rem; color: var(--ac-gold); font-weight: bold; text-shadow: 0 0 5px rgba(212,175,55,0.3); }

/* 模块 2: 神秘学识 */
.arts-container { display: flex; flex-wrap: wrap; gap: 12px; }
.empty-hint { color: var(--ac-gray); font-family: var(--ac-font-mono); font-size: 0.85rem; font-style: italic; width: 100%; text-align: center; padding: 20px 0; }
.art-badge {
  background: linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(0,0,0,0.8) 100%);
  border: 1px solid var(--ac-gold-dim);
  padding: 10px 16px;
  min-width: 110px;
  flex: 1;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  display: flex; flex-direction: column; align-items: center;
}
.art-name { font-size: 1.05rem; font-weight: bold; color: var(--ac-white); margin-bottom: 4px; letter-spacing: 1px; }
.art-level { font-family: var(--ac-font-mono); font-size: 0.9rem; color: var(--ac-gold); }
.art-exp { font-family: var(--ac-font-mono); font-size: 0.75rem; color: var(--ac-gray); margin-top: 4px; }

/* 模块 3: 技能列表 */
.skills-list { display: flex; flex-direction: column; gap: 12px; }
.skill-item { background: rgba(0,0,0,0.3); border-left: 3px solid var(--ac-gold-dim); padding: 10px 14px; transition: background 0.3s; }
.skill-item:hover { background: rgba(212, 175, 55, 0.05); border-left-color: var(--ac-gold); }
.skill-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.skill-name { font-weight: bold; color: var(--ac-gold-light); font-size: 1rem; }
.skill-level { font-family: var(--ac-font-mono); font-size: 0.8rem; color: var(--ac-gray); margin-left: 8px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 2px;}
.skill-aspect { font-family: var(--ac-font-mono); font-size: 0.85rem; color: var(--ac-gold); }
.skill-desc { font-size: 0.9rem; color: #dcdcdc; margin-bottom: 8px; line-height: 1.5; }
.skill-meta { font-family: var(--ac-font-mono); font-size: 0.8rem; color: var(--ac-gray); background: rgba(0,0,0,0.5); padding: 4px 8px; display: inline-block;}
.meta-label { color: var(--ac-gold-dim); }

/* 模块 4: 特殊状态 (全局警告) */
.status-box { border-color: rgba(204, 41, 41, 0.4); background: rgba(20, 5, 5, 0.6); }
.status-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
.status-item { background: rgba(204, 41, 41, 0.05); border-left: 2px solid var(--ac-red); padding: 8px 12px; }
.status-name { font-weight: bold; color: #ff6b6b; font-size: 0.9rem; margin-bottom: 4px; }
.status-desc { font-size: 0.85rem; color: #dcdcdc; margin-bottom: 4px; }
.status-meta { font-family: var(--ac-font-mono); font-size: 0.75rem; color: var(--ac-gray); line-height: 1.4; }

/* 动画 */
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

/* 子标签页淡入淡出 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from { opacity: 0; transform: translateY(5px); }
.fade-leave-to { opacity: 0; transform: translateY(-5px); }

/* 响应式 */
@media (max-width: 768px) {
  .profile-header { flex-direction: column; gap: 12px; }
  .profile-actions { width: 100%; align-items: flex-start; }
  .sub-tab { font-size: 0.8rem; padding: 10px 4px; }
  .vitals-list { grid-template-columns: 1fr; }
}
</style>
