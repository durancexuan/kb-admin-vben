<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { KnowledgeRobotDocApi } from '#/api';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRobotDoc,
  getRobotDocList,
  offlineRobotDoc,
  publishRobotDoc,
} from '#/api';

import { createStatusActionHandlers } from '../shared/use-status-actions';
import {
  getRobotDocPublishIssues,
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
          return await getRobotDocList({
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
  } as VxeTableGridOptions<KnowledgeRobotDocApi.RobotDoc>,
});

const { onOffline, onPublish } =
  createStatusActionHandlers<KnowledgeRobotDocApi.RobotDoc>({
    entityLabel: '文档',
    getIssues: getRobotDocPublishIssues,
    offlineApi: offlineRobotDoc,
    onRefresh: () => gridApi.query(),
    publishApi: publishRobotDoc,
  });

function onActionClick(e: OnActionClickParams<KnowledgeRobotDocApi.RobotDoc>) {
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

function onEdit(row: KnowledgeRobotDocApi.RobotDoc) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onDelete(row: KnowledgeRobotDocApi.RobotDoc) {
  const hideLoading = message.loading({
    content: `正在删除「${row.title}」`,
    duration: 0,
    key: 'robot_doc_delete_msg',
  });
  deleteRobotDoc(row.id)
    .then(() => {
      message.success({
        content: '删除成功',
        key: 'robot_doc_delete_msg',
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
    <Grid table-title="机器人专属知识库">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增文档
        </Button>
      </template>
    </Grid>
  </Page>
</template>
