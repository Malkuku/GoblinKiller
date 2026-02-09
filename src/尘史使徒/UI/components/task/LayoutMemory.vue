<!-- 路径: @/尘史使徒/UI/components/task/LayoutMemory.vue -->
<template>
  <div class="layout-memory">
    <div class="shattered-container">
      <div
        v-for="(item, index) in data.详细"
        :key="index"
        class="memory-shard"
      >
        <div class="shard-content">
          <span class="shard-icon">✦</span>
          <span class="shard-text">{{ item }}</span>
        </div>
        <!-- 装饰用的光效层 -->
        <div class="shard-glint"></div>
      </div>
    </div>

    <!-- 底部装饰：破碎的镜面感 -->
    <div class="broken-reflection"></div>
  </div>
</template>

<script setup>
defineProps({
  data: Object
});
</script>

<style scoped>
.layout-memory {
  position: relative;
  padding-top: 10px;
}

.shattered-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.memory-shard {
  position: relative;
  background: rgba(20, 15, 5, 0.6);
  border: 1px solid rgba(218, 165, 32, 0.3); /* 暗金色边框 */
  padding: 15px 20px;
  /* 使用 clip-path 切割出不规则的碎片感，这里做一个轻微的切角 */
  clip-path: polygon(
    0% 0%,
    98% 0%,
    100% 15%,
    100% 100%,
    2% 100%,
    0% 85%
  );
  transition: all 0.4s ease;
  overflow: hidden;
}

.memory-shard:hover {
  background: rgba(40, 30, 10, 0.8);
  border-color: rgba(255, 215, 0, 0.8); /* 亮金色 */
  transform: translateX(5px) scale(1.01);
  box-shadow: 0 0 15px rgba(218, 165, 32, 0.15);
}

.shard-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.shard-icon {
  color: #ffd700;
  font-size: 0.8rem;
  margin-top: 3px;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.6);
}

.shard-text {
  color: #e0d0b0;
  font-family: serif;
  line-height: 1.5;
  font-style: italic;
}

/* 动态光效：模拟玻璃反光 */
.shard-glint {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 45%,
    rgba(255, 215, 0, 0.1) 50%,
    transparent 55%
  );
  transform: rotate(30deg);
  transition: transform 0.6s;
  pointer-events: none;
  z-index: 1;
}

.memory-shard:hover .shard-glint {
  transform: rotate(30deg) translate(20px, 20px);
}

/* 底部装饰线：模拟裂纹 */
.broken-reflection {
  margin-top: 25px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(218, 165, 32, 0.2) 20%,
    rgba(255, 215, 0, 0.8) 50%,
    rgba(218, 165, 32, 0.2) 80%,
    transparent 100%
  );
  position: relative;
}

.broken-reflection::after {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  width: 6px;
  height: 6px;
  background: #ffd700;
  transform: rotate(45deg) translateX(-50%);
  box-shadow: 0 0 8px #ffd700;
}
</style>
