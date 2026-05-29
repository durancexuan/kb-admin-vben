import type { QaCategory } from '../qa/types.js';
import type { RobotLibrary, RobotQueryResult } from './types.js';

import { buildCampaignSpeakReply } from '../campaign/publish.js';
import { campaignService } from '../campaign/service.js';
import { config } from '../config.js';
import { buildGoodsSpeakReply } from '../goods/publish.js';
import { findGoodsById } from '../goods/repository.js';
import { goodsService } from '../goods/service.js';
import { qaService } from '../qa/service.js';
import { isValidCategory } from '../qa/types.js';
import { ROBOT_LIBRARY_LABEL } from './types.js';

interface RankedAnswer {
  confidence: number;
  display: string;
  library: RobotLibrary;
  speak: string;
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
    display: null,
    speak: null,
  };
}

function buildHit(utterance: string, best: RankedAnswer): RobotQueryResult {
  return {
    utterance,
    hit: true,
    library: best.library,
    libraryLabel: ROBOT_LIBRARY_LABEL[best.library],
    confidence: roundConfidence(best.confidence),
    display: best.display,
    speak: best.speak,
  };
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
    display: null,
    speak: null,
  };
}

export async function unifiedKnowledgeRetrieve(params: {
  category?: QaCategory;
  utterance: string;
}) {
  const utterance = params.utterance.trim();
  if (!utterance) {
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
      speak: qaBest.answer,
    });
  }

  const goodsBest = goodsResult.items[0];
  if (goodsBest) {
    const row = await findGoodsById(goodsBest.id);
    ranked.push({
      library: 'goods',
      confidence: goodsBest.confidence ?? 0,
      display: goodsBest.name,
      speak: row
        ? buildGoodsSpeakReply(row)
        : `${goodsBest.name}，售价 ${goodsBest.price} 元。`,
    });
  }

  const campaignBest = campaignResult.items[0];
  if (campaignBest) {
    ranked.push({
      library: 'campaign',
      confidence: campaignBest.confidence ?? 0,
      display: campaignBest.name,
      speak: buildCampaignSpeakReply(campaignBest),
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
