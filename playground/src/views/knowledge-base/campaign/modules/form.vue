<script lang="ts" setup>
import type { KnowledgeCampaignApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createCampaign, updateCampaign } from '#/api';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const campaignId = ref<string>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  fieldMappingTime: [['validityPeriod', ['startDate', 'endDate']]],
  layout: 'vertical',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<
      KnowledgeCampaignApi.CampaignPayload & {
        validityPeriod?: [string, string];
      }
    >();
    const { validityPeriod: _period, ...payload } = values;

    drawerApi.lock();
    try {
      if (campaignId.value) {
        await updateCampaign(campaignId.value, payload);
        message.success('活动更新成功');
      } else {
        await createCampaign(payload);
        message.success('活动新增成功');
      }
      emits('success');
      drawerApi.close();
    } catch {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<KnowledgeCampaignApi.Campaign>();
    formApi.resetForm();
    campaignId.value = data?.id;

    await nextTick();

    if (data?.id) {
      formApi.setValues({
        name: data.name,
        applicableGoodsIds: data.applicableGoodsIds,
        discount: data.discount,
        validityPeriod: [data.startDate, data.endDate],
      });
    }
  },
});

const drawerTitle = computed(() =>
  campaignId.value ? '编辑活动' : '新增活动',
);
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form class="mx-4" />
  </Drawer>
</template>
