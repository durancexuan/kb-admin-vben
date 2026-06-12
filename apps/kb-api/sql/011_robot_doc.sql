CREATE TABLE IF NOT EXISTS kb_robot_doc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id VARCHAR(64) NOT NULL DEFAULT 'default',
  title VARCHAR(200) NOT NULL,
  category VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  source_name VARCHAR(200),
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  embed_status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  CONSTRAINT kb_robot_doc_status_chk
    CHECK (status IN ('draft', 'offline', 'online')),
  CONSTRAINT kb_robot_doc_embed_status_chk
    CHECK (embed_status IN ('failed', 'none', 'ok', 'pending')),
  CONSTRAINT kb_robot_doc_category_chk
    CHECK (category IN ('本站基本情况', '企业通用知识', '本站专属知识', '团队与荣誉'))
);

CREATE INDEX IF NOT EXISTS idx_robot_doc_station_status
  ON kb_robot_doc (station_id, status);

CREATE TABLE IF NOT EXISTS kb_robot_doc_chunk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES kb_robot_doc (id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  heading VARCHAR(300) NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kb_robot_doc_chunk_unique UNIQUE (doc_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_robot_doc_chunk_doc
  ON kb_robot_doc_chunk (doc_id);
