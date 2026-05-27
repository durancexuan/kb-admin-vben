<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Card, Input, Table, Tag } from 'antdv-next';

// Mock data for display skeleton
const loading = ref(false);
const dataSource = ref([
  {
    id: '1',
    sku: 'SKU-0001',
    name: '92# 汽油',
    price: 7.89,
    shelfLocation: 'A-01',
    status: 'draft',
  },
  {
    id: '2',
    sku: 'SKU-0002',
    name: '95# 汽油',
    price: 8.56,
    shelfLocation: 'A-02',
    status: 'online',
  },
  {
    id: '3',
    sku: 'SKU-0003',
    name: '矿泉水 550ml',
    price: 2,
    shelfLocation: 'B-03',
    status: 'offline',
  },
]);

const columns = [
  { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
  { title: '商品名称', dataIndex: 'name', key: 'name' },
  { title: '价格', dataIndex: 'price', key: 'price', width: 100 },
  {
    title: '货架位置',
    dataIndex: 'shelfLocation',
    key: 'shelfLocation',
    width: 120,
  },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200 },
];

const searchKeyword = ref('');

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
  <Page title="商品全维库" auto-content-height>
    <Card>
      <div class="mb-4 flex items-center justify-between">
        <Input
          v-model:value="searchKeyword"
          placeholder="输入关键字搜索"
          allow-clear
          class="w-64"
        />
        <Button type="primary">
          <Plus class="size-4" />
          新增商品
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
