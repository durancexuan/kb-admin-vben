#!/usr/bin/env python3
"""构建并同步 playground 管理端到服务器 Nginx。"""
from __future__ import annotations

import io
import subprocess
import sys
import tarfile
from pathlib import Path

import paramiko

HOST, USER, PASSWORD = '192.168.13.7', 'user', 'abc@2026'
REMOTE_ROOT = '/home/user/kb-admin'
REPO = Path(__file__).resolve().parents[1]
PLAY_DIST = REPO / 'playground' / 'dist'
NGINX_CONF = REPO / 'deploy' / 'nginx' / 'kb-admin.conf'


def run_local(cmd: str, timeout: int = 1800) -> None:
    print('[local]', cmd)
    subprocess.run(cmd, cwd=REPO, check=True, timeout=timeout, shell=True)


def main() -> int:
    sys.stdout.reconfigure(encoding='utf-8')
    run_local('pnpm build:play', timeout=1800)
    if not PLAY_DIST.exists():
        print('playground dist missing', file=sys.stderr)
        return 1

    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
        for path in PLAY_DIST.rglob('*'):
            if path.is_file():
                rel = path.relative_to(PLAY_DIST)
                tar.add(path, arcname=f'deploy/playground-dist/{rel}'.replace('\\', '/'))
        if NGINX_CONF.exists():
            tar.add(NGINX_CONF, arcname='deploy/nginx/kb-admin.conf')
    payload = buffer.getvalue()
    print(f'[deploy] tarball {len(payload) / 1024 / 1024:.2f} MB')

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = ssh.open_sftp()
    remote_tar = f'{REMOTE_ROOT}/playground-deploy.tar.gz'
    with sftp.file(remote_tar, 'wb') as remote_file:
        remote_file.write(payload)
    sftp.close()

    def run(cmd: str) -> None:
        print('$', cmd)
        _, stdout, stderr = ssh.exec_command(cmd, timeout=300)
        code = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        if out.strip():
            print(out.rstrip())
        if err.strip():
            print(err.rstrip(), file=sys.stderr)
        if code != 0:
            raise RuntimeError(cmd)

    run(f'cd {REMOTE_ROOT} && tar -xzf playground-deploy.tar.gz && rm -f playground-deploy.tar.gz')
    run(
        f'cd {REMOTE_ROOT}/deploy && '
        f'(docker compose -f docker-compose.full.yml restart nginx || '
        f'echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.full.yml restart nginx)',
    )
    run('curl -s -o /dev/null -w "admin:%{http_code}\n" http://127.0.0.1:5556/')
    ssh.close()
    print(f'管理端已更新： http://{HOST}:5556/')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
