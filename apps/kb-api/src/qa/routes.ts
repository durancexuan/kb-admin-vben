import type { FastifyInstance } from 'fastify';

import type { QaCategory } from './types.js';

import { z } from 'zod';

import { requireAuth } from '../common/auth.js';
import {
  usePageResponseSuccess,
  useResponseError,
  useResponseSuccess,
} from '../common/response.js';
import { validateQaPayload } from './publish.js';
import { qaService } from './service.js';
import { isValidCategory } from './types.js';

const qaPayloadSchema = z.object({
  answer: z.string(),
  category: z.string(),
  question: z.string(),
});

export async function registerQaRoutes(app: FastifyInstance) {
  app.get(
    '/knowledge/qa/list',
    { preHandler: requireAuth },
    async (request) => {
      const query = request.query as {
        category?: string;
        keyword?: string;
        page?: string;
        pageSize?: string;
      };

      const page = Number.parseInt(query.page ?? '1', 10);
      const pageSize = Number.parseInt(query.pageSize ?? '10', 10);
      const category =
        query.category && isValidCategory(query.category)
          ? query.category
          : undefined;

      const items = await qaService.list({
        category,
        keyword: query.keyword,
      });

      return usePageResponseSuccess(page, pageSize, items);
    },
  );

  app.post(
    '/knowledge/qa',
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = qaPayloadSchema.parse(request.body);
      const errorMessage = validateQaPayload(body);
      if (errorMessage) {
        return reply
          .code(400)
          .send(useResponseError(errorMessage, errorMessage));
      }

      const qa = await qaService.create({
        answer: body.answer.trim(),
        category: body.category as QaCategory,
        question: body.question.trim(),
      });
      return useResponseSuccess(qa);
    },
  );

  app.put(
    '/knowledge/qa/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = qaPayloadSchema.parse(request.body);
      const errorMessage = validateQaPayload(body);
      if (errorMessage) {
        return reply
          .code(400)
          .send(useResponseError(errorMessage, errorMessage));
      }

      const qa = await qaService.update(id, {
        answer: body.answer.trim(),
        category: body.category as QaCategory,
        question: body.question.trim(),
      });

      if (!qa) {
        return reply
          .code(404)
          .send(useResponseError('NotFoundException', 'Qa not found'));
      }

      return useResponseSuccess(qa);
    },
  );

  app.delete(
    '/knowledge/qa/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const deleted = await qaService.remove(id);
      if (!deleted) {
        return reply
          .code(404)
          .send(useResponseError('NotFoundException', 'Qa not found'));
      }
      return useResponseSuccess(null);
    },
  );

  app.post(
    '/knowledge/qa/:id/publish',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await qaService.publish(id);
      if (!result.success) {
        return reply
          .code(400)
          .send(useResponseError(result.error, { issues: result.issues }));
      }
      return useResponseSuccess(result.data);
    },
  );

  app.post(
    '/knowledge/qa/:id/offline',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const qa = await qaService.offline(id);
      if (!qa) {
        return reply
          .code(404)
          .send(useResponseError('NotFoundException', 'Qa not found'));
      }
      return useResponseSuccess(qa);
    },
  );
}
