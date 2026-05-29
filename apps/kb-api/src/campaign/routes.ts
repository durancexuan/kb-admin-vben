import type { FastifyInstance } from 'fastify';

import { z } from 'zod';

import { requireAuth } from '../common/auth.js';
import {
  usePageResponseSuccess,
  useResponseError,
  useResponseSuccess,
} from '../common/response.js';
import { validateCampaignPayload } from './publish.js';
import { campaignService } from './service.js';

const campaignPayloadSchema = z.object({
  applicableGoodsIds: z.array(z.string()).min(1),
  discount: z.string(),
  endDate: z.string(),
  name: z.string(),
  startDate: z.string(),
});

export async function registerCampaignRoutes(app: FastifyInstance) {
  app.get(
    '/knowledge/campaign/list',
    { preHandler: requireAuth },
    async (request) => {
      const query = request.query as {
        keyword?: string;
        page?: string;
        pageSize?: string;
      };
      const page = Number.parseInt(query.page ?? '1', 10);
      const pageSize = Number.parseInt(query.pageSize ?? '10', 10);
      const items = await campaignService.list({ keyword: query.keyword });
      return usePageResponseSuccess(page, pageSize, items);
    },
  );

  app.get(
    '/knowledge/campaign/goods-options',
    { preHandler: requireAuth },
    async () => {
      const options = await campaignService.getGoodsOptions();
      return useResponseSuccess(options);
    },
  );

  app.post(
    '/knowledge/campaign',
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = campaignPayloadSchema.parse(request.body);
      const errorMessage = validateCampaignPayload(body);
      if (errorMessage) {
        return reply
          .code(400)
          .send(useResponseError(errorMessage, errorMessage));
      }

      try {
        const campaign = await campaignService.create({
          name: body.name.trim(),
          discount: body.discount.trim(),
          startDate: body.startDate,
          endDate: body.endDate,
          applicableGoodsIds: body.applicableGoodsIds,
        });
        return useResponseSuccess(campaign);
      } catch (error) {
        const message = error instanceof Error ? error.message : '创建活动失败';
        return reply.code(400).send(useResponseError(message, message));
      }
    },
  );

  app.put(
    '/knowledge/campaign/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = campaignPayloadSchema.parse(request.body);
      const errorMessage = validateCampaignPayload(body);
      if (errorMessage) {
        return reply
          .code(400)
          .send(useResponseError(errorMessage, errorMessage));
      }

      try {
        const campaign = await campaignService.update(id, {
          name: body.name.trim(),
          discount: body.discount.trim(),
          startDate: body.startDate,
          endDate: body.endDate,
          applicableGoodsIds: body.applicableGoodsIds,
        });
        if (!campaign) {
          return reply
            .code(404)
            .send(useResponseError('NotFoundException', 'Campaign not found'));
        }
        return useResponseSuccess(campaign);
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新活动失败';
        return reply.code(400).send(useResponseError(message, message));
      }
    },
  );

  app.delete(
    '/knowledge/campaign/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const deleted = await campaignService.remove(id);
      if (!deleted) {
        return reply
          .code(404)
          .send(useResponseError('NotFoundException', 'Campaign not found'));
      }
      return useResponseSuccess(null);
    },
  );

  app.post(
    '/knowledge/campaign/:id/publish',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await campaignService.publish(id);
      if (!result.success) {
        return reply
          .code(400)
          .send(useResponseError(result.error, { issues: result.issues }));
      }
      return useResponseSuccess(result.data);
    },
  );

  app.post(
    '/knowledge/campaign/:id/offline',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const campaign = await campaignService.offline(id);
      if (!campaign) {
        return reply
          .code(404)
          .send(useResponseError('NotFoundException', 'Campaign not found'));
      }
      return useResponseSuccess(campaign);
    },
  );
}
