import { eventHandler, getRouterParam, setResponseStatus } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { publishGoods } from '~/utils/knowledge-goods-store';
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

  const result = publishGoods(id);
  if (!result.success) {
    setResponseStatus(event, 400);
    return useResponseError(result.error, { issues: result.issues });
  }

  return useResponseSuccess(result.data);
});
