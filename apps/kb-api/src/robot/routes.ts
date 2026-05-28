import type { FastifyInstance } from 'fastify';

import { z } from 'zod';

import { requireRobotKey } from '../common/auth.js';
import { useResponseSuccess } from '../common/response.js';
import { qaService } from '../qa/service.js';
import { isValidCategory } from '../qa/types.js';

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
      const category =
        body.hints?.category && isValidCategory(body.hints.category)
          ? body.hints.category
          : undefined;

      const result = await qaService.retrieve({
        category,
        topK: body.topK,
        utterance: body.utterance,
      });

      const best = result.items[0];
      const runnerUp = result.items[1];
      const needClarify =
        result.hit &&
        best &&
        runnerUp &&
        runnerUp.confidence !== undefined &&
        best.confidence - runnerUp.confidence < 0.05;

      return useResponseSuccess({
        action: best
          ? {
              poi: null,
              type: 'none',
            }
          : null,
        hit: result.hit,
        needClarify,
        reply: best
          ? {
              display: best.question,
              speak: best.answer,
            }
          : null,
        source: best
          ? {
              category: best.category,
              matchType: best.matchType,
              qaId: best.id,
              matchedQuestion: best.question,
            }
          : null,
        type: 'faq',
        candidates: result.items,
      });
    },
  );
}
