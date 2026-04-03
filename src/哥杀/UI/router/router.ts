import { createMemoryHistory, createRouter } from 'vue-router';
import Layout from '../view/layout.vue';
import optionView from '@/哥杀/UI/view/选项.vue'
import playerView from '@/哥杀/UI/view/主角.vue'
import relationView from '@/哥杀/UI/components/role/RelationCharacterProfile.vue'

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
