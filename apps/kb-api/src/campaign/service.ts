import { config } from '../config.js';
import {
  buildCampaignRecentSpeakReply,
  formatPublishError,
  validateCampaignPublish,
} from './publish.js';
import {
  CAMPAIGN_INQUIRY_CONFIDENCE,
  CAMPAIGN_INQUIRY_RECENT_LIMIT,
  isCampaignInquiryIntent,
} from './query-normalize.js';
import {
  countGoodsByIds,
  createCampaign,
  deleteCampaign,
  findCampaignById,
  getCampaignGoodsIds,
  listActiveOnlineCampaigns,
  listCampaignRows,
  listGoodsOptions,
  resolveGoodsNames,
  searchCampaignByKeyword,
  setCampaignStatus,
  updateCampaign,
} from './repository.js';
import { toCampaignRecord } from './types.js';

export class CampaignService {
  private stationId = config.DEFAULT_STATION_ID;

  async create(payload: {
    applicableGoodsIds: string[];
    discount: string;
    endDate: string;
    name: string;
    startDate: string;
  }) {
    const goodsError = await this.validateGoodsIds(payload.applicableGoodsIds);
    if (goodsError) {
      throw new Error(goodsError);
    }

    const row = await createCampaign({
      ...payload,
      stationId: this.stationId,
    });
    const record = await this.toRecord(row);
    if (!record) {
      throw new Error('Failed to create campaign');
    }
    return record;
  }

  async getGoodsOptions() {
    return listGoodsOptions(this.stationId);
  }

  async list(params: { keyword?: string }) {
    const rows = await listCampaignRows({
      keyword: params.keyword,
      stationId: this.stationId,
    });
    const items = await Promise.all(
      rows.map(async (row) => {
        const applicableGoodsIds = await getCampaignGoodsIds(row.id);
        const applicableGoods = await resolveGoodsNames(applicableGoodsIds);
        return toCampaignRecord(row, applicableGoodsIds, applicableGoods);
      }),
    );
    return items;
  }

  async offline(id: string) {
    const row = await findCampaignById(id, this.stationId);
    if (!row) {
      return null;
    }
    const updated = await setCampaignStatus(id, 'offline', this.stationId);
    return this.toRecord(updated);
  }

  async publish(id: string) {
    const row = await findCampaignById(id, this.stationId);
    if (!row) {
      return { error: '活动不存在', success: false as const };
    }

    const applicableGoodsIds = await getCampaignGoodsIds(id);
    const issues = validateCampaignPublish({
      ...row,
      applicableGoodsIds,
    });
    if (issues.length > 0) {
      return {
        error: formatPublishError(issues),
        issues,
        success: false as const,
      };
    }

    const updated = await setCampaignStatus(id, 'online', this.stationId);
    if (!updated) {
      return { error: '活动不存在', success: false as const };
    }
    const data = await this.toRecord(updated);
    if (!data) {
      return { error: '活动不存在', success: false as const };
    }
    return { data, success: true as const };
  }

  async remove(id: string) {
    return deleteCampaign(id, this.stationId);
  }

  async retrieve(params: { topK?: number; utterance: string }) {
    const topK = params.topK ?? 5;
    const utterance = params.utterance.trim();
    if (!utterance) {
      return { hit: false as const, items: [] };
    }

    if (isCampaignInquiryIntent(utterance)) {
      return this.retrieveCampaignInquiry();
    }

    const hits = await searchCampaignByKeyword({
      limit: topK,
      queryText: utterance,
      stationId: this.stationId,
    });

    const items = hits.map((item) => ({
      applicableGoods: item.applicableGoods,
      confidence: Number(item.score.toFixed(4)),
      discount: item.discount,
      id: item.id,
      matchType: 'keyword' as const,
      name: item.name,
      speak: undefined as string | undefined,
    }));

    const best = items[0];
    const hit = Boolean(best && best.confidence >= config.MIN_RETRIEVE_SCORE);

    return { hit, items };
  }

  async update(
    id: string,
    payload: {
      applicableGoodsIds: string[];
      discount: string;
      endDate: string;
      name: string;
      startDate: string;
    },
  ) {
    const existing = await findCampaignById(id, this.stationId);
    if (!existing) {
      return null;
    }

    const goodsError = await this.validateGoodsIds(payload.applicableGoodsIds);
    if (goodsError) {
      throw new Error(goodsError);
    }

    const row = await updateCampaign(id, {
      ...payload,
      stationId: this.stationId,
    });
    return this.toRecord(row);
  }

  private async retrieveCampaignInquiry() {
    const campaigns = await listActiveOnlineCampaigns({
      limit: CAMPAIGN_INQUIRY_RECENT_LIMIT,
      stationId: this.stationId,
    });
    const speak = buildCampaignRecentSpeakReply(
      campaigns,
      CAMPAIGN_INQUIRY_RECENT_LIMIT,
    );
    const confidence = CAMPAIGN_INQUIRY_CONFIDENCE;
    const hit = confidence >= config.MIN_RETRIEVE_SCORE;
    const primary = campaigns[0];

    return {
      hit,
      items: [
        {
          applicableGoods: primary?.applicableGoods ?? '',
          confidence,
          discount: primary?.discount ?? '',
          id: primary?.id ?? '',
          matchType: 'intent' as const,
          name: primary
            ? `近期活动（${Math.min(campaigns.length, CAMPAIGN_INQUIRY_RECENT_LIMIT)}条）`
            : '近期活动',
          speak,
          vectorConfidence: undefined,
        },
      ],
    };
  }

  private async toRecord(row: Awaited<ReturnType<typeof findCampaignById>>) {
    if (!row) {
      return null;
    }
    const applicableGoodsIds = await getCampaignGoodsIds(row.id);
    const applicableGoods = await resolveGoodsNames(applicableGoodsIds);
    return toCampaignRecord(row, applicableGoodsIds, applicableGoods);
  }

  private async validateGoodsIds(goodsIds: string[]) {
    if (goodsIds.length === 0) {
      return '请至少选择一个适用商品';
    }
    const count = await countGoodsByIds(goodsIds, this.stationId);
    if (count !== goodsIds.length) {
      return '适用商品不存在';
    }
    return null;
  }
}

export const campaignService = new CampaignService();
