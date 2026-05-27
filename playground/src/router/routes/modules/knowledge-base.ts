import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'KnowledgeGoods',
    path: '/knowledge/goods',
    component: () => import('#/views/knowledge-base/goods/index.vue'),
    meta: {
      icon: 'mdi:package-variant-closed',
      order: 10,
      title: '商品全维库',
    },
  },
  {
    name: 'KnowledgeQa',
    path: '/knowledge/qa',
    component: () => import('#/views/knowledge-base/qa/index.vue'),
    meta: {
      icon: 'mdi:comment-question-outline',
      order: 11,
      title: '站级问答库',
    },
  },
  {
    name: 'KnowledgeCampaign',
    path: '/knowledge/campaign',
    component: () => import('#/views/knowledge-base/campaign/index.vue'),
    meta: {
      icon: 'mdi:bullhorn-outline',
      order: 12,
      title: '营销活动库',
    },
  },
];

export default routes;
