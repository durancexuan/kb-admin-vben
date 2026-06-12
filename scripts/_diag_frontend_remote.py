#!/usr/bin/env python3
from __future__ import annotations

import json
import sys

import paramiko

HOST, USER, PASSWORD = '192.168.13.7', 'user', 'abc@2026'


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 60) -> str:
    print('\n>>>', cmd)
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print('ERR:', err.rstrip())
    return out


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    run(ssh, 'curl -s -o /dev/null -w "admin:%{http_code}\n" http://127.0.0.1:5556/')
    run(ssh, 'curl -s http://127.0.0.1:8089/health')
    for path in (
        '/api/knowledge/qa/list?page=1&pageSize=5',
        '/api/knowledge/goods/list?page=1&pageSize=5',
        '/api/knowledge/campaign/list?page=1&pageSize=5',
        '/api/knowledge/robot-doc/list?page=1&pageSize=5',
    ):
        run(
            ssh,
            f'curl -s -w "\\nHTTP:%{{http_code}}\\n" "http://127.0.0.1:5556{path}"',
        )
    run(
        ssh,
        'curl -s -w "\\nHTTP:%{http_code}\\n" -X POST http://127.0.0.1:5556/api/auth/login '
        '-H "Content-Type: application/json" '
        '-d \'{"username":"vben","password":"123456"}\'',
    )
    run(ssh, 'docker logs kb-api-prod --tail 50 2>&1')
    run(ssh, 'docker logs kb-admin-nginx --tail 30 2>&1')
    run(ssh, 'docker logs kb-mock-prod --tail 30 2>&1')
    ssh.close()


if __name__ == '__main__':
    main()
