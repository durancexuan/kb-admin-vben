#!/usr/bin/env bash
# 在 192.168.13.7 等 Linux 服务器上首次一键部署（需已能 SSH 登录）
set -euo pipefail

REPO_URL="${KB_REPO_URL:-https://github.com/durancexuan/kb-admin-vben.git}"
INSTALL_DIR="${KB_INSTALL_DIR:-$HOME/kb-admin}"
BRANCH="${KB_BRANCH:-main}"

echo "[1/5] 检查 Docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "正在安装 Docker（需 sudo）..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
  echo "Docker 已安装。若提示权限不足，请执行 newgrp docker 或重新 SSH 登录后再次运行本脚本。"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未检测到 docker compose v2，请安装后重试。"
  exit 1
fi

echo "[2/5] 拉取代码 -> ${INSTALL_DIR}"
if [[ -d "${INSTALL_DIR}/.git" ]]; then
  git -C "${INSTALL_DIR}" fetch origin
  git -C "${INSTALL_DIR}" checkout "${BRANCH}"
  git -C "${INSTALL_DIR}" pull --ff-only origin "${BRANCH}"
else
  git clone --branch "${BRANCH}" "${REPO_URL}" "${INSTALL_DIR}"
fi

echo "[3/5] 启动 kb-api + Postgres"
cd "${INSTALL_DIR}/apps/kb-api"
bash scripts/deploy.sh

echo "[4/5] 尝试放行 8089（可选，失败可忽略）"
if command -v ufw >/dev/null 2>&1 && sudo ufw status 2>/dev/null | grep -q 'Status: active'; then
  sudo ufw allow 8089/tcp || true
fi

echo "[5/5] 本机健康检查"
sleep 3
curl -sf "http://127.0.0.1:${KB_API_PORT:-8089}/health" && echo "" || {
  echo "健康检查未通过，查看日志："
  echo "  cd ${INSTALL_DIR}/apps/kb-api && docker compose -f docker-compose.prod.yml logs --tail=80 kb-api"
  exit 1
}

SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo ""
echo "========== 服务器部署成功 =========="
echo "内网访问：http://${SERVER_IP:-<服务器IP>}:${KB_API_PORT:-8089}/health"
echo "管理端 .env.development 可设：VITE_KB_API_TARGET=http://${SERVER_IP:-192.168.13.7}:${KB_API_PORT:-8089}"
