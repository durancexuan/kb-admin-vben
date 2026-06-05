/** 归一化语义标签：去重、去空、最多 20 个 */
export function normalizeSemanticTags(
  input?: null | string | string[],
): string[] {
  if (!input) {
    return [];
  }

  const raw = Array.isArray(input) ? input : input.split(/[,，、\s/|]+/u);

  const tags: string[] = [];
  for (const item of raw) {
    const text = item.trim();
    if (text && !tags.includes(text)) {
      tags.push(text);
    }
    if (tags.length >= 20) {
      break;
    }
  }
  return tags;
}

export function formatSemanticTagsForEmbed(tags: string[]) {
  if (tags.length === 0) {
    return null;
  }
  return `语义标签：${tags.join('、')}`;
}
