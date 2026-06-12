#!/usr/bin/env python3
import sys

import paramiko

HOST, USER, PASSWORD = '192.168.13.7', 'user', 'abc@2026'


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    cmds = [
        'docker logs kb-bge-embedding --tail 80 2>&1',
        'docker logs kb-embedding-prod --tail 40 2>&1',
        'docker inspect kb-bge-embedding --format "{{json .State.Health}}"',
        'curl -sf http://127.0.0.1:8090/health || echo no_8090_host',
        'docker exec kb-bge-embedding python -c "import urllib.request; print(urllib.request.urlopen(\'http://127.0.0.1:8090/health\').read())" 2>&1 || echo exec_fail',
    ]
    for cmd in cmds:
        print('\n>>>', cmd)
        _, out, err = ssh.exec_command(cmd, timeout=120)
        print(out.read().decode('utf-8', errors='replace'))
        e = err.read().decode('utf-8', errors='replace')
        if e.strip():
            print('stderr:', e)

    ssh.close()


if __name__ == '__main__':
    main()
