<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Card, Input, Table, Tag } from 'antdv-next';

const loading = ref(false);
const searchKeyword = ref('');

const dataSource = ref([
  {
    id: '1',
    name: '夏日加油满减',
    applicableGoods: '92# 汽油, 95# 汽油',
    discount: '满 200 减 10',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    status: 'online',
  },
  {
    id: '2',
    name: '便利店买一送一',
    applicableGoods: '矿泉水 550ml',
    discount: '买一送一',
    startDate: '2026-05-25',
    endDate: '2026-05-31',
    status: 'draft',
  },
]);

const columns = [
  { title: '活动名', dataIndex: 'name', key: 'name' },
  { title: '适用商品', dataIndex: 'applicableGoods', key: 'applicableGoods' },
  { title: '优惠内容', dataIndex: 'discount', key: 'discount' },
  { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 120 },
  { title: '结束日期', dataIndex: 'endDate', key: 'endDate', width: 120 },
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
  <Page title="营销活动库" auto-content-height>
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
          新增活动
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
