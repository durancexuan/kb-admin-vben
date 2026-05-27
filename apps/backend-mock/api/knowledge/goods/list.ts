import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getGoodsStore } from '~/utils/knowledge-goods-store';
import { unAuthorizedResponse, usePageResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { keyword, page = 1, pageSize = 10 } = getQuery(event);
  let listData = structuredClone(getGoodsStore());

  if (keyword) {
    const search = String(keyword).toLowerCase();
    listData = listData.filter(
      (item) =>
        item.sku.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search),
    );
  }

  return usePageResponseSuccess(page as string, pageSize as string, listData);
});
