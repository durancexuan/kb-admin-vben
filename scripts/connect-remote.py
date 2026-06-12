#!/usr/bin/env python3
"""Quick SSH + health check against production server."""
import json
import sys
import urllib.error
import urllib.request

import paramiko

HOST = '192.168.13.7'
USER = 'user'
PASSWORD = 'abc@2026'


def main() -> int:
    sys.stdout.reconfigure(encoding='utf-8')
    print(f'=== SSH {USER}@{HOST} ===')

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    except Exception as exc:
        print(f'SSH: FAIL - {exc}')
        return 1

    print('SSH: OK')

    def run(cmd: str) -> str:
        _, stdout, stderr = ssh.exec_command(cmd, timeout=30)
        out = stdout.read().decode('utf-8', 'replace').strip()
        err = stderr.read().decode('utf-8', 'replace').strip()
        return out or err or '(empty)'

    for label, cmd in [
        ('hostname', 'hostname'),
        ('uptime', 'uptime -p 2>/dev/null || uptime'),
        (
            'docker',
            'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | head -10',
        ),
        ('kb-api health', 'curl -sf http://127.0.0.1:8089/health || echo FAIL'),
    ]:
        print(f'--- {label} ---')
        print(run(cmd))

    ssh.close()

    print('\n=== HTTP from local ===')
    for name, url in [
        ('kb-api 8089', f'http://{HOST}:8089/health'),
        ('admin 5556', f'http://{HOST}:5556/'),
    ]:
        try:
            with urllib.request.urlopen(url, timeout=10) as resp:
                body = resp.read(300).decode('utf-8', 'replace')
                print(f'{name}: HTTP {resp.status} {body[:200]}')
        except urllib.error.URLError as exc:
            print(f'{name}: FAIL - {exc}')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
