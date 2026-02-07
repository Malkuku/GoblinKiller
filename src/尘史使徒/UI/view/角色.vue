<!-- views/RoleView.vue -->
<template>
  <div class="role-view-container">

    <!-- 移动端：遮罩层 (当侧边栏打开时显示) -->
    <div
      class="mobile-overlay"
      v-if="isMobileMenuOpen"
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- 移动端：菜单切换按钮 (移到左上角) -->
    <button class="mobile-menu-toggle" @click="isMobileMenuOpen = !isMobileMenuOpen">
      {{ isMobileMenuOpen ? '✕' : '☰' }}
    </button>

    <!-- 左侧：角色列表导航 (原右侧，现移至 DOM 前部) -->
    <aside class="role-sidebar" :class="{ 'mobile-open': isMobileMenuOpen }">
      <div class="role-list-header">
        <span>倒影</span>
        <!-- 移动端关闭按钮 -->
        <span class="mobile-close-btn" @click="isMobileMenuOpen = false">✕</span>
      </div>

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
          <span class="name">{{ char.姓名 }}</span>

          <!-- 如果不在场但被关注，显示一个小提示 -->
          <span v-if="!char.在场 && !isOmniscient" class="absent-tag">(离)</span>

          <!-- 关注按钮 (移到右侧) -->
          <span
            class="star-icon"
            :class="{ active: isFollowed(id, '主要角色') }"
            @click.stop="toggleFollow(id, '主要角色')"
            title="关注/取消关注"
          >★</span>
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
          <span class="name">{{ char.姓名 }}</span>

          <!-- 关注按钮 (移到右侧) -->
          <span
            class="star-icon"
            :class="{ active: isFollowed(id, '次要角色') }"
            @click.stop="toggleFollow(id, '次要角色')"
            title="关注/取消关注"
          >★</span>
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
import { ERAUtil } from '@/Utils/ERAUtil';

const store = useStatStore();

// 状态
const selectedId = ref('user');
const selectedType = ref('user'); // 'user', 'main', 'minor'
const isMobileMenuOpen = ref(false); // 移动端菜单开关
const isOmniscient = ref(false);

// 数据获取
const userData = computed(() => store.stat_data?.角色?.user);

// --- 关注功能逻辑 ---

// 确保 system 数据结构存在
const ensureSystemData = () => {
  if (!store.stat_data) return;
  if (!store.stat_data.system) store.stat_data.system = {};
  if (!store.stat_data.system['关注角色列表']) {
    store.stat_data.system['关注角色列表'] = {
      '主要角色': [],
      '次要角色': []
    };
  }
};

// 判断是否已关注
const isFollowed = (id, categoryKey) => {
  const list = store.stat_data?.system?.['关注角色列表']?.[categoryKey];
  return list && list.includes(id);
};

// 切换关注状态
const toggleFollow = (id, categoryKey) => {
  ensureSystemData();
  const list = store.stat_data.system['关注角色列表'][categoryKey];
  const index = list.indexOf(id);

  if (index > -1) {
    list.splice(index, 1); // 取消关注
  } else {
    list.push(id); // 添加关注
  }

  // 持久化数据
  const updatePayload = {
    system: {
      '关注角色列表': store.stat_data.system['关注角色列表']
    }
  };

  ERAUtil.UpdateByObject(updatePayload).catch(err => {
    console.error('关注列表保存失败:', err);
  });
};

// 过滤逻辑：在场 OR 全视模式开启 OR 已关注
const filterChars = (chars, categoryKey) => {
  if (!chars) return {};
  const result = {};

  // 获取关注列表
  const followList = store.stat_data?.system?.['关注角色列表']?.[categoryKey] || [];

  for (const [key, char] of Object.entries(chars)) {
    const isPresent = char.在场;
    const isFollowedChar = followList.includes(key);

    // 核心逻辑：在场 或 全知视角 或 被关注
    if (isPresent || isOmniscient.value || isFollowedChar) {
      result[key] = char;
    }
  }
  return result;
};

// 传入 categoryKey 以便区分主要/次要角色的关注列表
const visibleMainChars = computed(() => filterChars(store.stat_data?.角色?.['主要角色'], '主要角色'));
const visibleMinorChars = computed(() => filterChars(store.stat_data?.角色?.['次要角色'], '次要角色'));

