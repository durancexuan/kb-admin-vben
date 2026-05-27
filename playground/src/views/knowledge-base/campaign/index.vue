<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { KnowledgeCampaignApi } from '#/api';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCampaign,
  getCampaignList,
  offlineCampaign,
  publishCampaign,
} from '#/api';

import { createStatusActionHandlers } from '../shared/use-status-actions';
import {
  getCampaignPublishIssues,
  useColumns,
  useGridFormSchema,
} from './data';
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
          return await getCampaignList({
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
  } as VxeTableGridOptions<KnowledgeCampaignApi.Campaign>,
});

const { onOffline, onPublish } =
  createStatusActionHandlers<KnowledgeCampaignApi.Campaign>({
    entityLabel: '活动',
    getIssues: getCampaignPublishIssues,
    offlineApi: offlineCampaign,
    onRefresh: () => gridApi.query(),
    publishApi: publishCampaign,
  });

function onActionClick(e: OnActionClickParams<KnowledgeCampaignApi.Campaign>) {
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

function onEdit(row: KnowledgeCampaignApi.Campaign) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onDelete(row: KnowledgeCampaignApi.Campaign) {
  const hideLoading = message.loading({
    content: `正在删除「${row.name}」`,
    duration: 0,
    key: 'campaign_delete_msg',
  });
  deleteCampaign(row.id)
    .then(() => {
      message.success({
        content: '删除成功',
        key: 'campaign_delete_msg',
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
    <Grid table-title="营销活动库">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增活动
        </Button>
      </template>
    </Grid>
  </Page>
</template>
