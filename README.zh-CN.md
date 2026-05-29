<div align="center">

# 知识库管理后台（T5）

加油站场景知识库管理：商品、问答、营销活动。基于 [Vue Vben Admin 5.x](https://github.com/vbenjs/vue-vben-admin)。

**仓库：** https://github.com/durancexuan/kb-admin-vben

</div>

**中文** | [English](./README.md)

---

## 简介

- **前端**：`playground`（Vben Admin）
- **Mock**：仅登录等通用接口（`apps/backend-mock`）
- **真实后端**：三库 CRUD → `apps/kb-api`（PostgreSQL + pgvector）

三库统一状态：**草稿 / 已上线 / 已下线**。

| 菜单       | 路由                  | 后端   |
| ---------- | --------------------- | ------ |
| 商品全维库 | `/knowledge/goods`    | kb-api |
| 站级问答库 | `/knowledge/qa`       | kb-api |
| 营销活动库 | `/knowledge/campaign` | kb-api |

## 环境

- Node.js `^22.18.0` 或 `^24.0.0`
- pnpm `>= 11.0.0`
- Docker Desktop（Postgres）

## 快速开始（仅 Mock 登录）

```bash
git clone https://github.com/durancexuan/kb-admin-vben.git
cd kb-admin-vben
corepack enable && pnpm install && pnpm -r run --if-present stub
pnpm dev:play
```

仅 Mock 时三库接口会报错，需同时启动 kb-api。

## 完整联调（推荐）

**三个终端，均在仓库根目录：**

```bash
pnpm -F @vben/kb-api run db:up
cp apps/kb-api/.env.example apps/kb-api/.env   # 首次
pnpm dev:kb-api
pnpm dev:play
```

`playground/vite.config.ts` 已将 `/api/knowledge/*` 代理到 kb-api；登录仍走 Mock。

### 确认数据在库

三库数据均在 Postgres 容器 `kb-postgres`、数据库 `kb` 中（**不是** Mock 内存）。管理端新建/编辑后，用下列命令核对是否已写入。

| 子库       | 业务表        | 关联表                                   |
| ---------- | ------------- | ---------------------------------------- |
| 商品全维库 | `kb_goods`    | `kb_goods_embedding`（已上线商品的向量） |
| 站级问答库 | `kb_qa`       | `kb_qa_embedding`                        |
| 营销活动库 | `kb_campaign` | `kb_campaign_goods`（适用商品）          |

**三库行数一览**（种子数据：商品 25、问答 10、活动 5）：

```bash
docker exec -it kb-postgres psql -U kb -d kb -c "
SELECT 'goods' AS lib, COUNT(*)::int AS cnt FROM kb_goods
UNION ALL SELECT 'qa', COUNT(*)::int FROM kb_qa
UNION ALL SELECT 'campaign', COUNT(*)::int FROM kb_campaign;
"
```

**商品全维库** — 最近 5 条（与管理端列表一致：`created_at`、SKU 倒序）：

```bash
docker exec -it kb-postgres psql -U kb -d kb -c "
SELECT sku, name, shelf_location, status, created_at
FROM kb_goods
ORDER BY created_at DESC, sku DESC
LIMIT 5;
"
```

> 查库勿写无 `ORDER BY` 的 `LIMIT`，否则可能只看到旧种子数据。

**站级问答库** — 最近 5 条（含分类、状态）：

```bash
docker exec -it kb-postgres psql -U kb -d kb -c "
SELECT question, category, status
FROM kb_qa
ORDER BY created_at DESC, id ASC
LIMIT 5;
"
```

**营销活动库** — 最近 5 条（含有效期、适用商品数）：

```bash
docker exec -it kb-postgres psql -U kb -d kb -c "
SELECT c.name, c.discount, c.start_date, c.end_date, c.status,
       COUNT(cg.goods_id)::int AS applicable_goods_count
FROM kb_campaign c
LEFT JOIN kb_campaign_goods cg ON cg.campaign_id = c.id
GROUP BY c.id
ORDER BY c.created_at DESC, c.id ASC
LIMIT 5;
"
```

**页面侧快速确认**：kb-api 终端应出现对应请求日志（如 `GET /api/knowledge/goods/list`）；在管理端新增一条后 **重启 kb-api**，列表里仍在 → 说明已落库。Mock 内存数据重启后会消失，勿与 kb-api 混淆。

**交互式进库**（可选）：

```bash
docker exec -it kb-postgres psql -U kb -d kb
# 进入后例如：\dt kb_*   SELECT * FROM kb_goods LIMIT 3;
```

## 常用命令

| 命令                             | 说明          |
| -------------------------------- | ------------- |
| `pnpm dev:play`                  | 管理端        |
| `pnpm dev:kb-api`                | 知识库 API    |
| `pnpm -F @vben/kb-api run db:up` | Postgres 容器 |

## 机器人 / Agent

`POST http://127.0.0.1:8080/api/robot/knowledge/query` — 并行检索三库。看返回 **`data.hit`** 与 **`data.speak`**（播报正文）；**`data.libraryLabel`** 表示来自哪个库。详见 [`apps/kb-api/README.md`](./apps/kb-api/README.md)。

## 常见问题

- **登录 404**：确认 `Nitro Mock Server` 已启动
- **三库报错**：先 `db:up` 再 `dev:kb-api`
- **8080 占用**：结束旧 `node` 进程或改 `apps/kb-api/.env` 中 `PORT`

[doc.vben.pro](https://doc.vben.pro) · [MIT](./LICENSE)
