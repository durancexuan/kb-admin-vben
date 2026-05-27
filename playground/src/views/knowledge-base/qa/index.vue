<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { KnowledgeQaApi } from '#/api';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteQa, getQaList, offlineQa, publishQa } from '#/api';

import { createStatusActionHandlers } from '../shared/use-status-actions';
import { getQaPublishIssues, useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getQaList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<KnowledgeQaApi.Qa>,
});

const { onOffline, onPublish } = createStatusActionHandlers<KnowledgeQaApi.Qa>({
  entityLabel: '问答',
  getIssues: getQaPublishIssues,
  offlineApi: offlineQa,
  onRefresh: () => gridApi.query(),
  publishApi: publishQa,
});

function onActionClick(e: OnActionClickParams<KnowledgeQaApi.Qa>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      onEdit(e.row);
      break;
    }
    case 'offline': {
      onOffline(e.row);
      break;
    }
    case 'publish': {
      onPublish(e.row);
      break;
    }
  }
}

function onEdit(row: KnowledgeQaApi.Qa) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onDelete(row: KnowledgeQaApi.Qa) {
  const hideLoading = message.loading({
    content: `正在删除「${row.question}」`,
    duration: 0,
    key: 'qa_delete_msg',
  });
  deleteQa(row.id)
    .then(() => {
      message.success({
        content: '删除成功',
        key: 'qa_delete_msg',
      });
      gridApi.query();
    })
    .catch(() => {
      hideLoading();
    });
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="gridApi.query()" />
    <Grid table-title="站级问答库">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增问答
        </Button>
      </template>
    </Grid>
  </Page>
</template>
