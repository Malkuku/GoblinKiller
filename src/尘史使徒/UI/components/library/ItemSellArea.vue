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
          <div class="cart-controls" v-if="pendingCart[name]">
            <button class="ctrl-btn" @click="removeFromCart(name)">-</button>
            <span class="count">{{ pendingCart[name].count }}</span>
            <button class="ctrl-btn" :disabled="!canSellMore(name)" @click="addToCart(name, details)">+</button>
          </div>
          <button v-else class="action-btn sell-btn" :disabled="!canSellMore(name)" @click="addToCart(name, details)">
            {{ getUserItemCount(name) > 0 ? '加入待售' : '未持有' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 结算悬浮栏 -->
    <div class="checkout-bar" v-if="totalCartCount > 0">
      <div class="checkout-info">
        <span>待售: {{ totalCartCount }} 项</span>
        <span>预计获得: {{ totalCartEarn }} 异质</span>
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

const props = defineProps({ itemSells: Object });
const showToast = inject('showToast', msg => console.log(msg));
const statStore = useStatStore();

const pendingCart = ref({});

const totalCartCount = computed(() => {
  return Object.values(pendingCart.value).reduce((sum, item) => sum + item.count, 0);
});

const totalCartEarn = computed(() => {
  return Object.values(pendingCart.value).reduce((sum, item) => sum + item.count * (item.details.单价 || 0), 0);
});

const getUserItemCount = itemName => {
  const items = statStore.stat_data?.角色?.user?.物品 || {};
  return items[itemName]?.数量 || 0;
};

const canSellMore = itemName => {
  const owned = getUserItemCount(itemName);
  const pending = pendingCart.value[itemName]?.count || 0;
  return owned > pending;
};

const addToCart = (name, details) => {
  if (!canSellMore(name)) {
    showToast('物品数量不足');
    return;
  }
  if (!pendingCart.value[name]) {
    pendingCart.value[name] = { details, count: 0 };
  }
  pendingCart.value[name].count++;
};

const removeFromCart = name => {
  if (pendingCart.value[name]) {
    pendingCart.value[name].count--;
    if (pendingCart.value[name].count <= 0) {
      delete pendingCart.value[name];
    }
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
  if (!statStore.stat_data) {
    showToast('数据未加载');
    return;
  }

  const user = statStore.stat_data.角色.user;
  const userItems = user.物品 || {};

  let totalEarn = 0;
  const soldNames = [];

  // 预先计算总收益，以便初始化 diff 对象
  for (const [itemName, cartItem] of Object.entries(pendingCart.value)) {
    totalEarn += cartItem.count * (cartItem.details.单价 || 0);
  }

  // 初始化嵌套对象结构
  const diff = {
    角色: {
      user: {
        缥缈异质: (user.缥缈异质 || 0) + totalEarn,
        物品: {},
      },
    },
  };

  for (const [itemName, cartItem] of Object.entries(pendingCart.value)) {
    const ownedCount = userItems[itemName]?.数量 || 0;
    const sellCount = cartItem.count;

    if (ownedCount < sellCount) {
      showToast(`【${itemName}】数量不足，结算中止`);
      return;
    }

    const remainCount = ownedCount - sellCount;

    if (remainCount > 0) {
      // 更新数量
      diff.角色.user.物品[itemName] = { ...userItems[itemName], 数量: remainCount };
    } else {
      // 数量为0，标记为 null 以便 deepMerge 删除该 key
      diff.角色.user.物品[itemName] = null;
    }

    soldNames.push(`${itemName}x${sellCount}`);
  }
  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`成功出售 ${totalCartCount.value} 件物品`);

    const vagueDesc = getVagueYizhiDesc(totalEarn);
    const namesStr = soldNames.join('、');
    const logText = `\n<systemLog>\n<user>将${namesStr}投入了未知的虚空。作为交换，你失去了这些物品，但从中汲取了${vagueDesc}。\n</systemLog>\n`;
    const lastMsgId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
    await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');

    clearCart();
  } catch (e) {
    showToast('交易失败');
    console.error(e);
  }
};
</script>

<style scoped>
.cart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ctrl-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #666;
  background: #333;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}
.ctrl-btn:hover:not(:disabled) {
  background: #444;
}
.ctrl-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.count {
  min-width: 20px;
  text-align: center;
  font-weight: bold;
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
