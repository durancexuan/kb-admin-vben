#!/usr/bin/env python3
import sys
import time

import paramiko

HOST, USER, PASSWORD = '192.168.13.7', 'user', 'abc@2026'


def run(ssh, cmd, timeout=600):
    print('$', cmd)
    _, o, _ = ssh.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.rstrip())
    return out


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    run(
        ssh,
        'cd /home/user/kb-admin/deploy && '
        '(docker compose -f docker-compose.full.yml restart kb-api || '
        'echo "abc@2026" | sudo -S docker compose -f docker-compose.full.yml restart kb-api)',
    )
    time.sleep(50)
    run(ssh, 'curl -sf http://127.0.0.1:8089/health')
    run(
        ssh,
        'docker exec kb-postgres-prod psql -U kb -d kb -c '
        '"SELECT library, COUNT(*) FROM kb_unified_index GROUP BY library ORDER BY library"',
    )
    run(
        ssh,
        'curl -sf -X POST http://127.0.0.1:8089/api/robot/knowledge/query '
        '-H "Content-Type: application/json" '
        '-H "X-Robot-Api-Key: abba8fd282de1bd03366be58664a033a" '
        '-d \'{"utterance":"可以自助加油吗"}\'',
    )
    run(ssh, 'cd /home/user/kb-admin/deploy && docker compose -f docker-compose.full.yml restart nginx')
    ssh.close()


if __name__ == '__main__':
    main()
