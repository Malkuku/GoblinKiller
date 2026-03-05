<template>
  <div class="scroll-area transaction-area">
    <div v-if="Object.keys(skillBuys).length === 0" class="empty-state">暂无技能典籍...</div>
    <div v-else class="card-grid">
      <div v-for="(details, name) in skillBuys" :key="name" class="trade-card skill-card">
        <div class="card-top">
          <span class="card-title">{{ name }}</span>
          <span class="level-badge">Lv.{{ details.技能等级 }}</span>
        </div>
        <div class="card-mid">
          <div class="tags">
            <span class="tag aspect">{{ details.性相 }}</span>
            <span class="tag cost">消耗: {{ details.消耗 }}</span>
          </div>
          <p class="desc">"{{ details.描述 }}"</p>
          <p class="effect">效果: {{ details.作用 }}</p>
        </div>
        <div class="card-action">
          <div class="price-display">需 {{ details.价格 || 100 }} 异质</div>
          <button v-if="pendingCart[name]" class="action-btn cancel-btn" @click="removeFromCart(name)">取消待购</button>
          <button
            v-else
            class="action-btn buy-btn"
            :disabled="hasSkill(name) || !canAddMore(details.价格 || 100)"
            @click="addToCart(name, details)"
          >
            {{ hasSkill(name) ? '已习得' : '加入待购' }}
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

const props = defineProps({ skillBuys: Object });
const showToast = inject('showToast', msg => console.log(msg));
const statStore = useStatStore();

const pendingCart = ref({});

const totalCartCount = computed(() => Object.keys(pendingCart.value).length);

const totalCartCost = computed(() => {
  return Object.values(pendingCart.value).reduce((sum, item) => sum + (item.details.价格 || 100), 0);
});

const currentYizhi = computed(() => {
  return statStore.stat_data?.角色?.user?.缥缈异质 || 0;
});

const hasSkill = skillName => {
  const skills = statStore.stat_data?.角色?.user?.技能 || {};
  return !!skills[skillName];
};

const canAddMore = price => {
  return currentYizhi.value - totalCartCost.value >= price;
};

const addToCart = (name, details) => {
  const price = details.价格 || 100;
  if (hasSkill(name)) {
    showToast('已习得该技能');
    return;
  }
  if (!canAddMore(price)) {
    showToast('异质不足');
    return;
  }
  pendingCart.value[name] = { details };
};

const removeFromCart = name => {
  delete pendingCart.value[name];
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

  // 构建嵌套对象结构
  const diff = {
    角色: {
      user: {
        缥缈异质: user.缥缈异质 - totalCartCost.value,
        技能: {},
      },
    },
  };

  const acquiredNames = [];

  for (const [skillName, cartItem] of Object.entries(pendingCart.value)) {
    acquiredNames.push(skillName);
    // 直接在对象上赋值
    diff.角色.user.技能[skillName] = {
      性相: cartItem.details.性相 || '无',
      技能等级: cartItem.details.技能等级 || 1,
      描述: cartItem.details.描述 || '',
      消耗: cartItem.details.消耗 || '',
      作用: cartItem.details.作用 || '',
    };
  }

  try {
    const cost = totalCartCost.value;
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`成功习得 ${totalCartCount.value} 项技能`);

    const vagueDesc = getVagueYizhiDesc(cost);
    const namesStr = acquiredNames.map(n => `【${n}】`).join('、');
    const logText = `\n<systemLog>\n<user>献出了${vagueDesc}作为代价。古老的低语在脑海中回荡，你失去了这些异质，但成功将${namesStr}的技艺铭刻于心。\n</systemLog>\n`;
    const lastMsgId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
    await MessageUtil.mergeContentToMessage(lastMsgId, logText, 'none');

    clearCart();
    setTimeout(() => statStore.initData(), 200);
  } catch (e) {
    showToast('购买失败');
  }
};
</script>

<style scoped>
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
</style>
