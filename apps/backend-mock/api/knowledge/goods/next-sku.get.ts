import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { generateNextSku } from '~/utils/knowledge-goods-store';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  return useResponseSuccess({ sku: generateNextSku() });
});
