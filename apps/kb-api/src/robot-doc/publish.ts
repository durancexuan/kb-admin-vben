import type { RobotDocRow } from './types.js';

import { pickSpeakFromChunk } from './chunking.js';

export type { RobotDocChunkDraft } from './chunking.js';
export { buildChunkEmbedText, splitDocIntoChunks } from './chunking.js';

export function buildRobotDocSpeakReply(params: {
  body: string;
  heading: string;
  title: string;
  utterance?: string;
}) {
  return pickSpeakFromChunk({
    body: params.body,
    heading: params.heading,
    title: params.title,
    utterance: params.utterance ?? params.heading,
  });
}

export function validateRobotDocPublish(
  row: Pick<RobotDocRow, 'content' | 'title'>,
) {
  const issues: string[] = [];
  if (!row.title?.trim()) {
    issues.push('标题');
  } else if (row.title.trim().length > 200) {
    issues.push('标题（不超过 200 字）');
  }
  if (!row.content?.trim()) {
    issues.push('正文');
  } else if (row.content.trim().length < 20) {
    issues.push('正文（不少于 20 字）');
  }
  return issues;
}

export function formatPublishError(issues: string[]) {
  return `缺少或不符合要求的字段：${issues.join('、')}`;
}

export function validateRobotDocPayload(body: {
  category?: string;
  content?: string;
  sourceName?: string;
  title?: string;
}) {
  const title = body.title?.trim();
  const content = body.content?.trim();
  if (!title) {
    return '标题不能为空';
  }
  if (title.length > 200) {
    return '标题不能超过 200 字';
  }
  if (!content) {
    return '正文不能为空';
  }
  if (content.length < 20) {
    return '正文不能少于 20 字';
  }
  if (
    body.category &&
    !['企业通用知识', '团队与荣誉', '本站专属知识', '本站基本情况'].includes(
      body.category,
    )
  ) {
    return '分类无效';
  }
  return null;
}
