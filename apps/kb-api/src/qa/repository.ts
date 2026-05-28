import type { QaCategory, QaRow, QaStatus } from './types.js';

import { config } from '../config.js';
import { query } from '../db/pool.js';

export async function listQa(params: {
  category?: QaCategory;
  keyword?: string;
  stationId: string;
}) {
  const values: unknown[] = [params.stationId];
  let sql = `
    SELECT id, station_id, question, answer, category, status, embed_status, updated_at, published_at
    FROM kb_qa
    WHERE station_id = $1
  `;

  if (params.category) {
    values.push(params.category);
    sql += ` AND category = $${values.length}`;
  }

  if (params.keyword) {
    values.push(`%${params.keyword}%`);
    const idx = values.length;
    sql += ` AND (question ILIKE $${idx} OR answer ILIKE $${idx})`;
  }

  // 按创建时间稳定排序，上下线不改动顺序（不依赖 updated_at）
  sql += ' ORDER BY created_at DESC, id ASC';

  const result = await query<QaRow>(sql, values);
  return result.rows;
}

export async function findQaById(
  id: string,
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query<QaRow>(
    `SELECT id, station_id, question, answer, category, status, embed_status, updated_at, published_at
     FROM kb_qa WHERE id = $1 AND station_id = $2`,
    [id, stationId],
  );
  return result.rows[0] ?? null;
}

export async function createQa(payload: {
  answer: string;
  category: QaCategory;
  question: string;
  stationId: string;
}) {
  const result = await query<QaRow>(
    `INSERT INTO kb_qa (station_id, question, answer, category, status, embed_status)
     VALUES ($1, $2, $3, $4, 'draft', 'none')
     RETURNING id, station_id, question, answer, category, status, embed_status, updated_at, published_at`,
    [payload.stationId, payload.question, payload.answer, payload.category],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create qa');
  }
  return row;
}

export async function updateQa(
  id: string,
  payload: {
    answer: string;
    category: QaCategory;
    question: string;
    stationId: string;
  },
) {
  const result = await query<QaRow>(
    `UPDATE kb_qa
     SET question = $3, answer = $4, category = $5, updated_at = now()
     WHERE id = $1 AND station_id = $2
     RETURNING id, station_id, question, answer, category, status, embed_status, updated_at, published_at`,
    [id, payload.stationId, payload.question, payload.answer, payload.category],
  );
  return result.rows[0] ?? null;
}

export async function deleteQa(
  id: string,
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query(
    'DELETE FROM kb_qa WHERE id = $1 AND station_id = $2',
    [id, stationId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function setQaStatus(
  id: string,
  status: QaStatus,
  embedStatus: QaRow['embed_status'],
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query<QaRow>(
    `UPDATE kb_qa
     SET status = $3::varchar,
         embed_status = $4::varchar,
         published_at = CASE
           WHEN $3::varchar = 'online'::varchar THEN COALESCE(published_at, now())
           ELSE published_at
         END
     WHERE id = $1 AND station_id = $2
     RETURNING id, station_id, question, answer, category, status, embed_status, updated_at, published_at`,
    [id, stationId, status, embedStatus],
  );
  return result.rows[0] ?? null;
}

export async function setEmbedStatus(
  id: string,
  embedStatus: QaRow['embed_status'],
  stationId = config.DEFAULT_STATION_ID,
) {
  await query(
    'UPDATE kb_qa SET embed_status = $3::varchar WHERE id = $1 AND station_id = $2',
    [id, stationId, embedStatus],
  );
}

export interface RetrieveCandidate {
  answer: string;
  category: QaCategory;
  id: string;
  keywordScore: number;
  question: string;
  score: number;
  vectorScore: number;
}

export async function searchQaByKeyword(params: {
  category?: QaCategory;
  limit: number;
  queryText: string;
  stationId: string;
}) {
  const values: unknown[] = [params.stationId, params.queryText];
  let sql = `
    SELECT
      q.id,
      q.question,
      q.answer,
      q.category,
      GREATEST(
        similarity(q.question, $2),
        similarity(q.answer, $2)
      ) AS keyword_score
    FROM kb_qa q
    WHERE q.station_id = $1
      AND q.status = 'online'
      AND (
        q.question ILIKE '%' || $2 || '%'
        OR q.answer ILIKE '%' || $2 || '%'
        OR similarity(q.question, $2) > 0.08
        OR similarity(q.answer, $2) > 0.08
      )
  `;

  if (params.category) {
    values.push(params.category);
    sql += ` AND q.category = $${values.length}`;
  }

  values.push(params.limit);
  sql += ` ORDER BY keyword_score DESC LIMIT $${values.length}`;

  const result = await query<{
    answer: string;
    category: QaCategory;
    id: string;
    keyword_score: number;
    question: string;
  }>(sql, values);

  return result.rows.map((row) => ({
    answer: row.answer,
    category: row.category,
    id: row.id,
    keywordScore: Number(row.keyword_score) || 0,
    question: row.question,
    score: Number(row.keyword_score) || 0,
    vectorScore: 0,
  }));
}

export async function searchQaByVector(params: {
  category?: QaCategory;
  limit: number;
  stationId: string;
  vector: number[];
}) {
  const vectorLiteral = `[${params.vector.join(',')}]`;
  const values: unknown[] = [params.stationId, vectorLiteral];
  let sql = `
    SELECT
      q.id,
      q.question,
      q.answer,
      q.category,
      1 - (e.embedding <=> $2::vector) AS vector_score
    FROM kb_qa_embedding e
    INNER JOIN kb_qa q ON q.id = e.qa_id
    WHERE q.station_id = $1
      AND q.status = 'online'
      AND e.embedding IS NOT NULL
  `;

  if (params.category) {
    values.push(params.category);
    sql += ` AND q.category = $${values.length}`;
  }

  values.push(params.limit);
  sql += ` ORDER BY e.embedding <=> $2::vector LIMIT $${values.length}`;

  const result = await query<{
    answer: string;
    category: QaCategory;
    id: string;
    question: string;
    vector_score: number;
  }>(sql, values);

  return result.rows.map((row) => ({
    answer: row.answer,
    category: row.category,
    id: row.id,
    keywordScore: 0,
    question: row.question,
    score: Number(row.vector_score) || 0,
    vectorScore: Number(row.vector_score) || 0,
  }));
}

export async function countEmbeddings(stationId: string) {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM kb_qa_embedding e
     INNER JOIN kb_qa q ON q.id = e.qa_id
     WHERE q.station_id = $1 AND q.status = 'online'`,
    [stationId],
  );
  return Number(result.rows[0]?.count ?? 0);
}
