import cors from '@fastify/cors';
import Fastify from 'fastify';

import { registerCampaignRoutes } from './campaign/routes.js';
import { config, hasExternalEmbedding } from './config.js';
import { migrate } from './db/migrate.js';
import { pool } from './db/pool.js';
import { embeddingService } from './embedding/embedding.service.js';
import { registerGoodsRoutes } from './goods/routes.js';
import { goodsService } from './goods/service.js';
import { registerQaRoutes } from './qa/routes.js';
import { qaService } from './qa/service.js';
import { registerRobotDocRoutes } from './robot-doc/routes.js';
import { registerRobotRoutes } from './robot/routes.js';
import { reindexUnifiedLibrary } from './unified-index/reindex.js';

async function bootstrap() {
  await migrate();

  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  await app.register(
    async (instance) => {
      await registerQaRoutes(instance);
      await registerGoodsRoutes(instance);
      await registerCampaignRoutes(instance);
      await registerRobotDocRoutes(instance);
      await registerRobotRoutes(instance);
    },
    { prefix: '/api' },
  );

  app.get('/health', async () => {
    const embedding =
      embeddingService.getLastHealth() ??
      (await embeddingService.probeHealth());
    return {
      embedding,
      ok: true,
    };
  });

  const embeddingHealth = await embeddingService.probeHealth();
  if (hasExternalEmbedding()) {
    if (embeddingHealth.ok) {
      app.log.info(
        {
          dim: embeddingHealth.dim,
          format: embeddingHealth.format,
          model: embeddingHealth.model,
          url: embeddingHealth.url,
        },
        'semantic embedding (BGE) ready',
      );
    } else {
      app.log.error(
        { error: embeddingHealth.error, url: embeddingHealth.url },
        'semantic embedding unavailable; check bge-embedding service',
      );
    }
  } else {
    app.log.warn(
      { model: embeddingHealth.model },
      'using local-hash embedding; configure EMBEDDING_API_URL for production',
    );
  }

  await Promise.all([qaService.reindexOnline(), goodsService.reindexOnline()]);
  await reindexUnifiedLibrary();

  await app.listen({ host: '0.0.0.0', port: config.PORT });
  app.log.info(`kb-api listening on http://127.0.0.1:${config.PORT}/api`);
}

bootstrap().catch(async (error) => {
  console.error(error);
  await pool.end();
  throw error;
});
