CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS kb_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id VARCHAR(64) NOT NULL DEFAULT 'default',
  question VARCHAR(200) NOT NULL,
  answer VARCHAR(1000) NOT NULL,
  category VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  embed_status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  CONSTRAINT chk_kb_qa_category CHECK (
    category IN ('加油机', '卫生间', '便利店', '营业时间', '其他')
  ),
  CONSTRAINT chk_kb_qa_status CHECK (
    status IN ('draft', 'online', 'offline')
  ),
  CONSTRAINT chk_kb_qa_embed_status CHECK (
    embed_status IN ('pending', 'ok', 'failed', 'none')
  )
);

CREATE INDEX IF NOT EXISTS idx_kb_qa_station_status ON kb_qa (station_id, status);
CREATE INDEX IF NOT EXISTS idx_kb_qa_station_category ON kb_qa (station_id, category);
CREATE INDEX IF NOT EXISTS idx_kb_qa_question_trgm ON kb_qa USING gin (question gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kb_qa_answer_trgm ON kb_qa USING gin (answer gin_trgm_ops);

CREATE TABLE IF NOT EXISTS kb_qa_embedding (
  qa_id UUID PRIMARY KEY REFERENCES kb_qa (id) ON DELETE CASCADE,
  station_id VARCHAR(64) NOT NULL,
  embedding vector(384),
  embed_text TEXT NOT NULL,
  model_id VARCHAR(64) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_qa_embedding_station ON kb_qa_embedding (station_id);
