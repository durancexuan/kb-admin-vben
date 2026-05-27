<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Card, Select, Table, Tag } from 'antdv-next';

const loading = ref(false);

const categoryOptions = [
  { label: '全部', value: '' },
  { label: '加油机', value: '加油机' },
  { label: '卫生间', value: '卫生间' },
  { label: '便利店', value: '便利店' },
  { label: '营业时间', value: '营业时间' },
  { label: '其他', value: '其他' },
];

const selectedCategory = ref('');

const dataSource = ref([
  {
    id: '1',
    question: '你们几点开门？',
    answer: '本站 24 小时营业。',
    category: '营业时间',
    updatedAt: '2026-05-20 10:00',
    status: 'online',
  },
  {
    id: '2',
    question: '卫生间在哪里？',
    answer: '进入便利店后左转即到。',
    category: '卫生间',
    updatedAt: '2026-05-21 14:30',
    status: 'draft',
  },
]);

const columns = [
  { title: '问题', dataIndex: 'question', key: 'question' },
  { title: '答案', dataIndex: 'answer', key: 'answer', ellipsis: true },
  { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200 },
];

function statusColor(status: string) {
  switch (status) {
    case 'offline': {
      return 'orange';
    }
    case 'online': {
      return 'green';
    }
    default: {
      return 'default';
    }
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'offline': {
      return '已下线';
    }
    case 'online': {
      return '已上线';
    }
    default: {
      return '草稿';
    }
  }
}
</script>

<template>
  <Page title="站级问答库" auto-content-height>
    <Card>
      <div class="mb-4 flex items-center justify-between">
        <Select
          v-model:value="selectedCategory"
          :options="categoryOptions"
          placeholder="按分类筛选"
          class="w-48"
          allow-clear
        />
        <Button type="primary">
          <Plus class="size-4" />
          新增问答
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        row-key="id"
        :pagination="{ pageSize: 10 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColor(record.status)">
              {{ statusLabel(record.status) }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Button type="link" size="small">编辑</Button>
            <Button type="link" size="small">上线</Button>
            <Button type="link" size="small" danger>删除</Button>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
