/** 口语前缀，检索前剥离 */
const ORAL_PREFIX =
  /^(有没有|有吗|有卖|卖不卖|想买|要买|帮我找|帮我拿|查询|请问|我想买|我要买|我想|我要|你们|咱这|这里|店里)+/u;

/** 口语后缀，检索前剥离 */
const ORAL_SUFFIX =
  /(多少钱|什么价格|价格多少|怎么卖|有卖吗|有吗|在哪|在哪里|哪儿|吗|呢|啊|呀)+$/u;

/**
 * 商品检索用查询归一化：去掉常见口语包裹，保留核心商品词。
 * 归一化后为空则回退原话。
 */
export function normalizeGoodsUtterance(utterance: string) {
  let text = utterance.trim();
  if (!text) {
    return text;
  }

  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text.replace(ORAL_PREFIX, '').replace(ORAL_SUFFIX, '').trim();
  }

  return text || utterance.trim();
}
