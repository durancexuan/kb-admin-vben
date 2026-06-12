import type { FastifyInstance } from 'fastify';

import { z } from 'zod';

import { requireAuth } from '../common/auth.js';
import {
  usePageResponseSuccess,
  useResponseError,
  useResponseSuccess,
} from '../common/response.js';
import { validateRobotDocPayload } from './publish.js';
import { robotDocService } from './service.js';
import { isValidRobotDocCategory } from './types.js';

const payloadSchema = z.object({
  category: z.string(),
  content: z.string(),
  sourceName: z.string().optional(),
  title: z.string(),
});

export async function registerRobotDocRoutes(app: FastifyInstance) {
  app.get(
    '/knowledge/robot-doc/list',
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
        query.category && isValidRobotDocCategory(query.category)
          ? query.category
          : undefined;
      const items = await robotDocService.list({
        category,
        keyword: query.keyword,
      });
      return usePageResponseSuccess(page, pageSize, items);
    },
  );

  app.post(
    '/knowledge/robot-doc',
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = payloadSchema.parse(request.body);
      const error = validateRobotDocPayload(body);
      if (error) {
        return reply.status(400).send(useResponseError(error));
      }
      const data = await robotDocService.create({
        title: body.title.trim(),
        category: body.category as never,
        content: body.content.trim(),
        sourceName: body.sourceName?.trim(),
      });
      return useResponseSuccess(data);
    },
  );

  app.put(
    '/knowledge/robot-doc/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = payloadSchema.parse(request.body);
      const error = validateRobotDocPayload(body);
      if (error) {
        return reply.status(400).send(useResponseError(error));
      }
      const data = await robotDocService.update(id, {
        title: body.title.trim(),
        category: body.category as never,
        content: body.content.trim(),
        sourceName: body.sourceName?.trim(),
      });
      if (!data) {
        return reply.status(404).send(useResponseError('文档不存在'));
      }
      return useResponseSuccess(data);
    },
  );

  app.delete(
    '/knowledge/robot-doc/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const ok = await robotDocService.remove(id);
      if (!ok) {
        return reply.status(404).send(useResponseError('文档不存在'));
      }
      return useResponseSuccess(true);
    },
  );

  app.post(
    '/knowledge/robot-doc/:id/publish',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await robotDocService.publish(id);
      if (!result.success) {
        return reply.status(400).send(useResponseError(result.error));
      }
      return useResponseSuccess(result.data);
    },
  );

  app.post(
    '/knowledge/robot-doc/:id/offline',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await robotDocService.offline(id);
      if (!data) {
        return reply.status(404).send(useResponseError('文档不存在'));
      }
      return useResponseSuccess(data);
    },
  );
}
