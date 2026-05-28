<div align="center">

# 知识库管理后台（T5）

基于 [Vue Vben Admin 5.x](https://github.com/vbenjs/vue-vben-admin) 的 Web 管理端，实现加油站场景下的商品、问答、营销活动三类知识库管理。

**仓库地址：** https://github.com/durancexuan/kb-admin-vben

</div>

**中文** | [English](./README.md)

---

## 项目简介

本项目在 Vben Admin Monorepo 的 `playground` 应用中实现「知识库管理后台」完整前端能力。开发阶段默认通过 **Nitro Mock** 提供接口；**站级问答库** 已提供真实后端 **`apps/kb-api`**（PostgreSQL + pgvector），可切换联调。商品库、活动库仍使用 Mock。

## 技术栈

| 类别      | 技术                                             |
| --------- | ------------------------------------------------ |
| 框架      | Vue 3 + TypeScript                               |
| 构建      | Vite 8                                           |
| UI        | Ant Design Vue（`antdv-next`）                   |
| 后台模板  | Vue Vben Admin 5.7                               |
| 表格      | Vxe Table（Vben 封装）                           |
| 接口 Mock | Nitro（`apps/backend-mock`）                     |
| 问答后端  | Fastify + PostgreSQL + pgvector（`apps/kb-api`） |
| 包管理    | pnpm workspace                                   |

## 功能说明

### 侧边栏菜单

| 菜单       | 路由                  | 说明                   |
| ---------- | --------------------- | ---------------------- |
| 商品全维库 | `/knowledge/goods`    | 商品 SKU、价格、货架等 |
| 站级问答库 | `/knowledge/qa`       | 常见问题与答案         |
| 营销活动库 | `/knowledge/campaign` | 促销活动配置           |

### 商品全维库

- 列表：SKU、商品名称、价格、货架位置、状态；分页；关键字搜索
- 新增 / 编辑：SKU 自动生成（只读）、名称、价格、货架位置、规格、导航点位
- 校验：名称、价格（>0）、货架位置必填
- 状态：草稿 / 已上线 / 已下线；支持上线、下线（缺字段时上线按钮禁用并悬停提示）

### 站级问答库

- 列表：问题、答案、分类、更新时间、状态；分类筛选；关键字搜索
- 新增 / 编辑 / 删除（删除二次确认）
- 分类：加油机、卫生间、便利店、营业时间、其他
- 校验：问题 ≤200 字、答案 ≤1000 字、分类必选

### 营销活动库

- 列表：活动名、适用商品、优惠内容、有效期、状态；关键字搜索
- 新增 / 编辑 / 删除；适用商品多选（来自商品库）
- 有效期：日期范围选择；结束时间须晚于开始时间
- 校验：活动名、优惠内容、适用商品、有效期；**已过期活动不可上线**
- 状态：草稿 / 已上线 / 已下线（与商品、问答统一）

### 状态与上线校验

三个子库统一状态机：

| 状态   | 标签颜色 | 说明                 |
| ------ | -------- | -------------------- |
| 草稿   | 灰色     | 新建默认状态         |
| 已上线 | 绿色     | 通过上线校验后可发布 |
| 已下线 | 橙色     | 主动下线             |

上线时若字段不完整，前端禁用「上线」按钮并提示缺失项；仍会弹出「上线校验未通过」对话框列出字段名。Mock 与 kb-api 均在服务端做相同校验。

### 后端实现状态

| 子库       | 管理端 | 真实后端         | 机器人检索 |
| ---------- | ------ | ---------------- | ---------- |
| 站级问答库 | ✅     | ✅ `apps/kb-api` | ✅         |
| 商品全维库 | ✅     | Mock             | 后续规划   |
| 营销活动库 | ✅     | Mock             | 后续规划   |

商品全维库的位置数据（货架编码、导航点位、未来地图坐标）已在方案中分层设计，**尚未写入 kb-api**；当前仅问答库走后端持久化与向量检索。

## 环境要求

- **Node.js**：`^22.18.0` 或 `^24.0.0`（见根目录 `package.json`）
- **pnpm**：`>= 11.0.0`（推荐启用 corepack）
- **Docker Desktop**（仅在使用真实问答后端时需要，用于启动 PostgreSQL）

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/durancexuan/kb-admin-vben.git
cd kb-admin-vben

# 2. 启用 corepack（若尚未启用）
corepack enable

# 3. 安装依赖
pnpm install

# 4. 构建 workspace 内部包（首次克隆建议执行）
pnpm -r run --if-present stub

# 5. 启动开发环境（会提示选择应用，请选 @vben/playground）
pnpm dev
```

浏览器访问：**http://localhost:5555**

- 登录账号：`vben`
- 登录密码：`123456`
- 登录页需完成滑块验证后再提交

### 仅前端 + Mock（默认）

上面「快速开始」即可，无需 Docker。三个子库均走 Nitro Mock。

### 问答库 + 真实后端联调

需要 **三个步骤**（开三个终端）：

```bash
# 终端 1：Postgres
pnpm -F @vben/kb-api run db:up

# 终端 2：kb-api
cp apps/kb-api/.env.example apps/kb-api/.env   # 首次
pnpm dev:kb-api

# 终端 3：playground（先改 .env.development，见下文）
pnpm dev:play
```

将 `playground/.env.development` 改为：

```env
VITE_GLOB_API_URL=http://127.0.0.1:8080/api
VITE_NITRO_MOCK=false
```

此时 **问答库** 走 PostgreSQL；**商品库、活动库** 接口 kb-api 尚未实现，对应页面会报错。若需三个菜单都能用，请保持 Mock 模式，仅单独用 curl / Postman 测机器人检索接口。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发（交互选择应用，选 **@vben/playground**） |
| `pnpm dev:play` | 直接启动 playground（推荐） |
| `pnpm dev:kb-api` | 启动问答库真实后端（需先启动 Postgres） |
| `pnpm -F @vben/playground run dev` | 同上，显式指定包名 |
| `pnpm -F @vben/kb-api run dev` | 同上，显式指定 kb-api |
| `pnpm -F @vben/kb-api run db:up` | 启动 Postgres（pgvector）容器 |
| `pnpm build:play` | 构建 playground 生产包 |
| `pnpm -F @vben/playground run typecheck` | TypeScript 类型检查 |

仅启动 Mock 服务（一般无需单独启动，playground 会通过 Vite 插件自动拉起）：

```bash
pnpm -F @vben/backend-mock run start
```

Mock 默认地址：`http://127.0.0.1:5320/api`（由 `playground/vite.config.ts` 代理 `/api`）

## 问答库真实后端（kb-api）

`apps/kb-api` 为**站级问答库**提供持久化后端，接口路径与 Mock 一致，管理端改环境变量即可切换，**无需改前端页面**。

### 能力范围

| 模块       | 状态      | 说明                                   |
| ---------- | --------- | -------------------------------------- |
| 站级问答库 | ✅ 已实现 | CRUD、上线、下线、向量索引、机器人检索 |
| 商品全维库 | Mock      | 真实后端后续再做                       |
| 营销活动库 | Mock      | 真实后端后续再做                       |

### 架构要点

- **业务表** `kb_qa`：问答内容、分类、状态（草稿 / 已上线 / 已下线）
- **向量表** `kb_qa_embedding`：已上线问答的语义索引（pgvector）
- **上线**：校验通过后写入向量；**下线**：从索引中移除
- **机器人检索**：关键词（pg_trgm）与向量**并行召回**，合并打分后返回播报答案

### 启动 kb-api

```bash
# 1. 启动 Postgres（需已安装 Docker Desktop）
pnpm -F @vben/kb-api run db:up

# 2. 配置环境变量（首次）
cp apps/kb-api/.env.example apps/kb-api/.env

# 3. 启动 API（默认 http://127.0.0.1:8080）
pnpm dev:kb-api
```

首次启动会自动执行 `apps/kb-api/sql/*.sql` 迁移，并重建已上线问答的向量索引。

### 管理端切换到真实后端

编辑 `playground/.env.development`：

```env
VITE_GLOB_API_URL=http://127.0.0.1:8080/api
VITE_NITRO_MOCK=false
```

JWT 密钥需与 Mock 一致（`ACCESS_TOKEN_SECRET=access_token_secret`）。登录 playground 后，**问答库**走 kb-api；商品、活动仍依赖 Mock 时需保持 Mock 运行，或暂时继续使用 Mock 全量接口。

另开终端启动 playground：

```bash
pnpm dev:play
```

### 机器人检索接口

管理端不使用此接口；供机器人 / 语音 / 联调调用。

```http
POST /api/robot/knowledge/query
X-Robot-Api-Key: robot-dev-key
Content-Type: application/json

{
  "utterance": "洗手间怎么走",
  "topK": 5,
  "hints": { "category": "卫生间" }
}
```

响应字段：`hit`（是否命中）、`reply.speak`（TTS 播报答案）、`candidates`（候选列表）、`source`（匹配的问答 ID 等）。

### Embedding 配置

| 模式 | 配置 | 说明 |
| --- | --- | --- |
| 开发默认 | 无需额外配置 | 本地 `local-hash-v1`，离线可跑 |
| 生产推荐 | `EMBEDDING_API_URL` + `EMBEDDING_API_KEY` | OpenAI 兼容 Embedding API |

更多细节见 [`apps/kb-api/README.md`](./apps/kb-api/README.md)。

### 存储与检索设计（问答库）

问答数据分两层存储：**业务表** `kb_qa` 存运营维护的标准问答与状态（草稿 / 已上线 / 已下线），是唯一权威来源；**向量表** `kb_qa_embedding` 存已上线内容的语义索引，由 pgvector 提供相似度搜索。上线时根据「分类 + 问题 + 答案」生成向量并写入索引，下线或删除时同步移除，机器人不会检索到未发布内容。

机器人不直接访问管理端 CRUD，而是调用 **`POST /api/robot/knowledge/query`**。对用户原话同时做 **关键词召回**（pg_trgm，适合含专有名词）与 **向量召回**（适合口语化问法），两路结果合并打分后返回 `reply.speak`（播报答案）及候选列表。置信度低于阈值时返回 `hit: false`，避免胡答。管理端列表里的关键字搜索仍走 SQL 模糊匹配，与机器人检索路径分离。

### kb-api 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `8080` | API 监听端口 |
| `DATABASE_URL` | 见 `.env.example` | PostgreSQL 连接串 |
| `ACCESS_TOKEN_SECRET` | `access_token_secret` | 与 Mock JWT 一致 |
| `ROBOT_API_KEY` | `robot-dev-key` | 机器人接口请求头 `X-Robot-Api-Key` |
| `MIN_RETRIEVE_SCORE` | `0.35` | 机器人检索最低置信度 |
| `EMBEDDING_API_URL` | 空 | 配置后启用外部 Embedding |
| `EMBEDDING_API_KEY` | 空 | 外部 Embedding 密钥 |

### 后续规划（尚未实现）

- **商品全维库**：货架编码（逻辑层）、导航点（语义层）、地图坐标（几何层）分层入库；语义找货与 SKU/货架精确查询分开处理
- **营销活动库**：按有效期与状态规则检索
- **机器人统一查询**：在问答之外并行召回商品、活动，合并决选（当前仅问答）

## 项目结构（与本业务相关）

```text
playground/
  src/
    router/routes/modules/knowledge-base.ts   # 三个一级菜单路由
    views/knowledge-base/
      goods/          # 商品全维库
      qa/             # 站级问答库
      campaign/       # 营销活动库
      shared/         # 上线校验、操作列等公共逻辑
    api/knowledge/    # 前端 API 封装

apps/backend-mock/
  api/knowledge/      # Mock 接口（商品/活动/问答）
  utils/              # 内存数据 store、上线校验

apps/kb-api/
  sql/                # PostgreSQL 迁移与种子数据
  src/
    qa/               # 问答 CRUD、发布、检索
    robot/            # 机器人统一查询接口
    embedding/        # 向量生成
  docker-compose.yml  # Postgres + pgvector
```

## Mock 接口一览

前缀均为 `/api`（经 Vite 代理到 Mock 服务）。

| 模块 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| 商品 | GET | `/knowledge/goods/list` | 分页列表 |
| 商品 | GET | `/knowledge/goods/next-sku` | 获取下一个 SKU |
| 商品 | POST | `/knowledge/goods` | 新增 |
| 商品 | PUT | `/knowledge/goods/:id` | 编辑 |
| 商品 | POST | `/knowledge/goods/:id/publish` | 上线 |
| 商品 | POST | `/knowledge/goods/:id/offline` | 下线 |
| 问答 | GET | `/knowledge/qa/list` | 分页列表 |
| 问答 | POST | `/knowledge/qa` | 新增 |
| 问答 | PUT | `/knowledge/qa/:id` | 编辑 |
| 问答 | DELETE | `/knowledge/qa/:id` | 删除 |
| 问答 | POST | `/knowledge/qa/:id/publish` | 上线 |
| 问答 | POST | `/knowledge/qa/:id/offline` | 下线 |
| 问答 | POST | `/robot/knowledge/query` | 机器人检索（仅 kb-api） |
| 活动 | GET | `/knowledge/campaign/list` | 分页列表 |
| 活动 | GET | `/knowledge/campaign/goods-options` | 适用商品选项 |
| 活动 | POST | `/knowledge/campaign` | 新增 |
| 活动 | PUT | `/knowledge/campaign/:id` | 编辑 |
| 活动 | DELETE | `/knowledge/campaign/:id` | 删除 |
| 活动 | POST | `/knowledge/campaign/:id/publish` | 上线 |
| 活动 | POST | `/knowledge/campaign/:id/offline` | 下线 |

## 常见问题

**Q：登录失败或接口 404？**

确认终端出现 `Nitro Mock Server` 启动日志。若未启动，先执行 `pnpm -r run --if-present stub`，再重新 `pnpm dev:play`。

**Q：`pnpm dev` 后选哪个应用？**

选择 **`@vben/playground`**。业务代码均在该应用中。

**Q：Windows 下 stub 失败？**

若路径含空格导致构建失败，项目已对 `internal/node-utils/scripts/build.mjs` 做兼容处理；请拉取最新代码后重试 `pnpm -r run --if-present stub`。

**Q：如何对接真实后端？**

站级问答库：按上文 [问答库真实后端（kb-api）](#问答库真实后端kb-api) 启动 `kb-api` 并修改 `playground/.env.development`。商品、活动尚未提供真实后端，仍使用 Mock。

**Q：kb-api 启动失败 / 连不上数据库？**

确认 Docker Desktop 已运行，并执行 `pnpm -F @vben/kb-api run db:up`。检查 `apps/kb-api/.env` 中 `DATABASE_URL` 是否为 `postgresql://kb:kb_secret@127.0.0.1:5432/kb`。

## 关于 Vben Admin 模板

本仓库基于 [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin) 二次开发。模板通用说明、贡献规范与浏览器支持见原版文档；详细框架文档：[https://doc.vben.pro](https://doc.vben.pro)

## License

[MIT](./LICENSE)
