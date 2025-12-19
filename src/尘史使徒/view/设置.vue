<template>
  <div class="settings-view-container">
    <div class="settings-panel">
      <h1 class="panel-title">门扉之间</h1>

      <div class="settings-list">
        <!-- 全知视角设置项 -->
        <div class="setting-item">
          <div class="info">
            <h2 class="setting-name">全知视角</h2>
            <p class="setting-description">
              作为游离于历史之外的人，你可以拜请[守夜人]，让你目见更多隐藏的秘密
            </p>
          </div>
          <div class="control">
            <label class="toggle-switch">
              <input type="checkbox" :checked="isOmniscient" @change="toggleOmniscientView">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- 未来可以添加更多设置项 -->
        <!--
        <div class="setting-item">
          ...
        </div>
        -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ERAUtil } from '@/Utils/ERAUtil';
import { useStatStore } from '@/尘史使徒/store/StatStore';
import * as toastr from 'toastr';

const statStore = useStatStore();

// 从 stat store 计算出当前的全知视角状态
const isOmniscient = computed(() => statStore.stat_data?.全知视角 === true);

/**
 * 当用户点击开关时触发此方法。
 */
const toggleOmniscientView = async () => {
  // 计算出将要设置的新值
  const newValue = !isOmniscient.value;

  try {
    // 构建要发送的更新对象
    const updatePayload = {
      "全知视角": newValue
    };

    // 调用全局方法来发送更新请求
    await ERAUtil.UpdateByObject(updatePayload);

  } catch (error) {
    console.error("更新“全知视角”设置失败:", error);
    toastr.error("守夜人没有回应你的祈求");
  }
};
</script>

<style scoped>
.settings-view-container {
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
}

.settings-panel {
  max-width: 800px;
  margin: 0 auto;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 2rem;
}

.panel-title {
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  color: var(--text-primary);
  margin: 0 0 2rem 0;
  text-align: center;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background-color: var(--border-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
  background-color: var(--bg-primary);
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}

.info {
  flex-grow: 1;
}

.setting-name {
  font-family: 'EB Garamond', serif;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.setting-description {
  font-family: 'EB Garamond', serif;
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.control {
  flex-shrink: 0;
}

/* 精美的 Toggle Switch 样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 28px;
  transition: background-color 0.3s ease;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: var(--text-secondary);
  border-radius: 50%;
  transition: transform 0.3s ease, background-color 0.3s ease;
}

input:checked + .slider {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
}

input:checked + .slider:before {
  transform: translateX(22px);
  background-color: white;
}
</style>
