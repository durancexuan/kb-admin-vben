import type { QaCategory } from '../qa/types.js';
import type { RobotLibrary } from '../robot/types.js';

export type UnifiedLibrary = RobotLibrary;

export interface QaUnifiedPayload {
  answer: string;
  category: QaCategory;
  qaId: string;
  question: string;
}

export interface GoodsUnifiedPayload {
  goodsId: string;
  name: string;
  navigationPoint: null | string;
  price: number;
  shelfLocation: string;
  sku: string;
  spec: null | string;
}

export interface CampaignUnifiedPayload {
  applicableGoods: string;
  campaignId: string;
  discount: string;
  endDate: string;
  name: string;
  startDate: string;
}

export interface RobotDocUnifiedPayload {
  body: string;
  category: string;
  docId: string;
  heading: string;
  title: string;
}

export type UnifiedPayload =
  | CampaignUnifiedPayload
  | GoodsUnifiedPayload
  | QaUnifiedPayload
  | RobotDocUnifiedPayload;

export interface UnifiedSearchHit {
  chunkIndex: number;
  embedText: string;
  id: string;
  keywordScore: number;
  library: UnifiedLibrary;
  markerText: string;
  payload: UnifiedPayload;
  sourceId: string;
  vectorScore: number;
}
