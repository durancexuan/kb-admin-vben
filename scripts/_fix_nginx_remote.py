#!/usr/bin/env python3
"""上传修复后的 nginx 配置并重启 nginx。"""
from __future__ import annotations

import sys
from pathlib import Path

import paramiko

HOST, USER, PASSWORD = '192.168.13.7', 'user', 'abc@2026'
REPO = Path(__file__).resolve().parents[1]
NGINX_CONF = REPO / 'deploy' / 'nginx' / 'kb-admin.conf'
REMOTE_CONF = '/home/user/kb-admin/deploy/nginx/kb-admin.conf'


def run(ssh: paramiko.SSHClient, cmd: str) -> None:
    print('$', cmd)
    _, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip(), file=sys.stderr)
    if code != 0:
        raise RuntimeError(f'failed ({code}): {cmd}')


def main() -> int:
    sys.stdout.reconfigure(encoding='utf-8')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    sftp = ssh.open_sftp()
    sftp.put(str(NGINX_CONF), REMOTE_CONF)
    sftp.close()
    print('uploaded nginx config')

    run(
        ssh,
        'cd /home/user/kb-admin/deploy && '
        '(docker compose -f docker-compose.full.yml restart nginx '
        '|| echo "abc@2026" | sudo -S docker compose -f docker-compose.full.yml restart nginx)',
    )
    run(
        ssh,
        'curl -s -w "\\nHTTP:%{http_code}\\n" '
        '"http://127.0.0.1:5556/api/knowledge/qa/list?page=1&pageSize=5"',
    )
    ssh.close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
