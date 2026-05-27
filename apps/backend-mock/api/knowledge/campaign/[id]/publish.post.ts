import { eventHandler, getRouterParam, setResponseStatus } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  formatCampaignForList,
  publishCampaign,
} from '~/utils/knowledge-campaign-store';
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
    return useResponseError('BadRequestException', 'Campaign id is required');
  }

  const result = publishCampaign(id);
  if (!result.success) {
    setResponseStatus(event, 400);
    return useResponseError(result.error, { issues: result.issues });
  }

  return useResponseSuccess(formatCampaignForList(result.data));
});
