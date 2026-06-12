<script lang="ts" setup>
import type { KnowledgeRobotDocApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createRobotDoc, updateRobotDoc } from '#/api';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const docId = ref<string>();

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

    const values =
      await formApi.getValues<KnowledgeRobotDocApi.RobotDocPayload>();
    drawerApi.lock();
    try {
      if (docId.value) {
        await updateRobotDoc(docId.value, values);
        message.success('文档更新成功');
      } else {
        await createRobotDoc(values);
        message.success('文档新增成功');
      }
      emits('success');
      drawerApi.close();
    } catch {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<KnowledgeRobotDocApi.RobotDoc>();
    formApi.resetForm();
    docId.value = data?.id;

    await nextTick();

    if (data?.id) {
      formApi.setValues({
        title: data.title,
        category: data.category,
        content: data.content,
        sourceName: data.sourceName ?? '',
      });
    }
  },
});

const drawerTitle = computed(() => (docId.value ? '编辑文档' : '新增文档'));
</script>

<template>
  <Drawer :title="drawerTitle" class="w-[720px]">
    <Form class="mx-4" />
  </Drawer>
</template>
