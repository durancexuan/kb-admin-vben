import type { GoodsRow, GoodsStatus } from './types.js';

import { config } from '../config.js';
import { query } from '../db/pool.js';

const goodsColumns = `
  id, station_id, sku, name, price, shelf_location, spec, navigation_point,
  status, embed_status, updated_at, published_at
`;

export async function listGoods(params: {
  keyword?: string;
  stationId: string;
}) {
  const values: unknown[] = [params.stationId];
  let sql = `
    SELECT ${goodsColumns}
    FROM kb_goods
    WHERE station_id = $1
  `;

  if (params.keyword) {
    values.push(`%${params.keyword}%`);
    const idx = values.length;
    sql += ` AND (sku ILIKE $${idx} OR name ILIKE $${idx})`;
  }

  sql += ' ORDER BY created_at DESC, id ASC';

  const result = await query<GoodsRow>(sql, values);
  return result.rows;
}

export async function findGoodsById(
  id: string,
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query<GoodsRow>(
    `SELECT ${goodsColumns} FROM kb_goods WHERE id = $1 AND station_id = $2`,
    [id, stationId],
  );
  return result.rows[0] ?? null;
}

export async function findGoodsBySku(
  sku: string,
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query<GoodsRow>(
    `SELECT ${goodsColumns}
     FROM kb_goods
     WHERE station_id = $1 AND sku ILIKE $2 AND status = 'online'`,
    [stationId, sku],
  );
  return result.rows[0] ?? null;
}

export async function generateNextSku(stationId: string) {
  const result = await query<{ max_no: null | number }>(
    `SELECT MAX(CAST(SUBSTRING(sku FROM 5) AS INTEGER)) AS max_no
     FROM kb_goods
     WHERE station_id = $1 AND sku ~ '^SKU-[0-9]+$'`,
    [stationId],
  );
  const next = (result.rows[0]?.max_no ?? 0) + 1;
  return `SKU-${String(next).padStart(4, '0')}`;
}

export async function createGoods(payload: {
  name: string;
  navigationPoint?: string;
  price: number;
  shelfLocation: string;
  sku: string;
  spec?: string;
  stationId: string;
}) {
  const result = await query<GoodsRow>(
    `INSERT INTO kb_goods (
       station_id, sku, name, price, shelf_location, spec, navigation_point, status, embed_status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', 'none')
     RETURNING ${goodsColumns}`,
    [
      payload.stationId,
      payload.sku,
      payload.name,
      payload.price,
      payload.shelfLocation,
      payload.spec ?? null,
      payload.navigationPoint ?? null,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create goods');
  }
  return row;
}

export async function updateGoods(
  id: string,
  payload: {
    name: string;
    navigationPoint?: string;
    price: number;
    shelfLocation: string;
    spec?: string;
    stationId: string;
  },
) {
  const result = await query<GoodsRow>(
    `UPDATE kb_goods
     SET name = $3,
         price = $4,
         shelf_location = $5,
         spec = $6,
         navigation_point = $7,
         updated_at = now()
     WHERE id = $1 AND station_id = $2
     RETURNING ${goodsColumns}`,
    [
      id,
      payload.stationId,
      payload.name,
      payload.price,
      payload.shelfLocation,
      payload.spec ?? null,
      payload.navigationPoint ?? null,
    ],
  );
  return result.rows[0] ?? null;
}

export async function setGoodsStatus(
  id: string,
  status: GoodsStatus,
  embedStatus: GoodsRow['embed_status'],
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query<GoodsRow>(
    `UPDATE kb_goods
     SET status = $3::varchar,
         embed_status = $4::varchar,
         published_at = CASE
           WHEN $3::varchar = 'online'::varchar THEN COALESCE(published_at, now())
           ELSE published_at
         END
     WHERE id = $1 AND station_id = $2
     RETURNING ${goodsColumns}`,
    [id, stationId, status, embedStatus],
  );
  return result.rows[0] ?? null;
}

export async function setGoodsEmbedStatus(
  id: string,
  embedStatus: GoodsRow['embed_status'],
  stationId = config.DEFAULT_STATION_ID,
) {
  await query(
    'UPDATE kb_goods SET embed_status = $3::varchar WHERE id = $1 AND station_id = $2',
    [id, stationId, embedStatus],
  );
}

export async function searchGoodsByKeyword(params: {
  limit: number;
  queryText: string;
  stationId: string;
}) {
  const result = await query<{
    id: string;
    keyword_score: number;
    name: string;
    navigation_point: null | string;
    price: string;
    shelf_location: string;
    sku: string;
    spec: null | string;
  }>(
    `SELECT
       g.id,
       g.sku,
       g.name,
       g.price,
       g.shelf_location,
       g.spec,
       g.navigation_point,
       GREATEST(
         similarity(g.name, $2),
         COALESCE(similarity(g.navigation_point, $2), 0),
         COALESCE(similarity(g.spec, $2), 0)
       ) AS keyword_score
     FROM kb_goods g
     WHERE g.station_id = $1
       AND g.status = 'online'
       AND (
         g.name ILIKE '%' || $2 || '%'
         OR g.sku ILIKE '%' || $2 || '%'
         OR g.spec ILIKE '%' || $2 || '%'
         OR g.navigation_point ILIKE '%' || $2 || '%'
         OR g.shelf_location ILIKE '%' || $2 || '%'
         OR similarity(g.name, $2) > 0.08
         OR COALESCE(similarity(g.navigation_point, $2), 0) > 0.08
       )
     ORDER BY keyword_score DESC
     LIMIT $3`,
    [params.stationId, params.queryText, params.limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    keywordScore: Number(row.keyword_score) || 0,
    name: row.name,
    navigationPoint: row.navigation_point,
    price: row.price,
    score: Number(row.keyword_score) || 0,
    shelfLocation: row.shelf_location,
    sku: row.sku,
    spec: row.spec,
    vectorScore: 0,
  }));
}

