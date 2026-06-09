#!/usr/bin/env python3
"""通过 SSH/SCP 将本地 kb-api 同步到服务器并重建容器。"""

from __future__ import annotations

import io
import os
import sys
import tarfile
import time
from pathlib import Path

import paramiko

HOST = os.environ.get('KB_DEPLOY_HOST', '192.168.13.7')
USER = os.environ.get('KB_DEPLOY_USER', 'user')
PASSWORD = os.environ.get('KB_DEPLOY_PASSWORD', 'abc@2026')
REMOTE_DIR = os.environ.get('KB_DEPLOY_DIR', '/home/user/kb-admin/apps/kb-api')
PORT = int(os.environ.get('KB_API_PORT', '8089'))

ROOT = Path(__file__).resolve().parents[1]

SKIP_DIRS = {
    '.git',
    'node_modules',
    '.nitro',
    '.env',
}
SKIP_SUFFIXES = {'.mjs.map'}


def should_skip(path: Path) -> bool:
    parts = set(path.parts)
    if parts & SKIP_DIRS:
        return True
    return path.suffix in SKIP_SUFFIXES


def build_tar_bytes() -> bytes:
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
        for file_path in ROOT.rglob('*'):
            if not file_path.is_file():
                continue
            rel = file_path.relative_to(ROOT)
            if should_skip(rel):
                continue
            tar.add(file_path, arcname=str(rel).replace('\\', '/'))
    buffer.seek(0)
    return buffer.read()


def run_remote(ssh: paramiko.SSHClient, command: str, timeout: int = 900) -> str:
    print(f'$ {command}')
    _, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip(), file=sys.stderr)
    if exit_code != 0:
        raise RuntimeError(f'command failed ({exit_code}): {command}')
    return out


def main() -> None:
    print(f'[deploy] target {USER}@{HOST}:{REMOTE_DIR}')
    payload = build_tar_bytes()
    print(f'[deploy] tarball {len(payload) / 1024 / 1024:.2f} MB')

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

    sftp = ssh.open_sftp()
    try:
        run_remote(ssh, f'mkdir -p {REMOTE_DIR}')
        remote_tar = f'{REMOTE_DIR}/kb-api-sync.tar.gz'
        with sftp.file(remote_tar, 'wb') as remote_file:
            remote_file.write(payload)
        run_remote(
            ssh,
            f'cd {REMOTE_DIR} && tar -xzf kb-api-sync.tar.gz && rm -f kb-api-sync.tar.gz',
        )
        docker_cmd = (
            f'cd {REMOTE_DIR} && '
            f'(docker compose -f docker-compose.prod.yml up -d --build '
            f'|| echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.prod.yml up -d --build)'
        )
        run_remote(ssh, docker_cmd, timeout=1200)
        time.sleep(8)
        health = run_remote(
            ssh,
            f'curl -sf http://127.0.0.1:{PORT}/health || true',
        )
        print('[deploy] health:', health.strip() or '(empty)')
        api_probe = run_remote(
            ssh,
            "curl -sf -o /dev/null -w '%{http_code}' "
            f'http://127.0.0.1:{PORT}/api/knowledge/qa/list?page=1&pageSize=1 '
            "|| echo '000'",
        )
        print('[deploy] qa list status:', api_probe.strip())
    finally:
        sftp.close()
        ssh.close()

    print('[deploy] done')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:  # noqa: BLE001
        print(f'[deploy] failed: {error}', file=sys.stderr)
        sys.exit(1)
