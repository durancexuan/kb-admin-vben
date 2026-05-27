<div align="center">

# Knowledge Base Admin (T5)

A gas-station knowledge base admin built on [Vue Vben Admin 5.x](https://github.com/vbenjs/vue-vben-admin), covering products, Q&A, and marketing campaigns.

**Repository:** https://github.com/durancexuan/kb-admin-vben

</div>

**English** | [中文](./README.zh-CN.md)

---

## Overview

This project implements the T5 knowledge base admin in the **`playground`** app of the Vben monorepo. During development, **Nitro Mock** (`apps/backend-mock`) provides APIs so you can run the full flow without a real backend.

## Tech Stack

| Area            | Stack                         |
| --------------- | ----------------------------- |
| Framework       | Vue 3 + TypeScript            |
| Build           | Vite 8                        |
| UI              | Ant Design Vue (`antdv-next`) |
| Admin shell     | Vue Vben Admin 5.7            |
| Tables          | Vxe Table (Vben wrapper)      |
| Mock API        | Nitro (`apps/backend-mock`)   |
| Package manager | pnpm workspace                |

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

All three modules share one status machine (draft → online → offline). The **Publish** button is disabled when required fields are missing; hover shows missing field names. A warning modal lists issues if publish is blocked. Mock APIs validate on the server as well.

## Requirements

- **Node.js:** `^22.18.0` or `^24.0.0`
- **pnpm:** `>= 11.0.0` (corepack recommended)

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

## Common Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server (interactive app picker → **@vben/playground**) |
| `pnpm dev:play` | Start playground only (recommended) |
| `pnpm -F @vben/playground run dev` | Same as above, explicit package |
| `pnpm build:play` | Production build for playground |
| `pnpm -F @vben/playground run typecheck` | TypeScript check |

Mock server (usually auto-started by Vite): `http://127.0.0.1:5320/api`, proxied via `/api` in `playground/vite.config.ts`.

Optional standalone mock:

```bash
pnpm -F @vben/backend-mock run start
```

## Project Layout (business code)

```text
playground/src/
  router/routes/modules/knowledge-base.ts
  views/knowledge-base/{goods,qa,campaign,shared}/
  api/knowledge/

apps/backend-mock/
  api/knowledge/
  utils/knowledge-*-store.ts
```

## Mock API (prefix `/api`)

See [README.zh-CN.md](./README.zh-CN.md#mock-接口一览) for the full endpoint table.

## FAQ

**Login fails or 404 on API**

Ensure `Nitro Mock Server` appears in the terminal. Run `pnpm -r run --if-present stub`, then `pnpm dev:play` again.

**Which app to select after `pnpm dev`?**

Choose **`@vben/playground`**.

**Connect to a real backend**

Set `VITE_GLOB_API_URL` in `playground/.env.development`, set `VITE_NITRO_MOCK=false`, and align `playground/src/api/knowledge/` with your API contract.

## Upstream Template

Based on [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin). Framework docs: [https://doc.vben.pro](https://doc.vben.pro)

## License

[MIT](./LICENSE)
