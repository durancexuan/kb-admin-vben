import type { KnowledgeQa } from '~/utils/knowledge-qa-store';

import { eventHandler, readBody, setResponseStatus } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { createQa, isValidCategory } from '~/utils/knowledge-qa-store';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

function validatePayload(body: Partial<KnowledgeQa>) {
  const question = body.question?.trim();
  const answer = body.answer?.trim();
  const category = body.category;

  if (!question) {
    return '问题不能为空';
  }
  if (question.length > 200) {
    return '问题不能超过 200 字';
  }
  if (!answer) {
    return '答案不能为空';
  }
  if (answer.length > 1000) {
    return '答案不能超过 1000 字';
  }
  if (!category || !isValidCategory(String(category))) {
    return '请选择分类';
  }
  return null;
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody<Partial<KnowledgeQa>>(event);
  const errorMessage = validatePayload(body);
  if (errorMessage) {
    setResponseStatus(event, 400);
    return useResponseError(errorMessage, errorMessage);
  }

  const question = body.question?.trim() ?? '';
  const answer = body.answer?.trim() ?? '';
  const qa = createQa({
    question,
    answer,
    category: body.category as KnowledgeQa['category'],
  });

  return useResponseSuccess(qa);
});
