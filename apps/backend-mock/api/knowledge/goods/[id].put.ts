import type { KnowledgeGoods } from '~/utils/knowledge-goods-store';

import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { updateGoods } from '~/utils/knowledge-goods-store';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

function validatePayload(body: Partial<KnowledgeGoods>) {
  const name = body.name?.trim();
  const shelfLocation = body.shelfLocation?.trim();
  const price = Number(body.price);

  if (!name) {
    return '商品名称不能为空';
  }
  if (!Number.isFinite(price) || price <= 0) {
    return '价格必须大于 0';
  }
  if (!shelfLocation) {
    return '货架位置不能为空';
  }
  return null;
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    setResponseStatus(event, 400);
    return useResponseError('BadRequestException', 'Goods id is required');
  }

  const body = await readBody<Partial<KnowledgeGoods>>(event);
  const errorMessage = validatePayload(body);
  if (errorMessage) {
    setResponseStatus(event, 400);
    return useResponseError(errorMessage, errorMessage);
  }

  const name = body.name?.trim() ?? '';
  const shelfLocation = body.shelfLocation?.trim() ?? '';
  const goods = updateGoods(id, {
    name,
    price: Number(body.price),
    shelfLocation,
    spec: body.spec?.trim() || undefined,
    navigationPoint: body.navigationPoint?.trim() || undefined,
  });

  if (!goods) {
    setResponseStatus(event, 404);
    return useResponseError('NotFoundException', 'Goods not found');
  }

  return useResponseSuccess(goods);
});
