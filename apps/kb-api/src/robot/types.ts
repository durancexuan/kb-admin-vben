export type RobotLibrary = 'campaign' | 'goods' | 'qa' | 'robot-doc';

export type RobotMatchType =
  | 'exact'
  | 'hybrid'
  | 'intent'
  | 'keyword'
  | 'vector';

export const ROBOT_LIBRARY_LABEL: Record<RobotLibrary, string> = {
  qa: '站级问答库',
  goods: '商品全维库',
  campaign: '营销活动库',
  'robot-doc': '机器人专属知识库',
};

/** 单条命中结果（置信度 ≥ 阈值） */
export interface RobotQueryItem {
  confidence: number;
  display: string;
  library: RobotLibrary;
  libraryLabel: string;
  matchType: RobotMatchType;
  speak: string;
  vectorConfidence: null | number;
}

/** 机器人 query：最佳一条 + 最多 5 条达标候选 */
export interface RobotQueryResult {
  /** 用户原话 */
  utterance: string;
  /** 是否至少有一条达到命中阈值；false 时不播报 speak */
  hit: boolean;
  /** 来源库（最佳一条）；未命中为 null */
  library: null | RobotLibrary;
  libraryLabel: null | string;
  /** 综合置信度 0~1（最佳一条） */
  confidence: null | number;
  vectorConfidence: null | number;
  matchType: null | RobotMatchType;
  display: null | string;
  /** TTS 播报正文（最佳一条） */
  speak: null | string;
  /** 达标候选，按置信度降序，最多 5 条；未命中为空数组 */
  items: RobotQueryItem[];
}
