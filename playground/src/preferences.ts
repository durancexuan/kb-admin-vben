import {
  defineOverridesPreferences,
  definePreferencesExtension,
} from '@vben/preferences';

interface PlaygroundPreferencesExtension {
  defaultVisibleRows: number;
  enableQuickActions: boolean;
  highlightTone: 'default' | 'success' | 'warning';
  reportTitle: string;
}

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    name: import.meta.env.VITE_APP_TITLE || '知识库管理',
    defaultHomePath: '/analytics',
  },
});

export type { PlaygroundPreferencesExtension };

/** 知识库项目不使用演示型偏好扩展 */
export const preferencesExtension =
  definePreferencesExtension<PlaygroundPreferencesExtension>({
    tabLabel: '',
    title: '',
    fields: [],
  });
