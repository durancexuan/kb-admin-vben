import type { RobotDocCategory } from './types.js';

import { config } from '../config.js';
import {
  removeFromUnifiedIndex,
  syncRobotDocToUnifiedIndex,
} from '../unified-index/sync.js';
import {
  formatPublishError,
  splitDocIntoChunks,
  validateRobotDocPublish,
} from './publish.js';
import {
  createRobotDoc,
  deleteRobotDoc,
  findRobotDocById,
  listRobotDocChunks,
  listRobotDocs,
  replaceRobotDocChunks,
  setRobotDocEmbedStatus,
  setRobotDocStatus,
  updateRobotDoc,
} from './repository.js';
import { toRobotDocRecord } from './types.js';

export class RobotDocService {
  private stationId = config.DEFAULT_STATION_ID;

  async create(payload: {
    category: RobotDocCategory;
    content: string;
    sourceName?: string;
    title: string;
  }) {
    const row = await createRobotDoc({
      ...payload,
      stationId: this.stationId,
    });
    if (!row) {
      throw new Error('Failed to create robot doc');
    }
    return toRobotDocRecord(row);
  }

  async list(params: { category?: RobotDocCategory; keyword?: string }) {
    const rows = await listRobotDocs({
      category: params.category,
      keyword: params.keyword,
      stationId: this.stationId,
    });
    return rows.map((row) => toRobotDocRecord(row));
  }

  async offline(id: string) {
    const row = await findRobotDocById(id, this.stationId);
    if (!row) {
      return null;
    }
    await removeFromUnifiedIndex('robot-doc', id, this.stationId);
    const updated = await setRobotDocStatus(
      id,
      this.stationId,
      'offline',
      'none',
    );
    return updated ? toRobotDocRecord(updated) : null;
  }

  async publish(id: string) {
    const row = await findRobotDocById(id, this.stationId);
    if (!row) {
      return { error: '文档不存在', success: false as const };
    }

    const issues = validateRobotDocPublish(row);
    if (issues.length > 0) {
      return {
        error: formatPublishError(issues),
        issues,
        success: false as const,
      };
    }

    await setRobotDocStatus(id, this.stationId, 'online', 'pending');
    await this.syncUnifiedIndex(id);

    const updated = await findRobotDocById(id, this.stationId);
    if (!updated) {
      return { error: '文档不存在', success: false as const };
    }
    return { data: toRobotDocRecord(updated), success: true as const };
  }

  async reindexOnline() {
    const rows = await listRobotDocs({ stationId: this.stationId });
    for (const row of rows.filter((item) => item.status === 'online')) {
      await this.syncUnifiedIndex(row.id);
    }
  }

  async remove(id: string) {
    await removeFromUnifiedIndex('robot-doc', id, this.stationId);
    return deleteRobotDoc(id, this.stationId);
  }

  async syncUnifiedIndex(id: string) {
    const row = await findRobotDocById(id, this.stationId);
    if (!row) {
      return;
    }

    try {
      const drafts = splitDocIntoChunks(row.title, row.content);
      await replaceRobotDocChunks(
        row.id,
        drafts.map((chunk) => ({
          body: chunk.body,
          chunkIndex: chunk.chunkIndex,
          heading: chunk.heading,
        })),
      );
      const chunks = await listRobotDocChunks(row.id);
      await syncRobotDocToUnifiedIndex(row, chunks, this.stationId);
      await setRobotDocEmbedStatus(row.id, this.stationId, 'ok');
    } catch (error) {
      console.error('[robot-doc] sync unified index failed', error);
      await setRobotDocEmbedStatus(row.id, this.stationId, 'failed');
      throw error;
    }
  }

  async update(
    id: string,
    payload: {
      category: RobotDocCategory;
      content: string;
      sourceName?: string;
      title: string;
    },
  ) {
    const row = await updateRobotDoc(id, this.stationId, payload);
    if (!row) {
      return null;
    }
    if (row.status === 'online') {
      await this.syncUnifiedIndex(id);
    }
    return toRobotDocRecord(row);
  }
}

export const robotDocService = new RobotDocService();
