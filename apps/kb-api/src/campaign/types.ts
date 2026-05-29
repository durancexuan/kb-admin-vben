export type CampaignStatus = 'draft' | 'offline' | 'online';

export interface CampaignRecord {
  applicableGoods: string;
  applicableGoodsIds: string[];
  discount: string;
  endDate: string;
  id: string;
  name: string;
  startDate: string;
  status: CampaignStatus;
}

export interface CampaignRow {
  discount: string;
  end_date: Date;
  id: string;
  name: string;
  published_at: Date | null;
  start_date: Date;
  station_id: string;
  status: CampaignStatus;
  updated_at: Date;
}

export function formatDate(value: Date | string) {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export function toCampaignRecord(
  row: CampaignRow,
  applicableGoodsIds: string[],
  applicableGoods: string,
): CampaignRecord {
  return {
    id: row.id,
    name: row.name,
    discount: row.discount,
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    applicableGoodsIds,
    applicableGoods,
    status: row.status,
  };
}
