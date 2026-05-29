CREATE TABLE IF NOT EXISTS kb_goods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id VARCHAR(64) NOT NULL DEFAULT 'default',
  sku VARCHAR(32) NOT NULL,
  name VARCHAR(128) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  shelf_location VARCHAR(32) NOT NULL,
  spec VARCHAR(64),
  navigation_point VARCHAR(128),
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  embed_status VARCHAR(16) NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  CONSTRAINT chk_kb_goods_status CHECK (status IN ('draft', 'online', 'offline')),
  CONSTRAINT chk_kb_goods_embed_status CHECK (
    embed_status IN ('pending', 'ok', 'failed', 'none')
  ),
  CONSTRAINT uq_kb_goods_station_sku UNIQUE (station_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_kb_goods_station_status ON kb_goods (station_id, status);
CREATE INDEX IF NOT EXISTS idx_kb_goods_name_trgm ON kb_goods USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kb_goods_nav_trgm ON kb_goods USING gin (
  navigation_point gin_trgm_ops
);

CREATE TABLE IF NOT EXISTS kb_goods_embedding (
  goods_id UUID PRIMARY KEY REFERENCES kb_goods (id) ON DELETE CASCADE,
  station_id VARCHAR(64) NOT NULL,
  embedding vector(384),
  embed_text TEXT NOT NULL,
  model_id VARCHAR(64) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_goods_embedding_station ON kb_goods_embedding (station_id);

CREATE TABLE IF NOT EXISTS kb_campaign (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id VARCHAR(64) NOT NULL DEFAULT 'default',
  name VARCHAR(128) NOT NULL,
  discount VARCHAR(256) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  CONSTRAINT chk_kb_campaign_status CHECK (status IN ('draft', 'online', 'offline'))
);

CREATE INDEX IF NOT EXISTS idx_kb_campaign_station_status ON kb_campaign (station_id, status);
CREATE INDEX IF NOT EXISTS idx_kb_campaign_name_trgm ON kb_campaign USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kb_campaign_discount_trgm ON kb_campaign USING gin (
  discount gin_trgm_ops
);

CREATE TABLE IF NOT EXISTS kb_campaign_goods (
  campaign_id UUID NOT NULL REFERENCES kb_campaign (id) ON DELETE CASCADE,
  goods_id UUID NOT NULL REFERENCES kb_goods (id) ON DELETE RESTRICT,
  PRIMARY KEY (campaign_id, goods_id)
);

CREATE INDEX IF NOT EXISTS idx_kb_campaign_goods_goods ON kb_campaign_goods (goods_id);
