# @vben/kb-api

站级问答库后端：PostgreSQL + pgvector。商品/活动接口未实现。

## 启动（仓库根目录）

```bash
pnpm -F @vben/kb-api run db:up
cp apps/kb-api/.env.example apps/kb-api/.env   # 首次
pnpm dev:kb-api
```

- API：http://127.0.0.1:8080/api
- 健康检查：http://127.0.0.1:8080/health
- 数据库：`postgresql://kb:kb_secret@127.0.0.1:5432/kb`

## 接口

| 类型 | 路径 | 鉴权 |
| --- | --- | --- |
| 管理 CRUD | `/api/knowledge/qa/*` | `Authorization: Bearer <JWT>`（与 Mock 同 secret） |
| 机器人检索 | `POST /api/robot/knowledge/query` | `X-Robot-Api-Key`（默认 `robot-dev-key`） |

管理端通过 playground 的 Vite 代理访问，无需单独配 CORS。

## 机器人请求示例

```json
{
  "utterance": "卫生间在哪里",
  "topK": 5,
  "hints": { "category": "卫生间" }
}
```

响应关注：`data.hit`、`data.reply.speak`、`data.candidates`。

## 环境变量（节选）

| 变量 | 默认 |
| --- | --- |
| `PORT` | `8080` |
| `ROBOT_API_KEY` | `robot-dev-key` |
| `MIN_RETRIEVE_SCORE` | `0.35` |
| `EMBEDDING_API_URL` / `EMBEDDING_API_KEY` | 空（开发用本地向量；生产可配 OpenAI 兼容 API） |

## 命令

| 命令                                         | 说明          |
| -------------------------------------------- | ------------- |
| `pnpm -F @vben/kb-api run dev`               | 开发          |
| `pnpm -F @vben/kb-api run db:up` / `db:down` | 启停 Postgres |

根目录说明：[README.zh-CN.md](../../README.zh-CN.md)
