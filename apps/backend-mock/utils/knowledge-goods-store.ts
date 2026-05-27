import { formatPublishError, validateGoodsPublish } from './knowledge-publish';

export type GoodsStatus = 'draft' | 'offline' | 'online';

export interface KnowledgeGoods {
  id: string;
  name: string;
  navigationPoint?: string;
  price: number;
  shelfLocation: string;
  sku: string;
  spec?: string;
  status: GoodsStatus;
}

const INITIAL_GOODS: KnowledgeGoods[] = [
  {
    id: '1',
    sku: 'SKU-0001',
    name: '92# 汽油',
    price: 7.89,
    shelfLocation: 'A-01',
    spec: '92号',
    navigationPoint: '加油区-1号机',
    status: 'online',
  },
  {
    id: '2',
    sku: 'SKU-0002',
    name: '95# 汽油',
    price: 8.56,
    shelfLocation: 'A-02',
    spec: '95号',
    navigationPoint: '加油区-2号机',
    status: 'online',
  },
  {
    id: '3',
    sku: 'SKU-0003',
    name: '98# 汽油',
    price: 9.12,
    shelfLocation: 'A-03',
    spec: '98号',
    navigationPoint: '加油区-3号机',
    status: 'draft',
  },
  {
    id: '4',
    sku: 'SKU-0004',
    name: '0# 柴油',
    price: 7.45,
    shelfLocation: 'A-04',
    spec: '0号',
    navigationPoint: '加油区-4号机',
    status: 'online',
  },
  {
    id: '5',
    sku: 'SKU-0005',
    name: '矿泉水 550ml',
    price: 2,
    shelfLocation: 'B-01',
    spec: '550ml',
    navigationPoint: '便利店-饮料区',
    status: 'online',
  },
  {
    id: '6',
    sku: 'SKU-0006',
    name: '可口可乐 500ml',
    price: 3.5,
    shelfLocation: 'B-02',
    spec: '500ml',
    navigationPoint: '便利店-饮料区',
    status: 'online',
  },
  {
    id: '7',
    sku: 'SKU-0007',
    name: '康师傅红烧牛肉面',
    price: 4.5,
    shelfLocation: 'B-03',
    spec: '桶装',
    navigationPoint: '便利店-速食区',
    status: 'offline',
  },
  {
    id: '8',
    sku: 'SKU-0008',
    name: '士力架 51g',
    price: 5,
    shelfLocation: 'B-04',
    spec: '51g',
    navigationPoint: '便利店-零食区',
    status: 'draft',
  },
  {
    id: '9',
    sku: 'SKU-0009',
    name: '红牛 250ml',
    price: 6,
    shelfLocation: 'B-05',
    spec: '250ml',
    navigationPoint: '便利店-饮料区',
    status: 'online',
  },
  {
    id: '10',
    sku: 'SKU-0010',
    name: '玻璃水 2L',
    price: 12,
    shelfLocation: 'C-01',
    spec: '2L',
    navigationPoint: '汽配区-货架1',
    status: 'online',
  },
  {
    id: '11',
    sku: 'SKU-0011',
    name: '机油 5W-30 4L',
    price: 168,
    shelfLocation: 'C-02',
    spec: '4L',
    navigationPoint: '汽配区-货架2',
    status: 'draft',
  },
  {
    id: '12',
    sku: 'SKU-0012',
    name: '车载充电器',
    price: 29.9,
    shelfLocation: 'C-03',
    spec: '双口USB',
    navigationPoint: '汽配区-货架3',
    status: 'offline',
  },
  {
    id: '13',
    sku: 'SKU-0013',
    name: '湿纸巾 80抽',
    price: 8.9,
    shelfLocation: 'B-06',
    status: 'online',
  },
  {
    id: '14',
    sku: 'SKU-0014',
    name: '一次性纸杯 50只',
    price: 6.5,
    shelfLocation: 'B-07',
    status: 'online',
  },
  {
    id: '15',
    sku: 'SKU-0015',
    name: '尿素溶液 10kg',
    price: 35,
    shelfLocation: 'C-04',
    status: 'draft',
  },
  {
    id: '16',
    sku: 'SKU-0016',
    name: '热狗',
    price: 6,
    shelfLocation: 'D-01',
    navigationPoint: '餐饮区-热食柜',
    status: 'online',
  },
  {
    id: '17',
    sku: 'SKU-0017',
    name: '茶叶蛋',
    price: 2.5,
    shelfLocation: 'D-02',
    navigationPoint: '餐饮区-热食柜',
    status: 'online',
  },
  {
    id: '18',
    sku: 'SKU-0018',
    name: '关东煮-鱼豆腐',
    price: 3,
    shelfLocation: 'D-03',
    navigationPoint: '餐饮区-关东煮',
    status: 'offline',
  },
  {
    id: '19',
    sku: 'SKU-0019',
    name: '洗车券',
    price: 15,
    shelfLocation: 'E-01',
    navigationPoint: '服务区-洗车点',
    status: 'online',
  },
  {
    id: '20',
    sku: 'SKU-0020',
    name: '加油卡充值 100元',
    price: 100,
    shelfLocation: 'E-02',
    navigationPoint: '收银台',
    status: 'online',
  },
  {
    id: '21',
    sku: 'SKU-0021',
    name: '百事可乐 500ml',
    price: 3,
    shelfLocation: 'B-08',
    status: 'draft',
  },
  {
    id: '22',
    sku: 'SKU-0022',
    name: '脉动 600ml',
    price: 4,
    shelfLocation: 'B-09',
    status: 'online',
  },
  {
    id: '23',
    sku: 'SKU-0023',
    name: '农夫山泉 550ml',
    price: 2,
    shelfLocation: 'B-10',
    status: 'online',
  },
  {
    id: '24',
    sku: 'SKU-0024',
    name: '冰红茶 500ml',
    price: 3.5,
    shelfLocation: 'B-11',
    status: 'offline',
  },
  {
    id: '25',
    sku: 'SKU-0025',
    name: '防冻液 -35℃ 4L',
    price: 45,
    shelfLocation: 'C-05',
    status: 'draft',
  },
];

