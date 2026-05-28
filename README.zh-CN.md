<div align="center">

# 知识库管理后台（T5）

加油站场景知识库管理：商品、问答、营销活动。基于 [Vue Vben Admin 5.x](https://github.com/vbenjs/vue-vben-admin)。

**仓库：** https://github.com/durancexuan/kb-admin-vben

</div>

**中文** | [English](./README.md)

---

## 简介

- **前端**：`playground`（Vben Admin）
- **Mock**：登录、商品、活动（`apps/backend-mock`）
- **真实后端**：站级问答库 → `apps/kb-api`（PostgreSQL + pgvector）；商品/活动后端未做

三库统一状态：**草稿 / 已上线 / 已下线**。

| 菜单       | 路由                  | 后端                              |
| ---------- | --------------------- | --------------------------------- |
| 商品全维库 | `/knowledge/goods`    | Mock                              |
| 站级问答库 | `/knowledge/qa`       | kb-api（需 Docker + kb-api 进程） |
| 营销活动库 | `/knowledge/campaign` | Mock                              |

## 环境

- Node.js `^22.18.0` 或 `^24.0.0`
- pnpm `>= 11.0.0`
- Docker Desktop（仅问答真实库需要）

## 快速开始（仅 Mock）

```bash
git clone https://github.com/durancexuan/kb-admin-vben.git
cd kb-admin-vben
corepack enable
pnpm install
pnpm -r run --if-present stub
pnpm dev:play
```

打开 http://localhost:5555（若 5555 被占用会变成 5556）

- 账号 `vben` / 密码 `123456`，需完成滑块验证

## 问答库 + PostgreSQL（推荐联调）

**三个终端，均在仓库根目录：**

```bash
pnpm -F @vben/kb-api run db:up    # 1. 数据库
cp apps/kb-api/.env.example apps/kb-api/.env   # 首次
pnpm dev:kb-api                   # 2. 真实 API :8080
pnpm dev:play                     # 3. 管理端 :5555
```

`playground/vite.config.ts` 已将 `/api/knowledge/qa` 代理到 kb-api，**无需改** `.env` 全站地址。登录仍走 Mock。

**如何确认问答走库：** kb-api 终端有 `qa/list` 日志；新增问答重启 kb-api 后仍在；或用 DBeaver 连 `127.0.0.1:5432` 看表 `kb_qa`。

## 常用命令

| 命令                             | 说明               |
| -------------------------------- | ------------------ |
| `pnpm dev:play`                  | 管理端             |
| `pnpm dev:kb-api`                | 问答 API           |
| `pnpm -F @vben/kb-api run db:up` | 启动 Postgres 容器 |
| `pnpm build:play`                | 构建               |

## 机器人 / Agent 调用

```http
POST http://127.0.0.1:8080/api/robot/knowledge/query
X-Robot-Api-Key: robot-dev-key
Content-Type: application/json

{ "utterance": "卫生间在哪里", "hints": { "category": "卫生间" } }
```

返回 `hit`、`reply.speak`（播报文案）、`candidates`。详见 [`apps/kb-api/README.md`](./apps/kb-api/README.md)。

## 目录（业务相关）

```text
playground/src/views/knowledge-base/   # 三个业务页
playground/src/api/knowledge/          # 前端 API
apps/backend-mock/api/knowledge/       # Mock
apps/kb-api/                           # 问答真实后端 + docker-compose.yml
```

## 常见问题

- **登录 404**：确认终端有 `Nitro Mock Server`，先 `pnpm -r run --if-present stub` 再 `pnpm dev:play`
- **问答报错**：先 `db:up` 再 `dev:kb-api`
- **端口不是 5555**：5555 被占用时 Vite 会自动用 5556
- **商品/活动**：仍用 Mock，与 kb-api 无关

框架文档：[doc.vben.pro](https://doc.vben.pro) · [MIT](./LICENSE)
