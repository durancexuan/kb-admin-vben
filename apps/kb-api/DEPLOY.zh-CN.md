# kb-api 服务器部署指南

给运维 / 负责人联调用：部署完成后提供 **`POST http://<IP>:8089/api/robot/knowledge/query`** 与 **`ROBOT_API_KEY`**。接口说明见 [ROBOT_API.zh-CN.md](./ROBOT_API.zh-CN.md)。

## 一、服务器要求

- Linux（推荐 Ubuntu 22.04+）
- 已安装 **Docker** 与 **Docker Compose v2**
- 开放端口：**8089**（或你在 `.env` 里设的 `KB_API_PORT`，默认 8089）；生产建议前面加 Nginx 走 443

## 二、一键部署（推荐 Docker）

### 1. 上传代码

```bash
git clone <仓库地址> kb-admin
cd kb-admin/apps/kb-api
```

### 2. 配置环境

```bash
cp .env.production.example .env
nano .env   # 或 vim
```

**必改两项：**

| 变量                | 说明                         |
| ------------------- | ---------------------------- |
| `POSTGRES_PASSWORD` | 数据库密码（强密码）         |
| `ROBOT_API_KEY`     | 机器人接口密钥（发给负责人） |

**生产建议再配 Embedding（负责人 GPU）：**

| 变量                   | 说明                                   |
| ---------------------- | -------------------------------------- |
| `EMBEDDING_API_URL`    | GPU 向量服务地址                       |
| `EMBEDDING_API_MODEL`  | 与 GPU 上模型名一致                    |
| `EMBEDDING_API_FORMAT` | `openai` / `tei` / `ollama` / `simple` |
| `EMBEDDING_DIM`        | 与模型输出维度一致（默认 384）         |

详见 **[EMBEDDING_API.zh-CN.md](./EMBEDDING_API.zh-CN.md)**。

### 3. 启动

```bash
bash scripts/deploy.sh
```

或手动：

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. 验证

```bash
curl -s http://127.0.0.1:8089/health
# 期望：{"ok":true,"embedding":{"ok":true,"mode":"external",...}}

curl -s -X POST http://127.0.0.1:8089/api/robot/knowledge/query \
  -H "Content-Type: application/json" \
  -H "X-Robot-Api-Key: <你的ROBOT_API_KEY>" \
  -d '{"utterance":"卫生间在哪里"}'
```

### 5. 发给负责人

```text
接口地址：POST http://<公网IP或域名>:8089/api/robot/knowledge/query
请求头：  X-Robot-Api-Key: <ROBOT_API_KEY>
请求体：  {"utterance":"用户说的话"}
```

云服务器还需在**安全组**放行 `8089`（或 443）。

## 三、常用运维命令

```bash
cd apps/kb-api

# 查看状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f kb-api

# 重启
docker compose -f docker-compose.prod.yml restart kb-api

# 停止
docker compose -f docker-compose.prod.yml down

# 更新代码后重新构建
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 四、HTTPS（可选）

1. 域名解析到服务器
2. 参考 `nginx.kb-api.conf.example` 配置 Nginx 反代到 `127.0.0.1:8080`
3. 用 certbot 申请证书
4. 负责人地址改为：`https://api.你的域名/api/robot/knowledge/query`

## 五、不用 Docker（仅 Node + PM2）

适合已有 Postgres 的场景。

```bash
# 1. 仓库根目录安装依赖
cd kb-admin
pnpm install

# 2. 仅起数据库（在 apps/kb-api）
cd apps/kb-api
docker compose up -d   # 开发用 compose，仅 postgres
cp .env.production.example .env
# 编辑 .env：DATABASE_URL=postgresql://kb:密码@127.0.0.1:5432/kb

# 3. 回到仓库根目录用 PM2 起 API
cd ../..
pnpm add -g pm2
pm2 start apps/kb-api/ecosystem.config.cjs
pm2 save
```

## 六、全栈部署（管理端 + 机器人 API）

仓库根目录执行 `pnpm deploy:full`，会在服务器拉起 Postgres、kb-api、Mock 登录、Nginx 管理端。

| 服务 | 默认端口 | 地址示例 |
| --- | --- | --- |
| 管理端（网页） | **5556** | `http://192.168.13.7:5556/` |
| 机器人 / 四库 API | **8089** | `http://192.168.13.7:8089/api/robot/knowledge/query` |

管理端占用 **5556** 而非 80，方便同机其他项目使用 80 端口。修改端口：服务器 `deploy/.env` 中设 `ADMIN_PORT=5556`，再 `docker compose -f docker-compose.full.yml up -d`。

登录账号：`vben` / `123456`（与 Mock 一致）。

## 七、架构

```text
浏览器 ──HTTP──► 服务器:5556 (Nginx 管理端)
                      ├── /api/knowledge/*、/api/robot/* → kb-api:8080
                      └── /api/auth/* 等 → mock:5320

负责人 ──HTTP──► 服务器:8089 (kb-api，机器人直连)
                      │
                      └──► postgres 容器 (pgvector，仅内网)
```

数据卷 `kb_api_kb_pg_data` 存数据库，**请定期备份**。

## 八、故障排查

| 现象 | 处理 |
| --- | --- |
| `请设置 POSTGRES_PASSWORD` | `.env` 未配置或变量名错误 |
| 外网连不上 | 检查安全组 / 防火墙 / `KB_API_PORT` |
| kb-api 启动失败 | `docker compose ... logs kb-api` 看数据库是否就绪 |
| 负责人 401 | `X-Robot-Api-Key` 与 `.env` 中 `ROBOT_API_KEY` 不一致 |
| `embedding.ok: false` | 检查 `EMBEDDING_API_URL` 与 GPU 服务；见 [EMBEDDING_API.zh-CN.md](./EMBEDDING_API.zh-CN.md) |
