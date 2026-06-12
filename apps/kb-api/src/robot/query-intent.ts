/** 用户在问站点/业务知识，而非询价、找货 */
const KNOWLEDGE_INQUIRY_PATTERNS = [
  /地址/u,
  /具体位置/u,
  /加油站.*在哪/u,
  /奥东.*在哪/u,
  /位置/u,
  /电话/u,
  /营业时间/u,
  /几点/u,
  /开门/u,
  /营业/u,
  /站经理/u,
  /站长/u,
  /是谁/u,
  /适用/u,
  /什么车/u,
  /标号/u,
  /油品/u,
  /汽油/u,
  /柴油/u,
  /充电/u,
  /新能源/u,
  /电动车/u,
  /发票/u,
  /积分/u,
  /开发票/u,
  /便利店/u,
  /售卖/u,
  /商品/u,
  /特色/u,
  /等级/u,
  /五星级/u,
  /品质/u,
  /保障/u,
  /便民/u,
  /免费/u,
  /具体位置/u,
];

/** 明确在问商品售价、货架、购买、陈列位置 */
const GOODS_PURCHASE_PATTERNS = [
  /多少钱/u,
  /什么价格/u,
  /价格多少/u,
  /怎么卖/u,
  /有卖/u,
  /卖不卖/u,
  /想买/u,
  /要买/u,
  /帮我找/u,
  /帮我拿/u,
  /货架/u,
  /导航/u,
  /SKU-/iu,
  /在哪卖/u,
];

/** 站点地址/设施问询（不走商品库） */
const STATION_LOCATION_PATTERNS = [
  /加油站/u,
  /奥东/u,
  /地址/u,
  /具体位置/u,
  /卫生间/u,
  /洗手间/u,
  /厕所/u,
];

/** 单品找货：「矿泉水在哪儿」等 */
export function isGoodsLocationInquiry(utterance: string) {
  const text = utterance.trim();
  if (!text) {
    return false;
  }
  if (!/(?:在哪儿|在哪里|在哪)/u.test(text)) {
    return false;
  }
  if (STATION_LOCATION_PATTERNS.some((pattern) => pattern.test(text))) {
    return false;
  }
  return true;
}

export function isRobotKnowledgeInquiryIntent(utterance: string) {
  const text = utterance.trim();
  if (!text) {
    return false;
  }
  return KNOWLEDGE_INQUIRY_PATTERNS.some((pattern) => pattern.test(text));
}

export function isGoodsPurchaseIntent(utterance: string) {
  const text = utterance.trim();
  if (!text) {
    return false;
  }
  return GOODS_PURCHASE_PATTERNS.some((pattern) => pattern.test(text));
}

/** 知识问询且非购买/找货意图时，不走商品库检索 */
export function shouldSuppressGoodsRetrieval(utterance: string) {
  if (isGoodsLocationInquiry(utterance) || isGoodsPurchaseIntent(utterance)) {
    return false;
  }
  return isRobotKnowledgeInquiryIntent(utterance);
}
