<div align="center">

# Knowledge Base Admin (T5)

Gas-station knowledge base admin (products, Q&A, campaigns) on [Vue Vben Admin 5.x](https://github.com/vbenjs/vue-vben-admin).

**Repo:** https://github.com/durancexuan/kb-admin-vben

</div>

**English** | [中文](./README.zh-CN.md)

---

## Overview

| Module      | Route                 | Backend                          |
| ----------- | --------------------- | -------------------------------- |
| Products    | `/knowledge/goods`    | Mock                             |
| Station Q&A | `/knowledge/qa`       | **kb-api** (Postgres + pgvector) |
| Campaigns   | `/knowledge/campaign` | Mock                             |

Shared status: **draft / online / offline**.

## Requirements

Node.js `^22.18.0` or `^24.0.0` · pnpm `>= 11.0.0` · Docker (for real Q&A DB only)

## Quick start (Mock only)

```bash
git clone https://github.com/durancexuan/kb-admin-vben.git
cd kb-admin-vben
corepack enable && pnpm install && pnpm -r run --if-present stub
pnpm dev:play
```

http://localhost:5555 · login `vben` / `123456` (slider captcha required)

## Q&A with PostgreSQL

From repo root, three terminals:

```bash
pnpm -F @vben/kb-api run db:up
cp apps/kb-api/.env.example apps/kb-api/.env   # first time
pnpm dev:kb-api
pnpm dev:play
```

`/api/knowledge/qa` is proxied to kb-api in `playground/vite.config.ts`. Login still uses Mock.

## Commands

| Command                          | Description        |
| -------------------------------- | ------------------ |
| `pnpm dev:play`                  | Admin UI           |
| `pnpm dev:kb-api`                | Q&A API (:8080)    |
| `pnpm -F @vben/kb-api run db:up` | Postgres container |

## Robot API

`POST http://127.0.0.1:8080/api/robot/knowledge/query` with header `X-Robot-Api-Key: robot-dev-key`. See [`apps/kb-api/README.md`](./apps/kb-api/README.md).

## FAQ

- **404 on login**: ensure Nitro Mock starts with `pnpm dev:play`
- **Q&A errors**: run `db:up` then `dev:kb-api`
- **Port 5556**: 5555 was busy; Vite picks the next port

[doc.vben.pro](https://doc.vben.pro) · [MIT](./LICENSE)
