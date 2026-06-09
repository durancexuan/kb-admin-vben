# Embedding API 对接说明（负责人 GPU 服务 ↔ kb-api）

kb-api 在**发布问答/商品**和**机器人检索**时，需要把文本转成向量写入 pgvector。  
配置 `EMBEDDING_API_URL` 后，kb-api 会调用负责人 GPU 上的 Embedding 服务，不再使用本地 `local-hash-v1`。

---

## 一、kb-api 需要负责人提供什么

| 项                     | 必填   | 说明                                    |
| ---------------------- | ------ | --------------------------------------- |
| `EMBEDDING_API_URL`    | **是** | HTTP POST 地址，见下文格式              |
| `EMBEDDING_API_MODEL`  | 是     | 与 GPU 服务里加载的模型名一致           |
| `EMBEDDING_API_FORMAT` | 否     | 默认 `openai`；见第二节                 |
| `EMBEDDING_API_KEY`    | 否     | 有鉴权时提供；内网可空                  |
| 向量维度               | 是     | 告知模型输出维度（如 384 / 512 / 1024） |

kb-api 侧在 `apps/kb-api/.env` 写入：

```env
EMBEDDING_API_URL=http://192.168.1.100:8080/v1/embeddings
EMBEDDING_API_MODEL=bge-small-zh-v1.5
EMBEDDING_API_FORMAT=openai
EMBEDDING_DIM=512
```

> **注意**：数据库表 `kb_*_embedding.embedding` 当前为 `vector(384)`。若 GPU 模型维度不是 384，需同步修改 `EMBEDDING_DIM` 并调整表结构（见第五节）。

---

## 二、支持的请求格式（`EMBEDDING_API_FORMAT`）

### 1. `openai`（默认，推荐）

多数 GPU 推理框架（vLLM、Xinference、TEI OpenAI 路由等）兼容此格式。

**请求**

```http
POST /v1/embeddings
Content-Type: application/json
Authorization: Bearer <可选>

{
  "input": "卫生间在哪里",
  "model": "bge-small-zh-v1.5"
}
```

**响应（任选其一，kb-api 自动解析）**

```json
{
  "data": [{ "embedding": [0.12, -0.03, ...] }]
}
```

### 2. `tei`（HuggingFace Text Embeddings Inference 原生）

**请求**

```json
{ "inputs": "卫生间在哪里" }
```

常见地址：`http://<host>:8080/embed`

**响应**

```json
[[0.12, -0.03, ...]]
```

### 3. `ollama`

**请求**

```json
{
  "model": "bge-m3",
  "prompt": "卫生间在哪里"
}
```

地址示例：`http://<host>:11434/api/embeddings`

**响应**

```json
{ "embedding": [0.12, -0.03, ...] }
```

### 4. `simple`（简易内网接口）

**请求**

```json
{ "input": "卫生间在哪里" }
```

**响应**（支持 `embedding` / `vector` / `embeddings[0]` / `data[0].embedding`）

---

## 三、联调步骤

### 1. 负责人自测 GPU 服务

```bash
curl -s -X POST "http://<GPU-IP>:8080/v1/embeddings" \
  -H "Content-Type: application/json" \
  -d '{"input":"测试","model":"bge-small-zh-v1.5"}'
```

应返回非空浮点数组。

### 2. kb-api 配置并重启

```bash
cd apps/kb-api
# 编辑 .env 填入 EMBEDDING_API_*
pnpm dev:kb-api
# 或 docker compose -f docker-compose.prod.yml restart kb-api
```

启动时会：

1. 探针调用 Embedding API
2. 对全部已上线问答/商品**重建向量**（`reindexOnline`）

### 3. 验证 kb-api 健康检查

```bash
curl -s http://127.0.0.1:8080/health
```

期望 `embedding.ok: true`，且 `mode: "external"`：

```json
{
  "ok": true,
  "embedding": {
    "ok": true,
    "mode": "external",
    "model": "bge-small-zh-v1.5",
    "format": "openai",
    "dim": 512,
    "url": "http://192.168.1.100:8080/v1/embeddings"
  }
}
```

### 4. 验证语义检索

```bash
curl -s -X POST "http://127.0.0.1:8080/api/robot/knowledge/query" \
  -H "Content-Type: application/json" \
  -H "X-Robot-Api-Key: robot-dev-key" \
  -d '{"utterance":"有没有吃的"}'
```

命中商品且 `matchType` 为 `vector` 或 `hybrid` 时，说明外部 Embedding 已生效。

---

## 四、网络要求

- kb-api 服务器必须能访问 GPU 服务器的 `EMBEDDING_API_URL`（内网 IP 或 VPN）
- 超时默认 30 秒，可通过 `EMBEDDING_API_TIMEOUT_MS` 调整
- Embedding 失败时，对应条目的 `embed_status` 会变为 `failed`，日志含 `[qa] embedding failed` / `[goods] embedding failed`

---

## 五、向量维度与数据库

当前 SQL 迁移创建的列为 `vector(384)`。若 GPU 模型输出 **512**（如 `bge-small-zh-v1.5`）：

1. `.env` 设置 `EMBEDDING_DIM=512`
2. 在 Postgres 执行（仅需一次）：

```sql
ALTER TABLE kb_qa_embedding
  ALTER COLUMN embedding TYPE vector(512);
ALTER TABLE kb_goods_embedding
  ALTER COLUMN embedding TYPE vector(512);
```

3. 重启 kb-api，触发全量 reindex

若暂时不改表结构，kb-api 会把 API 返回向量 **截断/补零** 到 `EMBEDDING_DIM`，能跑但语义效果会变差，**生产不推荐**。

---

## 六、常见问题

| 现象 | 处理 |
| --- | --- |
| 启动日志 `external embedding api unavailable` | 检查 URL、防火墙、模型名、GPU 服务是否启动 |
| 全部 `embed_status=failed` | 看 kb-api 日志；用 curl 直连 GPU 服务对比 |
| 检索仍只靠关键词 | 确认 reindex 完成；`GET /health` 中 `embedding.ok` 为 true |
| 401 / 403 | 配置 `EMBEDDING_API_KEY` 或让负责人放开内网鉴权 |

---

相关文档：[DEPLOY.zh-CN.md](./DEPLOY.zh-CN.md)、[ROBOT_API.zh-CN.md](./ROBOT_API.zh-CN.md)
