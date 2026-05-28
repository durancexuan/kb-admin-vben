import type { QaCategory, QaRow } from './types.js';

export function validateQaPublish(
  qa: Pick<QaRow, 'answer' | 'category' | 'question'>,
) {
  const issues: string[] = [];
  const question = qa.question?.trim() ?? '';
  const answer = qa.answer?.trim() ?? '';

  if (!question) {
    issues.push('问题');
  } else if (question.length > 200) {
    issues.push('问题（不超过 200 字）');
  }
  if (!answer) {
    issues.push('答案');
  } else if (answer.length > 1000) {
    issues.push('答案（不超过 1000 字）');
  }
  if (!qa.category) {
    issues.push('分类');
  }
  return issues;
}

export function formatPublishError(issues: string[]) {
  return `缺少或不符合要求的字段：${issues.join('、')}`;
}

export function buildEmbedText(qa: {
  answer: string;
  category: QaCategory;
  question: string;
}) {
  return `【分类：${qa.category}】\n问：${qa.question.trim()}\n答：${qa.answer.trim()}`;
}

export function validateQaPayload(body: {
  answer?: string;
  category?: string;
  question?: string;
}) {
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
  if (
    !category ||
    !['便利店', '其他', '加油机', '卫生间', '营业时间'].includes(category)
  ) {
    return '请选择分类';
  }
  return null;
}
