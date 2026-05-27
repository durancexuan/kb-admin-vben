import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  formatCampaignForList,
  getCampaignStore,
} from '~/utils/knowledge-campaign-store';
import { unAuthorizedResponse, usePageResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { keyword, page = 1, pageSize = 10 } = getQuery(event);
  let listData = getCampaignStore().map((item) => formatCampaignForList(item));

  if (keyword) {
    const search = String(keyword).toLowerCase();
    listData = listData.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.discount.toLowerCase().includes(search) ||
        item.applicableGoods.toLowerCase().includes(search),
    );
  }

  return usePageResponseSuccess(page as string, pageSize as string, listData);
});
