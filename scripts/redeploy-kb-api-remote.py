#!/usr/bin/env python3
"""同步 kb-api 源码到服务器并强制重建容器（触发 chunk 重索引）。"""
import io
import tarfile
import time
from pathlib import Path

import paramiko

HOST = '192.168.13.7'
USER = 'user'
PASSWORD = 'abc@2026'
ROOT = Path(__file__).resolve().parents[1] / 'apps' / 'kb-api'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

buffer = io.BytesIO()
with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
    for folder in ('src', 'sql', 'scripts'):
        base = ROOT / folder
        if not base.exists():
            continue
        for path in base.rglob('*'):
            if path.is_file():
                rel = path.relative_to(ROOT)
                tar.add(path, arcname=str(rel).replace('\\', '/'))
    for name in ('Dockerfile.standalone', 'package.standalone.json', 'tsconfig.json'):
        file_path = ROOT / name
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
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip())


run('cd /home/user/kb-admin/apps/kb-api && tar -xzf kb-api-src.tar.gz && rm -f kb-api-src.tar.gz')
run(
    f'cd /home/user/kb-admin/deploy && '
    f'(docker compose -f docker-compose.full.yml build --no-cache kb-api && '
    f'docker compose -f docker-compose.full.yml up -d kb-api) || '
    f'(echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.full.yml build --no-cache kb-api && '
    f'echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.full.yml up -d kb-api)'
)
time.sleep(25)
_, stdout, _ = ssh.exec_command('curl -sf http://127.0.0.1:8089/health')
print('health:', stdout.read().decode())
ssh.close()
