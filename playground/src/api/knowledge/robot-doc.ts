import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace KnowledgeRobotDocApi {
  export type RobotDocCategory =
    | '企业通用知识'
    | '团队与荣誉'
    | '本站专属知识'
    | '本站基本情况';

  export type RobotDocStatus = 'draft' | 'offline' | 'online';

  export interface RobotDoc {
    category: RobotDocCategory;
    content: string;
    contentLength: number;
    id: string;
    sourceName: null | string;
    status: RobotDocStatus;
    title: string;
    updatedAt: string;
  }

  export interface RobotDocListParams extends Recordable<any> {
    category?: RobotDocCategory;
    keyword?: string;
    page: number;
    pageSize: number;
  }

  export interface RobotDocListResult {
    items: RobotDoc[];
    total: number;
  }

  export type RobotDocPayload = {
    category: RobotDocCategory;
    content: string;
    sourceName?: string;
    title: string;
  };
}

async function getRobotDocList(
  params: KnowledgeRobotDocApi.RobotDocListParams,
) {
  return requestClient.get<KnowledgeRobotDocApi.RobotDocListResult>(
    '/knowledge/robot-doc/list',
    { params },
  );
}

async function createRobotDoc(data: KnowledgeRobotDocApi.RobotDocPayload) {
  return requestClient.post<KnowledgeRobotDocApi.RobotDoc>(
    '/knowledge/robot-doc',
    data,
  );
}

async function updateRobotDoc(
  id: string,
  data: KnowledgeRobotDocApi.RobotDocPayload,
) {
  return requestClient.put<KnowledgeRobotDocApi.RobotDoc>(
    `/knowledge/robot-doc/${id}`,
    data,
  );
}

async function deleteRobotDoc(id: string) {
  return requestClient.delete(`/knowledge/robot-doc/${id}`);
}

async function publishRobotDoc(id: string) {
  return requestClient.post<KnowledgeRobotDocApi.RobotDoc>(
    `/knowledge/robot-doc/${id}/publish`,
  );
}

async function offlineRobotDoc(id: string) {
  return requestClient.post<KnowledgeRobotDocApi.RobotDoc>(
    `/knowledge/robot-doc/${id}/offline`,
  );
}

export {
  createRobotDoc,
  deleteRobotDoc,
  getRobotDocList,
  offlineRobotDoc,
  publishRobotDoc,
  updateRobotDoc,
};
