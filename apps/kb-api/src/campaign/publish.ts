import type { CampaignRow } from './types.js';

export function validateCampaignPublish(
  campaign: Pick<
    CampaignRow,
    'discount' | 'end_date' | 'name' | 'start_date'
  > & { applicableGoodsIds: string[] },
) {
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
  if (!campaign.start_date || !campaign.end_date) {
    issues.push('有效期');
  } else if (formatDate(campaign.end_date) <= formatDate(campaign.start_date)) {
    issues.push('有效期（结束须晚于开始）');
  }

  const today = new Date().toISOString().slice(0, 10);
  if (campaign.end_date && formatDate(campaign.end_date) < today) {
    issues.push('活动已过期');
  }
  return issues;
}

export function formatPublishError(issues: string[]) {
  return `缺少或不符合要求的字段：${issues.join('、')}`;
}

function formatDate(value: Date | string) {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export function validateCampaignPayload(body: {
  applicableGoodsIds?: string[];
  discount?: string;
  endDate?: string;
  name?: string;
  startDate?: string;
}) {
  const name = body.name?.trim();
  const discount = body.discount?.trim();
  const startDate = body.startDate;
  const endDate = body.endDate;
  const applicableGoodsIds = body.applicableGoodsIds;

  if (!name) {
    return '活动名不能为空';
  }
  if (!discount) {
    return '优惠内容不能为空';
  }
  if (!startDate || !endDate) {
    return '请选择有效期';
  }
  if (endDate <= startDate) {
    return '结束时间必须晚于开始时间';
  }
  if (!applicableGoodsIds?.length) {
    return '请至少选择一个适用商品';
  }
  return null;
}

export function buildCampaignSpeakReply(campaign: {
  applicableGoods: string;
  discount: string;
  name: string;
}) {
  const goods = campaign.applicableGoods
    ? `，适用商品：${campaign.applicableGoods}`
    : '';
  return `当前活动「${campaign.name}」，${campaign.discount}${goods}。`;
}

/** 活动汇总：按开始时间由晚到早，最多播报 limit 条 */
export function buildCampaignRecentSpeakReply(
  campaigns: Array<{
    applicableGoods: string;
    discount: string;
    name: string;
    startDate: string;
  }>,
  limit: number,
) {
  if (campaigns.length === 0) {
    return '近期暂无进行中的优惠活动，欢迎常来看看。';
  }

  const recent = campaigns.slice(0, limit);
  const parts = recent.map((item, index) => {
    const goods = item.applicableGoods ? `，适用：${item.applicableGoods}` : '';
    return `${index + 1}、「${item.name}」${item.discount}（${item.startDate} 起）${goods}`;
  });

  return `按开始时间由晚到早，近期 ${recent.length} 条活动：${parts.join('；')}。`;
}
