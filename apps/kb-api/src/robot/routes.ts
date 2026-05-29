import type { FastifyInstance } from 'fastify';

import { z } from 'zod';

import { requireRobotKey } from '../common/auth.js';
import { useResponseSuccess } from '../common/response.js';
import { parseRobotCategory, unifiedKnowledgeRetrieve } from './service.js';

const robotQuerySchema = z.object({
  hints: z
    .object({
      category: z.string().optional(),
    })
    .optional(),
  stationId: z.string().optional(),
  topK: z.number().int().positive().max(20).optional(),
  utterance: z.string().min(1),
});

export async function registerRobotRoutes(app: FastifyInstance) {
  app.post(
    '/robot/knowledge/query',
    { preHandler: requireRobotKey },
    async (request) => {
      const body = robotQuerySchema.parse(request.body);
      const category = parseRobotCategory(body.hints?.category);

      const result = await unifiedKnowledgeRetrieve({
        category,
        topK: body.topK,
        utterance: body.utterance,
      });

      return useResponseSuccess(result);
    },
  );
}
