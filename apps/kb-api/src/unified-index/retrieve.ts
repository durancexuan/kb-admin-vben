import type { QaCategory } from '../qa/types.js';
import type {
  RobotMatchType,
  RobotQueryItem,
  RobotQueryResult,
} from '../robot/types.js';
import type {
  CampaignUnifiedPayload,
  GoodsUnifiedPayload,
  QaUnifiedPayload,
  RobotDocUnifiedPayload,
  UnifiedLibrary,
  UnifiedSearchHit,
} from './types.js';

import {
  buildCampaignRecentSpeakReply,
  buildCampaignSpeakReply,
} from '../campaign/publish.js';
import {
  CAMPAIGN_INQUIRY_CONFIDENCE,
  CAMPAIGN_INQUIRY_RECENT_LIMIT,
  isCampaignInquiryIntent,
} from '../campaign/query-normalize.js';
import { listActiveOnlineCampaigns } from '../campaign/repository.js';
import { config } from '../config.js';
import { embeddingService } from '../embedding/embedding.service.js';
import { buildGoodsSpeakReply } from '../goods/publish.js';
import {
  expandGoodsSearchQueries,
  GOODS_CATALOG_INQUIRY_CONFIDENCE,
  isGoodsCatalogInquiryIntent,
  normalizeGoodsUtterance,
} from '../goods/query-normalize.js';
import { findGoodsBySku, listOnlineGoods } from '../goods/repository.js';
import { buildRobotDocSpeakReply } from '../robot-doc/publish.js';
import { shouldSuppressGoodsRetrieval } from '../robot/query-intent.js';
import { ROBOT_LIBRARY_LABEL } from '../robot/types.js';
import {
  countUnifiedIndex,
  searchUnifiedByKeyword,
  searchUnifiedByVector,
} from './repository.js';

interface RankedAnswer {
  confidence: number;
  display: string;
  library: UnifiedLibrary;
  matchType: RobotMatchType;
  speak: string;
  vectorConfidence?: number;
}

const LIBRARY_PRIORITY: Record<UnifiedLibrary, number> = {
  goods: 0,
  qa: 1,
  'robot-doc': 2,
  campaign: 3,
};

function roundConfidence(value: number) {
  return Number(value.toFixed(4));
}

function compareRanked(a: RankedAnswer, b: RankedAnswer) {
  if (b.confidence !== a.confidence) {
    return b.confidence - a.confidence;
  }
  return LIBRARY_PRIORITY[a.library] - LIBRARY_PRIORITY[b.library];
}

function mergeHybridScore(keywordScore: number, vectorScore: number) {
  if (keywordScore <= 0) {
    return vectorScore;
  }
  if (vectorScore <= 0) {
    return keywordScore * 0.35;
  }
  return keywordScore * 0.35 + vectorScore * 0.65;
}

function resolveSpeak(hit: UnifiedSearchHit, utterance: string) {
  const payload = hit.payload;
  switch (hit.library) {
    case 'campaign': {
      const campaign = payload as CampaignUnifiedPayload;
      return buildCampaignSpeakReply(campaign);
    }
    case 'goods': {
      const goods = payload as GoodsUnifiedPayload;
      return buildGoodsSpeakReply({
        name: goods.name,
        navigation_point: goods.navigationPoint,
        price: goods.price,
        shelf_location: goods.shelfLocation,
        spec: goods.spec,
      });
    }
    case 'qa': {
      const qa = payload as QaUnifiedPayload;
      return qa.answer;
    }
    case 'robot-doc': {
      const doc = payload as RobotDocUnifiedPayload;
      return buildRobotDocSpeakReply({
        body: doc.body,
        heading: doc.heading,
        title: doc.title,
        utterance,
      });
    }
    default: {
      return hit.markerText;
    }
  }
}

function resolveDisplay(hit: UnifiedSearchHit) {
  if (hit.library === 'qa') {
    return (hit.payload as QaUnifiedPayload).question;
  }
  if (hit.library === 'robot-doc') {
    const doc = hit.payload as RobotDocUnifiedPayload;
    return doc.heading || doc.title;
  }
  return hit.markerText;
}