// --- 逻辑结束 ---

// 选择逻辑
const selectRole = (id, type) => {
  selectedId.value = id;
  selectedType.value = type;
  // 移动端选择后自动关闭菜单
  if (window.innerWidth <= 768) {
    isMobileMenuOpen.value = false;
  }
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

// 初始化
watch(() => store.stat_data, (newVal) => {
  if (newVal) {
    ensureSystemData(); // 确保数据结构完整
    if (!selectedId.value) {
      selectedId.value = 'user';
    }
  }
}, { immediate: true });

</script>

<style scoped>
.role-view-container {
  display: flex;
  height: 100%;
  width: 100%;
  background: rgba(0,0,0,0.2);
  position: relative;
}

/* 左侧列表样式 */
.role-sidebar {
  width: 240px; /* 稍微加宽 */
  border-right: 1px solid var(--c-border); /* 改为右边框 */
  display: flex;
  flex-direction: column;
  background: rgba(20, 20, 20, 0.6); /* 稍微加深背景，增加层次感 */
  backdrop-filter: blur(5px);
  flex-shrink: 0;
  z-index: 10;
}

.role-list-header {
  padding: 16px;
  font-family: var(--font-title);
  font-size: 1.2rem;
  color: var(--c-gold);
  border-bottom: 1px solid var(--c-border);
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background: rgba(0,0,0,0.1);
}

.role-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

/* 滚动条美化 */
.role-list::-webkit-scrollbar {
  width: 4px;
}
.role-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.category-title {
  padding: 12px 16px 6px;
  font-size: 0.75rem;
  color: var(--c-text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  opacity: 0.7;
}

.role-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent; /* 选中条移到左边 */
  position: relative;
}

.role-item:hover {
  background: var(--c-hover-bg);
}

.role-item.active {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent); /* 渐变从左向右 */
  border-left-color: var(--c-gold);
  color: var(--c-gold);
}

.role-item .name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95rem;
}

/* 星星图标样式 - 移到右侧 */
.star-icon {
  font-size: 1rem;
  color: #444;
  cursor: pointer;
  line-height: 1;
  transition: all 0.2s;
  margin-left: auto; /* 推到最右边 */
  padding: 4px;
  border-radius: 50%;
}
.star-icon:hover {
  color: #888;
  background: rgba(255,255,255,0.05);
}
.star-icon.active {
  color: #FFD700;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.4);
}

.absent-tag {
  font-size: 0.7rem;
  color: #666;
  margin-right: 4px;
}

.divider {
  height: 1px;
  background: var(--c-border);
  margin: 10px 16px;
  opacity: 0.3;
}

/* 右侧内容区 */
.role-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  /* 可以在这里添加背景图或纹理 */
}

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- 移动端适配样式 --- */
.mobile-menu-toggle { display: none; }
.mobile-close-btn { display: none; }
.mobile-overlay { display: none; }

@media (max-width: 768px) {
  .role-view-container {
    flex-direction: column;
  }

  /* 移动端侧边栏变为左侧抽屉 */
  .role-sidebar {
    position: fixed;
    top: 0;
    left: 0; /* 改为左侧 */
    bottom: 0;
    width: 260px;
    background: #1a1a1a;
    box-shadow: 2px 0 15px rgba(0,0,0,0.7);
    transform: translateX(-100%); /* 默认隐藏在左侧 */
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1000;
    border-right: 1px solid #333;
    border-left: none;
  }

  .role-sidebar.mobile-open {
    transform: translateX(0);
  }

  /* 移动端菜单按钮 - 左上角 */
  .mobile-menu-toggle {
    display: block;
    position: absolute;
    top: 12px;
    left: 12px; /* 改为左侧 */
    z-index: 900;
    background: rgba(0,0,0,0.6);
    border: 1px solid var(--c-border);
    color: var(--c-gold);
    width: 36px;
    height: 36px;
    border-radius: 4px;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 侧边栏内的关闭按钮 */
  .mobile-close-btn {
    display: block;
    position: absolute;
    right: 15px;
    cursor: pointer;
    font-size: 1.2rem;
    color: #999;
  }

  /* 遮罩层 */
  .mobile-overlay {
    display: block;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    z-index: 999;
    backdrop-filter: blur(2px);
  }
}
</style>
