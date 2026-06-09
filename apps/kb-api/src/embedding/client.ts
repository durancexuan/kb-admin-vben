import { config } from '../config.js';

export type EmbeddingApiFormat = 'ollama' | 'openai' | 'simple' | 'tei';

export type EmbeddingHealth = {
  dim: number;
  error?: string;
  format: EmbeddingApiFormat;
  mode: 'external' | 'local';
  model: string;
  ok: boolean;
  url?: string;
};

function buildRequestBody(text: string, format: EmbeddingApiFormat) {
  switch (format) {
    case 'ollama': {
      return {
        model: config.EMBEDDING_API_MODEL,
        prompt: text,
      };
    }
    case 'simple': {
      return { input: text };
    }
    case 'tei': {
      return { inputs: text };
    }
    default: {
      return {
        input: text,
        model: config.EMBEDDING_API_MODEL,
      };
    }
  }
}

function buildHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.EMBEDDING_API_KEY) {
    headers.Authorization = `Bearer ${config.EMBEDDING_API_KEY}`;
  }
  return headers;
}

function extractVector(payload: unknown): null | number[] {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    const first = payload[0];
    if (Array.isArray(first) && first.length > 0) {
      return first as number[];
    }
    if (typeof first === 'number') {
      return payload as number[];
    }
    return null;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.embedding) && record.embedding.length > 0) {
    return record.embedding as number[];
  }

  if (Array.isArray(record.vector) && record.vector.length > 0) {
    return record.vector as number[];
  }

  if (Array.isArray(record.embeddings)) {
    const first = record.embeddings[0];
    if (Array.isArray(first) && first.length > 0) {
      return first as number[];
    }
  }

  if (Array.isArray(record.data)) {
    const first = record.data[0];
    if (Array.isArray(first) && first.length > 0) {
      return first as number[];
    }
    if (first && typeof first === 'object') {
      const embedding = (first as { embedding?: number[] }).embedding;
      if (embedding?.length) {
        return embedding;
      }
    }
  }

  return null;
}

async function readErrorBody(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return '';
  }
}

export function getActiveEmbeddingModelId() {
  return config.EMBEDDING_API_URL
    ? config.EMBEDDING_API_MODEL
    : config.EMBEDDING_MODEL;
}

export function isExternalEmbeddingEnabled() {
  return Boolean(config.EMBEDDING_API_URL);
}

export async function fetchExternalEmbedding(text: string): Promise<number[]> {
  const apiUrl = config.EMBEDDING_API_URL;
  if (!apiUrl) {
    throw new Error('EMBEDDING_API_URL is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.EMBEDDING_API_TIMEOUT_MS,
  );

  try {
    const response = await fetch(apiUrl, {
      body: JSON.stringify(buildRequestBody(text, config.EMBEDDING_API_FORMAT)),
      headers: buildHeaders(),
      method: 'POST',
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await readErrorBody(response);
      throw new Error(
        `Embedding API failed: HTTP ${response.status}${detail ? ` — ${detail}` : ''}`,
      );
    }

    const payload = await response.json();
    const vector = extractVector(payload);
    if (!vector?.length) {
      throw new Error('Embedding API returned empty or unrecognized vector');
    }

    return vector;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Embedding API timeout after ${config.EMBEDDING_API_TIMEOUT_MS}ms`,
        { cause: error },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkEmbeddingApi(
  probeText = '知识库向量探针',
): Promise<EmbeddingHealth> {
  if (!isExternalEmbeddingEnabled()) {
    return {
      dim: config.EMBEDDING_DIM,
      format: config.EMBEDDING_API_FORMAT,
      mode: 'local',
      model: config.EMBEDDING_MODEL,
      ok: true,
    };
  }

  try {
    const vector = await fetchExternalEmbedding(probeText);
    return {
      dim: vector.length,
      format: config.EMBEDDING_API_FORMAT,
      mode: 'external',
      model: config.EMBEDDING_API_MODEL,
      ok: true,
      url: config.EMBEDDING_API_URL,
    };
  } catch (error) {
    return {
      dim: config.EMBEDDING_DIM,
      error: error instanceof Error ? error.message : String(error),
      format: config.EMBEDDING_API_FORMAT,
      mode: 'external',
      model: config.EMBEDDING_API_MODEL,
      ok: false,
      url: config.EMBEDDING_API_URL,
    };
  }
}
