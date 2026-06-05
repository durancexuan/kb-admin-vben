/* eslint-disable @typescript-eslint/no-require-imports -- PM2 配置文件 */
/**
 * 不用 Docker 时，在仓库根目录：pm2 start apps/kb-api/ecosystem.config.cjs
 * 需先：cd apps/kb-api && docker compose up -d && cp .env.production.example .env
 */
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

module.exports = {
  apps: [
    {
      name: 'kb-api',
      cwd: repoRoot,
      script: 'pnpm',
      args: '-F @vben/kb-api run start',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
    },
  ],
};
