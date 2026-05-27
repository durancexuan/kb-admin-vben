import { eventHandler, getRouterParam, setResponseStatus } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { deleteQa } from '~/utils/knowledge-qa-store';
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
    return useResponseError('BadRequestException', 'Qa id is required');
  }

  const deleted = deleteQa(id);
  if (!deleted) {
    setResponseStatus(event, 404);
    return useResponseError('NotFoundException', 'Qa not found');
  }

  return useResponseSuccess(null);
});
