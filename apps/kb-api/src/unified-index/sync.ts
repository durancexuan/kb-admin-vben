import type { CampaignRow } from '../campaign/types.js';
import type { GoodsRow } from '../goods/types.js';
import type { QaRow } from '../qa/types.js';
import type { RobotDocChunkRow, RobotDocRow } from '../robot-doc/types.js';

import { formatDate } from '../campaign/types.js';
import { getActiveEmbeddingModelId } from '../embedding/client.js';
import { embeddingService } from '../embedding/embedding.service.js';
import { buildGoodsEmbedText } from '../goods/publish.js';
import { buildChunkEmbedText } from '../robot-doc/publish.js';
import {
  deleteUnifiedIndexBySource,
  upsertUnifiedIndexRow,
} from './repository.js';

function buildQaMarkerText(qa: Pick<QaRow, 'question'>) {
  return qa.question.trim();
}

function buildQaEmbedText(qa: Pick<QaRow, 'category' | 'question'>) {
  return `【${qa.category}】${qa.question.trim()}`;
}

function buildCampaignEmbedText(campaign: {
  applicableGoods: string;
  discount: string;
  name: string;
}) {
  return `活动：${campaign.name.trim()}，优惠：${campaign.discount.trim()}，适用：${campaign.applicableGoods.trim()}`;
}

export async function syncQaToUnifiedIndex(
  qa: Pick<QaRow, 'answer' | 'category' | 'id' | 'question' | 'station_id'>,
  stationId = qa.station_id,
) {
  const markerText = buildQaMarkerText(qa);
  const embedText = buildQaEmbedText(qa);
  const vector = await embeddingService.embed(embedText);

  await upsertUnifiedIndexRow({
    stationId,
    library: 'qa',
    sourceId: qa.id,
    chunkIndex: 0,
    markerText,
    embedText,
    embedding: vector,
    payload: {
      qaId: qa.id,
      question: qa.question,
      answer: qa.answer,
      category: qa.category,
    },
    modelId: getActiveEmbeddingModelId(),
    toPgVector: (value) => embeddingService.toPgVector(value),
  });
}

export async function syncGoodsToUnifiedIndex(
  goods: GoodsRow,
  stationId = goods.station_id,
) {
  const embedText = buildGoodsEmbedText(goods);
  const vector = await embeddingService.embed(embedText);

  await upsertUnifiedIndexRow({
    stationId,
    library: 'goods',
    sourceId: goods.id,
    chunkIndex: 0,
    markerText: goods.name.trim(),
    embedText,
    embedding: vector,
    payload: {
      goodsId: goods.id,
      sku: goods.sku,
      name: goods.name,
      price: Number(goods.price),
      shelfLocation: goods.shelf_location,
      navigationPoint: goods.navigation_point,
      spec: goods.spec,
    },
    modelId: getActiveEmbeddingModelId(),
    toPgVector: (value) => embeddingService.toPgVector(value),
  });
}

export async function syncCampaignToUnifiedIndex(
  campaign: CampaignRow,
  applicableGoods: string,
  stationId = campaign.station_id,
) {
  const embedText = buildCampaignEmbedText({
    applicableGoods,
    discount: campaign.discount,
    name: campaign.name,
  });
  const vector = await embeddingService.embed(embedText);

  await upsertUnifiedIndexRow({
    stationId,
    library: 'campaign',
    sourceId: campaign.id,
    chunkIndex: 0,
    markerText: campaign.name.trim(),
    embedText,
    embedding: vector,
    payload: {
      campaignId: campaign.id,
      name: campaign.name,
      discount: campaign.discount,
      applicableGoods,
      startDate: formatDate(campaign.start_date),
      endDate: formatDate(campaign.end_date),
    },
    modelId: getActiveEmbeddingModelId(),
    toPgVector: (value) => embeddingService.toPgVector(value),
  });
}

export async function syncRobotDocToUnifiedIndex(
  doc: RobotDocRow,
  chunks: RobotDocChunkRow[],
  stationId = doc.station_id,
) {
  await deleteUnifiedIndexBySource({
    library: 'robot-doc',
    sourceId: doc.id,
    stationId,
  });

  for (const chunk of chunks) {
    const embedText = buildChunkEmbedText({
      body: chunk.body,
      category: doc.category,
      heading: chunk.heading,
      title: doc.title,
    });
    const vector = await embeddingService.embed(embedText);

    await upsertUnifiedIndexRow({
      stationId,
      library: 'robot-doc',
      sourceId: doc.id,
      chunkIndex: chunk.chunk_index,
      markerText: chunk.heading || doc.title,
      embedText,
      embedding: vector,
      payload: {
        docId: doc.id,
        title: doc.title,
        category: doc.category,
        heading: chunk.heading,
        body: chunk.body,
      },
      modelId: getActiveEmbeddingModelId(),
      toPgVector: (value) => embeddingService.toPgVector(value),
    });
  }
}

export async function removeFromUnifiedIndex(
  library: 'campaign' | 'goods' | 'qa' | 'robot-doc',
  sourceId: string,
  stationId: string,
) {
  await deleteUnifiedIndexBySource({ library, sourceId, stationId });
}