function toRanked(hit: UnifiedSearchHit, utterance: string): RankedAnswer {
  const confidence = mergeHybridScore(hit.keywordScore, hit.vectorScore);
  let matchType: RobotMatchType = 'keyword';
  if (hit.keywordScore > 0 && hit.vectorScore > 0) {
    matchType = 'hybrid';
  } else if (hit.vectorScore > 0) {
    matchType = 'vector';
  }

  return {
    library: hit.library,
    confidence,
    display: resolveDisplay(hit),
    matchType,
    speak: resolveSpeak(hit, utterance),
    vectorConfidence: hit.vectorScore > 0 ? hit.vectorScore : undefined,
  };
}

function mergeHits(
  keywordHits: UnifiedSearchHit[],
  vectorHits: UnifiedSearchHit[],
) {
  const merged = new Map<string, UnifiedSearchHit>();
  const keyOf = (hit: UnifiedSearchHit) =>
    `${hit.library}:${hit.sourceId}:${hit.chunkIndex}`;

  for (const hit of keywordHits) {
    merged.set(keyOf(hit), { ...hit });
  }

  for (const hit of vectorHits) {
    const key = keyOf(hit);
    const existing = merged.get(key);
    if (existing) {
      existing.vectorScore = Math.max(existing.vectorScore, hit.vectorScore);
      continue;
    }
    merged.set(key, { ...hit });
  }

  return [...merged.values()];
}

async function collectIntentCandidates(
  utterance: string,
  stationId: string,
): Promise<RankedAnswer[]> {
  const candidates: RankedAnswer[] = [];

  if (isCampaignInquiryIntent(utterance)) {
    const campaigns = await listActiveOnlineCampaigns({
      limit: CAMPAIGN_INQUIRY_RECENT_LIMIT,
      stationId,
    });
    const speak = buildCampaignRecentSpeakReply(
      campaigns,
      CAMPAIGN_INQUIRY_RECENT_LIMIT,
    );
    candidates.push({
      library: 'campaign',
      confidence: CAMPAIGN_INQUIRY_CONFIDENCE,
      display: `近期活动（${Math.min(campaigns.length, CAMPAIGN_INQUIRY_RECENT_LIMIT)}条）`,
      matchType: 'intent',
      speak,
    });
  }

  if (!shouldSuppressGoodsRetrieval(utterance)) {
    const normalized = normalizeGoodsUtterance(utterance);
    const skuMatch = normalized.match(/SKU-\d+/i);
    if (skuMatch) {
      const goods = await findGoodsBySku(skuMatch[0], stationId);
      if (goods) {
        candidates.push({
          library: 'goods',
          confidence: 1,
          display: goods.name,
          matchType: 'exact',
          speak: buildGoodsSpeakReply(goods),
        });
      }
    }

    if (isGoodsCatalogInquiryIntent(utterance)) {
      const allGoods = await listOnlineGoods(stationId);
      candidates.push({
        library: 'goods',
        confidence: GOODS_CATALOG_INQUIRY_CONFIDENCE,
        display: `在售商品（${allGoods.length}件）`,
        matchType: 'intent',
        speak:
          allGoods.length > 0
            ? `本站在售共 ${allGoods.length} 件商品，欢迎到店选购。`
            : '近期暂无可售商品，欢迎常来看看。',
      });
    }
  }

  return candidates;
}

async function searchUnifiedCandidates(params: {
  category?: QaCategory;
  stationId: string;
  utterance: string;
}) {
  const topK = config.ROBOT_RESULT_TOP_K;
  const excludeLibraries = shouldSuppressGoodsRetrieval(params.utterance)
    ? (['goods'] as UnifiedLibrary[])
    : undefined;

  const searchTexts = shouldSuppressGoodsRetrieval(params.utterance)
    ? [params.utterance]
    : expandGoodsSearchQueries(params.utterance);

  const keywordHits = await searchUnifiedByKeyword({
    stationId: params.stationId,
    queryText: params.utterance,
    limit: topK * 3,
    excludeLibraries,
    qaCategory: params.category,
  });

  const indexCount = await countUnifiedIndex(params.stationId);
  const vectorHitGroups =
    indexCount > 0
      ? await Promise.all(
          searchTexts.map(async (text) => {
            const vector = await embeddingService.embed(text);
            return searchUnifiedByVector({
              stationId: params.stationId,
              vector,
              limit: topK * 3,
              excludeLibraries,
              qaCategory: params.category,
              toPgVector: (value) => embeddingService.toPgVector(value),
            });
          }),
        )
      : [];

  const vectorHits: UnifiedSearchHit[] = [];
  for (const hit of vectorHitGroups.flat()) {
    const key = `${hit.library}:${hit.sourceId}:${hit.chunkIndex}`;
    const existing = vectorHits.find(
      (item) => `${item.library}:${item.sourceId}:${item.chunkIndex}` === key,
    );
    if (existing) {
      existing.vectorScore = Math.max(existing.vectorScore, hit.vectorScore);
      continue;
    }
    vectorHits.push({ ...hit });
  }

  return mergeHits(keywordHits, vectorHits);
}

