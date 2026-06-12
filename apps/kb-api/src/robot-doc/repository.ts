import type { EmbedStatus, RobotDocCategory, RobotDocRow } from './types.js';

import { config } from '../config.js';
import { query } from '../db/pool.js';

const DOC_COLUMNS = `
  id, station_id, title, category, content, source_name, status, embed_status, updated_at, published_at
`;

export async function listRobotDocs(params: {
  category?: RobotDocCategory;
  keyword?: string;
  stationId: string;
}) {
  const values: unknown[] = [params.stationId];
  let sql = `SELECT ${DOC_COLUMNS} FROM kb_robot_doc WHERE station_id = $1`;

  if (params.category) {
    values.push(params.category);
    sql += ` AND category = $${values.length}`;
  }

  if (params.keyword?.trim()) {
    values.push(`%${params.keyword.trim()}%`);
    sql += ` AND (title ILIKE $${values.length} OR content ILIKE $${values.length})`;
  }

  sql += ' ORDER BY updated_at DESC';
  const result = await query<RobotDocRow>(sql, values);
  return result.rows;
}

export async function findRobotDocById(
  id: string,
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query<RobotDocRow>(
    `SELECT ${DOC_COLUMNS} FROM kb_robot_doc WHERE id = $1 AND station_id = $2`,
    [id, stationId],
  );
  return result.rows[0] ?? null;
}

export async function createRobotDoc(params: {
  category: RobotDocCategory;
  content: string;
  sourceName?: string;
  stationId: string;
  title: string;
}) {
  const result = await query<RobotDocRow>(
    `INSERT INTO kb_robot_doc (station_id, title, category, content, source_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${DOC_COLUMNS}`,
    [
      params.stationId,
      params.title,
      params.category,
      params.content,
      params.sourceName ?? null,
    ],
  );
  return result.rows[0] ?? null;
}

export async function updateRobotDoc(
  id: string,
  stationId: string,
  payload: {
    category: RobotDocCategory;
    content: string;
    sourceName?: string;
    title: string;
  },
) {
  const result = await query<RobotDocRow>(
    `UPDATE kb_robot_doc
     SET title = $3,
         category = $4,
         content = $5,
         source_name = $6,
         updated_at = now()
     WHERE id = $1 AND station_id = $2
     RETURNING ${DOC_COLUMNS}`,
    [
      id,
      stationId,
      payload.title,
      payload.category,
      payload.content,
      payload.sourceName ?? null,
    ],
  );
  return result.rows[0] ?? null;
}

export async function deleteRobotDoc(
  id: string,
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query(
    'DELETE FROM kb_robot_doc WHERE id = $1 AND station_id = $2',
    [id, stationId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function setRobotDocStatus(
  id: string,
  stationId: string,
  status: RobotDocRow['status'],
  embedStatus: EmbedStatus,
) {
  const result = await query<RobotDocRow>(
    `UPDATE kb_robot_doc
     SET status = $3::varchar,
         embed_status = $4::varchar,
         published_at = CASE
           WHEN $3::varchar = 'online'::varchar THEN COALESCE(published_at, now())
           ELSE published_at
         END,
         updated_at = now()
     WHERE id = $1 AND station_id = $2
     RETURNING ${DOC_COLUMNS}`,
    [id, stationId, status, embedStatus],
  );
  return result.rows[0] ?? null;
}

export async function setRobotDocEmbedStatus(
  id: string,
  stationId: string,
  embedStatus: EmbedStatus,
) {
  await query(
    'UPDATE kb_robot_doc SET embed_status = $3::varchar, updated_at = now() WHERE id = $1 AND station_id = $2',
    [id, stationId, embedStatus],
  );
}

export async function replaceRobotDocChunks(
  docId: string,
  chunks: Array<{ body: string; chunkIndex: number; heading: string }>,
) {
  await query('DELETE FROM kb_robot_doc_chunk WHERE doc_id = $1', [docId]);
  for (const chunk of chunks) {
    await query(
      `INSERT INTO kb_robot_doc_chunk (doc_id, chunk_index, heading, body)
       VALUES ($1, $2, $3, $4)`,
      [docId, chunk.chunkIndex, chunk.heading, chunk.body],
    );
  }
}

export async function listRobotDocChunks(docId: string) {
  const result = await query<{
    body: string;
    chunk_index: number;
    doc_id: string;
    heading: string;
    id: string;
  }>(
    `SELECT id, doc_id, chunk_index, heading, body
     FROM kb_robot_doc_chunk
     WHERE doc_id = $1
     ORDER BY chunk_index ASC`,
    [docId],
  );
  return result.rows;
}
