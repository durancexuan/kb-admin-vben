import {
  getCampaignGoodsIds,
  listCampaignRows,
  resolveGoodsNames,
} from '../campaign/repository.js';
import { config } from '../config.js';
import { listGoods } from '../goods/repository.js';
import { listQa } from '../qa/repository.js';
import { listRobotDocs } from '../robot-doc/repository.js';
import { robotDocService } from '../robot-doc/service.js';
import {
  syncCampaignToUnifiedIndex,
  syncGoodsToUnifiedIndex,
  syncQaToUnifiedIndex,
} from './sync.js';

export async function reindexUnifiedLibrary(
  stationId = config.DEFAULT_STATION_ID,
) {
  const qaRows = await listQa({ stationId });
  for (const row of qaRows.filter((item) => item.status === 'online')) {
    await syncQaToUnifiedIndex(row, stationId);
  }

  const goodsRows = await listGoods({ stationId });
  for (const row of goodsRows.filter((item) => item.status === 'online')) {
    await syncGoodsToUnifiedIndex(row, stationId);
  }

  const campaignRows = await listCampaignRows({ stationId });
  for (const row of campaignRows.filter((item) => item.status === 'online')) {
    const goodsIds = await getCampaignGoodsIds(row.id);
    const applicableGoods = await resolveGoodsNames(goodsIds);
    await syncCampaignToUnifiedIndex(row, applicableGoods, stationId);
  }

  const docs = await listRobotDocs({ stationId });
  for (const row of docs.filter((item) => item.status === 'online')) {
    await robotDocService.syncUnifiedIndex(row.id);
  }
}
