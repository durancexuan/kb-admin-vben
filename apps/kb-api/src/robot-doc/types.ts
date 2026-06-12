export type RobotDocCategory =
  | '企业通用知识'
  | '团队与荣誉'
  | '本站专属知识'
  | '本站基本情况';

export type RobotDocStatus = 'draft' | 'offline' | 'online';
export type EmbedStatus = 'failed' | 'none' | 'ok' | 'pending';

export const ROBOT_DOC_CATEGORIES: RobotDocCategory[] = [
  '本站基本情况',
  '企业通用知识',
  '本站专属知识',
  '团队与荣誉',
];

export interface RobotDocRecord {
  category: RobotDocCategory;
  content: string;
  contentLength: number;
  embedStatus: EmbedStatus;
  id: string;
  sourceName: null | string;
  status: RobotDocStatus;
  title: string;
  updatedAt: string;
}

export interface RobotDocRow {
  category: RobotDocCategory;
  content: string;
  embed_status: EmbedStatus;
  id: string;
  published_at: Date | null;
  source_name: null | string;
  station_id: string;
  status: RobotDocStatus;
  title: string;
  updated_at: Date;
}

export interface RobotDocChunkRow {
  body: string;
  chunk_index: number;
  doc_id: string;
  heading: string;
  id: string;
}

export function toRobotDocRecord(row: RobotDocRow): RobotDocRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    contentLength: row.content.length,
    sourceName: row.source_name,
    status: row.status,
    embedStatus: row.embed_status,
    updatedAt: row.updated_at.toISOString(),
  };
}

export function isValidRobotDocCategory(
  value: string,
): value is RobotDocCategory {
  return ROBOT_DOC_CATEGORIES.includes(value as RobotDocCategory);
}
