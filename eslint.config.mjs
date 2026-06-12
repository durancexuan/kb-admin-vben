import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    ignores: ['**/apps/kb-api/models/**', '**/apps/kb-api/.venv/**'],
  },
]);
