/** 口语前缀，检索前剥离 */
const ORAL_PREFIX =
  /^(有没有|有吗|有卖|卖不卖|想买|要买|帮我找|帮我拿|查询|请问|我想买|我要买|我想|我要|你们|咱这|这里|店里|有)+/u;

/** 口语后缀，检索前剥离 */
const ORAL_SUFFIX =
  /(多少钱|什么价格|价格多少|怎么卖|有卖吗|有吗|在哪|在哪里|哪儿|之类|之类的|什么的|什么|吗|呢|啊|呀|的)+$/u;

/** 句中口语片段（循环剥离） */
const ORAL_INLINE = /(之类|之类的|什么的|什么的|大概|差不多|之类东西)/gu;

/**
 * 口语类目 → 检索关键词（匹配商品名、navigation_point、shelf_location 等）
 */
const GOODS_CATEGORY_ALIASES: Record<string, string[]> = {
  喝: ['饮料', '饮料区'],
  喝的: ['饮料', '饮料区'],
  有喝: ['饮料', '饮料区'],
  有喝的: ['饮料', '饮料区'],
  饮品: ['饮料', '饮料区'],
  饮料: ['饮料', '饮料区'],
  水: ['矿泉水', '农夫山泉', '饮料'],
  矿泉水: ['矿泉水', '饮料'],
  可乐: ['可口可乐', '百事可乐', '可乐', '饮料'],
  吃: ['热食', '食品', '零食'],
  吃的: ['热食', '食品', '零食'],
  零食: ['零食', '士力架', '关东煮'],
  泡面: ['康师傅', '红烧牛肉面', '方便面'],
  方便面: ['康师傅', '方便面'],
  加油: ['汽油', '柴油', '92', '95'],
};

/** 句中包含即触发类目扩展（语义/关键词共用） */
const CATEGORY_HINT_PATTERNS: Array<{
  aliases: string[];
  pattern: RegExp;
}> = [
  {
    pattern: /饮料|饮品|喝|可乐|矿泉水|苏打|果汁/,
    aliases: ['饮料', '饮料区'],
  },
  { pattern: /零食|薯片|巧克力|坚果/, aliases: ['零食', '食品'] },
  { pattern: /吃|热食|便当|泡面|方便面/, aliases: ['热食', '食品', '零食'] },
  { pattern: /加油|汽油|柴油|92|95|98/, aliases: ['汽油', '柴油', '加油'] },
];

/**
 * 商品检索用查询归一化：去掉常见口语包裹，保留核心商品词。
 */
export function normalizeGoodsUtterance(utterance: string) {
  let text = utterance.trim();
  if (!text) {
    return text;
  }

  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text
      .replace(ORAL_PREFIX, '')
      .replace(ORAL_SUFFIX, '')
      .replaceAll(ORAL_INLINE, '')
      .trim();
  }

  return text || utterance.trim();
}

export function resolveCategoryAliases(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }

  if (GOODS_CATEGORY_ALIASES[trimmed]) {
    return GOODS_CATEGORY_ALIASES[trimmed];
  }

  const withoutLeadingYou = trimmed.replace(/^有/u, '').trim();
  if (withoutLeadingYou && GOODS_CATEGORY_ALIASES[withoutLeadingYou]) {
    return GOODS_CATEGORY_ALIASES[withoutLeadingYou];
  }

  for (const { pattern, aliases } of CATEGORY_HINT_PATTERNS) {
    if (pattern.test(trimmed) || pattern.test(withoutLeadingYou)) {
      return aliases;
    }
  }

  return undefined;
}

/**
 * 生成商品关键词检索用的多条查询词（原话 + 归一化 + 类目扩展）。
 */
export function expandGoodsSearchQueries(utterance: string) {
  const raw = utterance.trim();
  const normalized = normalizeGoodsUtterance(raw);
  const queries: string[] = [];

  const push = (value: string) => {
    const text = value.trim();
    if (text && !queries.includes(text)) {
      queries.push(text);
    }
  };

  push(normalized);
  push(raw);

  const aliasSources = [normalized, raw];
  for (const source of aliasSources) {
    const aliases = resolveCategoryAliases(source);
    if (aliases) {
      for (const alias of aliases) {
        push(alias);
      }
    }
  }

  return queries;
}

/**
 * 向量/语义检索用的多条表述（原话 + 归一化 + 类目词 + 场景描述）。
 * 关键词未命中时，靠多路向量取最佳语义匹配。
 */
export function goodsSemanticEmbedTexts(utterance: string) {
  const raw = utterance.trim();
  const normalized = normalizeGoodsUtterance(raw);
  const texts: string[] = [];

  const push = (value: string) => {
    const text = value.trim();
    if (text && !texts.includes(text)) {
      texts.push(text);
    }
  };

  push(raw);
  push(normalized);

  for (const source of [normalized, raw]) {
    const aliases = resolveCategoryAliases(source);
    if (aliases) {
      for (const alias of aliases) {
        push(alias);
      }
      push(`${aliases[0]} 商品`);
    }
  }

  return texts;
}

/** @deprecated 使用 goodsSemanticEmbedTexts；保留兼容 */
export function goodsEmbedQueryText(utterance: string) {
  return goodsSemanticEmbedTexts(utterance)[0] ?? utterance.trim();
}

/** 用户询问「近期有什么商品」等，走在售汇总而非单品检索 */
const GOODS_CATALOG_INQUIRY_PATTERNS = [
  /近期.*商品/u,
  /最近.*商品/u,
  /有什么商品/u,
  /有哪些商品/u,
  /商品.*有哪些/u,
  /店里.*商品/u,
  /在售.*商品/u,
  /卖什么商品/u,
];

export function isGoodsCatalogInquiryIntent(utterance: string) {
  const text = utterance.trim();
  if (!text) {
    return false;
  }
  if (GOODS_CATALOG_INQUIRY_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }
  return /^(近期|最近).*(有什么|有哪些)/u.test(text) && /商品/u.test(text);
}

/** 商品汇总问询固定置信度 */
export const GOODS_CATALOG_INQUIRY_CONFIDENCE = 0.92;

/** 汇总播报时取 SKU 编号最大的条数 */
export const GOODS_CATALOG_TAIL_SKU_COUNT = 3;

export function parseGoodsSkuNumber(sku: string) {
  const matched = sku.match(/SKU-(\d+)/i);
  return matched ? Number(matched[1]) : 0;
}

/** 类目标签：优先导航点位，否则按货架区推断 */
export function resolveGoodsCategoryLabel(goods: {
  navigation_point: null | string;
  shelf_location: string;
}) {
  const navigation = goods.navigation_point?.trim();
  if (navigation) {
    return navigation;
  }

  const zone = goods.shelf_location.trim().charAt(0).toUpperCase();
  const zoneNames: Record<string, string> = {
    A: '加油区',
    B: '便利店',
    C: '汽配区',
    D: '餐饮区',
    E: '服务区',
  };
  return zoneNames[zone] ?? '其他';
}
