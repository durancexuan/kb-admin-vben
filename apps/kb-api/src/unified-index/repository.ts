import type { QaCategory } from '../qa/types.js';
import type {
  UnifiedLibrary,
  UnifiedPayload,
  UnifiedSearchHit,
} from './types.js';

import { config } from '../config.js';
import { query } from '../db/pool.js';

interface UnifiedIndexRow {
  chunk_index: number;
  embed_text: string;
  id: string;
  keyword_score?: number;
  library: UnifiedLibrary;
  marker_text: string;
  payload: UnifiedPayload;
  source_id: string;
  vector_score?: number;
}

function toSearchHit(row: UnifiedIndexRow): UnifiedSearchHit {
  return {
    id: row.id,
    library: row.library,
    sourceId: row.source_id,
    chunkIndex: row.chunk_index,
    markerText: row.marker_text,
    embedText: row.embed_text,
    payload: row.payload,
    keywordScore: Number(row.keyword_score ?? 0),
    vectorScore: Number(row.vector_score ?? 0),
  };
}

export async function countUnifiedIndex(stationId = config.DEFAULT_STATION_ID) {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM kb_unified_index WHERE station_id = $1',
    [stationId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function deleteUnifiedIndexBySource(params: {
  library: UnifiedLibrary;
  sourceId: string;
  stationId?: string;
}) {
  await query(
    `DELETE FROM kb_unified_index
     WHERE station_id = $1 AND library = $2 AND source_id = $3`,
    [
      params.stationId ?? config.DEFAULT_STATION_ID,
      params.library,
      params.sourceId,
    ],
  );
}

export async function upsertUnifiedIndexRow(params: {
  chunkIndex: number;
  embedding: number[];
  embedText: string;
  library: UnifiedLibrary;
  markerText: string;
  modelId: string;
  payload: UnifiedPayload;
  sourceId: string;
  stationId: string;
  toPgVector: (vector: number[]) => string;
}) {
  await query(
    `INSERT INTO kb_unified_index (
       station_id, library, source_id, chunk_index,
       marker_text, embed_text, embedding, payload, model_id, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8::jsonb, $9, now())
     ON CONFLICT (station_id, library, source_id, chunk_index) DO UPDATE SET
       marker_text = EXCLUDED.marker_text,
       embed_text = EXCLUDED.embed_text,
       embedding = EXCLUDED.embedding,
       payload = EXCLUDED.payload,
       model_id = EXCLUDED.model_id,
       updated_at = now()`,
    [
      params.stationId,
      params.library,
      params.sourceId,
      params.chunkIndex,
      params.markerText,
      params.embedText,
      params.toPgVector(params.embedding),
      JSON.stringify(params.payload),
      params.modelId,
    ],
  );
}

function buildLibraryFilter(
  values: unknown[],
  params: {
    excludeLibraries?: UnifiedLibrary[];
    qaCategory?: QaCategory;
  },
  options?: { requireEmbedding?: boolean },
) {
  let sql = ' WHERE station_id = $1';
  if (options?.requireEmbedding !== false) {
    sql += ' AND embedding IS NOT NULL';
  }

  if (params.excludeLibraries?.length) {
    values.push(params.excludeLibraries);
    sql += ` AND NOT (library = ANY($${values.length}::text[]))`;
  }

  if (params.qaCategory) {
    values.push(params.qaCategory);
    sql += ` AND (library <> 'qa' OR payload ->> 'category' = $${values.length})`;
  }

  return sql;
}

export async function searchUnifiedByVector(params: {
  excludeLibraries?: UnifiedLibrary[];
  limit: number;
  qaCategory?: QaCategory;
  stationId: string;
  toPgVector: (vector: number[]) => string;
  vector: number[];
}) {
  const values: unknown[] = [params.stationId];
  const where = buildLibraryFilter(values, params, { requireEmbedding: true });
  values.push(params.toPgVector(params.vector));
  const vectorParam = values.length;
  values.push(params.limit);

  const result = await query<UnifiedIndexRow>(
    `SELECT
       id, library, source_id, chunk_index, marker_text, embed_text, payload,
       1 - (embedding <=> $${vectorParam}::vector) AS vector_score
     FROM kb_unified_index
     ${where}
     ORDER BY embedding <=> $${vectorParam}::vector
     LIMIT $${values.length}`,
    values,
  );
  return result.rows.map((row) => toSearchHit(row));
}

export async function searchUnifiedByKeyword(params: {
  excludeLibraries?: UnifiedLibrary[];
  limit: number;
  qaCategory?: QaCategory;
  queryText: string;
  stationId: string;
}) {
  const values: unknown[] = [params.stationId];
  const where = buildLibraryFilter(values, params, { requireEmbedding: false });
  values.push(params.queryText);
  const queryParam = values.length;
  values.push(params.limit);

  const result = await query<UnifiedIndexRow>(
    `SELECT
       id, library, source_id, chunk_index, marker_text, embed_text, payload,
       similarity(marker_text, $${queryParam}) AS keyword_score
     FROM kb_unified_index
     ${where}
       AND (
         marker_text ILIKE '%' || $${queryParam} || '%'
         OR similarity(marker_text, $${queryParam}) > 0.08
       )
     ORDER BY keyword_score DESC
     LIMIT $${values.length}`,
    values,
  );
  return result.rows.map((row) => toSearchHit(row));
}
