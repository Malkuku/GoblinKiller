import { createMemoryHistory, createRouter } from 'vue-router';
import Layout from '../view/layout.vue';
import XuanXiang from '../view/选项.vue';

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/选项',
      children: [
        { path: '选项', component: XuanXiang },
        // { path: '世界信息', component: ShiJieXinXi },
        // { path: '角色', component: JueSe },
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
