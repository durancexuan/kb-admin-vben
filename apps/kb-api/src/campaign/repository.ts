import type { CampaignRow } from './types.js';

import { config } from '../config.js';
import { query } from '../db/pool.js';

const campaignColumns = `
  id, station_id, name, discount, start_date, end_date, status, updated_at, published_at
`;

export async function listCampaignRows(params: {
  keyword?: string;
  stationId: string;
}) {
  const values: unknown[] = [params.stationId];
  let sql = `
    SELECT ${campaignColumns}
    FROM kb_campaign
    WHERE station_id = $1
  `;

  if (params.keyword) {
    values.push(`%${params.keyword}%`);
    const idx = values.length;
    sql += `
      AND (
        name ILIKE $${idx}
        OR discount ILIKE $${idx}
        OR EXISTS (
          SELECT 1
          FROM kb_campaign_goods cg
          INNER JOIN kb_goods g ON g.id = cg.goods_id
          WHERE cg.campaign_id = kb_campaign.id
            AND g.name ILIKE $${idx}
        )
      )
    `;
  }

  sql += ' ORDER BY created_at DESC, id ASC';

  const result = await query<CampaignRow>(sql, values);
  return result.rows;
}

export async function findCampaignById(
  id: string,
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query<CampaignRow>(
    `SELECT ${campaignColumns} FROM kb_campaign WHERE id = $1 AND station_id = $2`,
    [id, stationId],
  );
  return result.rows[0] ?? null;
}

export async function getCampaignGoodsIds(campaignId: string) {
  const result = await query<{ goods_id: string }>(
    `SELECT goods_id FROM kb_campaign_goods WHERE campaign_id = $1 ORDER BY goods_id`,
    [campaignId],
  );
  return result.rows.map((row) => row.goods_id);
}

export async function resolveGoodsNames(goodsIds: string[]) {
  if (goodsIds.length === 0) {
    return '';
  }
  const result = await query<{ name: string }>(
    `SELECT name FROM kb_goods WHERE id = ANY($1::uuid[]) ORDER BY name`,
    [goodsIds],
  );
  return result.rows.map((row) => row.name).join(', ');
}

export async function countGoodsByIds(goodsIds: string[], stationId: string) {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM kb_goods
     WHERE station_id = $1 AND id = ANY($2::uuid[])`,
    [stationId, goodsIds],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function replaceCampaignGoods(
  campaignId: string,
  goodsIds: string[],
) {
  await query('DELETE FROM kb_campaign_goods WHERE campaign_id = $1', [
    campaignId,
  ]);
  for (const goodsId of goodsIds) {
    await query(
      `INSERT INTO kb_campaign_goods (campaign_id, goods_id) VALUES ($1, $2)`,
      [campaignId, goodsId],
    );
  }
}

export async function createCampaign(payload: {
  applicableGoodsIds: string[];
  discount: string;
  endDate: string;
  name: string;
  startDate: string;
  stationId: string;
}) {
  const result = await query<CampaignRow>(
    `INSERT INTO kb_campaign (
       station_id, name, discount, start_date, end_date, status
     )
     VALUES ($1, $2, $3, $4::date, $5::date, 'draft')
     RETURNING ${campaignColumns}`,
    [
      payload.stationId,
      payload.name,
      payload.discount,
      payload.startDate,
      payload.endDate,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create campaign');
  }
  await replaceCampaignGoods(row.id, payload.applicableGoodsIds);
  return row;
}

export async function updateCampaign(
  id: string,
  payload: {
    applicableGoodsIds: string[];
    discount: string;
    endDate: string;
    name: string;
    startDate: string;
    stationId: string;
  },
) {
  const result = await query<CampaignRow>(
    `UPDATE kb_campaign
     SET name = $3,
         discount = $4,
         start_date = $5::date,
         end_date = $6::date,
         updated_at = now()
     WHERE id = $1 AND station_id = $2
     RETURNING ${campaignColumns}`,
    [
      id,
      payload.stationId,
      payload.name,
      payload.discount,
      payload.startDate,
      payload.endDate,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  await replaceCampaignGoods(id, payload.applicableGoodsIds);
  return row;
}

export async function deleteCampaign(
  id: string,
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query(
    'DELETE FROM kb_campaign WHERE id = $1 AND station_id = $2',
    [id, stationId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function setCampaignStatus(
  id: string,
  status: CampaignRow['status'],
  stationId = config.DEFAULT_STATION_ID,
) {
  const result = await query<CampaignRow>(
    `UPDATE kb_campaign
     SET status = $3::varchar,
         published_at = CASE
           WHEN $3::varchar = 'online'::varchar THEN COALESCE(published_at, now())
           ELSE published_at
         END
     WHERE id = $1 AND station_id = $2
     RETURNING ${campaignColumns}`,
    [id, stationId, status],
  );
  return result.rows[0] ?? null;
}

export async function searchCampaignByKeyword(params: {
  limit: number;
  queryText: string;
  stationId: string;
}) {
  const result = await query<{
    applicable_goods: string;
    discount: string;
    id: string;
    keyword_score: number;
    name: string;
  }>(
    `SELECT
       c.id,
       c.name,
       c.discount,
       COALESCE(string_agg(g.name, ', ' ORDER BY g.name), '') AS applicable_goods,
       GREATEST(
         similarity(c.name, $2),
         similarity(c.discount, $2)
       ) AS keyword_score
     FROM kb_campaign c
     LEFT JOIN kb_campaign_goods cg ON cg.campaign_id = c.id
     LEFT JOIN kb_goods g ON g.id = cg.goods_id
     WHERE c.station_id = $1
       AND c.status = 'online'
       AND c.end_date >= CURRENT_DATE
       AND (
         c.name ILIKE '%' || $2 || '%'
         OR c.discount ILIKE '%' || $2 || '%'
         OR g.name ILIKE '%' || $2 || '%'
         OR similarity(c.name, $2) > 0.08
         OR similarity(c.discount, $2) > 0.08
       )
     GROUP BY c.id, c.name, c.discount
     ORDER BY keyword_score DESC
     LIMIT $3`,
    [params.stationId, params.queryText, params.limit],
  );

  return result.rows.map((row) => ({
    applicableGoods: row.applicable_goods,
    discount: row.discount,
    id: row.id,
    name: row.name,
    score: Number(row.keyword_score) || 0,
  }));
}

export async function listGoodsOptions(stationId: string) {
  const result = await query<{ id: string; name: string }>(
    `SELECT id, name FROM kb_goods WHERE station_id = $1 ORDER BY name ASC`,
    [stationId],
  );
  return result.rows.map((row) => ({
    label: row.name,
    value: row.id,
  }));
}
