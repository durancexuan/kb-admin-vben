import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          // 知识库走真实后端 kb-api（需先 pnpm dev:kb-api）
          '/api/knowledge/qa': {
            changeOrigin: true,
            target: 'http://127.0.0.1:8080',
          },
          '/api/knowledge/goods': {
            changeOrigin: true,
            target: 'http://127.0.0.1:8080',
          },
          '/api/knowledge/campaign': {
            changeOrigin: true,
            target: 'http://127.0.0.1:8080',
          },
          // 机器人统一检索（须在通用 /api Mock 规则之前）
          '/api/robot': {
            changeOrigin: true,
            target: 'http://127.0.0.1:8080',
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
