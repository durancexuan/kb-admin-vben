import { message } from 'antdv-next';

import { getPublishTooltip, showPublishBlockedModal } from './publish';

interface StatusActionOptions<T extends { id: string }> {
  entityLabel: string;
  getIssues: (row: T) => string[];
  offlineApi: (id: string) => Promise<unknown>;
  onRefresh: () => void;
  publishApi: (id: string) => Promise<unknown>;
}

export function createStatusActionHandlers<T extends { id: string }>(
  options: StatusActionOptions<T>,
) {
  function onPublish(row: T) {
    const issues = options.getIssues(row);
    if (issues.length > 0) {
      showPublishBlockedModal(issues, options.entityLabel);
      return;
    }

    options
      .publishApi(row.id)
      .then(() => {
        message.success(`${options.entityLabel}已上线`);
        options.onRefresh();
      })
      .catch(() => {
        // 错误提示由 request 拦截器统一处理
      });
  }

  function onOffline(row: T) {
    options
      .offlineApi(row.id)
      .then(() => {
        message.success(`${options.entityLabel}已下线`);
        options.onRefresh();
      })
      .catch(() => {});
  }

  return { onOffline, onPublish };
}

export { getPublishTooltip };
