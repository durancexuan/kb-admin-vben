# 知识库 API（@vben/kb-api）

站级问答库真实后端：**PostgreSQL + pgvector**。管理端接口路径与 `apps/backend-mock` 一致；另提供机器人语义检索接口。

> 商品库、活动库 **未实现**，请勿对本服务请求 `/knowledge/goods/*`、`/knowledge/campaign/*`。

根目录说明见 [README.zh-CN.md](../../README.zh-CN.md#问答库真实后端kb-api)。

## 能力一览

| 能力 | 路径前缀 | 鉴权 |
| --- | --- | --- |
| 问答 CRUD / 上下线 | `/api/knowledge/qa` | `Authorization: Bearer <JWT>` |
| 机器人检索 | `/api/robot/knowledge/query` | `X-Robot-Api-Key` |
| 健康检查 | `/health` | 无 |

## 快速开始

```bash
# 仓库根目录
pnpm install

# 启动数据库（需 Docker Desktop）
pnpm -F @vben/kb-api run db:up

# 环境变量（首次）
cp apps/kb-api/.env.example apps/kb-api/.env

# 启动服务 → http://127.0.0.1:8080
pnpm dev:kb-api
```

首次启动会：

1. 执行 `sql/001_init.sql`、`sql/002_seed.sql`
2. 为所有 `status = online` 的问答重建向量索引

## 管理端接口

与 Mock 相同，响应包：

```json
{ "code": 0, "data": { ... }, "message": "ok", "error": null }
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/knowledge/qa/list` | `page`, `pageSize`, `keyword`, `category` |
| POST | `/api/knowledge/qa` | 新增，默认 `draft` |
| PUT | `/api/knowledge/qa/:id` | 编辑；已上线条目会重算向量 |
| DELETE | `/api/knowledge/qa/:id` | 删除 |
| POST | `/api/knowledge/qa/:id/publish` | 上线 + 写向量 |
| POST | `/api/knowledge/qa/:id/offline` | 下线 + 删向量 |

JWT：`ACCESS_TOKEN_SECRET` 须与 Mock 相同（默认 `access_token_secret`），使用 playground 登录后的 token 即可。

## 机器人检索

```http
POST /api/robot/knowledge/query
X-Robot-Api-Key: robot-dev-key
Content-Type: application/json

{
  "utterance": "洗手间怎么走",
  "topK": 5,
  "hints": { "category": "卫生间" }
}
```

成功命中示例（字段节选）：

```json
{
  "code": 0,
  "data": {
    "hit": true,
    "type": "faq",
    "reply": {
      "speak": "进入便利店后左转即到，设有无障碍卫生间。",
      "display": "卫生间在哪里？"
    },
    "source": {
      "qaId": "00000000-0000-4000-8000-000000000002",
      "category": "卫生间",
      "matchedQuestion": "卫生间在哪里？",
      "matchType": "hybrid"
    },
    "candidates": [ ... ]
  }
}
```

检索逻辑：对已上线问答并行执行 **pg_trgm 关键词** 与 **pgvector 向量** 召回，按 `0.35 × 关键词分 + 0.65 × 向量分` 合并（仅一路命中则按该路计分）。`MIN_RETRIEVE_SCORE` 以下返回 `hit: false`。

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `8080` | 监听端口 |
| `DATABASE_URL` | `postgresql://kb:kb_secret@127.0.0.1:5432/kb` | 数据库 |
| `ACCESS_TOKEN_SECRET` | `access_token_secret` | 管理端 JWT |
| `DEFAULT_STATION_ID` | `default` | 单站占位 |
| `ROBOT_API_KEY` | `robot-dev-key` | 机器人密钥 |
| `MIN_RETRIEVE_SCORE` | `0.35` | 最低命中分 |
| `EMBEDDING_DIM` | `384` | 向量维度 |
| `EMBEDDING_MODEL` | `local-hash-v1` | 本地模型标识 |
| `EMBEDDING_API_URL` | — | OpenAI 兼容 Embedding 地址 |
| `EMBEDDING_API_KEY` | — | Embedding API Key |

未配置外部 Embedding 时使用 **local-hash-v1**（离线可跑，适合开发）；生产建议配置 `EMBEDDING_API_URL` + `EMBEDDING_API_KEY`。

## 目录结构

```text
apps/kb-api/
  docker-compose.yml    # Postgres + pgvector
  sql/
    001_init.sql        # 表结构
    002_seed.sql        # 种子问答
  src/
    main.ts             # 入口
    qa/                 # CRUD、发布、检索
    robot/              # 机器人 query
    embedding/          # 向量生成
    db/                 # 连接与迁移
```

## 常用命令

| 命令                               | 说明                      |
| ---------------------------------- | ------------------------- |
| `pnpm -F @vben/kb-api run dev`     | 开发（watch）             |
| `pnpm -F @vben/kb-api run start`   | 生产式启动                |
| `pnpm -F @vben/kb-api run db:up`   | 启动 Docker Postgres      |
| `pnpm -F @vben/kb-api run db:down` | 停止容器                  |
| `pnpm -F @vben/kb-api run migrate` | 仅执行 SQL（不启动 HTTP） |

## 故障排查

**`ECONNREFUSED` 连接数据库**

- 确认 Docker Desktop 已启动：`pnpm -F @vben/kb-api run db:up`
- 检查 `DATABASE_URL` 与 `docker-compose.yml` 中账号一致

**管理端 401**

- `ACCESS_TOKEN_SECRET` 与 Mock 不一致时需重新登录

**机器人始终 `hit: false`**

- 确认问答已 **上线**（`draft` 不参与检索）
- 调低 `MIN_RETRIEVE_SCORE` 或换更接近标准问的 `utterance`
- 执行 `pnpm dev:kb-api` 时会 `reindexOnline()`；也可重启服务重建向量

**`embed_status = failed`**

- 查看启动日志；外部 Embedding 不可用时仍会 `online`，但仅关键词检索有效
