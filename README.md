<div align="center">

# Knowledge Base Admin (T5)

A gas-station knowledge base admin built on [Vue Vben Admin 5.x](https://github.com/vbenjs/vue-vben-admin), covering products, Q&A, and marketing campaigns.

**Repository:** https://github.com/durancexuan/kb-admin-vben

</div>

**English** | [中文](./README.zh-CN.md)

---

## Overview

This project implements the T5 knowledge base admin in the **`playground`** app of the Vben monorepo. By default, **Nitro Mock** (`apps/backend-mock`) provides APIs for all modules. **Station Q&A** also has a real backend in **`apps/kb-api`** (PostgreSQL + pgvector). Product and campaign modules still use Mock.

## Tech Stack

| Area            | Stack                                           |
| --------------- | ----------------------------------------------- |
| Framework       | Vue 3 + TypeScript                              |
| Build           | Vite 8                                          |
| UI              | Ant Design Vue (`antdv-next`)                   |
| Admin shell     | Vue Vben Admin 5.7                              |
| Tables          | Vxe Table (Vben wrapper)                        |
| Mock API        | Nitro (`apps/backend-mock`)                     |
| Q&A backend     | Fastify + PostgreSQL + pgvector (`apps/kb-api`) |
| Package manager | pnpm workspace                                  |

## Features

### Sidebar menus

| Menu | Route | Description |
| --- | --- | --- |
| Product library | `/knowledge/goods` | SKU, price, shelf location, etc. |
| Station Q&A | `/knowledge/qa` | FAQ entries by category |
| Marketing campaigns | `/knowledge/campaign` | Promotions and validity |

### Product library

- List with pagination and keyword search (SKU / name)
- Create / edit drawer: auto SKU (read-only), name, price, shelf location, spec, navigation point
- Validation: name, price (> 0), shelf location required
- Status: draft / online / offline with publish & offline actions

### Station Q&A

- List with category filter, keyword search, pagination
- Create / edit / delete (delete with confirmation)
- Categories: fuel pump, restroom, convenience store, business hours, other
- Validation: question (≤200 chars), answer (≤1000 chars), category required

### Marketing campaigns

- List with keyword search and pagination
- Create / edit / delete; multi-select applicable products from product library
- Date range picker; end date must be after start date
- Validation: name, discount, products, validity; **expired campaigns cannot go online**
- Same draft / online / offline status model as other modules

### Publish rules

All three modules share one status machine (draft → online → offline). The **Publish** button is disabled when required fields are missing; hover shows missing field names. A warning modal lists issues if publish is blocked. Mock and kb-api apply the same server-side validation.

### Backend status

| Module              | Admin UI | Real backend     | Robot retrieval |
| ------------------- | -------- | ---------------- | --------------- |
| Station Q&A         | ✅       | ✅ `apps/kb-api` | ✅              |
| Product library     | ✅       | Mock             | Planned         |
| Marketing campaigns | ✅       | Mock             | Planned         |

Product location data (shelf codes, POI, future map coordinates) is designed but **not implemented in kb-api** yet.

## Requirements

- **Node.js:** `^22.18.0` or `^24.0.0`
- **pnpm:** `>= 11.0.0` (corepack recommended)
- **Docker Desktop** (required only when running the real Q&A backend)

## Quick Start

```bash
git clone https://github.com/durancexuan/kb-admin-vben.git
cd kb-admin-vben

corepack enable
pnpm install

# First-time setup: build internal workspace packages
pnpm -r run --if-present stub

# Start dev (when prompted, choose @vben/playground)
pnpm dev
```

Or start playground directly:

```bash
pnpm dev:play
```

Open **http://localhost:5555**

| Item     | Value                                    |
| -------- | ---------------------------------------- |
| Username | `vben`                                   |
| Password | `123456`                                 |
| Note     | Complete the slider captcha before login |

### Frontend + Mock only (default)

The quick start above is enough. All three modules use Nitro Mock; no Docker required.

### Q&A with real backend

Use **three terminals**:

```bash
# Terminal 1: Postgres
pnpm -F @vben/kb-api run db:up

# Terminal 2: kb-api
cp apps/kb-api/.env.example apps/kb-api/.env   # first time
pnpm dev:kb-api

# Terminal 3: playground (after editing .env.development)
pnpm dev:play
```

Set `playground/.env.development`:

```env
VITE_GLOB_API_URL=http://127.0.0.1:8080/api
VITE_NITRO_MOCK=false
```

**Q&A** uses PostgreSQL; **products and campaigns** are not in kb-api yet, so those pages will fail. For all three menus, keep Mock mode and test robot retrieval via curl/Postman.

## Common Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server (interactive app picker → **@vben/playground**) |
| `pnpm dev:play` | Start playground only (recommended) |
| `pnpm dev:kb-api` | Start real Q&A backend (Postgres must be running) |
| `pnpm -F @vben/playground run dev` | Same as above, explicit package |
| `pnpm -F @vben/kb-api run dev` | Start kb-api explicitly |
| `pnpm -F @vben/kb-api run db:up` | Start Postgres (pgvector) container |
| `pnpm build:play` | Production build for playground |
| `pnpm -F @vben/playground run typecheck` | TypeScript check |

Mock server (usually auto-started by Vite): `http://127.0.0.1:5320/api`, proxied via `/api` in `playground/vite.config.ts`.

Optional standalone mock:

```bash
pnpm -F @vben/backend-mock run start
```

## Q&A Backend (kb-api)

`apps/kb-api` is the **persistent backend for Station Q&A**. Admin API paths match Nitro Mock, so the playground can switch via env vars without frontend changes.

### Scope

| Module | Status | Notes |
| --- | --- | --- |
| Station Q&A | ✅ Done | CRUD, publish/offline, vector index, robot retrieval |
| Product library | Mock | Real backend planned later |
| Marketing campaigns | Mock | Real backend planned later |

### Architecture

- **`kb_qa`**: questions, answers, categories, draft / online / offline
- **`kb_qa_embedding`**: semantic index for online entries (pgvector)
- **Publish**: validate → write vectors; **Offline**: remove from index
- **Robot query**: keyword (pg_trgm) + vector recall in parallel, merged ranking

### Start kb-api

```bash
# 1. Start Postgres (Docker Desktop required)
pnpm -F @vben/kb-api run db:up

# 2. Env file (first time)
cp apps/kb-api/.env.example apps/kb-api/.env

# 3. Start API (default http://127.0.0.1:8080)
pnpm dev:kb-api
```

Migrations in `apps/kb-api/sql/` run on first start; online Q&A vectors are rebuilt automatically.

### Point playground to kb-api

Edit `playground/.env.development`:

```env
VITE_GLOB_API_URL=http://127.0.0.1:8080/api
VITE_NITRO_MOCK=false
```

Use the same JWT secret as Mock (`ACCESS_TOKEN_SECRET=access_token_secret`). After login, **Q&A** uses kb-api; products and campaigns still need Mock unless you keep Mock running for those routes.

In another terminal:

```bash
pnpm dev:play
```

### Robot retrieval API

Not used by the admin UI. For robots, voice, or integration tests.

```http
POST /api/robot/knowledge/query
X-Robot-Api-Key: robot-dev-key
Content-Type: application/json

{
  "utterance": "Where is the restroom?",
  "topK": 5,
  "hints": { "category": "卫生间" }
}
```

Response includes `hit`, `reply.speak` (TTS text), `candidates`, and `source`.

### Embedding

| Mode | Config | Notes |
| --- | --- | --- |
| Dev default | none | Local `local-hash-v1`, works offline |
| Production | `EMBEDDING_API_URL` + `EMBEDDING_API_KEY` | OpenAI-compatible API |

See [`apps/kb-api/README.md`](./apps/kb-api/README.md) for more detail.

### Storage & retrieval (Q&A)

**`kb_qa`** holds authoritative FAQ content and status. **`kb_qa_embedding`** holds semantic indexes for online entries (pgvector). Publish writes vectors; offline removes them so robots never see draft content.

Robots call **`POST /api/robot/knowledge/query`**. Keyword recall (pg_trgm) and vector recall run **in parallel**, scores are merged, and the response includes `reply.speak` for TTS. Low confidence returns `hit: false`. Admin list keyword search uses SQL only, separate from robot retrieval.

### kb-api environment variables

| Variable              | Default               | Description               |
| --------------------- | --------------------- | ------------------------- |
| `PORT`                | `8080`                | API port                  |
| `DATABASE_URL`        | see `.env.example`    | PostgreSQL connection     |
| `ACCESS_TOKEN_SECRET` | `access_token_secret` | Must match Mock JWT       |
| `ROBOT_API_KEY`       | `robot-dev-key`       | Header `X-Robot-Api-Key`  |
| `MIN_RETRIEVE_SCORE`  | `0.35`                | Minimum robot match score |
| `EMBEDDING_API_URL`   | empty                 | External embedding API    |
| `EMBEDDING_API_KEY`   | empty                 | Embedding API key         |

### Roadmap (not implemented)

- **Product library**: layered location model (shelf / POI / coordinates)
- **Campaigns**: date and status rules
- **Unified robot query**: parallel recall across Q&A, products, campaigns (Q&A only today)

## Project Layout (business code)

```text
playground/src/
  router/routes/modules/knowledge-base.ts
  views/knowledge-base/{goods,qa,campaign,shared}/
  api/knowledge/

apps/backend-mock/
  api/knowledge/
  utils/knowledge-*-store.ts

apps/kb-api/
  sql/                 # migrations & seed
  src/qa/              # Q&A CRUD & retrieval
  src/robot/           # robot query API
  docker-compose.yml   # Postgres + pgvector
```

## Mock API (prefix `/api`)

See [README.zh-CN.md](./README.zh-CN.md#mock-接口一览) for the full endpoint table.

## FAQ

**Login fails or 404 on API**

Ensure `Nitro Mock Server` appears in the terminal. Run `pnpm -r run --if-present stub`, then `pnpm dev:play` again.

**Which app to select after `pnpm dev`?**

Choose **`@vben/playground`**.

**Connect to a real backend**

For **Station Q&A**, follow [Q&A Backend (kb-api)](#qa-backend-kb-api) above. Product and campaign real APIs are not implemented yet; keep using Mock for those.

**kb-api fails to start / DB connection error**

Ensure Docker Desktop is running and run `pnpm -F @vben/kb-api run db:up`. Check `DATABASE_URL` in `apps/kb-api/.env`.

## Upstream Template

Based on [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin). Framework docs: [https://doc.vben.pro](https://doc.vben.pro)

## License

[MIT](./LICENSE)
