/** 用户询问「有没有活动 / 促销」等，走活动库汇总而非按活动名关键词匹配 */
const CAMPAIGN_INQUIRY_PATTERNS = [
  /近期.*活动/u,
  /最近.*活动/u,
  /有没有.*活动/u,
  /有.*活动[吗嘛]?/u,
  /什么活动/u,
  /哪些活动/u,
  /活动.*有哪些/u,
  /优惠活动/u,
  /促销活动/u,
  /促销/u,
  /打折/u,
  /满减/u,
  /^活动[吗嘛]?$/u,
];

export function isCampaignInquiryIntent(utterance: string) {
  const text = utterance.trim();
  if (!text) {
    return false;
  }
  return CAMPAIGN_INQUIRY_PATTERNS.some((pattern) => pattern.test(text));
}

/** 活动汇总问询的固定置信度，需高于常见 QA 弱匹配 */
export const CAMPAIGN_INQUIRY_CONFIDENCE = 0.92;

/** 活动汇总问询播报条数（按开始时间由晚到早） */
export const CAMPAIGN_INQUIRY_RECENT_LIMIT = 3;
