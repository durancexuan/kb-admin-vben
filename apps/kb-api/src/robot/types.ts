export type RobotLibrary = 'campaign' | 'goods' | 'qa';

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
  /** 最佳匹配置信度 0~1；无候选为 null */
  confidence: null | number;
  /** 界面短标题；未命中为 null */
  display: null | string;
  /** 播报正文；未命中为 null */
  speak: null | string;
}
