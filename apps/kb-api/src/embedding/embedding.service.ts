import type { GoodsRow } from '../goods/types.js';
import type { QaCategory } from '../qa/types.js';

import { config, hasExternalEmbedding } from '../config.js';
import { query } from '../db/pool.js';
import { buildGoodsEmbedText } from '../goods/publish.js';
import { buildEmbedText } from '../qa/publish.js';

export class EmbeddingService {
  async embed(text: string): Promise<number[]> {
    if (hasExternalEmbedding()) {
      return this.embedExternal(text);
    }
    return this.embedLocal(text);
  }

  toPgVector(vector: number[]) {
    return `[${vector.join(',')}]`;
  }

  private bump(vec: number[], index: number, delta: number) {
    const slot = ((index % vec.length) + vec.length) % vec.length;
    vec[slot] = (vec[slot] ?? 0) + delta;
  }

  private async embedExternal(text: string): Promise<number[]> {
    const apiUrl = config.EMBEDDING_API_URL;
    if (!apiUrl) {
      throw new Error('EMBEDDING_API_URL is not configured');
    }
    const response = await fetch(apiUrl, {
      body: JSON.stringify({
        input: text,
        model: config.EMBEDDING_API_MODEL,
      }),
      headers: {
        Authorization: `Bearer ${config.EMBEDDING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Embedding API failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };
    const vector = payload.data[0]?.embedding;
    if (!vector?.length) {
      throw new Error('Embedding API returned empty vector');
    }
    return this.normalize(this.resize(vector, config.EMBEDDING_DIM));
  }

  /** 本地可离线运行的字符哈希向量，开发联调够用；生产请配置外部 Embedding API */
  private embedLocal(text: string): number[] {
    const dim = config.EMBEDDING_DIM;
    const vec = Array.from({ length: dim }, () => 0);

    for (let i = 0; i < text.length; ) {
      const code = text.codePointAt(i) ?? 0;
      i += code > 65_536 ? 2 : 1;
      this.bump(vec, code % dim, 1);
      this.bump(vec, (code * 31 + i) % dim, 0.5);
      this.bump(vec, (code * 17 + i * 7) % dim, 0.25);
    }

    return this.normalize(vec);
  }

  private normalize(vector: number[]) {
    const norm = Math.hypot(...vector);
    if (!norm) {
      return vector;
    }
    return vector.map((value) => value / norm);
  }

  private resize(vector: number[], dim: number) {
    if (vector.length === dim) {
      return vector;
    }
    if (vector.length > dim) {
      return vector.slice(0, dim);
    }
    return [...vector, ...Array.from({ length: dim - vector.length }, () => 0)];
  }
}

export const embeddingService = new EmbeddingService();

export async function upsertQaEmbedding(qa: {
  answer: string;
  category: QaCategory;
  id: string;
  question: string;
  stationId: string;
}) {
  const embedText = buildEmbedText(qa);
  const vector = await embeddingService.embed(embedText);

  await query(
    `INSERT INTO kb_qa_embedding (qa_id, station_id, embedding, embed_text, model_id, updated_at)
     VALUES ($1, $2, $3::vector, $4, $5, now())
     ON CONFLICT (qa_id) DO UPDATE SET
       station_id = EXCLUDED.station_id,
       embedding = EXCLUDED.embedding,
       embed_text = EXCLUDED.embed_text,
       model_id = EXCLUDED.model_id,
       updated_at = now()`,
    [
      qa.id,
      qa.stationId,
      embeddingService.toPgVector(vector),
      embedText,
      hasExternalEmbedding()
        ? config.EMBEDDING_API_MODEL
        : config.EMBEDDING_MODEL,
    ],
  );
}

export async function deleteQaEmbedding(qaId: string) {
  await query('DELETE FROM kb_qa_embedding WHERE qa_id = $1', [qaId]);
}

export async function upsertGoodsEmbedding(goods: GoodsRow) {
  const embedText = buildGoodsEmbedText(goods);
  const vector = await embeddingService.embed(embedText);

  await query(
    `INSERT INTO kb_goods_embedding (goods_id, station_id, embedding, embed_text, model_id, updated_at)
     VALUES ($1, $2, $3::vector, $4, $5, now())
     ON CONFLICT (goods_id) DO UPDATE SET
       station_id = EXCLUDED.station_id,
       embedding = EXCLUDED.embedding,
       embed_text = EXCLUDED.embed_text,
       model_id = EXCLUDED.model_id,
       updated_at = now()`,
    [
      goods.id,
      goods.station_id,
      embeddingService.toPgVector(vector),
      embedText,
      hasExternalEmbedding()
        ? config.EMBEDDING_API_MODEL
        : config.EMBEDDING_MODEL,
    ],
  );
}

export async function deleteGoodsEmbedding(goodsId: string) {
  await query('DELETE FROM kb_goods_embedding WHERE goods_id = $1', [goodsId]);
}
