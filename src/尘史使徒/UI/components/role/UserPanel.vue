<template>
  <div class="char-panel user-panel">
    <header class="panel-header">
      <div class="header-content">
        <div>
          <h2 class="char-name">{{ username }}</h2>
          <div class="char-identity">{{ data.当前身份 }}</div>
        </div>
        <div class="header-actions">
          <button class="edit-btn" @click="isEditing ? saveEdit() : startEdit()">
            {{ isEditing ? '保存' : '编辑' }}
          </button>
          <button class="cancel-btn" v-if="isEditing" @click="cancelEdit">取消</button>
        </div>
      </div>
    </header>

    <!-- 内部导航 -->
    <div class="sub-nav">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['sub-nav-item', { active: currentTab === tab }]"
        @click="currentTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div class="panel-content scroll-container">
      <!-- ================= 状态页 ================= -->
      <div v-if="currentTab === '状态'" class="tab-content">
        <section class="info-block">
          <h3>生命状态</h3>
          <LifeStatusModule :data="data" />
        </section>

        <section v-if="data.特殊状态" class="info-block">
          <h3>特殊状态</h3>
          <SpecialStatusModule :data="data.特殊状态" :stats="data" />
        </section>
      </div>

      <!-- ================= 属性页 ================= -->
      <div v-if="currentTab === '属性'" class="tab-content">
        <section class="info-block">
          <h3>性格倾向</h3>
          <PersonalityModule
            :data="isEditing ? editForm.性格 : data.性格"
            :isEditing="isEditing"
            @update:data="editForm.性格 = $event"
          />
        </section>

        <section class="info-block">
          <ArtsModule :arts-data="data.术之等级" />
        </section>
      </div>

      <!-- ================= 技能页 ================= -->
      <div v-if="currentTab === '技能'" class="tab-content">
        <section class="info-block">
          <h3>战斗技能</h3>
          <SkillModule :data="data.技能" :stats="data" />
        </section>
      </div>

      <!-- ================= 档案页 ================= -->
      <div v-if="currentTab === '档案'" class="tab-content">
        <section class="info-block">
          <h3>外貌</h3>
          <p v-if="!isEditing">{{ data.外貌?.join('。') }}</p>
          <textarea v-else v-model="editForm._外貌Str" class="edit-textarea" placeholder="每行一条外貌特征"></textarea>
        </section>
        <section class="info-block">
          <h3>背景</h3>
          <p class="text-content" v-if="!isEditing">{{ data.背景?.join('\n') }}</p>
          <textarea v-else v-model="editForm._背景Str" class="edit-textarea" placeholder="每行一条背景故事"></textarea>
        </section>
        <section class="info-block">
          <h3>人际关系</h3>
          <RelationshipModule
            :data="isEditing ? editForm.人际关系 : data.人际关系"
            :isEditing="isEditing"
            @update:data="editForm.人际关系 = $event"
          />
        </section>
      </div>

      <!-- ================= 物品页 ================= -->
      <div v-if="currentTab === '物品'" class="tab-content">
        <section class="info-block" v-if="data.金钱 !== undefined">
          <h3>持有金</h3>
          <div class="currency-row">
            <span class="currency-value">{{ data.金钱 }}</span>
            <span class="currency-unit">g</span>
          </div>
        </section>
        <InventoryModule :data="data.物品" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LifeStatusModule from './LifeStatusModule.vue';
import ArtsModule from './ArtsModule.vue';
import PersonalityModule from '@/尘史使徒/UI/components/role/PersonalityModule.vue';
import SpecialStatusModule from '@/尘史使徒/UI/components/role/SpecialStatusModule.vue';
import RelationshipModule from '@/尘史使徒/UI/components/role/RelationshipModule.vue';
import InventoryModule from '@/尘史使徒/UI/components/role/InventoryModule.vue';
import SkillModule from '@/尘史使徒/UI/components/role/SkillModule.vue';
import { MvuUtil } from '@/Utils/MvuUtil';

const props = defineProps(['data', 'charId', 'category']);
const username = substitudeMacros('{{user}}');
const tabs = ['状态', '属性', '技能', '档案', '物品'];
const currentTab = ref('状态');

