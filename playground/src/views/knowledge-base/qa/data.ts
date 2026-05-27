import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { KnowledgeQaApi } from '#/api';

import { z } from '#/adapter/form';

import { buildStatusOperationOptions } from '../shared/operation-options';
import {
  getQaPublishIssues,
  PUBLISH_STATUS_TAG_OPTIONS,
} from '../shared/publish';

export { getQaPublishIssues };

export const QA_CATEGORY_OPTIONS: {
  label: string;
  value: KnowledgeQaApi.QaCategory;
}[] = [
  { label: '加油机', value: '加油机' },
  { label: '卫生间', value: '卫生间' },
  { label: '便利店', value: '便利店' },
  { label: '营业时间', value: '营业时间' },
  { label: '其他', value: '其他' },
];

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 200,
        placeholder: '请输入问题，最多 200 字',
        showCount: true,
      },
      fieldName: 'question',
      label: '问题',
      rules: z
        .string()
        .trim()
        .min(1, { message: '请输入问题' })
        .max(200, { message: '问题不能超过 200 字' }),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxlength: 1000,
        placeholder: '请输入答案，最多 1000 字',
        rows: 5,
        showCount: true,
      },
      fieldName: 'answer',
      label: '答案',
      rules: z
        .string()
        .trim()
        .min(1, { message: '请输入答案' })
        .max(1000, { message: '答案不能超过 1000 字' }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: QA_CATEGORY_OPTIONS,
        placeholder: '请选择分类',
      },
      fieldName: 'category',
      label: '分类',
      rules: z
        .string({ message: '请选择分类' })
        .min(1, { message: '请选择分类' }),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: QA_CATEGORY_OPTIONS,
        placeholder: '按分类筛选',
      },
      fieldName: 'category',
      label: '分类',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '搜索问题或答案',
      },
      fieldName: 'keyword',
      label: '关键字',
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<KnowledgeQaApi.Qa>,
): VxeTableGridColumns<KnowledgeQaApi.Qa> {
  return [
    {
      field: 'question',
      minWidth: 180,
      title: '问题',
    },
    {
      field: 'answer',
      minWidth: 200,
      showOverflow: true,
      title: '答案',
    },
    {
      field: 'category',
      title: '分类',
      width: 100,
    },
    {
      field: 'updatedAt',
      title: '更新时间',
      width: 170,
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
          nameField: 'question',
          nameTitle: '问答',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: buildStatusOperationOptions(getQaPublishIssues, [
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
