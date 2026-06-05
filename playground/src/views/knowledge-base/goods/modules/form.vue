<script lang="ts" setup>
import type { KnowledgeGoodsApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createGoods, getNextGoodsSku, updateGoods } from '#/api';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<KnowledgeGoodsApi.Goods>();
const goodsId = ref<string>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<
      KnowledgeGoodsApi.GoodsPayload & { semanticTagsText?: string }
    >();
    const payload: KnowledgeGoodsApi.GoodsPayload = {
      ...values,
      semanticTags: parseSemanticTagsText(values.semanticTagsText),
    };
    drawerApi.lock();
    try {
      if (goodsId.value) {
        await updateGoods(goodsId.value, payload);
        message.success('商品更新成功');
      } else {
        await createGoods(payload);
        message.success('商品新增成功');
      }
      emits('success');
      drawerApi.close();
    } catch {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<KnowledgeGoodsApi.Goods>();
    formApi.resetForm();
    formData.value = data;
    goodsId.value = data?.id;

    await nextTick();

    if (data?.id) {
      formApi.setValues({
        ...data,
        semanticTagsText: data.semanticTags?.join('，') ?? '',
      });
      return;
    }

    try {
      const { sku } = await getNextGoodsSku();
      formApi.setValues({ sku });
    } catch {
      message.error('获取 SKU 失败，请稍后重试');
      drawerApi.close();
    }
  },
});

const drawerTitle = computed(() => (goodsId.value ? '编辑商品' : '新增商品'));

function parseSemanticTagsText(text?: string) {
  if (!text?.trim()) {
    return [];
  }
  return [
    ...new Set(
      text
        .split(/[,，、\s/|]+/u)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form class="mx-4" />
  </Drawer>
</template>
