import type { KnowledgeCampaign } from './knowledge-campaign-store';
import type { KnowledgeGoods } from './knowledge-goods-store';
import type { KnowledgeQa } from './knowledge-qa-store';

export type PublishStatus = 'draft' | 'offline' | 'online';

export function validateGoodsPublish(goods: KnowledgeGoods): string[] {
  const issues: string[] = [];
  if (!goods.name?.trim()) {
    issues.push('商品名称');
  }
  if (!Number.isFinite(goods.price) || goods.price <= 0) {
    issues.push('价格');
  }
  if (!goods.shelfLocation?.trim()) {
    issues.push('货架位置');
  }
  return issues;
}

export function validateQaPublish(qa: KnowledgeQa): string[] {
  const issues: string[] = [];
  const question = qa.question?.trim() ?? '';
  const answer = qa.answer?.trim() ?? '';

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
  if (!qa.category) {
    issues.push('分类');
  }
  return issues;
}

export function validateCampaignPublish(campaign: KnowledgeCampaign): string[] {
  const issues: string[] = [];
  if (!campaign.name?.trim()) {
    issues.push('活动名');
  }
  if (!campaign.discount?.trim()) {
    issues.push('优惠内容');
  }
  if (!campaign.applicableGoodsIds?.length) {
    issues.push('适用商品');
  }
  if (!campaign.startDate || !campaign.endDate) {
    issues.push('有效期');
  } else if (campaign.endDate <= campaign.startDate) {
    issues.push('有效期（结束须晚于开始）');
  }

  const today = new Date().toISOString().slice(0, 10);
  if (campaign.endDate && campaign.endDate < today) {
    issues.push('活动已过期');
  }
  return issues;
}

export function formatPublishError(issues: string[]) {
  return `缺少或不符合要求的字段：${issues.join('、')}`;
}
