-- BGE-small-zh-v1.5 输出 512 维；切换语义模型后清空旧向量并扩维
TRUNCATE TABLE kb_unified_index;
TRUNCATE TABLE kb_qa_embedding;
TRUNCATE TABLE kb_goods_embedding;

ALTER TABLE kb_qa_embedding
  ALTER COLUMN embedding TYPE vector(512);

ALTER TABLE kb_goods_embedding
  ALTER COLUMN embedding TYPE vector(512);

ALTER TABLE kb_unified_index
  ALTER COLUMN embedding TYPE vector(512);
