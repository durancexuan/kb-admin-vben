import type { RobotDocCategory } from '../src/robot-doc/types.js';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { migrate } from '../src/db/migrate.js';
import { pool } from '../src/db/pool.js';
import { robotDocService } from '../src/robot-doc/service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedRoot = path.resolve(__dirname, '../seed-data/robot-doc');

const SEED_FILES: Array<{
  category: RobotDocCategory;
  file: string;
  sourceName: string;
  title: string;
}> = [
  {
    category: '本站基本情况',
    file: '01-station-basic.txt',
    sourceName: '奥东加油站基本情况介绍.txt',
    title: '奥东加油站基本情况',
  },
  {
    category: '企业通用知识',
    file: '02-corp-convenience.md',
    sourceName: '中国石油加油站便利店机器人专属知识库.md',
    title: '加油站便利店企业通用知识',
  },
  {
    category: '本站专属知识',
    file: '03-station-exclusive.md',
    sourceName: '中国石油北京奥东加油站专属机器人知识库.md',
    title: '奥东加油站专属知识',
  },
  {
    category: '团队与荣誉',
    file: '04-team-honor.md',
    sourceName: '中国石油北京奥东加油站团队风采与荣誉资质专属知识库.md',
    title: '奥东加油站团队风采与荣誉资质',
  },
];

async function main() {
  await migrate();

  for (const item of SEED_FILES) {
    const content = await readFile(path.join(seedRoot, item.file), 'utf8');
    const rows = await robotDocService.list({ keyword: item.title });
    const existing = rows.find((row) => row.title === item.title);

    if (existing) {
      await robotDocService.update(existing.id, {
        title: item.title,
        category: item.category,
        content,
        sourceName: item.sourceName,
      });
      const published = await robotDocService.publish(existing.id);
      if (!published.success) {
        throw new Error(`${item.title}: ${published.error}`);
      }
      console.warn(`updated + published: ${item.title}`);
      continue;
    }

    const created = await robotDocService.create({
      title: item.title,
      category: item.category,
      content,
      sourceName: item.sourceName,
    });
    const published = await robotDocService.publish(created.id);
    if (!published.success) {
      throw new Error(`${item.title}: ${published.error}`);
    }
    console.warn(`created + published: ${item.title}`);
  }

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  throw error;
});
