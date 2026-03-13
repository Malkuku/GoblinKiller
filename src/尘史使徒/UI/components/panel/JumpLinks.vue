<template>
  <transition-group name="slide-up" tag="div" class="link-btn-group">
    <!-- 任务跳转按钮 -->
    <button v-if="showQuestLink" key="quest" class="jump-btn quest-btn" @click="navigateToQuest">
      <span class="icon">📜</span>
      <span class="text">检测到新的委托契约</span>
      <span class="arrow">➔</span>
    </button>

    <!-- 商店跳转按钮 -->
    <button v-if="showShopLink" key="shop" class="jump-btn shop-btn" @click="navigateToShop">
      <span class="icon">⚖</span>
      <span class="text">检测到交易契机</span>
      <span class="arrow">➔</span>
    </button>
  </transition-group>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

defineProps<{
  showQuestLink: boolean;
  showShopLink: boolean;
}>();

const router = useRouter();
const navigateToQuest = () => router.push('/任务');
const navigateToShop = () => router.push('/商店');
</script>

<style scoped>
.link-btn-group {
  position: absolute; bottom: 100px; left: 0; right: 0;
  display: flex; flex-direction: column-reverse; align-items: center;
  gap: 10px; z-index: 20; pointer-events: none;
}
.jump-btn {
  pointer-events: auto; background: rgba(20, 22, 28, 0.95);
  border: 1px solid var(--c-gold); color: var(--c-gold); padding: 10px 25px;
  border-radius: 30px; font-family: 'Cinzel', serif; font-size: 1rem;
  cursor: pointer; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 0 15px rgba(164, 139, 87, 0.3);
  transition: all 0.3s ease; animation: float 3s ease-in-out infinite;
}
.jump-btn:hover {
  background: var(--c-gold); color: #1a1a1a;
  transform: translateY(-2px); box-shadow: 0 0 25px rgba(164, 139, 87, 0.6);
}
.jump-btn .arrow { font-weight: bold; }
.shop-btn {
  border-color: #ffd700; color: #ffd700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
}
.shop-btn:hover { background: #ffd700; box-shadow: 0 0 25px rgba(255, 215, 0, 0.5); }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
</style>
