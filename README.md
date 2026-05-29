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

Robot API: `POST /api/robot/knowledge/query` — unified FAQ, goods, and campaign retrieval.

See [`apps/kb-api/README.md`](./apps/kb-api/README.md).

[doc.vben.pro](https://doc.vben.pro) · [MIT](./LICENSE)
