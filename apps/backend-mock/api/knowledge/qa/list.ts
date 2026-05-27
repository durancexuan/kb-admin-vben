import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getQaStore, isValidCategory } from '~/utils/knowledge-qa-store';
import { unAuthorizedResponse, usePageResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { category, keyword, page = 1, pageSize = 10 } = getQuery(event);
  let listData = structuredClone(getQaStore());

  if (category && isValidCategory(String(category))) {
    listData = listData.filter((item) => item.category === category);
  }

  if (keyword) {
    const search = String(keyword).toLowerCase();
    listData = listData.filter(
      (item) =>
        item.question.toLowerCase().includes(search) ||
        item.answer.toLowerCase().includes(search),
    );
  }

  return usePageResponseSuccess(page as string, pageSize as string, listData);
});
