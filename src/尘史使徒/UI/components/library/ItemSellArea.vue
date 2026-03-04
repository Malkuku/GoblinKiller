<template>
  <div class="scroll-area transaction-area">
    <div v-if="Object.keys(itemSells).length === 0" class="empty-state">暂无物品收购需求...</div>
    <div v-else class="card-grid">
      <div v-for="(details, name) in itemSells" :key="name" class="trade-card item-card">
        <div class="card-top">
          <span class="card-title">{{ name }}</span>
          <span class="price-badge">💰 {{ details.单价 }}</span>
        </div>
        <div class="card-mid">
          <p class="meta">类型: {{ details.类型 }}</p>
          <p class="inventory-check" :class="{ 'has-item': getUserItemCount(name) > 0 }">
            背包持有: {{ getUserItemCount(name) }}
          </p>
        </div>
        <div class="card-action">
          <button
            class="action-btn sell-btn"
            :disabled="getUserItemCount(name) <= 0"
            @click="sellItem(name, details)"
          >
            {{ getUserItemCount(name) > 0 ? '出售' : '未持有' }}
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
import { MessageUtil } from '@/Utils/MessageUtil'; // 引入消息工具

const props = defineProps({ itemSells: Object });
const showToast = inject('showToast', (msg) => console.log(msg));
const statStore = useStatStore();

// 模糊化异质数量的辅助函数
const getVagueYizhiDesc = (amount) => {
  if (amount <= 20) return "些许微弱的异质";
  if (amount <= 60) return "一缕缥缈的异质";
  if (amount <= 150) return "一团氤氲的异质";
  return "一股涌动的浓郁异质";
};

const getUserItemCount = (itemName) => {
  const items = statStore.stat_data?.角色?.user?.物品 || {};
  return items[itemName]?.数量 || 0;
};

const sellItem = async (itemName, details) => {
  if (!statStore.stat_data) { showToast("数据未加载"); return; }
  const user = statStore.stat_data.角色.user;
  const userItems = user.物品 || {};

  if (!userItems[itemName] || userItems[itemName].数量 < 1) {
    showToast("你没有该物品"); return;
  }

  const price = details.单价 || 0;
  const diff = {};
  const itemPath = `角色.user.物品.${itemName}`;

  if (userItems[itemName].数量 > 1) {
    diff[itemPath] = { ...userItems[itemName], 数量: userItems[itemName].数量 - 1 };
  } else {
    diff[itemPath] = null;
  }
  diff["角色.user.缥缈异质"] = (user.缥缈异质 || 0) + price;

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`出售成功！`);

    // 发送交易日志消息
    const vagueDesc = getVagueYizhiDesc(price);
    const logText = `\n<user>将【${itemName}】投入了未知的虚空。作为交换，你失去了该物品，但从中汲取了${vagueDesc}。\n`;
    const lastMsgId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
    await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');

    setTimeout(() => statStore.initData(), 200);
  } catch (e) {
    showToast("交易失败");
    console.error(e);
  }
};
</script>
