# @vben/kb-api

知识库三库后端：PostgreSQL + pgvector（问答、商品向量检索）。

## 启动（本地开发）

```bash
pnpm -F @vben/kb-api run db:up
cp apps/kb-api/.env.example apps/kb-api/.env
pnpm dev:kb-api
```

- API：http://127.0.0.1:8080/api
- 健康检查：http://127.0.0.1:8080/health

## 部署到服务器

见 **[DEPLOY.zh-CN.md](./DEPLOY.zh-CN.md)**（Docker 一键：`apps/kb-api` 下 `bash scripts/deploy.sh`）。

## 管理端接口

| 模块 | 路径前缀                    | 鉴权 |
| ---- | --------------------------- | ---- |
| 问答 | `/api/knowledge/qa/*`       | JWT  |
| 商品 | `/api/knowledge/goods/*`    | JWT  |
| 活动 | `/api/knowledge/campaign/*` | JWT  |

路径与 Mock 一致；playground 通过 Vite 代理 `/api/knowledge/*`。

## 机器人统一检索

**对接负责人请直接看：[ROBOT_API.zh-CN.md](./ROBOT_API.zh-CN.md)**（含鉴权、请求/响应、`confidence` / `vectorConfidence`、话术示例）。

```http
POST /api/robot/knowledge/query
X-Robot-Api-Key: robot-dev-key
```

问答/商品在 pgvector 索引命中时，响应除综合 `confidence` 外，另返回 **`vectorConfidence`**（向量相似度）与 **`matchType`**（`keyword` / `vector` / `hybrid` 等）。

## 外部 Embedding API（负责人 GPU）

默认 `local-hash-v1` 仅适合开发。生产在 `.env` 配置 `EMBEDDING_API_URL` 后，kb-api 会调用 GPU 上的向量服务。

**对接说明：[EMBEDDING_API.zh-CN.md](./EMBEDDING_API.zh-CN.md)**

```env
EMBEDDING_API_URL=http://<GPU-IP>:8080/v1/embeddings
EMBEDDING_API_MODEL=bge-small-zh-v1.5
EMBEDDING_API_FORMAT=openai
```

启动后 `GET /health` 可查看 `embedding.ok` 与当前模型。

## 数据表

| 表                                  | 说明                     |
| ----------------------------------- | ------------------------ |
| `kb_qa` / `kb_qa_embedding`         | 问答                     |
| `kb_goods` / `kb_goods_embedding`   | 商品（含货架、导航点位） |
| `kb_campaign` / `kb_campaign_goods` | 活动与适用商品           |

根目录说明：[README.zh-CN.md](../../README.zh-CN.md)
