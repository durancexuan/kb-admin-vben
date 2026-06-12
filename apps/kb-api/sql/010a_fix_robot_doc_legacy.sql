-- 一次性修复：旧版 kb_robot_doc 缺 station_id 时，在 011 建表/建索引前重建
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'kb_robot_doc'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'kb_robot_doc'
      AND column_name = 'station_id'
  ) THEN
    DROP TABLE IF EXISTS kb_robot_doc_chunk CASCADE;
    DROP TABLE IF EXISTS kb_robot_doc CASCADE;
  END IF;
END $$;
