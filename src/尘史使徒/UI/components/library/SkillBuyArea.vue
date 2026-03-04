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
          <button
            class="action-btn buy-btn"
            :disabled="hasSkill(name) || !canAfford(details.价格 || 100)"
            @click="buySkill(name, details)"
          >
            {{ hasSkill(name) ? '已习得' : '购买' }}
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

const props = defineProps({ skillBuys: Object });
const showToast = inject('showToast', (msg) => console.log(msg));
const statStore = useStatStore();

const hasSkill = (skillName) => {
  const skills = statStore.stat_data?.角色?.user?.技能 || {};
  return !!skills[skillName];
};

const canAfford = (price) => {
  return (statStore.stat_data?.角色?.user?.缥缈异质 || 0) >= price;
};

const buySkill = async (skillName, details) => {
  if (!statStore.stat_data) return;
  const user = statStore.stat_data.角色.user;
  const price = details.价格 || 100;

  if ((user.缥缈异质 || 0) < price) {
    showToast("异质不足"); return;
  }

  const diff = {};
  diff["角色.user.缥缈异质"] = user.缥缈异质 - price;
  diff[`角色.user.技能.${skillName}`] = {
    性相: details.性相 || "无",
    技能等级: 1,
    描述: details.描述 || "",
    消耗: details.消耗 || "",
    作用: details.作用 || ""
  };

  try {
    await MvuUtil.updateMvuDataByDiff(diff);
    showToast(`习得技能：${skillName}`);
    setTimeout(() => statStore.initData(), 200);
  } catch (e) {
    showToast("购买失败");
  }
};
</script>
