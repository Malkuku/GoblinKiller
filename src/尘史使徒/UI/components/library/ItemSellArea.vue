<template>
  <div class="scroll-area transaction-area">
    <div v-if="Object.keys(itemSells).length === 0" class="empty-state">暂无物品收购需求...</div>
    <div v-else class="card-grid">
      <div v-for="(details, name) in itemSells" :key="name" class="trade-card item-card">
        <div class="card-top">
          <span class="card-title">{{ name }}</span>
          <span class="price-badge">
            <!-- 保持原有的异质图标 SVG -->
            <svg class="nebula-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#d946ef" stop-opacity="1" />
                  <stop offset="60%" stop-color="#8b5cf6" stop-opacity="0.8" />
                  <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
                </radialGradient>
                <linearGradient id="swirl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--c-gold, #d4af37)" />
                  <stop offset="50%" stop-color="#ec4899" />
                  <stop offset="100%" stop-color="#06b6d4" />
                </linearGradient>
              </defs>
              <circle class="nebula-core" cx="12" cy="12" r="6" fill="url(#core-glow)" />
              <path class="nebula-swirl" d="M12 3C16.97 3 21 7.03 21 12C21 13.5 20.5 14.8 19.8 16C18.5 13 15.5 11 12 11C8.5 11 5.5 13 4.2 16C3.5 14.8 3 13.5 3 12C3 7.03 7.03 3 12 3Z" fill="url(#swirl-grad)" opacity="0.7" />
              <path class="nebula-swirl-reverse" d="M12 21C7.03 21 3 16.97 3 12C3 10.5 3.5 9.2 4.2 8C5.5 11 8.5 13 12 13C15.5 13 18.5 11 19.8 8C20.5 9.2 21 10.5 21 12C21 16.97 16.97 21 12 21Z" fill="url(#swirl-grad)" opacity="0.5" />
              <circle cx="7" cy="7" r="1" fill="#fff" opacity="0.8" />
              <circle cx="17" cy="16" r="0.8" fill="var(--c-gold, #d4af37)" opacity="0.9" />
              <circle cx="18" cy="8" r="1.2" fill="#fff" opacity="0.6" />
            </svg>
            {{ details.单价 }}
          </span>
        </div>

        <div class="card-mid">
          <p class="meta">
            <span class="type-tag" :class="getUserAssetInfo(name).type">{{ getUserAssetInfo(name).type === 'skill' ? '技能' : '物品' }}</span>
            {{ details.类型 }}
          </p>

          <!-- 动态显示持有状态 -->
          <p class="inventory-check" :class="{ 'has-item': getUserAssetInfo(name).count > 0 }">
            <template v-if="getUserAssetInfo(name).type === 'skill'">
              {{ getUserAssetInfo(name).count > 0 ? '✦ 已习得此术' : '未习得' }}
            </template>
            <template v-else>
              背包持有: {{ getUserAssetInfo(name).count }}
            </template>
          </p>
        </div>

        <div class="card-action">
          <div class="cart-controls" v-if="pendingCart[name]">
            <button class="ctrl-btn" @click="removeFromCart(name)">-</button>
            <span class="count">{{ pendingCart[name].count }}</span>
            <!-- 技能通常只有1个，加入购物车后就不能再加了 -->
            <button class="ctrl-btn" :disabled="!canSellMore(name)" @click="addToCart(name, details)">+</button>
          </div>
          <button v-else class="action-btn sell-btn" :disabled="!canSellMore(name)" @click="addToCart(name, details)">
            {{ getSellButtonText(name) }}
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

/**
 * 获取用户资产信息（物品或技能）
 * @param {string} name 资产名称
 * @returns {{count: number, type: 'item'|'skill'|'none', data: any}}
 */
const getUserAssetInfo = (name) => {
  const user = statStore.stat_data?.角色?.user;
  if (!user) return { count: 0, type: 'none', data: null };

  // 优先检查物品
  if (user.物品 && user.物品[name]) {
    return {
      count: user.物品[name].数量 || 0,
      type: 'item',
      data: user.物品[name]
    };
  }

  // 其次检查技能
  if (user.技能 && user.技能[name]) {
    // 技能存在即视为数量1
    return {
      count: 1,
      type: 'skill',
      data: user.技能[name]
    };
  }

  return { count: 0, type: 'none', data: null };
};

const canSellMore = itemName => {
  const info = getUserAssetInfo(itemName);
  const owned = info.count;
  const pending = pendingCart.value[itemName]?.count || 0;
  return owned > pending;
};

const getSellButtonText = (name) => {
  const info = getUserAssetInfo(name);
  if (info.count <= 0) return '未持有';
  if (info.type === 'skill') return '遗忘并出售';
  return '加入待售';
};

const addToCart = (name, details) => {
  if (!canSellMore(name)) {
    showToast('持有数量不足');
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

  let totalEarn = 0;
  const soldLogItems = []; // 用于日志记录

  // 预先计算总收益
  for (const [itemName, cartItem] of Object.entries(pendingCart.value)) {
    totalEarn += cartItem.count * (cartItem.details.单价 || 0);
  }

  // 初始化 Diff 结构，同时准备好物品和技能的容器
  const diff = {
    角色: {
      user: {
        缥缈异质: (user.缥缈异质 || 0) + totalEarn,
        物品: {},
        技能: {}
      },
    },
  };

  for (const [itemName, cartItem] of Object.entries(pendingCart.value)) {
    const assetInfo = getUserAssetInfo(itemName);
    const sellCount = cartItem.count;

    if (assetInfo.count < sellCount) {
      showToast(`【${itemName}】数量不足，结算中止`);
      return;
    }

    if (assetInfo.type === 'item') {
      // 处理物品逻辑
      const remainCount = assetInfo.count - sellCount;
      if (remainCount > 0) {
        diff.角色.user.物品[itemName] = { ...assetInfo.data, 数量: remainCount };
      } else {
        diff.角色.user.物品[itemName] = null; // 数量归零，删除
      }
      soldLogItems.push(`${itemName}x${sellCount}`);
    }
    else if (assetInfo.type === 'skill') {
      // 处理技能逻辑：出售即删除
      diff.角色.user.技能[itemName] = null;
      soldLogItems.push(`[技能]${itemName}`);
    }
  }

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`成功交易，获得 ${totalEarn} 异质`);

    const vagueDesc = getVagueYizhiDesc(totalEarn);
    const namesStr = soldLogItems.join('、');
    // 稍微调整文案以适应技能出售
    const logText = `\n<systemLog>\n<user>将${namesStr}投入了未知的虚空。作为交换，你失去了它们，但从中汲取了${vagueDesc}。\n</systemLog>\n`;
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
/* 保持原有样式，新增部分样式 */
.type-tag {
  font-size: 0.8em;
  padding: 1px 4px;
  border-radius: 3px;
  margin-right: 6px;
  background: #444;
  color: #aaa;
}
.type-tag.skill {
  background: #4a3b69;
  color: #d8b4fe;
  border: 1px solid #6b4c9a;
}
.type-tag.item {
  background: #3b4a45;
  color: #a7f3d0;
  border: 1px solid #34d399;
}

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
