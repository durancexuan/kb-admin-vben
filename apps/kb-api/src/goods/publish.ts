import type { GoodsRow } from './types.js';

import { resolveGoodsCategoryLabel } from './query-normalize.js';

export function validateGoodsPublish(
  goods: Pick<GoodsRow, 'name' | 'price' | 'shelf_location'>,
) {
  const issues: string[] = [];
  if (!goods.name?.trim()) {
    issues.push('商品名称');
  }
  const price = Number(goods.price);
  if (!Number.isFinite(price) || price <= 0) {
    issues.push('价格');
  }
  if (!goods.shelf_location?.trim()) {
    issues.push('货架位置');
  }
  return issues;
}

export function formatPublishError(issues: string[]) {
  return `缺少或不符合要求的字段：${issues.join('、')}`;
}

export function buildGoodsEmbedText(goods: {
  name: string;
  navigation_point?: null | string;
  shelf_location: string;
  spec?: null | string;
}) {
  const parts = [
    goods.navigation_point ? `区域：${goods.navigation_point.trim()}` : null,
    `商品：${goods.name.trim()}`,
    goods.spec ? `规格：${goods.spec.trim()}` : null,
    `货架：${goods.shelf_location.trim()}`,
  ].filter(Boolean);
  return parts.join('，');
}

export function validateGoodsPayload(body: {
  name?: string;
  price?: number;
  shelfLocation?: string;
}) {
  const name = body.name?.trim();
  const shelfLocation = body.shelfLocation?.trim();
  const price = body.price;

  if (!name) {
    return '商品名称不能为空';
  }
  if (!Number.isFinite(price) || (price ?? 0) <= 0) {
    return '价格必须大于 0';
  }
  if (!shelfLocation) {
    return '货架位置不能为空';
  }
  return null;
}

export function buildGoodsSpeakReply(goods: {
  name: string;
  navigation_point?: null | string;
  price: number | string;
  shelf_location: string;
  spec?: null | string;
}) {
  const price = Number(goods.price);
  const location = goods.navigation_point
    ? `${goods.navigation_point}，货架 ${goods.shelf_location}`
    : `货架 ${goods.shelf_location}`;
  const spec = goods.spec ? `，规格 ${goods.spec}` : '';
  return `${goods.name}${spec}，售价 ${price} 元，位于 ${location}。`;
}

export function buildGoodsCatalogSpeakReply(
  allGoods: Array<{
    name: string;
    navigation_point: null | string;
    price: number | string;
    shelf_location: string;
    sku: string;
  }>,
  tailGoods: Array<{
    name: string;
    price: number | string;
    sku: string;
  }>,
) {
  if (allGoods.length === 0) {
    return '近期暂无可售商品，欢迎常来看看。';
  }

  const groups = new Map<string, string[]>();
  for (const item of allGoods) {
    const category = resolveGoodsCategoryLabel(item);
    const names = groups.get(category) ?? [];
    names.push(item.name);
    groups.set(category, names);
  }

  const categoryParts = [...groups.entries()].map(([category, names]) => {
    const sample = names.slice(0, 2).join('、');
    const countText =
      names.length > 2 ? `等${names.length}件` : `共${names.length}件`;
    return `${category}有${sample}${countText}`;
  });

  const tailParts =
    tailGoods.length > 0
      ? tailGoods.map((item, index) => {
          const price = Number(item.price);
          return `${index + 1}、${item.name}（${item.sku}）${price} 元`;
        })
      : [];

  const categoryIntro = `本站在售共 ${groups.size} 个类目：${categoryParts.join('；')}`;
  if (tailParts.length === 0) {
    return `${categoryIntro}。`;
  }
  return `${categoryIntro}。SKU 靠后的三款：${tailParts.join('；')}。`;
}
