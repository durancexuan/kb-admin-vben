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

并行召回问答（关键词+向量）、商品（SKU 精确 / 关键词+向量）、活动（关键词），按置信度决选。

### 请求

```json
{ "utterance": "卫生间在哪里" }
```

### 响应 `data` 字段

三库各取置信度最高的一条，再全局决选，**只返回一条最佳回答**。

| 字段           | 说明                                                |
| -------------- | --------------------------------------------------- |
| `utterance`    | 回显用户原话                                        |
| `hit`          | 是否达到命中阈值（`false` 时不要播报）              |
| `library`      | 来源库 `qa` / `goods` / `campaign`；未命中为 `null` |
| `libraryLabel` | 中文库名；未命中为 `null`                           |
| `confidence`   | 最佳匹配置信度 0~1；无候选为 `null`                 |
| `display`      | 界面短标题；未命中为 `null`                         |
| `speak`        | **播报正文**（TTS 直接读这个）；未命中为 `null`     |

```json
{
  "code": 0,
  "data": {
    "utterance": "卫生间在哪里",
    "hit": true,
    "library": "qa",
    "libraryLabel": "站级问答库",
    "confidence": 0.6881,
    "display": "卫生间在哪里？",
    "speak": "进入便利店后左转即到，设有无障碍卫生间。"
  }
}
```

未命中时：`hit: false`，`library` / `libraryLabel` / `display` / `speak` 为 `null`；`confidence` 可能仍返回最佳尝试分数供调试。

## 数据表

| 表                                  | 说明                     |
| ----------------------------------- | ------------------------ |
| `kb_qa` / `kb_qa_embedding`         | 问答                     |
| `kb_goods` / `kb_goods_embedding`   | 商品（含货架、导航点位） |
| `kb_campaign` / `kb_campaign_goods` | 活动与适用商品           |

根目录说明：[README.zh-CN.md](../../README.zh-CN.md)
