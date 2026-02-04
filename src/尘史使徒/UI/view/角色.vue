<!-- views/RoleView.vue -->
<template>
  <div class="role-view-container">
    <!-- 左侧：角色列表导航 -->
    <aside class="role-sidebar">
      <div class="role-list-header">倒影</div>
      <div class="role-list scroll-wrapper">

        <!-- 玩家 -->
        <div
          class="role-item user-item"
          :class="{ active: selectedId === 'user' }"
          @click="selectRole('user', 'user')"
        >
          <span class="icon">♟</span>
          <span class="name">{{ '我' }}</span>
        </div>

        <div class="divider"></div>

        <!-- 主要角色 -->
        <div class="category-title">主要角色</div>
        <div
          v-for="(char, id) in visibleMainChars"
          :key="id"
          class="role-item main-item"
          :class="{ active: selectedId === id }"
          @click="selectRole(id, 'main')"
        >
          <span class="status-dot" :class="{ present: char.在场 }"></span>
          <span class="name">{{ char.姓名 }}</span>
        </div>

        <!-- 次要角色 -->
        <div class="category-title">次要角色</div>
        <div
          v-for="(char, id) in visibleMinorChars"
          :key="id"
          class="role-item minor-item"
          :class="{ active: selectedId === id }"
          @click="selectRole(id, 'minor')"
        >
          <span class="status-dot" :class="{ present: char.在场 }"></span>
          <span class="name">{{ char.姓名 }}</span>
        </div>

      </div>
    </aside>

    <!-- 右侧：详细内容展示区 -->
    <main class="role-content">
      <transition name="fade" mode="out-in">
        <component
          :is="currentComponent"
          :key="selectedId"
          :data="currentData"
        />
      </transition>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import UserPanel from '@/尘史使徒/UI/components/role/UserPanel.vue';
import MainCharPanel from '@/尘史使徒/UI/components/role/MainCharPanel.vue';
import MinorCharPanel from '@/尘史使徒/UI/components/role/MinorCharPanel.vue';

const store = useStatStore();

// 状态
const selectedId = ref('user');
const selectedType = ref('user'); // 'user', 'main', 'minor'

// 数据获取
const userData = computed(() => store.stat_data?.角色?.user);
const isOmniscient = computed(() => store.stat_data?.system?.['全知视角'] === true);

// 过滤逻辑：在场 OR 全视模式开启
const filterChars = (chars) => {
  if (!chars) return {};
  const result = {};
  for (const [key, char] of Object.entries(chars)) {
    if (char.在场 || isOmniscient.value) {
      result[key] = char;
    }
  }
  return result;
};

const visibleMainChars = computed(() => filterChars(store.stat_data?.角色?.['主要角色']));
const visibleMinorChars = computed(() => filterChars(store.stat_data?.角色?.['次要角色']));

// 选择逻辑
const selectRole = (id, type) => {
  selectedId.value = id;
  selectedType.value = type;
};

// 动态组件判定
const currentComponent = computed(() => {
  switch (selectedType.value) {
    case 'user': return UserPanel;
    case 'main': return MainCharPanel;
    case 'minor': return MinorCharPanel;
    default: return UserPanel;
  }
});

// 当前选中角色的数据
const currentData = computed(() => {
  if (selectedType.value === 'user') return userData.value;
  if (selectedType.value === 'main') return store.stat_data?.角色?.['主要角色']?.[selectedId.value];
  if (selectedType.value === 'minor') return store.stat_data?.角色?.['次要角色']?.[selectedId.value];
  return {};
});

// 初始化：如果没有数据，或者重置时
watch(() => store.stat_data, (newVal) => {
  if (newVal && !selectedId.value) {
    selectedId.value = 'user';
  }
}, { immediate: true });

</script>

<style scoped>
.role-view-container {
  display: flex;
  height: 100%;
  width: 100%;
  background: rgba(0,0,0,0.2);
}

/* 左侧列表样式 */
.role-sidebar {
  width: 200px;
  border-right: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  background: rgba(0,0,0,0.1);
}

.role-list-header {
  padding: 15px;
  font-family: var(--font-title);
  font-size: 1.2rem;
  color: var(--c-gold);
  border-bottom: 1px solid var(--c-border);
  text-align: center;
}

.role-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.category-title {
  padding: 10px 15px 5px;
  font-size: 0.8rem;
  color: var(--c-text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.role-item {
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.role-item:hover {
  background: var(--c-hover-bg);
}

.role-item.active {
  background: linear-gradient(90deg, var(--c-hover-bg), transparent);
  border-left-color: var(--c-gold);
  color: var(--c-gold);
}

.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #555;
}
.status-dot.present { background: #4caf50; box-shadow: 0 0 5px #4caf50; }

.divider { height: 1px; background: var(--c-border); margin: 10px 15px; opacity: 0.3; }

/* 右侧内容区 */
.role-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
