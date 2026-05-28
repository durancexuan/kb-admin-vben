import cors from '@fastify/cors';
import Fastify from 'fastify';

import { config } from './config.js';
import { migrate } from './db/migrate.js';
import { pool } from './db/pool.js';
import { registerQaRoutes } from './qa/routes.js';
import { qaService } from './qa/service.js';
import { registerRobotRoutes } from './robot/routes.js';

async function bootstrap() {
  await migrate();

  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  await app.register(
    async (instance) => {
      await registerQaRoutes(instance);
      await registerRobotRoutes(instance);
    },
    { prefix: '/api' },
  );

  app.get('/health', async () => ({ ok: true }));

  await qaService.reindexOnline();

  await app.listen({ host: '0.0.0.0', port: config.PORT });
  app.log.info(`kb-api listening on http://127.0.0.1:${config.PORT}/api`);
}

bootstrap().catch(async (error) => {
  console.error(error);
  await pool.end();
  throw error;
});
