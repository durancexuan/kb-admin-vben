import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getGoodsStore } from '~/utils/knowledge-goods-store';
import { unAuthorizedResponse, usePageResponseSuccess } from '~/utils/response';

function compareGoodsDesc(
  a: { id: string; sku: string },
  b: { id: string; sku: string },
) {
  const skuA = Number.parseInt(a.sku.replace(/^SKU-/i, ''), 10);
  const skuB = Number.parseInt(b.sku.replace(/^SKU-/i, ''), 10);
  if (Number.isFinite(skuA) && Number.isFinite(skuB) && skuA !== skuB) {
    return skuB - skuA;
  }
  const idA = Number.parseInt(a.id, 10);
  const idB = Number.parseInt(b.id, 10);
  if (Number.isFinite(idA) && Number.isFinite(idB)) {
    return idB - idA;
  }
  return b.id.localeCompare(a.id);
}

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

  listData.sort(compareGoodsDesc);

  return usePageResponseSuccess(page as string, pageSize as string, listData);
});
