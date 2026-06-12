import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { KnowledgeRobotDocApi } from '#/api';

import { z } from '#/adapter/form';

import { buildStatusOperationOptions } from '../shared/operation-options';
import {
  getRobotDocPublishIssues,
  PUBLISH_STATUS_TAG_OPTIONS,
} from '../shared/publish';

export { getRobotDocPublishIssues };

export const ROBOT_DOC_CATEGORY_OPTIONS: {
  label: string;
  value: KnowledgeRobotDocApi.RobotDocCategory;
}[] = [
  { label: '本站基本情况', value: '本站基本情况' },
  { label: '企业通用知识', value: '企业通用知识' },
  { label: '本站专属知识', value: '本站专属知识' },
  { label: '团队与荣誉', value: '团队与荣誉' },
];

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 200,
        placeholder: '请输入文档标题',
        showCount: true,
      },
      fieldName: 'title',
      label: '标题',
      rules: z
        .string()
        .trim()
        .min(1, { message: '请输入标题' })
        .max(200, { message: '标题不能超过 200 字' }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: ROBOT_DOC_CATEGORY_OPTIONS,
        placeholder: '请选择分类',
      },
      fieldName: 'category',
      label: '分类',
      rules: z
        .string({ message: '请选择分类' })
        .min(1, { message: '请选择分类' }),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '可选，原始文件名或来源说明',
      },
      fieldName: 'sourceName',
      label: '来源名称',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '支持 Markdown，发布后将自动分块入库',
        rows: 16,
        showCount: true,
      },
      fieldName: 'content',
      help: '正文不少于 20 字；发布后会同步到机器人统一检索索引',
      label: '正文',
      rules: z.string().trim().min(20, { message: '正文不能少于 20 字' }),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: ROBOT_DOC_CATEGORY_OPTIONS,
        placeholder: '按分类筛选',
      },
      fieldName: 'category',
      label: '分类',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '搜索标题或正文',
      },
      fieldName: 'keyword',
      label: '关键字',
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<KnowledgeRobotDocApi.RobotDoc>,
): VxeTableGridColumns<KnowledgeRobotDocApi.RobotDoc> {
  return [
    {
      field: 'title',
      minWidth: 200,
      title: '标题',
    },
    {
      field: 'category',
      title: '分类',
      width: 120,
    },
    {
      field: 'contentLength',
      formatter: ({ cellValue }) => `${cellValue ?? 0} 字`,
      title: '字数',
      width: 90,
    },
    {
      field: 'sourceName',
      formatter: ({ cellValue }) => cellValue || '-',
      minWidth: 140,
      showOverflow: true,
      title: '来源',
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
          nameField: 'title',
          nameTitle: '文档',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: buildStatusOperationOptions(getRobotDocPublishIssues, [
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
