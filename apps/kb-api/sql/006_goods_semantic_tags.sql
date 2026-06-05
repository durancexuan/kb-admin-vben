-- 商品语义标签：口语/类目/近义词，用于检索加权
ALTER TABLE kb_goods
ADD COLUMN IF NOT EXISTS semantic_tags TEXT[] NOT NULL DEFAULT '{}';

-- 数组 GIN 索引（array_to_string 非 IMMUTABLE，不能用于表达式 trigram 索引）
CREATE INDEX IF NOT EXISTS idx_kb_goods_semantic_tags_gin ON kb_goods USING gin (
  semantic_tags
);
