import type { GoodsRow } from './types.js';

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
