export type GoodsStatus = 'draft' | 'offline' | 'online';

export type EmbedStatus = 'failed' | 'none' | 'ok' | 'pending';

export interface GoodsRecord {
  id: string;
  name: string;
  navigationPoint?: string;
  price: number;
  shelfLocation: string;
  sku: string;
  spec?: string;
  status: GoodsStatus;
}

export interface GoodsRow {
  embed_status: EmbedStatus;
  id: string;
  name: string;
  navigation_point: null | string;
  price: string;
  published_at: Date | null;
  shelf_location: string;
  sku: string;
  spec: null | string;
  station_id: string;
  status: GoodsStatus;
  updated_at: Date;
}

export function toGoodsRecord(row: GoodsRow): GoodsRecord {
  const record: GoodsRecord = {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: Number(row.price),
    shelfLocation: row.shelf_location,
    status: row.status,
  };
  if (row.spec) {
    record.spec = row.spec;
  }
  if (row.navigation_point) {
    record.navigationPoint = row.navigation_point;
  }
  return record;
}