export async function searchGoodsByVector(params: {
  limit: number;
  stationId: string;
  vector: number[];
}) {
  const vectorLiteral = `[${params.vector.join(',')}]`;
  const result = await query<{
    id: string;
    name: string;
    navigation_point: null | string;
    price: string;
    shelf_location: string;
    sku: string;
    spec: null | string;
    vector_score: number;
  }>(
    `SELECT
       g.id,
       g.sku,
       g.name,
       g.price,
       g.shelf_location,
       g.spec,
       g.navigation_point,
       1 - (e.embedding <=> $2::vector) AS vector_score
     FROM kb_goods_embedding e
     INNER JOIN kb_goods g ON g.id = e.goods_id
     WHERE g.station_id = $1
       AND g.status = 'online'
       AND e.embedding IS NOT NULL
     ORDER BY e.embedding <=> $2::vector
     LIMIT $3`,
    [params.stationId, vectorLiteral, params.limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    keywordScore: 0,
    name: row.name,
    navigationPoint: row.navigation_point,
    price: row.price,
    score: Number(row.vector_score) || 0,
    shelfLocation: row.shelf_location,
    sku: row.sku,
    spec: row.spec,
    vectorScore: Number(row.vector_score) || 0,
  }));
}

export async function countGoodsEmbeddings(stationId: string) {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM kb_goods_embedding e
     INNER JOIN kb_goods g ON g.id = e.goods_id
     WHERE g.station_id = $1 AND g.status = 'online'`,
    [stationId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function listOnlineGoods(stationId: string) {
  const result = await query<GoodsRow>(
    `SELECT ${goodsColumns}
     FROM kb_goods
     WHERE station_id = $1 AND status = 'online'`,
    [stationId],
  );
  return result.rows;
}

export async function listAllGoodsForOptions(stationId: string) {
  const result = await query<{ id: string; name: string }>(
    `SELECT id, name FROM kb_goods WHERE station_id = $1 ORDER BY name ASC`,
    [stationId],
  );
  return result.rows;
}
