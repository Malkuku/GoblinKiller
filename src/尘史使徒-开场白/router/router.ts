import { createMemoryHistory, createRouter } from 'vue-router';
import Layout from '../view/layout.vue';

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/封面',
      children: [
        {
          path: '/封面',
          name: '封面',
          component: () => import('../view/封面.vue'),
          meta: { index: 0 }
        },
        {
          path: '/漫宿',
          name: '漫宿',
          component: () => import('../view/漫宿.vue'),
          meta: { index: 1 }
        },
        {
          path: '/八大准则',
          name: '八大准则',
          component: () => import('../view/八大准则.vue'),
          meta: { index: 2 }
        },
        {
          path: '/王国与人种',
          name: '王国与人种',
          component: () => import('../view/王国与人种.vue'),
          meta: { index: 3 }
        },
        {
          path: '/流亡之人',
          name: '流亡之人',
          component: () => import('../view/流亡之人.vue'),
          meta: { index: 4 }
        },
        {
          path: '/开始游戏',
          name: '开始游戏',
          component: () => import('../view/开始游戏.vue'),
          meta: { index: 5 }
        },
      ],
    },
  ],
});
