import { eventHandler, getRouterParam, setResponseStatus } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { offlineGoods } from '~/utils/knowledge-goods-store';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

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

  const goods = offlineGoods(id);
  if (!goods) {
    setResponseStatus(event, 404);
    return useResponseError('NotFoundException', 'Goods not found');
  }

  return useResponseSuccess(goods);
});
