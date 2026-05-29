import type { FastifyInstance } from 'fastify';

import { z } from 'zod';

import { requireAuth } from '../common/auth.js';
import {
  usePageResponseSuccess,
  useResponseError,
  useResponseSuccess,
} from '../common/response.js';
import { validateGoodsPayload } from './publish.js';
import { goodsService } from './service.js';

const goodsPayloadSchema = z.object({
  name: z.string(),
  navigationPoint: z.string().optional(),
  price: z.number(),
  shelfLocation: z.string(),
  sku: z.string().optional(),
  spec: z.string().optional(),
});

export async function registerGoodsRoutes(app: FastifyInstance) {
  app.get(
    '/knowledge/goods/list',
    { preHandler: requireAuth },
    async (request) => {
      const query = request.query as {
        keyword?: string;
        page?: string;
        pageSize?: string;
      };
      const page = Number.parseInt(query.page ?? '1', 10);
      const pageSize = Number.parseInt(query.pageSize ?? '10', 10);
      const items = await goodsService.list({ keyword: query.keyword });
      return usePageResponseSuccess(page, pageSize, items);
    },
  );

  app.get(
    '/knowledge/goods/next-sku',
    { preHandler: requireAuth },
    async () => {
      const sku = await goodsService.getNextSku();
      return useResponseSuccess({ sku });
    },
  );

  app.post(
    '/knowledge/goods',
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = goodsPayloadSchema.parse(request.body);
      const errorMessage = validateGoodsPayload(body);
      if (errorMessage) {
        return reply
          .code(400)
          .send(useResponseError(errorMessage, errorMessage));
      }

      const goods = await goodsService.create({
        name: body.name.trim(),
        navigationPoint: body.navigationPoint?.trim() || undefined,
        price: body.price,
        shelfLocation: body.shelfLocation.trim(),
        sku: body.sku?.trim() || undefined,
        spec: body.spec?.trim() || undefined,
      });
      return useResponseSuccess(goods);
    },
  );

  app.put(
    '/knowledge/goods/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = goodsPayloadSchema.parse(request.body);
      const errorMessage = validateGoodsPayload(body);
      if (errorMessage) {
        return reply
          .code(400)
          .send(useResponseError(errorMessage, errorMessage));
      }

      const goods = await goodsService.update(id, {
        name: body.name.trim(),
        navigationPoint: body.navigationPoint?.trim() || undefined,
        price: body.price,
        shelfLocation: body.shelfLocation.trim(),
        spec: body.spec?.trim() || undefined,
      });

      if (!goods) {
        return reply
          .code(404)
          .send(useResponseError('NotFoundException', 'Goods not found'));
      }

      return useResponseSuccess(goods);
    },
  );

  app.post(
    '/knowledge/goods/:id/publish',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await goodsService.publish(id);
      if (!result.success) {
        return reply
          .code(400)
          .send(useResponseError(result.error, { issues: result.issues }));
      }
      return useResponseSuccess(result.data);
    },
  );

  app.post(
    '/knowledge/goods/:id/offline',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const goods = await goodsService.offline(id);
      if (!goods) {
        return reply
          .code(404)
          .send(useResponseError('NotFoundException', 'Goods not found'));
      }
      return useResponseSuccess(goods);
    },
  );
}
