import type { QueryResultRow } from 'pg';

import { Pool } from 'pg';

import { config } from '../config.js';

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params);
}
