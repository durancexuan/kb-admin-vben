#!/usr/bin/env bash
# 在 Linux 服务器上于 apps/kb-api 目录执行：bash scripts/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

gen_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 16
    return
  fi
  tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 32
}

if [[ ! -f .env ]]; then
  cp .env.production.example .env
fi

if grep -q '请改成' .env 2>/dev/null; then
  POSTGRES_PASSWORD="$(gen_secret)"
  ROBOT_API_KEY="$(gen_secret)"
  ACCESS_TOKEN_SECRET="$(gen_secret)"
  sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${POSTGRES_PASSWORD}/" .env
  sed -i "s/^ROBOT_API_KEY=.*/ROBOT_API_KEY=${ROBOT_API_KEY}/" .env
  sed -i "s/^ACCESS_TOKEN_SECRET=.*/ACCESS_TOKEN_SECRET=${ACCESS_TOKEN_SECRET}/" .env
  echo "已自动生成 .env 密钥（请妥善保存下方输出）。"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 Docker，请先安装：https://docs.docker.com/engine/install/"
  exit 1
fi

docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "========== 部署完成 =========="
echo "健康检查："
echo "  curl -s http://127.0.0.1:${KB_API_PORT:-8089}/health"
echo ""
echo "机器人接口（发给负责人）："
echo "  POST http://<服务器IP>:${KB_API_PORT:-8089}/api/robot/knowledge/query"
echo "  Header: X-Robot-Api-Key: $(grep '^ROBOT_API_KEY=' .env | cut -d= -f2-)"
echo ""
echo "数据库密码 POSTGRES_PASSWORD=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)"
