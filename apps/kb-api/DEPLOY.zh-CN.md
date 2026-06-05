# kb-api 服务器部署指南

给运维 / 负责人联调用：部署完成后提供 **`POST http://<IP>:8080/api/robot/knowledge/query`** 与 **`ROBOT_API_KEY`**。接口说明见 [ROBOT_API.zh-CN.md](./ROBOT_API.zh-CN.md)。

## 一、服务器要求

- Linux（推荐 Ubuntu 22.04+）
- 已安装 **Docker** 与 **Docker Compose v2**
- 开放端口：**8080**（或你在 `.env` 里设的 `KB_API_PORT`）；生产建议前面加 Nginx 走 443

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
curl -s http://127.0.0.1:8080/health
# 期望：{"ok":true}

curl -s -X POST http://127.0.0.1:8080/api/robot/knowledge/query \
  -H "Content-Type: application/json" \
  -H "X-Robot-Api-Key: <你的ROBOT_API_KEY>" \
  -d '{"utterance":"卫生间在哪里"}'
```

### 5. 发给负责人

```text
接口地址：POST http://<公网IP或域名>:8080/api/robot/knowledge/query
请求头：  X-Robot-Api-Key: <ROBOT_API_KEY>
请求体：  {"utterance":"用户说的话"}
```

云服务器还需在**安全组**放行 `8080`（或 443）。

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

## 六、架构

```text
负责人 ──HTTP──► 服务器:8080 (kb-api 容器)
                      │
                      └──► postgres 容器 (pgvector，仅内网)
```

数据卷 `kb_pg_data` 存数据库，**请定期备份**。

## 七、故障排查

| 现象 | 处理 |
| --- | --- |
| `请设置 POSTGRES_PASSWORD` | `.env` 未配置或变量名错误 |
| 外网连不上 | 检查安全组 / 防火墙 / `KB_API_PORT` |
| kb-api 启动失败 | `docker compose ... logs kb-api` 看数据库是否就绪 |
| 负责人 401 | `X-Robot-Api-Key` 与 `.env` 中 `ROBOT_API_KEY` 不一致 |
