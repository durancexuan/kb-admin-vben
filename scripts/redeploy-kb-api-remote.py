#!/usr/bin/env python3
"""同步 kb-api 源码到服务器并强制重建容器（触发 chunk 重索引）。"""
from __future__ import annotations

import io
import sys
import tarfile
import time
from pathlib import Path

import paramiko

HOST = '192.168.13.7'
USER = 'user'
PASSWORD = 'abc@2026'
ROOT = Path(__file__).resolve().parents[1]
KB_API_ROOT = ROOT / 'apps' / 'kb-api'
DEPLOY_ROOT = ROOT / 'deploy'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
sys.stdout.reconfigure(encoding='utf-8')
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

buffer = io.BytesIO()
with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
    for folder in ('src', 'sql', 'scripts', 'seed-data', 'models'):
        base = KB_API_ROOT / folder
        if not base.exists():
            continue
        for path in base.rglob('*'):
            if path.is_file():
                rel = path.relative_to(KB_API_ROOT)
                tar.add(path, arcname=str(rel).replace('\\', '/'))
    for name in (
        'Dockerfile.standalone',
        'Dockerfile.bge-embedding',
        'package.standalone.json',
        'requirements-bge.txt',
        'tsconfig.json',
    ):
        file_path = KB_API_ROOT / name
        arcname = 'package.json' if name == 'package.standalone.json' else name
        tar.add(file_path, arcname=arcname)
buffer.seek(0)

sftp = ssh.open_sftp()
remote_tar = '/home/user/kb-admin/apps/kb-api/kb-api-src.tar.gz'
with sftp.file(remote_tar, 'wb') as remote_file:
    remote_file.write(buffer.read())
sftp.close()


def run(cmd: str) -> None:
    print('$', cmd)
    _, stdout, stderr = ssh.exec_command(cmd, timeout=900)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip())


run(
    'cd /home/user/kb-admin/apps/kb-api && tar -xzf kb-api-src.tar.gz && rm -f kb-api-src.tar.gz '
    '&& rm -f sql/008_robot_doc.sql sql/009_seed_robot_doc.sql'
)
compose_local = DEPLOY_ROOT / 'docker-compose.full.yml'
if compose_local.exists():
    sftp = ssh.open_sftp()
    sftp.put(
        str(compose_local),
        '/home/user/kb-admin/deploy/docker-compose.full.yml',
    )
    nginx_conf = DEPLOY_ROOT / 'nginx' / 'kb-admin.conf'
    if nginx_conf.exists():
        sftp.put(str(nginx_conf), '/home/user/kb-admin/deploy/nginx/kb-admin.conf')
    sftp.close()
run(
    f'cd /home/user/kb-admin/deploy && '
    f'(docker compose -f docker-compose.full.yml build bge-embedding kb-api && '
    f'docker compose -f docker-compose.full.yml up -d bge-embedding kb-api) || '
    f'(echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.full.yml build bge-embedding kb-api && '
    f'echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.full.yml up -d bge-embedding kb-api)'
)
time.sleep(40)
run(
    f'cd /home/user/kb-admin/deploy && '
    f'(docker compose -f docker-compose.full.yml restart nginx || '
    f'echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.full.yml restart nginx)'
)
_, stdout, _ = ssh.exec_command('curl -sf http://127.0.0.1:8089/health')
print('health:', stdout.read().decode())
run(
    'docker exec kb-api-prod pnpm exec tsx scripts/seed-robot-docs.ts '
    '|| echo "seed-robot-docs skipped or failed"'
)
time.sleep(5)
run(
    f'cd /home/user/kb-admin/deploy && '
    f'(docker compose -f docker-compose.full.yml restart kb-api || '
    f'echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.full.yml restart kb-api)'
)
time.sleep(50)
_, stdout, _ = ssh.exec_command('curl -sf http://127.0.0.1:8089/health')
print('health after reindex:', stdout.read().decode())
ssh.close()
