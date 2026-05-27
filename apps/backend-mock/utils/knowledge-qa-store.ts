import { formatPublishError, validateQaPublish } from './knowledge-publish';

export type QaCategory = '便利店' | '其他' | '加油机' | '卫生间' | '营业时间';

export type QaStatus = 'draft' | 'offline' | 'online';

export interface KnowledgeQa {
  answer: string;
  category: QaCategory;
  id: string;
  question: string;
  status: QaStatus;
  updatedAt: string;
}

export const QA_CATEGORIES: QaCategory[] = [
  '加油机',
  '卫生间',
  '便利店',
  '营业时间',
  '其他',
];

const formatterCN = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function formatNow() {
  return formatterCN.format(new Date());
}

const INITIAL_QA: KnowledgeQa[] = [
  {
    id: '1',
    question: '你们几点开门？',
    answer: '本站 24 小时营业，全年无休。',
    category: '营业时间',
    updatedAt: '2026/05/20 10:00:00',
    status: 'online',
  },
  {
    id: '2',
    question: '卫生间在哪里？',
    answer: '进入便利店后左转即到，设有无障碍卫生间。',
    category: '卫生间',
    updatedAt: '2026/05/21 14:30:00',
    status: 'online',
  },
  {
    id: '3',
    question: '92号汽油加油机在哪？',
    answer: '92号汽油加油机位于进站口左侧 1-4 号枪。',
    category: '加油机',
    updatedAt: '2026/05/22 09:15:00',
    status: 'online',
  },
  {
    id: '4',
    question: '便利店有热食吗？',
    answer: '便利店提供关东煮、热狗、茶叶蛋等热食，供应时间为 6:00-22:00。',
    category: '便利店',
    updatedAt: '2026/05/23 11:20:00',
    status: 'draft',
  },
  {
    id: '5',
    question: '可以开发票吗？',
    answer: '支持电子发票和纸质发票，请在加油后 30 日内到收银台或小程序申请。',
    category: '其他',
    updatedAt: '2026/05/24 16:45:00',
    status: 'online',
  },
  {
    id: '6',
    question: '95号汽油加油机在哪？',
    answer: '95号汽油加油机位于进站口右侧 5-8 号枪。',
    category: '加油机',
    updatedAt: '2026/05/25 08:30:00',
    status: 'online',
  },
  {
    id: '7',
    question: '卫生间需要刷卡吗？',
    answer: '无需刷卡，凭加油小票可免费使用卫生间。',
    category: '卫生间',
    updatedAt: '2026/05/25 10:00:00',
    status: 'offline',
  },
  {
    id: '8',
    question: '便利店支持移动支付吗？',
    answer: '支持微信、支付宝、银联及加油卡支付。',
    category: '便利店',
    updatedAt: '2026/05/26 13:10:00',
    status: 'online',
  },
  {
    id: '9',
    question: '节假日营业时间有变化吗？',
    answer:
      '法定节假日照常 24 小时营业，部分热食供应时间可能调整，以店内公告为准。',
    category: '营业时间',
    updatedAt: '2026/05/26 15:00:00',
    status: 'draft',
  },
  {
    id: '10',
    question: '柴油加油机在哪？',
    answer: '0号柴油加油机位于站区后方 9-12 号枪，请按指示牌行驶。',
    category: '加油机',
    updatedAt: '2026/05/27 09:00:00',
    status: 'online',
  },
];

let qaStore: KnowledgeQa[] = structuredClone(INITIAL_QA);

export function getQaStore() {
  return qaStore;
}

export function isValidCategory(category: string): category is QaCategory {
  return QA_CATEGORIES.includes(category as QaCategory);
}

export function createQa(payload: {
  answer: string;
  category: QaCategory;
  question: string;
}) {
  const qa: KnowledgeQa = {
    id: String(Date.now()),
    question: payload.question,
    answer: payload.answer,
    category: payload.category,
    updatedAt: formatNow(),
    status: 'draft',
  };
  qaStore = [qa, ...qaStore];
  return qa;
}

export function publishQa(id: string) {
  const index = qaStore.findIndex((item) => item.id === id);
  if (index === -1) return { error: '问答不存在', success: false as const };

  const current = qaStore[index];
  if (!current) return { error: '问答不存在', success: false as const };

  const issues = validateQaPublish(current);
  if (issues.length > 0) {
    return {
      error: formatPublishError(issues),
      issues,
      success: false as const,
    };
  }

  const online: KnowledgeQa = {
    ...current,
    status: 'online',
    updatedAt: formatNow(),
  };
  qaStore[index] = online;
  return { data: online, success: true as const };
}

export function offlineQa(id: string) {
  const index = qaStore.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const current = qaStore[index];
  if (!current) return null;

  const offline: KnowledgeQa = {
    ...current,
    status: 'offline',
    updatedAt: formatNow(),
  };
  qaStore[index] = offline;
  return offline;
}

export function updateQa(
  id: string,
  payload: {
    answer: string;
    category: QaCategory;
    question: string;
  },
) {
  const index = qaStore.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = qaStore[index];
  if (!current) return null;

  const updated: KnowledgeQa = {
    ...current,
    question: payload.question,
    answer: payload.answer,
    category: payload.category,
    updatedAt: formatNow(),
  };
  qaStore[index] = updated;
  return updated;
}

export function deleteQa(id: string) {
  const index = qaStore.findIndex((item) => item.id === id);
  if (index === -1) return false;
  qaStore = qaStore.filter((item) => item.id !== id);
  return true;
}