let goodsStore: KnowledgeGoods[] = structuredClone(INITIAL_GOODS);

export function getGoodsStore() {
  return goodsStore;
}

export function generateNextSku() {
  let maxNo = 0;
  for (const item of goodsStore) {
    const match = item.sku.match(/^SKU-(\d+)$/);
    if (!match) continue;
    const skuNo = match[1];
    if (!skuNo) continue;
    maxNo = Math.max(maxNo, Number.parseInt(skuNo, 10));
  }
  return `SKU-${String(maxNo + 1).padStart(4, '0')}`;
}

export function createGoods(
  payload: Omit<KnowledgeGoods, 'id' | 'sku' | 'status'> & {
    sku?: string;
    status?: GoodsStatus;
  },
) {
  const goods: KnowledgeGoods = {
    id: String(Date.now()),
    sku: payload.sku ?? generateNextSku(),
    name: payload.name,
    price: payload.price,
    shelfLocation: payload.shelfLocation,
    spec: payload.spec,
    navigationPoint: payload.navigationPoint,
    status: payload.status ?? 'draft',
  };
  goodsStore = [goods, ...goodsStore];
  return goods;
}

export function publishGoods(id: string) {
  const index = goodsStore.findIndex((item) => item.id === id);
  if (index === -1) return { error: '商品不存在', success: false as const };

  const current = goodsStore[index];
  if (!current) return { error: '商品不存在', success: false as const };

  const issues = validateGoodsPublish(current);
  if (issues.length > 0) {
    return {
      error: formatPublishError(issues),
      issues,
      success: false as const,
    };
  }

  const online: KnowledgeGoods = { ...current, status: 'online' };
  goodsStore[index] = online;
  return { data: online, success: true as const };
}

export function offlineGoods(id: string) {
  const index = goodsStore.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const current = goodsStore[index];
  if (!current) return null;

  const offline: KnowledgeGoods = { ...current, status: 'offline' };
  goodsStore[index] = offline;
  return offline;
}

export function updateGoods(
  id: string,
  payload: Partial<
    Omit<KnowledgeGoods, 'id' | 'sku' | 'status'> & { status?: GoodsStatus }
  >,
) {
  const index = goodsStore.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = goodsStore[index];
  if (!current) return null;

  const updated: KnowledgeGoods = {
    ...current,
    ...payload,
    id: current.id,
    sku: current.sku,
  };
  goodsStore[index] = updated;
  return updated;
}

export function resetGoodsStore() {
  goodsStore = structuredClone(INITIAL_GOODS);
}
