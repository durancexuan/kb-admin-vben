#!/usr/bin/env bash
# 在 Linux 服务器上于 apps/kb-api 目录执行：bash scripts/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.production.example .env
  echo "已生成 .env，请先编辑 POSTGRES_PASSWORD 与 ROBOT_API_KEY 后再执行本脚本。"
  exit 1
fi

if grep -q '请改成' .env 2>/dev/null; then
  echo "请先编辑 .env 中的 POSTGRES_PASSWORD 与 ROBOT_API_KEY。"
  exit 1
fi

docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "部署完成。健康检查："
echo "  curl -s http://127.0.0.1:${KB_API_PORT:-8080}/health"
echo ""
echo "机器人接口（将地址与密钥发给负责人）："
echo "  POST http://<服务器IP>:${KB_API_PORT:-8080}/api/robot/knowledge/query"
echo "  Header: X-Robot-Api-Key: <.env 中 ROBOT_API_KEY>"
