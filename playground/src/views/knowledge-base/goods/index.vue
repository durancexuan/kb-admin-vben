<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { KnowledgeGoodsApi } from '#/api';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getGoodsList, offlineGoods, publishGoods } from '#/api';

import { createStatusActionHandlers } from '../shared/use-status-actions';
import { getGoodsPublishIssues, useColumns, useGridFormSchema } from './data';
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
          return await getGoodsList({
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
  } as VxeTableGridOptions<KnowledgeGoodsApi.Goods>,
});

const { onOffline, onPublish } =
  createStatusActionHandlers<KnowledgeGoodsApi.Goods>({
    entityLabel: '商品',
    getIssues: getGoodsPublishIssues,
    offlineApi: offlineGoods,
    onRefresh: () => gridApi.query(),
    publishApi: publishGoods,
  });

function onActionClick(e: OnActionClickParams<KnowledgeGoodsApi.Goods>) {
  switch (e.code) {
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

function onEdit(row: KnowledgeGoodsApi.Goods) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="gridApi.query()" />
    <Grid table-title="商品全维库">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增商品
        </Button>
      </template>
    </Grid>
  </Page>
</template>
