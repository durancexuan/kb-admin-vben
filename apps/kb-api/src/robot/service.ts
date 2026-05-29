import type { QaCategory } from '../qa/types.js';

import { buildCampaignSpeakReply } from '../campaign/publish.js';
import { campaignService } from '../campaign/service.js';
import { buildGoodsSpeakReply } from '../goods/publish.js';
import { findGoodsById } from '../goods/repository.js';
import { goodsService } from '../goods/service.js';
import { qaService } from '../qa/service.js';
import { isValidCategory } from '../qa/types.js';

type KnowledgeType = 'campaign' | 'faq' | 'goods';

interface UnifiedCandidate {
  confidence: number;
  type: KnowledgeType;
}

export async function unifiedKnowledgeRetrieve(params: {
  category?: QaCategory;
  topK?: number;
  utterance: string;
}) {
  const [qaResult, goodsResult, campaignResult] = await Promise.all([
    qaService.retrieve({
      category: params.category,
      topK: params.topK,
      utterance: params.utterance,
    }),
    goodsService.retrieve({
      topK: params.topK,
      utterance: params.utterance,
    }),
    campaignService.retrieve({
      topK: params.topK,
      utterance: params.utterance,
    }),
  ]);

  const winners: UnifiedCandidate[] = [];

  if (qaResult.hit && qaResult.items[0]) {
    winners.push({
      type: 'faq',
      confidence: qaResult.items[0].confidence ?? 0,
    });
  }
  if (goodsResult.hit && goodsResult.items[0]) {
    winners.push({
      type: 'goods',
      confidence: goodsResult.items[0].confidence ?? 0,
    });
  }
  if (campaignResult.hit && campaignResult.items[0]) {
    winners.push({
      type: 'campaign',
      confidence: campaignResult.items[0].confidence ?? 0,
    });
  }

  winners.sort((a, b) => b.confidence - a.confidence);
  const bestType = winners[0]?.type ?? null;

  if (bestType === 'goods') {
    const best = goodsResult.items[0];
    if (best) {
      const row = await findGoodsById(best.id);
      const speak = row
        ? buildGoodsSpeakReply(row)
        : `${best.name}，售价 ${best.price} 元。`;
      const runnerUp = goodsResult.items[1];
      const needClarify =
        goodsResult.hit &&
        runnerUp &&
        best.confidence - runnerUp.confidence < 0.05;

      return {
        action: {
          poi: best.navigationPoint ?? null,
          type: 'navigate' as const,
        },
        candidates: goodsResult.items,
        hit: goodsResult.hit,
        needClarify,
        reply: {
          display: best.name,
          speak,
        },
        source: {
          goodsId: best.id,
          matchType: best.matchType,
          name: best.name,
          shelfLocation: best.shelfLocation,
          sku: best.sku,
        },
        type: 'goods' as const,
      };
    }
  }

  if (bestType === 'campaign') {
    const best = campaignResult.items[0];
    if (best) {
      const speak = buildCampaignSpeakReply(best);
      const runnerUp = campaignResult.items[1];
      const needClarify =
        campaignResult.hit &&
        runnerUp &&
        best.confidence - runnerUp.confidence < 0.05;

      return {
        action: null,
        candidates: campaignResult.items,
        hit: campaignResult.hit,
        needClarify,
        reply: {
          display: best.name,
          speak,
        },
        source: {
          campaignId: best.id,
          discount: best.discount,
          matchType: best.matchType,
          name: best.name,
        },
        type: 'campaign' as const,
      };
    }
  }

  const best = qaResult.items[0];
  const runnerUp = qaResult.items[1];
  const needClarify =
    qaResult.hit &&
    best &&
    runnerUp &&
    runnerUp.confidence !== undefined &&
    best.confidence - runnerUp.confidence < 0.05;

  return {
    action: best ? { poi: null, type: 'none' as const } : null,
    candidates: qaResult.items,
    hit: qaResult.hit,
    needClarify,
    reply: best
      ? {
          display: best.question,
          speak: best.answer,
        }
      : null,
    source: best
      ? {
          category: best.category,
          matchType: best.matchType,
          matchedQuestion: best.question,
          qaId: best.id,
        }
      : null,
    type: 'faq' as const,
  };
}

export function parseRobotCategory(category?: string) {
  return category && isValidCategory(category) ? category : undefined;
}
