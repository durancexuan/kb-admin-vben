import type { Recordable } from '@vben/types';

import type { PublishStatus } from './publish';

import { getPublishTooltip } from './publish';

type RowWithStatus = { status: PublishStatus };

export function buildStatusOperationOptions<T extends RowWithStatus>(
  getIssues: (row: T) => string[],
  extraOptions: Array<Recordable<any> | string> = ['edit'],
) {
  return [
    ...extraOptions,
    {
      code: 'publish',
      disabled: (row: T) => getIssues(row).length > 0,
      show: (row: T) => row.status !== 'online',
      text: '上线',
      title: (row: T) => getPublishTooltip(getIssues(row)),
    },
    {
      code: 'offline',
      show: (row: T) => row.status === 'online',
      text: '下线',
    },
  ];
}
