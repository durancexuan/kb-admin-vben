<div align="center">

# Knowledge Base Admin (T5)

Gas-station knowledge base admin on [Vue Vben Admin 5.x](https://github.com/vbenjs/vue-vben-admin).

**Repo:** https://github.com/durancexuan/kb-admin-vben

</div>

**English** | [中文](./README.zh-CN.md)

---

## Overview

All three knowledge modules use **kb-api** (Postgres + pgvector). Mock is only for login.

| Module      | Route                 | Backend |
| ----------- | --------------------- | ------- |
| Products    | `/knowledge/goods`    | kb-api  |
| Station Q&A | `/knowledge/qa`       | kb-api  |
| Campaigns   | `/knowledge/campaign` | kb-api  |

## Setup

```bash
pnpm -F @vben/kb-api run db:up
cp apps/kb-api/.env.example apps/kb-api/.env
pnpm dev:kb-api
pnpm dev:play
```

Login: `vben` / `123456` at http://localhost:5555

### Verify data in Postgres

All three modules persist to database `kb` in container `kb-postgres`:

| Module    | Table         | Related              |
| --------- | ------------- | -------------------- |
| Products  | `kb_goods`    | `kb_goods_embedding` |
| Q&A       | `kb_qa`       | `kb_qa_embedding`    |
| Campaigns | `kb_campaign` | `kb_campaign_goods`  |

Row counts (seed: 25 / 10 / 5):

```bash
docker exec -it kb-postgres psql -U kb -d kb -c "
SELECT 'goods' AS lib, COUNT(*)::int AS cnt FROM kb_goods
UNION ALL SELECT 'qa', COUNT(*)::int FROM kb_qa
UNION ALL SELECT 'campaign', COUNT(*)::int FROM kb_campaign;
"
```

Products (same order as admin list: `created_at`, SKU desc):

```bash
docker exec -it kb-postgres psql -U kb -d kb -c "
SELECT sku, name, shelf_location, status, created_at
FROM kb_goods ORDER BY created_at DESC, sku DESC LIMIT 5;
"
```

Q&A:

```bash
docker exec -it kb-postgres psql -U kb -d kb -c "
SELECT question, category, status FROM kb_qa ORDER BY created_at DESC LIMIT 5;
"
```

Campaigns:

```bash
docker exec -it kb-postgres psql -U kb -d kb -c "
SELECT c.name, c.discount, c.start_date, c.end_date, c.status,
       COUNT(cg.goods_id)::int AS applicable_goods_count
FROM kb_campaign c
LEFT JOIN kb_campaign_goods cg ON cg.campaign_id = c.id
GROUP BY c.id ORDER BY c.created_at DESC LIMIT 5;
"
```

See [README.zh-CN.md](./README.zh-CN.md) for full Chinese docs.

Robot API: `POST /api/robot/knowledge/query` — unified FAQ, goods, and campaign retrieval.

See [`apps/kb-api/README.md`](./apps/kb-api/README.md).

[doc.vben.pro](https://doc.vben.pro) · [MIT](./LICENSE)
