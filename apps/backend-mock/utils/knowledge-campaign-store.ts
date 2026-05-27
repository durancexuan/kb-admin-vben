import { getGoodsStore } from './knowledge-goods-store';
import {
  formatPublishError,
  validateCampaignPublish,
} from './knowledge-publish';

export type CampaignStatus = 'draft' | 'offline' | 'online';

export interface KnowledgeCampaign {
  applicableGoodsIds: string[];
  discount: string;
  endDate: string;
  id: string;
  name: string;
  startDate: string;
  status: CampaignStatus;
}

function resolveGoodsNames(ids: string[]) {
  const goods = getGoodsStore();
  return ids
    .map((id) => goods.find((item) => item.id === id)?.name)
    .filter(Boolean)
    .join(', ');
}

const INITIAL_CAMPAIGNS: KnowledgeCampaign[] = [
  {
    id: '1',
    name: '夏日加油满减',
    applicableGoodsIds: ['1', '2'],
    discount: '满 200 减 10',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    status: 'online',
  },
  {
    id: '2',
    name: '便利店买一送一',
    applicableGoodsIds: ['5'],
    discount: '买一送一',
    startDate: '2026-05-25',
    endDate: '2026-05-31',
    status: 'online',
  },
  {
    id: '3',
    name: '周末柴油特惠',
    applicableGoodsIds: ['4'],
    discount: '每升优惠 0.3 元',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    status: 'offline',
  },
  {
    id: '4',
    name: '热食套餐折扣',
    applicableGoodsIds: ['16', '17'],
    discount: '第二份半价',
    startDate: '2026-05-20',
    endDate: '2026-06-20',
    status: 'online',
  },
  {
    id: '5',
    name: '玻璃水加购优惠',
    applicableGoodsIds: ['10'],
    discount: '加购机油享 8 折',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    status: 'offline',
  },
];

let campaignStore: KnowledgeCampaign[] = structuredClone(INITIAL_CAMPAIGNS);

export function getCampaignStore() {
  return campaignStore;
}

export function formatCampaignForList(campaign: KnowledgeCampaign) {
  return {
    ...campaign,
    applicableGoods: resolveGoodsNames(campaign.applicableGoodsIds),
  };
}

export function getGoodsOptions() {
  return getGoodsStore().map((item) => ({
    label: item.name,
    value: item.id,
  }));
}

function validateDates(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return '请选择有效期';
  }
  if (endDate <= startDate) {
    return '结束时间必须晚于开始时间';
  }
  return null;
}

function validateGoodsIds(ids: string[] | undefined) {
  if (!ids?.length) {
    return '请至少选择一个适用商品';
  }
  const goods = getGoodsStore();
  const invalid = ids.some((id) => !goods.some((item) => item.id === id));
  if (invalid) {
    return '适用商品不存在';
  }
  return null;
}

export function createCampaign(payload: {
  applicableGoodsIds: string[];
  discount: string;
  endDate: string;
  name: string;
  startDate: string;
  status?: CampaignStatus;
}) {
  const dateError = validateDates(payload.startDate, payload.endDate);
  if (dateError) throw new Error(dateError);
  const goodsError = validateGoodsIds(payload.applicableGoodsIds);
  if (goodsError) throw new Error(goodsError);

  const campaign: KnowledgeCampaign = {
    id: String(Date.now()),
    name: payload.name.trim(),
    applicableGoodsIds: payload.applicableGoodsIds,
    discount: payload.discount.trim(),
    startDate: payload.startDate,
    endDate: payload.endDate,
    status: payload.status ?? 'draft',
  };
  campaignStore = [campaign, ...campaignStore];
  return campaign;
}

export function updateCampaign(
  id: string,
  payload: Partial<{
    applicableGoodsIds: string[];
    discount: string;
    endDate: string;
    name: string;
    startDate: string;
    status: CampaignStatus;
  }>,
) {
  const index = campaignStore.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = campaignStore[index];
  if (!current) return null;

  const updated: KnowledgeCampaign = {
    ...current,
    ...payload,
    id: current.id,
  };

  const dateError = validateDates(updated.startDate, updated.endDate);
  if (dateError) throw new Error(dateError);
  const goodsError = validateGoodsIds(updated.applicableGoodsIds);
  if (goodsError) throw new Error(goodsError);

  campaignStore[index] = updated;
  return updated;
}

export function publishCampaign(id: string) {
  const index = campaignStore.findIndex((item) => item.id === id);
  if (index === -1) return { error: '活动不存在', success: false as const };

  const current = campaignStore[index];
  if (!current) return { error: '活动不存在', success: false as const };

  const issues = validateCampaignPublish(current);
  if (issues.length > 0) {
    return {
      error: formatPublishError(issues),
      issues,
      success: false as const,
    };
  }

  const online: KnowledgeCampaign = { ...current, status: 'online' };
  campaignStore[index] = online;
  return { data: online, success: true as const };
}

export function offlineCampaign(id: string) {
  const index = campaignStore.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const current = campaignStore[index];
  if (!current) return null;

  const offline: KnowledgeCampaign = { ...current, status: 'offline' };
  campaignStore[index] = offline;
  return offline;
}

export function deleteCampaign(id: string) {
  const index = campaignStore.findIndex((item) => item.id === id);
  if (index === -1) return false;
  campaignStore = campaignStore.filter((item) => item.id !== id);
  return true;
}
