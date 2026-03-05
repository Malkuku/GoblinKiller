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

          <button v-if="pendingCart[name]" class="action-btn cancel-btn" @click="removeFromCart(name)">取消待购</button>
          <button
            v-else
            class="action-btn buy-btn"
            :disabled="!canAddMore(details.价格 || 50)"
            @click="addToCart(name, details)"
          >
            加入待购
          </button>
        </div>
      </div>
    </div>

    <!-- 结算悬浮栏 -->
    <div class="checkout-bar" v-if="totalCartCount > 0">
      <div class="checkout-info">
        <span>总计: {{ totalCartCost }} 异质</span>
      </div>
      <div class="checkout-actions">
        <button class="action-btn clear-btn" @click="clearCart">清空</button>
        <button class="action-btn confirm-btn" @click="confirmCheckout">确认结算</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { MvuUtil } from '@/Utils/MvuUtil';
import { MessageUtil } from '@/Utils/MessageUtil';

const props = defineProps({ secretBuys: Object });
const showToast = inject('showToast', msg => console.log(msg));
const statStore = useStatStore();

const pendingCart = ref({});

const totalCartCount = computed(() => {
  return Object.keys(pendingCart.value).length;
});

const totalCartCost = computed(() => {
  return Object.values(pendingCart.value).reduce((sum, item) => sum + (item.details.价格 || 50), 0);
});

const currentYizhi = computed(() => {
  return statStore.stat_data?.角色?.user?.缥缈异质 || 0;
});

const canAddMore = price => {
  return currentYizhi.value - totalCartCost.value >= price;
};

const addToCart = (name, details) => {
  const price = details.价格 || 50;
  if (!canAddMore(price)) {
    showToast('异质不足');
    return;
  }
  if (!pendingCart.value[name]) {
    pendingCart.value[name] = { details, count: 1 };
  }
};

const removeFromCart = name => {
  if (pendingCart.value[name]) {
    delete pendingCart.value[name];
  }
};

const clearCart = () => {
  pendingCart.value = {};
};

const getVagueYizhiDesc = amount => {
  if (amount <= 20) return '些许微弱的异质';
  if (amount <= 60) return '一缕缥缈的异质';
  if (amount <= 150) return '一团氤氲的异质';
  return '一股涌动的浓郁异质';
};

const confirmCheckout = async () => {
  if (totalCartCount.value === 0) return;
  if (!statStore.stat_data) return;

  const user = statStore.stat_data.角色.user;
  if ((user.缥缈异质 || 0) < totalCartCost.value) {
    showToast('异质不足');
    return;
  }

  const diff = {
    角色: {
      user: {
        缥缈异质: user.缥缈异质 - totalCartCost.value,
        物品: {},
      },
    },
  };

  const userItems = user.物品 || {};
  const occupiedNames = new Set(Object.keys(userItems));
  const acquiredNames = [];

  for (const [secretName, cartItem] of Object.entries(pendingCart.value)) {
    let finalName = secretName;
    let counter = 1;
    while (occupiedNames.has(finalName)) {
      finalName = `${secretName}${counter}`;
      counter++;
    }
    occupiedNames.add(finalName);
    acquiredNames.push(finalName);

    diff.角色.user.物品[finalName] = {
      类型: '密传',
      数量: 1,
      耐久: 100,
      描述: cartItem.details.描述 || '一份神秘的记录',
      作用: cartItem.details.作用 || '阅读以获取知识',
    };
  }

  try {
    const cost = totalCartCost.value;
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`成功购买 ${totalCartCount.value} 份密传`);

    const vagueDesc = getVagueYizhiDesc(cost);
    const namesStr = acquiredNames.map(n => `【${n}】`).join('、');
    const logText = `\n<systemLog>\n<user>散去了${vagueDesc}。随着异质的流失，隐秘的知识在现实中凝结，你获得了密传线索：${namesStr}。\n</systemLog>\n`;
    const lastMsgId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
    await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');

    clearCart();
  } catch (e) {
    showToast('购买失败');
  }
};
</script>

<style scoped>
.cancel-btn {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.cancel-btn:hover {
  background: #b71c1c;
}

.checkout-bar {
  position: sticky;
  bottom: 0;
  background: rgba(40, 40, 40, 0.95);
  padding: 12px 20px;
  border-top: 1px solid #555;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  border-radius: 8px;
  color: #fff;
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
}
.checkout-info {
  display: flex;
  gap: 20px;
  font-weight: bold;
}
.checkout-actions {
  display: flex;
  gap: 10px;
}
.clear-btn {
  background: #666;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.clear-btn:hover {
  background: #777;
}
.confirm-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.confirm-btn:hover {
  background: #45a049;
}
</style>
