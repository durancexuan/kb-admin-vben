import type { QaCategory, QaRecord } from './types.js';

import { config } from '../config.js';
import {
  deleteQaEmbedding,
  embeddingService,
  upsertQaEmbedding,
} from '../embedding/embedding.service.js';
import { formatPublishError, validateQaPublish } from './publish.js';
import {
  countEmbeddings,
  createQa,
  deleteQa,
  findQaById,
  listQa,
  searchQaByKeyword,
  searchQaByVector,
  setEmbedStatus,
  setQaStatus,
  updateQa,
} from './repository.js';
import { toQaRecord } from './types.js';

export class QaService {
  private stationId = config.DEFAULT_STATION_ID;

  async create(payload: {
    answer: string;
    category: QaCategory;
    question: string;
  }): Promise<QaRecord> {
    const row = await createQa({
      ...payload,
      stationId: this.stationId,
    });
    return toQaRecord(row);
  }

  async list(params: { category?: QaCategory; keyword?: string }) {
    const rows = await listQa({
      category: params.category,
      keyword: params.keyword,
      stationId: this.stationId,
    });
    return rows.map((row) => toQaRecord(row));
  }

  async offline(id: string) {
    const row = await findQaById(id, this.stationId);
    if (!row) {
      return null;
    }

    await deleteQaEmbedding(id);
    const updated = await setQaStatus(id, 'offline', 'none', this.stationId);
    return updated ? toQaRecord(updated) : null;
  }

  async publish(id: string) {
    const row = await findQaById(id, this.stationId);
    if (!row) {
      return { error: '问答不存在', success: false as const };
    }

    const issues = validateQaPublish(row);
    if (issues.length > 0) {
      return {
        error: formatPublishError(issues),
        issues,
        success: false as const,
      };
    }

    await setQaStatus(id, 'online', 'pending', this.stationId);
    await this.syncEmbedding(row);

    const updated = await findQaById(id, this.stationId);
    if (!updated) {
      return { error: '问答不存在', success: false as const };
    }
    return { data: toQaRecord(updated), success: true as const };
  }

  async reindexOnline() {
    const rows = await listQa({ stationId: this.stationId });
    for (const row of rows.filter((item) => item.status === 'online')) {
      await this.syncEmbedding(row);
    }
  }

  async remove(id: string) {
    return deleteQa(id, this.stationId);
  }

  async retrieve(params: {
    category?: QaCategory;
    topK?: number;
    utterance: string;
  }) {
    const topK = params.topK ?? 5;
    const utterance = params.utterance.trim();
    if (!utterance) {
      return { hit: false as const, items: [] };
    }

    const keywordHits = await searchQaByKeyword({
      category: params.category,
      limit: topK,
      queryText: utterance,
      stationId: this.stationId,
    });

    let vectorHits: Awaited<ReturnType<typeof searchQaByVector>> = [];
    const embeddingCount = await countEmbeddings(this.stationId);
    if (embeddingCount > 0) {
      const queryVector = await embeddingService.embed(utterance);
      vectorHits = await searchQaByVector({
        category: params.category,
        limit: topK,
        stationId: this.stationId,
        vector: queryVector,
      });
    }

    const merged = new Map<
      string,
      {
        answer: string;
        category: QaCategory;
        id: string;
        keywordScore: number;
        question: string;
        score: number;
        vectorScore: number;
      }
    >();

    for (const item of keywordHits) {
      merged.set(item.id, item);
    }

    for (const item of vectorHits) {
      const existing = merged.get(item.id);
      if (existing) {
        existing.vectorScore = item.vectorScore;
        existing.score = existing.keywordScore * 0.35 + item.vectorScore * 0.65;
      } else {
        merged.set(item.id, {
          ...item,
          keywordScore: 0,
          score: item.vectorScore * 0.65,
        });
      }
    }

    for (const item of merged.values()) {
      if (item.vectorScore === 0 && item.keywordScore > 0) {
        item.score = item.keywordScore * 0.35;
      }
    }

    const items = [...merged.values()]
      .toSorted((a, b) => b.score - a.score)
      .slice(0, topK);

    const best = items[0];
    const hit = Boolean(best && best.score >= config.MIN_RETRIEVE_SCORE);

    return {
      hit,
      items: items.map((item) => {
        const matchType = resolveMatchType(item.vectorScore, item.keywordScore);
        return {
          answer: item.answer,
          category: item.category,
          confidence: Number(item.score.toFixed(4)),
          id: item.id,
          matchType,
          question: item.question,
          vectorConfidence:
            item.vectorScore > 0
              ? Number(item.vectorScore.toFixed(4))
              : undefined,
        };
      }),
    };
  }

  async update(
    id: string,
    payload: {
      answer: string;
      category: QaCategory;
      question: string;
    },
  ) {
    const existing = await findQaById(id, this.stationId);
    if (!existing) {
      return null;
    }

    const row = await updateQa(id, {
      ...payload,
      stationId: this.stationId,
    });
    if (!row) {
      return null;
    }

    if (row.status === 'online') {
      await this.syncEmbedding(row);
    }

    return toQaRecord(row);
  }

  private async syncEmbedding(row: {
    answer: string;
    category: QaCategory;
    id: string;
    question: string;
    station_id: string;
  }) {
    try {
      await upsertQaEmbedding({
        answer: row.answer,
        category: row.category,
        id: row.id,
        question: row.question,
        stationId: row.station_id,
      });
      await setEmbedStatus(row.id, 'ok', this.stationId);
    } catch {
      await setEmbedStatus(row.id, 'failed', this.stationId);
    }
  }
}

function resolveMatchType(vectorScore: number, keywordScore: number) {
  if (vectorScore > 0 && keywordScore > 0) {
    return 'hybrid' as const;
  }
  if (vectorScore > 0) {
    return 'vector' as const;
  }
  return 'keyword' as const;
}

export const qaService = new QaService();
