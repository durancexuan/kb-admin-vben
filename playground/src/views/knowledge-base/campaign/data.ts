import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { KnowledgeCampaignApi } from '#/api';

import { z } from '#/adapter/form';
import { getCampaignGoodsOptions } from '#/api';

import { buildStatusOperationOptions } from '../shared/operation-options';
import {
  getCampaignPublishIssues,
  PUBLISH_STATUS_TAG_OPTIONS,
} from '../shared/publish';

export { getCampaignPublishIssues };

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入活动名称',
      },
      fieldName: 'name',
      label: '活动名',
      rules: z.string().trim().min(1, { message: '请输入活动名' }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getCampaignGoodsOptions,
        class: 'w-full',
        mode: 'multiple',
        placeholder: '请选择适用商品',
      },
      fieldName: 'applicableGoodsIds',
      label: '适用商品',
      rules: z.array(z.string()).min(1, { message: '请至少选择一个适用商品' }),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '如：满 200 减 10',
      },
      fieldName: 'discount',
      label: '优惠内容',
      rules: z.string().trim().min(1, { message: '请输入优惠内容' }),
    },
    {
      component: 'RangePicker',
      componentProps: {
        class: 'w-full',
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
      fieldName: 'validityPeriod',
      label: '有效期',
      rules: z
        .array(z.string())
        .length(2, { message: '请选择有效期' })
        .refine(([start, end]) => !!start && !!end && end > start, {
          message: '结束时间必须晚于开始时间',
        }),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '搜索活动名、优惠内容或适用商品',
      },
      fieldName: 'keyword',
      label: '关键字',
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<KnowledgeCampaignApi.Campaign>,
): VxeTableGridColumns<KnowledgeCampaignApi.Campaign> {
  return [
    {
      field: 'name',
      minWidth: 140,
      title: '活动名',
    },
    {
      field: 'applicableGoods',
      minWidth: 160,
      showOverflow: true,
      title: '适用商品',
    },
    {
      field: 'discount',
      minWidth: 120,
      title: '优惠内容',
    },
    {
      field: 'startDate',
      formatter: ({ row }) => `${row.startDate} ~ ${row.endDate}`,
      title: '有效期',
      width: 220,
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
          nameTitle: '活动',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: buildStatusOperationOptions(getCampaignPublishIssues, [
          'edit',
          'delete',
        ]),
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 200,
    },
  ];
}
