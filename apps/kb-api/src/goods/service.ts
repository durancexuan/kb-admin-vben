import type { GoodsRow } from './types.js';

import { config } from '../config.js';
import {
  deleteGoodsEmbedding,
  embeddingService,
  upsertGoodsEmbedding,
} from '../embedding/embedding.service.js';
import { formatPublishError, validateGoodsPublish } from './publish.js';
import { normalizeGoodsUtterance } from './query-normalize.js';
import {
  countGoodsEmbeddings,
  createGoods,
  findGoodsById,
  findGoodsBySku,
  generateNextSku,
  listGoods,
  listOnlineGoods,
  searchGoodsByKeyword,
  searchGoodsByVector,
  setGoodsEmbedStatus,
  setGoodsStatus,
  updateGoods,
} from './repository.js';
import { toGoodsRecord } from './types.js';

export class GoodsService {
  private stationId = config.DEFAULT_STATION_ID;

  async create(payload: {
    name: string;
    navigationPoint?: string;
    price: number;
    shelfLocation: string;
    sku?: string;
    spec?: string;
  }) {
    const sku = payload.sku ?? (await generateNextSku(this.stationId));
    const row = await createGoods({
      ...payload,
      sku,
      stationId: this.stationId,
    });
    return toGoodsRecord(row);
  }

  async getNextSku() {
    return generateNextSku(this.stationId);
  }

  async list(params: { keyword?: string }) {
    const rows = await listGoods({
      keyword: params.keyword,
      stationId: this.stationId,
    });
    return rows.map((row) => toGoodsRecord(row));
  }

  async offline(id: string) {
    const row = await findGoodsById(id, this.stationId);
    if (!row) {
      return null;
    }
    await deleteGoodsEmbedding(id);
    const updated = await setGoodsStatus(id, 'offline', 'none', this.stationId);
    return updated ? toGoodsRecord(updated) : null;
  }

  async publish(id: string) {
    const row = await findGoodsById(id, this.stationId);
    if (!row) {
      return { error: '商品不存在', success: false as const };
    }

    const issues = validateGoodsPublish(row);
    if (issues.length > 0) {
      return {
        error: formatPublishError(issues),
        issues,
        success: false as const,
      };
    }

    await setGoodsStatus(id, 'online', 'pending', this.stationId);
    await this.syncEmbedding(row);

    const updated = await findGoodsById(id, this.stationId);
    if (!updated) {
      return { error: '商品不存在', success: false as const };
    }
    return { data: toGoodsRecord(updated), success: true as const };
  }

  async reindexOnline() {
    const rows = await listOnlineGoods(this.stationId);
    for (const row of rows) {
      await this.syncEmbedding(row);
    }
  }

  async retrieve(params: { topK?: number; utterance: string }) {
    const topK = params.topK ?? 5;
    const utterance = normalizeGoodsUtterance(params.utterance.trim());
    if (!utterance) {
      return { hit: false as const, items: [] };
    }

    const skuMatch = utterance.match(/SKU-\d+/i);
    if (skuMatch) {
      const exact = await findGoodsBySku(skuMatch[0], this.stationId);
      if (exact) {
        return {
          hit: true,
          items: [
            {
              confidence: 1,
              id: exact.id,
              matchType: 'exact' as const,
              name: exact.name,
              navigationPoint: exact.navigation_point,
              price: Number(exact.price),
              shelfLocation: exact.shelf_location,
              sku: exact.sku,
              spec: exact.spec,
            },
          ],
        };
      }
    }

    const keywordHits = await searchGoodsByKeyword({
      limit: topK,
      queryText: utterance,
      stationId: this.stationId,
    });

    let vectorHits: Awaited<ReturnType<typeof searchGoodsByVector>> = [];
    const embeddingCount = await countGoodsEmbeddings(this.stationId);
    if (embeddingCount > 0) {
      const queryVector = await embeddingService.embed(utterance);
      vectorHits = await searchGoodsByVector({
        limit: topK,
        stationId: this.stationId,
        vector: queryVector,
      });
    }

    const merged = new Map<
      string,
      (typeof keywordHits)[number] & {
        keywordScore: number;
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
        existing.score = mergeGoodsRetrieveScore(
          existing.keywordScore,
          item.vectorScore,
        );
      } else {
        merged.set(item.id, {
          ...item,
          keywordScore: 0,
          score: mergeGoodsRetrieveScore(0, item.vectorScore),
        });
      }
    }

    for (const item of merged.values()) {
      if (item.vectorScore === 0 && item.keywordScore > 0) {
        item.score = mergeGoodsRetrieveScore(item.keywordScore, 0);
      }
    }

    const items = [...merged.values()]
      .toSorted((a, b) => b.score - a.score)
      .slice(0, topK);

    const best = items[0];
    const hit = Boolean(best && best.score >= config.MIN_RETRIEVE_SCORE);

    return {
      hit,
      items: items.map((item) => ({
        confidence: Number(item.score.toFixed(4)),
        id: item.id,
        matchType: resolveMatchType(item.vectorScore, item.keywordScore),
        name: item.name,
        navigationPoint: item.navigationPoint,
        price: Number(item.price),
        shelfLocation: item.shelfLocation,
        sku: item.sku,
        spec: item.spec,
      })),
    };
  }

  async update(
    id: string,
    payload: {
      name: string;
      navigationPoint?: string;
      price: number;
      shelfLocation: string;
      spec?: string;
    },
  ) {
    const existing = await findGoodsById(id, this.stationId);
    if (!existing) {
      return null;
    }

    const row = await updateGoods(id, {
      ...payload,
      stationId: this.stationId,
    });
    if (!row) {
      return null;
    }

    if (row.status === 'online') {
      await this.syncEmbedding(row);
    }

    return toGoodsRecord(row);
  }

  private async syncEmbedding(row: GoodsRow) {
    try {
      await upsertGoodsEmbedding(row);
      await setGoodsEmbedStatus(row.id, 'ok', this.stationId);
    } catch {
      await setGoodsEmbedStatus(row.id, 'failed', this.stationId);
    }
  }
}

function mergeGoodsRetrieveScore(keywordScore: number, vectorScore: number) {
  const strongKeyword = keywordScore >= 0.75;

  if (vectorScore > 0 && keywordScore > 0) {
    return strongKeyword
      ? keywordScore * 0.7 + vectorScore * 0.3
      : keywordScore * 0.35 + vectorScore * 0.65;
  }
  if (vectorScore > 0) {
    return vectorScore * 0.65;
  }
  if (keywordScore > 0) {
    return strongKeyword ? keywordScore : keywordScore * 0.35;
  }
  return 0;
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

export const goodsService = new GoodsService();
