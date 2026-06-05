import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { KnowledgeGoodsApi } from '#/api';

import { z } from '#/adapter/form';

import { buildStatusOperationOptions } from '../shared/operation-options';
import {
  getGoodsPublishIssues,
  PUBLISH_STATUS_TAG_OPTIONS,
} from '../shared/publish';

export { getGoodsPublishIssues };

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '自动生成',
      },
      fieldName: 'sku',
      label: 'SKU',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入商品名称',
      },
      fieldName: 'name',
      label: '商品名称',
      rules: z.string().trim().min(1, { message: '请输入商品名称' }),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0.01,
        placeholder: '请输入价格',
        precision: 2,
      },
      fieldName: 'price',
      label: '价格',
      rules: z
        .number({ message: '请输入价格' })
        .gt(0, { message: '价格必须大于 0' }),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入货架位置',
      },
      fieldName: 'shelfLocation',
      label: '货架位置',
      rules: z.string().trim().min(1, { message: '请输入货架位置' }),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入规格，如 500ml',
      },
      fieldName: 'spec',
      label: '规格',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入导航点位',
      },
      fieldName: 'navigationPoint',
      label: '导航点位',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '多个标签用逗号分隔，如：热食,吃的,食品',
      },
      fieldName: 'semanticTagsText',
      help: '口语/类目/近义词，用于机器人检索匹配',
      label: '语义标签',
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '输入 SKU 或商品名称',
      },
      fieldName: 'keyword',
      label: '关键字',
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<KnowledgeGoodsApi.Goods>,
): VxeTableGridColumns<KnowledgeGoodsApi.Goods> {
  return [
    {
      field: 'sku',
      title: 'SKU',
      width: 120,
    },
    {
      field: 'name',
      minWidth: 160,
      title: '商品名称',
    },
    {
      field: 'semanticTags',
      formatter: ({ cellValue }) => {
        const tags = cellValue as string[] | undefined;
        return tags?.length ? tags.join('、') : '-';
      },
      minWidth: 180,
      title: '分类标签',
    },
    {
      field: 'price',
      formatter: ({ cellValue }) => {
        const price = Number(cellValue);
        return Number.isFinite(price) ? `¥${price.toFixed(2)}` : '-';
      },
      title: '价格',
      width: 100,
    },
    {
      field: 'shelfLocation',
      title: '货架位置',
      width: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [...PUBLISH_STATUS_TAG_OPTIONS],
      },
      field: 'status',
      title: '状态',
      width: 100,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '商品',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: buildStatusOperationOptions(getGoodsPublishIssues, ['edit']),
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 180,
    },
  ];
}
