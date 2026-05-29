# @vben/kb-api

知识库三库后端：PostgreSQL + pgvector（问答、商品向量检索）。

## 启动（仓库根目录）

```bash
pnpm -F @vben/kb-api run db:up
cp apps/kb-api/.env.example apps/kb-api/.env
pnpm dev:kb-api
```

- API：http://127.0.0.1:8080/api
- 健康检查：http://127.0.0.1:8080/health

## 管理端接口

| 模块 | 路径前缀                    | 鉴权 |
| ---- | --------------------------- | ---- |
| 问答 | `/api/knowledge/qa/*`       | JWT  |
| 商品 | `/api/knowledge/goods/*`    | JWT  |
| 活动 | `/api/knowledge/campaign/*` | JWT  |

路径与 Mock 一致；playground 通过 Vite 代理 `/api/knowledge/*`。

## 机器人统一检索

```http
POST /api/robot/knowledge/query
X-Robot-Api-Key: robot-dev-key
```

并行召回问答（关键词+向量）、商品（SKU 精确 / 关键词+向量）、活动（关键词），按置信度决选。响应 `data.type`：`faq` | `goods` | `campaign`。

示例：

```json
{ "utterance": "有没有矿泉水", "topK": 5 }
```

```json
{ "utterance": "有什么优惠活动", "topK": 5 }
```

## 数据表

| 表                                  | 说明                     |
| ----------------------------------- | ------------------------ |
| `kb_qa` / `kb_qa_embedding`         | 问答                     |
| `kb_goods` / `kb_goods_embedding`   | 商品（含货架、导航点位） |
| `kb_campaign` / `kb_campaign_goods` | 活动与适用商品           |

根目录说明：[README.zh-CN.md](../../README.zh-CN.md)
