import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace KnowledgeCampaignApi {
  export type CampaignStatus = 'draft' | 'offline' | 'online';

  export interface Campaign {
    applicableGoods: string;
    applicableGoodsIds: string[];
    discount: string;
    endDate: string;
    id: string;
    name: string;
    startDate: string;
    status: CampaignStatus;
  }

  export interface CampaignListParams extends Recordable<any> {
    keyword?: string;
    page: number;
    pageSize: number;
  }

  export interface CampaignListResult {
    items: Campaign[];
    total: number;
  }

  export interface GoodsOption {
    label: string;
    value: string;
  }

  export type CampaignPayload = Pick<
    Campaign,
    'applicableGoodsIds' | 'discount' | 'endDate' | 'name' | 'startDate'
  >;
}

async function getCampaignList(
  params: KnowledgeCampaignApi.CampaignListParams,
) {
  return requestClient.get<KnowledgeCampaignApi.CampaignListResult>(
    '/knowledge/campaign/list',
    { params },
  );
}

async function getCampaignGoodsOptions() {
  return requestClient.get<KnowledgeCampaignApi.GoodsOption[]>(
    '/knowledge/campaign/goods-options',
  );
}

async function createCampaign(data: KnowledgeCampaignApi.CampaignPayload) {
  return requestClient.post<KnowledgeCampaignApi.Campaign>(
    '/knowledge/campaign',
    data,
  );
}

async function updateCampaign(
  id: string,
  data: KnowledgeCampaignApi.CampaignPayload,
) {
  return requestClient.put<KnowledgeCampaignApi.Campaign>(
    `/knowledge/campaign/${id}`,
    data,
  );
}

async function publishCampaign(id: string) {
  return requestClient.post<KnowledgeCampaignApi.Campaign>(
    `/knowledge/campaign/${id}/publish`,
  );
}

async function offlineCampaign(id: string) {
  return requestClient.post<KnowledgeCampaignApi.Campaign>(
    `/knowledge/campaign/${id}/offline`,
  );
}

async function deleteCampaign(id: string) {
  return requestClient.delete(`/knowledge/campaign/${id}`);
}

export {
  createCampaign,
  deleteCampaign,
  getCampaignGoodsOptions,
  getCampaignList,
  offlineCampaign,
  publishCampaign,
  updateCampaign,
};
