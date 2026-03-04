<template>
  <div class="scroll-area transaction-area">
    <div v-if="Object.keys(secretBuys).length === 0" class="empty-state">暂无密传线索...</div>
    <div v-else class="card-grid">
      <div v-for="(details, name) in secretBuys" :key="name" class="trade-card secret-card">
        <div class="card-top">
          <span class="card-title">{{ name }}</span>
          <span class="icon-badge">📜</span>
        </div>
        <div class="card-mid">
          <p class="desc">线索: {{ details.描述 }}</p>
          <p class="effect">可能收获: {{ details.作用 }}</p>
        </div>
        <div class="card-action">
          <div class="price-display">需 {{ details.价格 || 50 }} 异质</div>
          <button
            class="action-btn buy-btn"
            :disabled="!canAfford(details.价格 || 50)"
            @click="buySecret(name, details)"
          >
            购买
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { MvuUtil } from '@/Utils/MvuUtil';

const props = defineProps({ secretBuys: Object });
const showToast = inject('showToast', (msg) => console.log(msg));
const statStore = useStatStore();

const canAfford = (price) => {
  return (statStore.stat_data?.角色?.user?.缥缈异质 || 0) >= price;
};

const buySecret = async (secretName, details) => {
  if (!statStore.stat_data) return;
  const user = statStore.stat_data.角色.user;
  const price = details.价格 || 50;

  if ((user.缥缈异质 || 0) < price) {
    showToast("异质不足"); return;
  }

  let finalName = secretName;
  let counter = 1;
  const userItems = user.物品 || {};

  while (userItems[finalName]) {
    finalName = `${secretName}${counter}`;
    counter++;
  }

  const diff = {};
  diff["角色.user.缥缈异质"] = user.缥缈异质 - price;
  diff[`角色.user.物品.${finalName}`] = {
    类型: "密传",
    数量: 1,
    耐久: 100,
    描述: details.描述 || "一份神秘的记录",
    作用: details.作用 || "阅读以获取知识"
  };

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`获得密传：${finalName}`);
    setTimeout(() => statStore.initData(), 200);
  } catch (e) {
    showToast("购买失败");
  }
};
</script>
