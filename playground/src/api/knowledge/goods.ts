import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace KnowledgeGoodsApi {
  export type GoodsStatus = 'draft' | 'offline' | 'online';

  export interface Goods {
    id: string;
    name: string;
    navigationPoint?: string;
    price: number;
    semanticTags?: string[];
    shelfLocation: string;
    sku: string;
    spec?: string;
    status: GoodsStatus;
  }

  export interface GoodsListParams extends Recordable<any> {
    keyword?: string;
    page: number;
    pageSize: number;
  }

  export interface GoodsListResult {
    items: Goods[];
    total: number;
  }

  export type GoodsPayload = Pick<
    Goods,
    | 'name'
    | 'navigationPoint'
    | 'price'
    | 'semanticTags'
    | 'shelfLocation'
    | 'sku'
    | 'spec'
  >;
}

async function getGoodsList(params: KnowledgeGoodsApi.GoodsListParams) {
  return requestClient.get<KnowledgeGoodsApi.GoodsListResult>(
    '/knowledge/goods/list',
    { params },
  );
}

async function getNextGoodsSku() {
  return requestClient.get<{ sku: string }>('/knowledge/goods/next-sku');
}

async function createGoods(data: KnowledgeGoodsApi.GoodsPayload) {
  return requestClient.post<KnowledgeGoodsApi.Goods>('/knowledge/goods', data);
}

async function updateGoods(id: string, data: KnowledgeGoodsApi.GoodsPayload) {
  return requestClient.put<KnowledgeGoodsApi.Goods>(
    `/knowledge/goods/${id}`,
    data,
  );
}

async function publishGoods(id: string) {
  return requestClient.post<KnowledgeGoodsApi.Goods>(
    `/knowledge/goods/${id}/publish`,
  );
}

async function offlineGoods(id: string) {
  return requestClient.post<KnowledgeGoodsApi.Goods>(
    `/knowledge/goods/${id}/offline`,
  );
}

export {
  createGoods,
  getGoodsList,
  getNextGoodsSku,
  offlineGoods,
  publishGoods,
  updateGoods,
};
