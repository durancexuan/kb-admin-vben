import process from 'node:process';

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  ACCESS_TOKEN_SECRET: z.string().default('access_token_secret'),
  DATABASE_URL: z
    .string()
    .default('postgresql://kb:kb_secret@127.0.0.1:5432/kb'),
  DEFAULT_STATION_ID: z.string().default('default'),
  EMBEDDING_API_KEY: z.string().optional(),
  EMBEDDING_API_MODEL: z.string().default('text-embedding-3-small'),
  EMBEDDING_API_URL: z.string().optional(),
  EMBEDDING_DIM: z.coerce.number().default(384),
  EMBEDDING_MODEL: z.string().default('local-hash-v1'),
  MIN_RETRIEVE_SCORE: z.coerce.number().default(0.35),
  PORT: z.coerce.number().default(8080),
  ROBOT_API_KEY: z.string().default('robot-dev-key'),
});

export const config = envSchema.parse(process.env);

export function hasExternalEmbedding() {
  return Boolean(config.EMBEDDING_API_URL && config.EMBEDDING_API_KEY);
}
