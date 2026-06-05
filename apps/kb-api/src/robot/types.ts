export type RobotLibrary = 'campaign' | 'goods' | 'qa';

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
};

/** 机器人 query 只返回全局置信度最高的一条 */
export interface RobotQueryResult {
  /** 用户原话 */
  utterance: string;
  /** 是否达到命中阈值；false 时不播报 speak */
  hit: boolean;
  /** 来源库；未命中为 null */
  library: null | RobotLibrary;
  libraryLabel: null | string;
  /** 综合置信度 0~1（决选用）；无候选为 null */
  confidence: null | number;
  /**
   * 向量相似度 0~1（仅问答/商品走向量或混合检索时有值）。
   * 对接方可用于展示「语义匹配强度」；规则汇总意图无此字段。
   */
  vectorConfidence: null | number;
  /** 匹配方式；未命中为 null */
  matchType: null | RobotMatchType;
  /** 界面短标题；未命中为 null */
  display: null | string;
  /** 播报正文；未命中为 null */
  speak: null | string;
}
