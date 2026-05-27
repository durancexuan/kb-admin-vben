import type { KnowledgeCampaign } from '~/utils/knowledge-campaign-store';

import { eventHandler, readBody, setResponseStatus } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  createCampaign,
  formatCampaignForList,
} from '~/utils/knowledge-campaign-store';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

function validatePayload(body: Partial<KnowledgeCampaign>) {
  const name = body.name?.trim();
  const discount = body.discount?.trim();

  if (!name) {
    return '活动名不能为空';
  }
  if (!discount) {
    return '优惠内容不能为空';
  }
  if (!body.startDate || !body.endDate) {
    return '请选择有效期';
  }
  if (!body.applicableGoodsIds?.length) {
    return '请至少选择一个适用商品';
  }
  return null;
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody<Partial<KnowledgeCampaign>>(event);
  const errorMessage = validatePayload(body);
  if (errorMessage) {
    setResponseStatus(event, 400);
    return useResponseError(errorMessage, errorMessage);
  }

  try {
    const campaign = createCampaign({
      name: body.name?.trim() ?? '',
      discount: body.discount?.trim() ?? '',
      startDate: body.startDate ?? '',
      endDate: body.endDate ?? '',
      applicableGoodsIds: body.applicableGoodsIds ?? [],
      status: 'draft',
    });
    return useResponseSuccess(formatCampaignForList(campaign));
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建活动失败';
    setResponseStatus(event, 400);
    return useResponseError(message, message);
  }
});
