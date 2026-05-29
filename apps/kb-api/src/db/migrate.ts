import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSqlFile(filePath: string) {
  let sql = await readFile(filePath, 'utf8');
  // Windows 编辑器/PowerShell 可能写入 UTF-8 BOM，Postgres 无法解析
  if (sql.startsWith('\uFEFF')) {
    sql = sql.slice(1);
  }
  await pool.query(sql);
}

export async function migrate() {
  const sqlDir = path.resolve(__dirname, '../../sql');
  const entries = await readdir(sqlDir);
  const files = entries.filter((name) => name.endsWith('.sql')).toSorted();

  for (const file of files) {
    await runSqlFile(path.join(sqlDir, file));
  }
}

if (process.argv[1]?.includes('migrate')) {
  migrate()
    .then(() => pool.end())
    .catch(async (error) => {
      console.error(error);
      await pool.end();
      throw error;
    });
}