function toQueryItem(item: RankedAnswer): RobotQueryItem {
  return {
    library: item.library,
    libraryLabel: ROBOT_LIBRARY_LABEL[item.library],
    confidence: roundConfidence(item.confidence),
    vectorConfidence:
      item.vectorConfidence === undefined
        ? null
        : roundConfidence(item.vectorConfidence),
    matchType: item.matchType,
    display: item.display,
    speak: item.speak,
  };
}

function buildMiss(utterance: string): RobotQueryResult {
  return {
    utterance,
    hit: false,
    library: null,
    libraryLabel: null,
    confidence: null,
    vectorConfidence: null,
    matchType: null,
    display: null,
    speak: null,
    items: [],
  };
}

function buildResult(
  utterance: string,
  hits: RankedAnswer[],
  bestBelow: null | RankedAnswer,
): RobotQueryResult {
  if (hits.length === 0) {
    if (!bestBelow) {
      return buildMiss(utterance);
    }
    return {
      utterance,
      hit: false,
      library: null,
      libraryLabel: null,
      confidence: roundConfidence(bestBelow.confidence),
      vectorConfidence:
        bestBelow.vectorConfidence === undefined
          ? null
          : roundConfidence(bestBelow.vectorConfidence),
      matchType: bestBelow.matchType,
      display: null,
      speak: null,
      items: [],
    };
  }

  const best = hits[0];
  if (!best) {
    return buildMiss(utterance);
  }
  return {
    utterance,
    hit: true,
    library: best.library,
    libraryLabel: ROBOT_LIBRARY_LABEL[best.library],
    confidence: roundConfidence(best.confidence),
    vectorConfidence:
      best.vectorConfidence === undefined
        ? null
        : roundConfidence(best.vectorConfidence),
    matchType: best.matchType,
    display: best.display,
    speak: best.speak,
    items: hits.map((item) => toQueryItem(item)),
  };
}

function dedupeCandidates(candidates: RankedAnswer[]) {
  const seen = new Set<string>();
  const result: RankedAnswer[] = [];
  for (const item of candidates.toSorted(compareRanked)) {
    const key = `${item.library}:${item.display}:${item.speak.slice(0, 80)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function selectHits(candidates: RankedAnswer[]) {
  const sorted = [...candidates].toSorted(compareRanked);
  const threshold = config.MIN_RETRIEVE_SCORE;
  const topK = config.ROBOT_RESULT_TOP_K;
  const hits = sorted
    .filter((item) => item.confidence >= threshold)
    .slice(0, topK);
  const bestBelow = hits.length > 0 ? null : (sorted[0] ?? null);
  return { hits, bestBelow };
}

export async function retrieveFromUnifiedIndex(params: {
  category?: QaCategory;
  stationId?: string;
  utterance: string;
}): Promise<RobotQueryResult> {
  const utterance = params.utterance.trim();
  if (!utterance) {
    return buildMiss(utterance);
  }

  const stationId = params.stationId ?? config.DEFAULT_STATION_ID;
  const [intentCandidates, unifiedHits] = await Promise.all([
    collectIntentCandidates(utterance, stationId),
    searchUnifiedCandidates({
      utterance,
      category: params.category,
      stationId,
    }),
  ]);

  const ranked = [
    ...intentCandidates,
    ...unifiedHits.map((hit) => toRanked(hit, utterance)),
  ];
  const deduped = dedupeCandidates(ranked);
  const { hits, bestBelow } = selectHits(deduped);
  return buildResult(utterance, hits, bestBelow);
}
