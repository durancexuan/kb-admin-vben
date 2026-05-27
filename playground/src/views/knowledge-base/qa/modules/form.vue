<script lang="ts" setup>
import type { KnowledgeQaApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createQa, updateQa } from '#/api';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const qaId = ref<string>();

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

    const values = await formApi.getValues<KnowledgeQaApi.QaPayload>();
    drawerApi.lock();
    try {
      if (qaId.value) {
        await updateQa(qaId.value, values);
        message.success('问答更新成功');
      } else {
        await createQa(values);
        message.success('问答新增成功');
      }
      emits('success');
      drawerApi.close();
    } catch {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<KnowledgeQaApi.Qa>();
    formApi.resetForm();
    qaId.value = data?.id;

    await nextTick();

    if (data?.id) {
      formApi.setValues({
        question: data.question,
        answer: data.answer,
        category: data.category,
      });
    }
  },
});

const drawerTitle = computed(() => (qaId.value ? '编辑问答' : '新增问答'));
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form class="mx-4" />
  </Drawer>
</template>