// 编辑状态管理
const isEditing = ref(false);
const editForm = ref({});

const startEdit = () => {
  editForm.value = JSON.parse(JSON.stringify(props.data));
  editForm.value._外貌Str = (editForm.value.外貌 || []).join('\n');
  editForm.value._背景Str = (editForm.value.背景 || []).join('\n');
  editForm.value.性格 = editForm.value.性格 || {};
  editForm.value.人际关系 = editForm.value.人际关系 || {};
  isEditing.value = true;
};

const saveEdit = async () => {
  const newAppearance = editForm.value._外貌Str.split('\n').map(s => s.trim()).filter(s => s);
  const newBackground = editForm.value._背景Str.split('\n').map(s => s.trim()).filter(s => s);

  const diff = {
    外貌: newAppearance,
    背景: newBackground,
    性格: editForm.value.性格,
    人际关系: editForm.value.人际关系
  };

  const cat = props.category || 'User';
  const cid = props.charId || 'User';

  await MvuUtil.updateMvuDataByDiff({
    角色: {
      [cat]: {
        [cid]: diff
      }
    }
  });
  isEditing.value = false;
};

const cancelEdit = () => {
  isEditing.value = false;
};
</script>

<style scoped>
/* --- 基础变量 --- */
.char-panel {
  --c-gold: #d4af37;
  --c-text: #e0e0e0;
  --c-text-dim: #a0a0a0;
  --c-bg-dark: rgba(0, 0, 0, 0.4);
  --font-title: 'Cinzel', serif;
  --font-body: 'EB Garamond', serif;

  height: 100%; display: flex; flex-direction: column; padding: 20px; color: var(--c-text);
  font-family: var(--font-body);
}

.panel-header { border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 15px; margin-bottom: 15px; }
.header-content { display: flex; justify-content: space-between; align-items: flex-start; }
.char-name { font-family: var(--font-title); color: var(--c-gold); font-size: 2rem; margin: 0; }
.char-identity { color: var(--c-text-dim); margin-top: 5px; }

/* 按钮样式 */
.header-actions { display: flex; gap: 10px; align-items: center; }
.edit-btn, .cancel-btn {
  background: transparent; border: 1px solid var(--c-gold); color: var(--c-gold);
  padding: 4px 12px; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; font-family: var(--font-title);
}
.edit-btn:hover { background: var(--c-gold); color: #000; }
.cancel-btn { border-color: #a0a0a0; color: #a0a0a0; }
.cancel-btn:hover { background: #a0a0a0; color: #000; }

/* 编辑输入框 */
.edit-textarea {
  width: 100%; background: rgba(0, 0, 0, 0.5); border: 1px solid var(--c-gold); color: var(--c-text);
  padding: 8px; font-family: var(--font-body); border-radius: 4px; resize: vertical; min-height: 80px;
}

/* 导航 */
.sub-nav { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.sub-nav-item { background: none; border: none; color: var(--c-text-dim); padding: 8px 16px; cursor: pointer; font-family: var(--font-title); transition: 0.3s; border-bottom: 2px solid transparent; font-size: 1.1rem; }
.sub-nav-item.active { color: var(--c-gold); border-bottom-color: var(--c-gold); }
.sub-nav-item:hover { color: #fff; }

.scroll-container { flex: 1; overflow-y: auto; padding-right: 10px; }
.scroll-container::-webkit-scrollbar { width: 6px; }
.scroll-container::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 3px; }

.info-block { margin-bottom: 25px; background: var(--c-bg-dark); padding: 20px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
.info-block h3 { color: var(--c-gold); border-left: 3px solid var(--c-gold); padding-left: 10px; margin-top: 0; font-family: var(--font-title); margin-bottom: 15px; }

.currency-row { display: flex; align-items: baseline; gap: 5px; }
.currency-value { font-family: var(--font-title); font-size: 1.8rem; color: var(--c-gold); font-weight: bold; text-shadow: 0 0 10px rgba(212, 175, 55, 0.3); }
.currency-unit { font-family: var(--font-title); font-size: 1.2rem; color: var(--c-text-dim); }

.text-content { white-space: pre-wrap; line-height: 1.6; color: #ccc; }
</style>
