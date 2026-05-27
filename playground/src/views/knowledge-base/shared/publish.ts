import type { KnowledgeCampaignApi } from '#/api/knowledge/campaign';
import type { KnowledgeGoodsApi } from '#/api/knowledge/goods';
import type { KnowledgeQaApi } from '#/api/knowledge/qa';

import { Modal } from 'antdv-next';

export type PublishStatus = KnowledgeGoodsApi.GoodsStatus;

export const PUBLISH_STATUS_TAG_OPTIONS = [
  { color: 'default', label: '草稿', value: 'draft' },
  { color: 'success', label: '已上线', value: 'online' },
  { color: 'warning', label: '已下线', value: 'offline' },
] as const;

export function getGoodsPublishIssues(row: KnowledgeGoodsApi.Goods): string[] {
  const issues: string[] = [];
  if (!row.name?.trim()) {
    issues.push('商品名称');
  }
  if (!Number.isFinite(row.price) || row.price <= 0) {
    issues.push('价格');
  }
  if (!row.shelfLocation?.trim()) {
    issues.push('货架位置');
  }
  return issues;
}

export function getQaPublishIssues(row: KnowledgeQaApi.Qa): string[] {
  const issues: string[] = [];
  const question = row.question?.trim() ?? '';
  const answer = row.answer?.trim() ?? '';

  if (!question) {
    issues.push('问题');
  } else if (question.length > 200) {
    issues.push('问题（不超过 200 字）');
  }
  if (!answer) {
    issues.push('答案');
  } else if (answer.length > 1000) {
    issues.push('答案（不超过 1000 字）');
  }
  if (!row.category) {
    issues.push('分类');
  }
  return issues;
}

export function getCampaignPublishIssues(
  row: KnowledgeCampaignApi.Campaign,
): string[] {
  const issues: string[] = [];
  if (!row.name?.trim()) {
    issues.push('活动名');
  }
  if (!row.discount?.trim()) {
    issues.push('优惠内容');
  }
  if (!row.applicableGoodsIds?.length) {
    issues.push('适用商品');
  }
  if (!row.startDate || !row.endDate) {
    issues.push('有效期');
  } else if (row.endDate <= row.startDate) {
    issues.push('有效期（结束须晚于开始）');
  }

  const today = new Date().toISOString().slice(0, 10);
  if (row.endDate && row.endDate < today) {
    issues.push('活动已过期');
  }
  return issues;
}

export function getPublishTooltip(issues: string[]) {
  if (issues.length === 0) {
    return '';
  }
  return `缺失字段：${issues.join('、')}`;
}

export function showPublishBlockedModal(
  issues: string[],
  entityLabel = '记录',
) {
  Modal.warning({
    content: `无法上线该${entityLabel}，请完善以下字段后重试：\n${issues.map((item) => `· ${item}`).join('\n')}`,
    title: '上线校验未通过',
    width: 480,
  });
}
