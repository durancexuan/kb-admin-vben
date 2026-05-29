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

**确认数据在库：**

```bash
docker exec -it kb-postgres psql -U kb -d kb -c "SELECT name, status FROM kb_goods LIMIT 5;"
```

## 常用命令

| 命令                             | 说明          |
| -------------------------------- | ------------- |
| `pnpm dev:play`                  | 管理端        |
| `pnpm dev:kb-api`                | 知识库 API    |
| `pnpm -F @vben/kb-api run db:up` | Postgres 容器 |

## 机器人 / Agent

`POST http://127.0.0.1:8080/api/robot/knowledge/query` — 并行检索问答、商品、活动，返回 `type`（`faq` / `goods` / `campaign`）与 `reply.speak`。详见 [`apps/kb-api/README.md`](./apps/kb-api/README.md)。

## 常见问题

- **登录 404**：确认 `Nitro Mock Server` 已启动
- **三库报错**：先 `db:up` 再 `dev:kb-api`
- **8080 占用**：结束旧 `node` 进程或改 `apps/kb-api/.env` 中 `PORT`

[doc.vben.pro](https://doc.vben.pro) · [MIT](./LICENSE)
