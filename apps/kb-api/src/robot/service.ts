import type { QaCategory } from '../qa/types.js';
import type { RobotQueryResult } from './types.js';

import { isValidCategory } from '../qa/types.js';
import { retrieveFromUnifiedIndex } from '../unified-index/retrieve.js';

export async function unifiedKnowledgeRetrieve(params: {
  category?: QaCategory;
  utterance: string;
}): Promise<RobotQueryResult> {
  return retrieveFromUnifiedIndex(params);
}

export function parseRobotCategory(category?: string) {
  return category && isValidCategory(category) ? category : undefined;
}
