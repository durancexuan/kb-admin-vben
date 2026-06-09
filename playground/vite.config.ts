import process from 'node:process';

import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';

export default defineConfig(async (config) => {
  const env = loadEnv(config?.mode ?? 'development', process.cwd(), '');
  const kbApiTarget = env.VITE_KB_API_TARGET || 'http://127.0.0.1:8080';

  return {
    application: {},
    vite: {
      server: {
        proxy: {
          // 知识库走 kb-api（默认本地；.env.development 可设 VITE_KB_API_TARGET 直连服务器）
          '/api/knowledge/qa': {
            changeOrigin: true,
            target: kbApiTarget,
          },
          '/api/knowledge/goods': {
            changeOrigin: true,
            target: kbApiTarget,
          },
          '/api/knowledge/campaign': {
            changeOrigin: true,
            target: kbApiTarget,
          },
          // 机器人统一检索（须在通用 /api Mock 规则之前）
          '/api/robot': {
            changeOrigin: true,
            target: kbApiTarget,
          },
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址（登录等）
            target: 'http://127.0.0.1:5320/api',
            ws: true,
          },
        },
      },
    },
  };
});
