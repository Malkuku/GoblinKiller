import { createMemoryHistory, createRouter } from 'vue-router';
import Layout from '../view/layout.vue';

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/选项',
      children: [
        {
          path: '选项',
          component: () => import('../view/选项.vue'),
        },
        {
          path: '世界信息',
          component: () => import('../view/世界信息.vue'),
        },
        {
          path: '角色',
          component: () => import('../view/角色.vue'),
        },
        {
          path: '任务',
          component: () => import('../view/任务.vue'),
        },
        {
          path: '商店',
          component: () => import('../view/商店.vue'),
        },
        {
          path: '图片',
          component: () => import('../view/图片展示.vue'),
        },
        {
          path: '设置',
          component: () => import('../view/设置.vue'),
        },
      ],
    },
  ],
});
