<template>
  <div class="char-panel minor-panel">
    <header class="panel-header">
      <div class="header-top">
        <h2 class="char-name">{{ data.姓名 }}</h2>
        <div class="header-actions">
          <button class="edit-btn" @click="isEditing ? saveEdit() : startEdit()">
            {{ isEditing ? '保存' : '编辑' }}
          </button>
          <button class="cancel-btn" v-if="isEditing" @click="cancelEdit">取消</button>
          <button class="delete-btn" v-if="!isEditing" @click="deleteChar">删除角色</button>
        </div>
      </div>
      <div class="char-intro" v-if="!isEditing">{{ data.简介 || '暂无简介' }}</div>
      <textarea v-else v-model="editForm.简介" class="edit-textarea mt-2" placeholder="简介"></textarea>
    </header>

    <div class="panel-content scroll-container">
      <section class="info-block">
        <h3>性格标签</h3>
        <div class="tags-container" v-if="!isEditing">
          <span v-for="tag in data.性格标签" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <input v-else v-model="editForm._性格标签Str" class="edit-input" placeholder="输入标签，用空格分隔" />
      </section>

      <section class="info-block">
        <h3>状态</h3>
        <LifeStatusModule :data="data" />
        <div class="mt-4" v-if="data.特殊状态">
          <h4>特殊状态</h4>
          <SpecialStatusModule :data="data.特殊状态" :stats="data" />
        </div>
      </section>

      <section class="info-block">
        <h3>能力</h3>
        <div class="mb-3">
          <ArtsModule v-if="typeof data.术之等级 === 'object'" :arts-data="data.术之等级" />
          <p v-else><strong>术之等级:</strong> {{ data.术之等级 || '未知' }}</p>
        </div>
        <div class="mt-4" v-if="data.技能">
          <h4>技能</h4>
          <SkillModule :data="data.技能" :stats="data" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SpecialStatusModule from './SpecialStatusModule.vue';
import ArtsModule from './ArtsModule.vue';
import SkillModule from './SkillModule.vue';
import LifeStatusModule from '@/尘史使徒/UI/components/role/LifeStatusModule.vue';
import { MvuUtil } from '@/Utils/MvuUtil';

const props = defineProps(['data', 'charId', 'category']);

// 编辑状态管理
const isEditing = ref(false);
const editForm = ref({});

const startEdit = () => {
  editForm.value = JSON.parse(JSON.stringify(props.data));
  editForm.value._性格标签Str = (editForm.value.性格标签 || []).join(' ');
  isEditing.value = true;
};

const saveEdit = async () => {
  const newTags = editForm.value._性格标签Str.split(/\s+/).filter(s => s);
  const diff = {
    简介: editForm.value.简介,
    性格标签: newTags
  };
  await MvuUtil.updateMvuDataByDiff({
    角色: {
      [props.category]: {
        [props.charId]: diff
      }
    }
  });
  isEditing.value = false;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const deleteChar = async () => {
  if (!props.charId || !props.category) return;
  const nameDisplay = props.data?.姓名 || props.charId;
  if (!confirm(`确定要删除角色【${nameDisplay}】吗？\n此操作将删除该角色的所有数据且不可恢复。`)) return;
  try {
    await MvuUtil.updateMvuDataByDiff({
      角色: { [props.category]: { [props.charId]: null } }
    });
  } catch (error) {
    console.error("删除角色时发生错误:", error);
  }
};
</script>

<style scoped>
/* 基础变量 */
.char-panel {
  --c-gold: #d4af37;
  --c-text: #e0e0e0;
  --c-text-dim: #a0a0a0;
  --c-bg-dark: rgba(0, 0, 0, 0.4);
  --c-hover-bg: rgba(255, 255, 255, 0.1);
  --c-border: rgba(255, 255, 255, 0.2);
  --c-danger: #e74c3c;
  --font-title: 'Cinzel', serif;

  height: 100%; display: flex; flex-direction: column; padding: 20px; color: var(--c-text);
}

.panel-header { border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 15px; margin-bottom: 15px; }
.header-top { display: flex; justify-content: space-between; align-items: center; }
.char-name { font-family: var(--font-title); color: var(--c-gold); font-size: 1.8rem; margin: 0; }
.char-intro { font-style: italic; color: var(--c-text-dim); margin-top: 5px; }

/* 按钮样式 */
.header-actions { display: flex; gap: 10px; align-items: center; }
.edit-btn, .cancel-btn, .delete-btn {
  background: transparent; border: 1px solid var(--c-gold); color: var(--c-gold);
  padding: 4px 12px; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; font-family: var(--font-title);
}
.edit-btn:hover { background: var(--c-gold); color: #000; }
.cancel-btn { border-color: #a0a0a0; color: #a0a0a0; }
.cancel-btn:hover { background: #a0a0a0; color: #000; }
.delete-btn { border-color: var(--c-danger); color: var(--c-danger); opacity: 0.7; }
.delete-btn:hover { background: var(--c-danger); color: white; opacity: 1; box-shadow: 0 0 8px rgba(231, 76, 60, 0.4); }

/* 编辑输入框 */
.edit-textarea, .edit-input {
  width: 100%; background: rgba(0, 0, 0, 0.5); border: 1px solid var(--c-gold); color: var(--c-text);
  padding: 8px; font-family: 'EB Garamond', serif; border-radius: 4px;
}
.edit-textarea { resize: vertical; min-height: 60px; }

.scroll-container { flex: 1; overflow-y: auto; padding-right: 10px; }
.info-block { margin-bottom: 25px; background: var(--c-bg-dark); padding: 20px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
.info-block h3 { color: var(--c-gold); border-left: 3px solid var(--c-gold); padding-left: 10px; margin-top: 0; font-family: var(--font-title); margin-bottom: 15px; }
.info-block h4 { color: var(--c-text-dim); margin-top: 15px; margin-bottom: 10px; font-size: 0.95rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; }

.tag { display: inline-block; background: var(--c-hover-bg); border: 1px solid var(--c-border); padding: 2px 8px; margin-right: 5px; margin-bottom: 5px; font-size: 0.9rem; color: var(--c-text-dim); }

.mt-2 { margin-top: 10px; }
.mt-4 { margin-top: 20px; }
.mb-3 { margin-bottom: 15px; }
</style>
