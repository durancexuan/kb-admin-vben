-- 四库合一：机器人检索统一向量索引
CREATE TABLE IF NOT EXISTS kb_unified_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id VARCHAR(64) NOT NULL DEFAULT 'default',
  library VARCHAR(16) NOT NULL,
  source_id UUID NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  marker_text TEXT NOT NULL,
  embed_text TEXT NOT NULL,
  embedding vector(384),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_id VARCHAR(64),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kb_unified_index_library_chk
    CHECK (library IN ('qa', 'goods', 'campaign', 'robot-doc')),
  CONSTRAINT kb_unified_index_unique
    UNIQUE (station_id, library, source_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_unified_index_station_library
  ON kb_unified_index (station_id, library);

CREATE INDEX IF NOT EXISTS idx_unified_index_marker_trgm
  ON kb_unified_index USING gin (marker_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_unified_index_qa_category
  ON kb_unified_index (station_id, ((payload ->> 'category')))
  WHERE library = 'qa';
