import type { QaCategory } from '../qa/types.js';
import type {
  RobotLibrary,
  RobotMatchType,
  RobotQueryResult,
} from './types.js';

import { buildCampaignSpeakReply } from '../campaign/publish.js';
import { isCampaignInquiryIntent } from '../campaign/query-normalize.js';
import { campaignService } from '../campaign/service.js';
import { config } from '../config.js';
import { buildGoodsSpeakReply } from '../goods/publish.js';
import { isGoodsCatalogInquiryIntent } from '../goods/query-normalize.js';
import { findGoodsById } from '../goods/repository.js';
import { goodsService } from '../goods/service.js';
import { qaService } from '../qa/service.js';
import { isValidCategory } from '../qa/types.js';
import { ROBOT_LIBRARY_LABEL } from './types.js';

interface RankedAnswer {
  confidence: number;
  display: string;
  library: RobotLibrary;
  matchType: RobotMatchType;
  speak: string;
  vectorConfidence?: number;
}

function toRobotResult(
  utterance: string,
  best: RankedAnswer,
  hit: boolean,
): RobotQueryResult {
  return {
    utterance,
    hit,
    library: hit ? best.library : null,
    libraryLabel: hit ? ROBOT_LIBRARY_LABEL[best.library] : null,
    confidence: roundConfidence(best.confidence),
    vectorConfidence:
      best.vectorConfidence === undefined
        ? null
        : roundConfidence(best.vectorConfidence),
    matchType: hit ? best.matchType : null,
    display: hit ? best.display : null,
    speak: hit ? best.speak : null,
  };
}

function roundConfidence(value: number) {
  return Number(value.toFixed(4));
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
  };
}

function buildHit(utterance: string, best: RankedAnswer): RobotQueryResult {
  return toRobotResult(utterance, best, true);
}

function buildBelowThreshold(
  utterance: string,
  best: RankedAnswer,
): RobotQueryResult {
  return {
    utterance,
    hit: false,
    library: null,
    libraryLabel: null,
    confidence: roundConfidence(best.confidence),
    vectorConfidence:
      best.vectorConfidence === undefined
        ? null
        : roundConfidence(best.vectorConfidence),
    matchType: best.matchType,
    display: null,
    speak: null,
  };
}

function pickVectorConfidence(item: { vectorConfidence?: number }) {
  return item.vectorConfidence;
}

function pickMatchType(
  item: { matchType?: RobotMatchType },
  fallback: RobotMatchType,
) {
  return item.matchType ?? fallback;
}

export async function unifiedKnowledgeRetrieve(params: {
  category?: QaCategory;
  utterance: string;
}) {
  const utterance = params.utterance.trim();
  if (!utterance) {
    return buildMiss(utterance);
  }

  if (isCampaignInquiryIntent(utterance)) {
    const campaignResult = await campaignService.retrieve({
      topK: 5,
      utterance,
    });
    const campaignBest = campaignResult.items[0];
    if (campaignBest) {
      const ranked: RankedAnswer = {
        library: 'campaign',
        confidence: campaignBest.confidence ?? 0,
        display: campaignBest.name,
        matchType: pickMatchType(campaignBest, 'intent'),
        speak:
          campaignBest.speak ??
          (campaignBest.id
            ? buildCampaignSpeakReply(campaignBest)
            : campaignBest.name),
      };
      if (ranked.confidence >= config.MIN_RETRIEVE_SCORE) {
        return buildHit(utterance, ranked);
      }
      return buildBelowThreshold(utterance, ranked);
    }
    return buildMiss(utterance);
  }

  if (isGoodsCatalogInquiryIntent(utterance)) {
    const goodsResult = await goodsService.retrieve({
      topK: 1,
      utterance,
    });
    const goodsBest = goodsResult.items[0];
    if (goodsBest) {
      const ranked: RankedAnswer = {
        library: 'goods',
        confidence: goodsBest.confidence ?? 0,
        display: goodsBest.name,
        matchType: pickMatchType(goodsBest, 'intent'),
        speak:
          goodsBest.speak ??
          (goodsBest.id
            ? buildGoodsSpeakReply({
                name: goodsBest.name,
                navigation_point: goodsBest.navigationPoint,
                price: goodsBest.price,
                shelf_location: goodsBest.shelfLocation,
                spec: goodsBest.spec,
              })
            : goodsBest.name),
      };
      if (ranked.confidence >= config.MIN_RETRIEVE_SCORE) {
        return buildHit(utterance, ranked);
      }
      return buildBelowThreshold(utterance, ranked);
    }
    return buildMiss(utterance);
  }

  const [qaResult, goodsResult, campaignResult] = await Promise.all([
    qaService.retrieve({ category: params.category, topK: 1, utterance }),
    goodsService.retrieve({ topK: 1, utterance }),
    campaignService.retrieve({ topK: 1, utterance }),
  ]);

  const ranked: RankedAnswer[] = [];

  const qaBest = qaResult.items[0];
  if (qaBest) {
    ranked.push({
      library: 'qa',
      confidence: qaBest.confidence ?? 0,
      display: qaBest.question,
      matchType: pickMatchType(qaBest, 'keyword'),
      speak: qaBest.answer,
      vectorConfidence: pickVectorConfidence(qaBest),
    });
  }

  const goodsBest = goodsResult.items[0];
  if (goodsBest) {
    const row = goodsBest.id ? await findGoodsById(goodsBest.id) : null;
    ranked.push({
      library: 'goods',
      confidence: goodsBest.confidence ?? 0,
      display: goodsBest.name,
      matchType: pickMatchType(goodsBest, 'keyword'),
      speak:
        goodsBest.speak ??
        (row
          ? buildGoodsSpeakReply(row)
          : `${goodsBest.name}，售价 ${goodsBest.price} 元。`),
      vectorConfidence: pickVectorConfidence(goodsBest),
    });
  }

  const campaignBest = campaignResult.items[0];
  if (campaignBest) {
    const speak = campaignBest.speak ?? buildCampaignSpeakReply(campaignBest);
    ranked.push({
      library: 'campaign',
      confidence: campaignBest.confidence ?? 0,
      display: campaignBest.name,
      matchType: pickMatchType(campaignBest, 'keyword'),
      speak,
    });
  }

  if (ranked.length === 0) {
    return buildMiss(utterance);
  }

  ranked.sort((a, b) => b.confidence - a.confidence);
  const best = ranked[0];
  if (!best) {
    return buildMiss(utterance);
  }

  if (best.confidence < config.MIN_RETRIEVE_SCORE) {
    return buildBelowThreshold(utterance, best);
  }

  return buildHit(utterance, best);
}

export function parseRobotCategory(category?: string) {
  return category && isValidCategory(category) ? category : undefined;
}
