import { formatUpdatedAt } from '../common/datetime.js';

export const QA_CATEGORIES = [
  '加油机',
  '卫生间',
  '便利店',
  '营业时间',
  '其他',
] as const;

export type QaCategory = (typeof QA_CATEGORIES)[number];

export type QaStatus = 'draft' | 'offline' | 'online';

export type EmbedStatus = 'failed' | 'none' | 'ok' | 'pending';

export interface QaRecord {
  answer: string;
  category: QaCategory;
  id: string;
  question: string;
  status: QaStatus;
  updatedAt: string;
}

export interface QaRow {
  answer: string;
  category: QaCategory;
  embed_status: EmbedStatus;
  id: string;
  question: string;
  published_at: Date | null;
  station_id: string;
  status: QaStatus;
  updated_at: Date;
}

export function isValidCategory(value: string): value is QaCategory {
  return QA_CATEGORIES.includes(value as QaCategory);
}

export function toQaRecord(row: QaRow): QaRecord {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    status: row.status,
    updatedAt: formatUpdatedAt(row.updated_at),
  };
}
