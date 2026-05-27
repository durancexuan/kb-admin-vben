<div align="center">

# 知识库管理后台（T5）

基于 [Vue Vben Admin 5.x](https://github.com/vbenjs/vue-vben-admin) 的 Web 管理端，实现加油站场景下的商品、问答、营销活动三类知识库管理。

**仓库地址：** https://github.com/durancexuan/kb-admin-vben

</div>

**中文** | [English](./README.md)

---

## 项目简介

本项目在 Vben Admin Monorepo 的 `playground` 应用中实现「知识库管理后台」完整前端能力，开发阶段通过 **Nitro Mock** 提供接口，无需真实后端即可联调全流程。

## 技术栈

| 类别      | 技术                           |
| --------- | ------------------------------ |
| 框架      | Vue 3 + TypeScript             |
| 构建      | Vite 8                         |
| UI        | Ant Design Vue（`antdv-next`） |
| 后台模板  | Vue Vben Admin 5.7             |
| 表格      | Vxe Table（Vben 封装）         |
| 接口 Mock | Nitro（`apps/backend-mock`）   |
| 包管理    | pnpm workspace                 |

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

上线时若字段不完整，前端禁用「上线」按钮并提示缺失项；仍会弹出「上线校验未通过」对话框列出字段名，后端 Mock 同步校验。

## 环境要求

- **Node.js**：`^22.18.0` 或 `^24.0.0`（见根目录 `package.json`）
- **pnpm**：`>= 11.0.0`（推荐启用 corepack）

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

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发（交互选择应用，选 **@vben/playground**） |
| `pnpm dev:play` | 直接启动 playground（推荐） |
| `pnpm -F @vben/playground run dev` | 同上，显式指定包名 |
| `pnpm build:play` | 构建 playground 生产包 |
| `pnpm -F @vben/playground run typecheck` | TypeScript 类型检查 |

仅启动 Mock 服务（一般无需单独启动，playground 会通过 Vite 插件自动拉起）：

```bash
pnpm -F @vben/backend-mock run start
```

Mock 默认地址：`http://127.0.0.1:5320/api`（由 `playground/vite.config.ts` 代理 `/api`）

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
  api/knowledge/      # Mock 接口
  utils/              # 内存数据 store、上线校验
```

## Mock 接口一览

前缀均为 `/api`（经 Vite 代理到 Mock 服务）。

| 模块 | 方法   | 路径                                | 说明           |
| ---- | ------ | ----------------------------------- | -------------- |
| 商品 | GET    | `/knowledge/goods/list`             | 分页列表       |
| 商品 | GET    | `/knowledge/goods/next-sku`         | 获取下一个 SKU |
| 商品 | POST   | `/knowledge/goods`                  | 新增           |
| 商品 | PUT    | `/knowledge/goods/:id`              | 编辑           |
| 商品 | POST   | `/knowledge/goods/:id/publish`      | 上线           |
| 商品 | POST   | `/knowledge/goods/:id/offline`      | 下线           |
| 问答 | GET    | `/knowledge/qa/list`                | 分页列表       |
| 问答 | POST   | `/knowledge/qa`                     | 新增           |
| 问答 | PUT    | `/knowledge/qa/:id`                 | 编辑           |
| 问答 | DELETE | `/knowledge/qa/:id`                 | 删除           |
| 问答 | POST   | `/knowledge/qa/:id/publish`         | 上线           |
| 问答 | POST   | `/knowledge/qa/:id/offline`         | 下线           |
| 活动 | GET    | `/knowledge/campaign/list`          | 分页列表       |
| 活动 | GET    | `/knowledge/campaign/goods-options` | 适用商品选项   |
| 活动 | POST   | `/knowledge/campaign`               | 新增           |
| 活动 | PUT    | `/knowledge/campaign/:id`           | 编辑           |
| 活动 | DELETE | `/knowledge/campaign/:id`           | 删除           |
| 活动 | POST   | `/knowledge/campaign/:id/publish`   | 上线           |
| 活动 | POST   | `/knowledge/campaign/:id/offline`   | 下线           |

## 常见问题

**Q：登录失败或接口 404？**

确认终端出现 `Nitro Mock Server` 启动日志。若未启动，先执行 `pnpm -r run --if-present stub`，再重新 `pnpm dev:play`。

**Q：`pnpm dev` 后选哪个应用？**

选择 **`@vben/playground`**。业务代码均在该应用中。

**Q：Windows 下 stub 失败？**

若路径含空格导致构建失败，项目已对 `internal/node-utils/scripts/build.mjs` 做兼容处理；请拉取最新代码后重试 `pnpm -r run --if-present stub`。

**Q：如何对接真实后端？**

将 `playground/.env.development` 中 `VITE_GLOB_API_URL` 改为真实接口地址，并设置 `VITE_NITRO_MOCK=false`，再按后端接口契约调整 `playground/src/api/knowledge/` 与响应结构。

## 关于 Vben Admin 模板

本仓库基于 [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin) 二次开发。模板通用说明、贡献规范与浏览器支持见原版文档；详细框架文档：[https://doc.vben.pro](https://doc.vben.pro)

## License

[MIT](./LICENSE)
