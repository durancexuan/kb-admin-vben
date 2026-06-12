import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'KnowledgeGoods',
    path: '/knowledge/goods',
    component: () => import('#/views/knowledge-base/goods/index.vue'),
    meta: {
      icon: 'mdi:package-variant-closed',
      order: 1,
      title: '商品全维库',
    },
  },
  {
    name: 'KnowledgeQa',
    path: '/knowledge/qa',
    component: () => import('#/views/knowledge-base/qa/index.vue'),
    meta: {
      icon: 'mdi:comment-question-outline',
      order: 2,
      title: '站级问答库',
    },
  },
  {
    name: 'KnowledgeCampaign',
    path: '/knowledge/campaign',
    component: () => import('#/views/knowledge-base/campaign/index.vue'),
    meta: {
      icon: 'mdi:bullhorn-outline',
      order: 3,
      title: '营销活动库',
    },
  },
  {
    name: 'KnowledgeRobotDoc',
    path: '/knowledge/robot-doc',
    component: () => import('#/views/knowledge-base/robot-doc/index.vue'),
    meta: {
      icon: 'mdi:robot-outline',
      order: 4,
      title: '机器人专属知识库',
    },
  },
  {
    name: 'Profile',
    path: '/profile',
    component: () => import('#/views/_core/profile/index.vue'),
    meta: {
      hideInMenu: true,
      icon: 'lucide:user',
      title: '个人中心',
    },
  },
];

export default routes;
