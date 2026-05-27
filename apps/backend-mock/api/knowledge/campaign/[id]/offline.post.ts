import { eventHandler, getRouterParam, setResponseStatus } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  formatCampaignForList,
  offlineCampaign,
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

  const campaign = offlineCampaign(id);
  if (!campaign) {
    setResponseStatus(event, 404);
    return useResponseError('NotFoundException', 'Campaign not found');
  }

  return useResponseSuccess(formatCampaignForList(campaign));
});
