import { createMemoryHistory, createRouter } from 'vue-router';
import Layout from '../view/layout.vue';
import optionView from '@/哥杀/UI/view/选项.vue'
import playerView from '@/哥杀/UI/view/主角.vue'
import relationView from '@/哥杀/UI/view/关系角色.vue'
import petView from '@/哥杀/UI/view/宠物.vue'
import EnemyView from '@/哥杀/UI/view/敌人.vue'
import ItemView from '@/哥杀/UI/view/背包.vue'

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/选项',
      children: [
        { path: '选项', component: optionView },
        { path: '主角', component: playerView },
        { path: '关系角色', component: relationView },
        { path: '宠物', component: petView },
        { path: '敌人', component: EnemyView },
        { path: '背包', component: ItemView },
        // { path: '任务', component: RenWu },
        // { path: '仓库', component: CangKu },
        // { path: '商店', component: ShangDian },
        // { path: '世界情报', component: ShiJieQingBao },
        // { path: '图片', component: TuPian },
        // { path: '设置', component: SheZhi },
        // { path: '开场设置', component: KaiChang },
        // { path: '人物创建', component: RenWuChuangJian },
        // { path: '图书馆', component: TuShuGuan },
        // { path: '技能库', component: JiNengKu },
        // { path: '总结', component: ZongJie }
      ],
    },
  ],
});
