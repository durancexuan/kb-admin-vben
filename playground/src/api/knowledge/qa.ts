import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace KnowledgeQaApi {
  export type QaCategory = '便利店' | '其他' | '加油机' | '卫生间' | '营业时间';

  export type QaStatus = 'draft' | 'offline' | 'online';

  export interface Qa {
    answer: string;
    category: QaCategory;
    id: string;
    question: string;
    status: QaStatus;
    updatedAt: string;
  }

  export interface QaListParams extends Recordable<any> {
    category?: QaCategory;
    keyword?: string;
    page: number;
    pageSize: number;
  }

  export interface QaListResult {
    items: Qa[];
    total: number;
  }

  export type QaPayload = Pick<Qa, 'answer' | 'category' | 'question'>;
}

async function getQaList(params: KnowledgeQaApi.QaListParams) {
  return requestClient.get<KnowledgeQaApi.QaListResult>('/knowledge/qa/list', {
    params,
  });
}

async function createQa(data: KnowledgeQaApi.QaPayload) {
  return requestClient.post<KnowledgeQaApi.Qa>('/knowledge/qa', data);
}

async function updateQa(id: string, data: KnowledgeQaApi.QaPayload) {
  return requestClient.put<KnowledgeQaApi.Qa>(`/knowledge/qa/${id}`, data);
}

async function deleteQa(id: string) {
  return requestClient.delete(`/knowledge/qa/${id}`);
}

async function publishQa(id: string) {
  return requestClient.post<KnowledgeQaApi.Qa>(`/knowledge/qa/${id}/publish`);
}

async function offlineQa(id: string) {
  return requestClient.post<KnowledgeQaApi.Qa>(`/knowledge/qa/${id}/offline`);
}

export { createQa, deleteQa, getQaList, offlineQa, publishQa, updateQa };
