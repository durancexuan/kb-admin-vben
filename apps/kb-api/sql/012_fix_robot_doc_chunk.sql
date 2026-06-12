-- 一次性修复：旧版 kb_robot_doc_chunk 含 station_id 等字段时重建
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'kb_robot_doc_chunk'
      AND column_name = 'station_id'
  ) THEN
    DROP TABLE kb_robot_doc_chunk CASCADE;

    CREATE TABLE kb_robot_doc_chunk (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      doc_id UUID NOT NULL REFERENCES kb_robot_doc (id) ON DELETE CASCADE,
      chunk_index INT NOT NULL,
      heading VARCHAR(300) NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT kb_robot_doc_chunk_unique UNIQUE (doc_id, chunk_index)
    );

    CREATE INDEX idx_robot_doc_chunk_doc ON kb_robot_doc_chunk (doc_id);
  END IF;
END $$;
