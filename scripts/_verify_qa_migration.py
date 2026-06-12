#!/usr/bin/env python3
import json
import sys

import paramiko

HOST, USER, PASSWORD = '192.168.13.7', 'user', 'abc@2026'


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    cmds = [
        "docker exec kb-postgres-prod psql -U kb -d kb -t -c \"SELECT COUNT(*) FROM kb_qa WHERE status='online'\"",
        "docker exec kb-postgres-prod psql -U kb -d kb -t -c \"SELECT question FROM kb_qa WHERE id='00000000-0000-4000-8000-000000000028'\"",
        "docker exec kb-postgres-prod psql -U kb -d kb -t -c \"SELECT COUNT(*) FROM kb_unified_index WHERE library='qa'\"",
        "docker exec kb-postgres-prod psql -U kb -d kb -t -c \"SELECT COUNT(*) FROM kb_unified_index WHERE library='robot-doc' AND embed_text LIKE '%可以自助加油%'\"",
        (
            'curl -sf -X POST http://127.0.0.1:8089/api/robot/knowledge/query '
            '-H "Content-Type: application/json" '
            '-H "X-Robot-Api-Key: abba8fd282de1bd03366be58664a033a" '
            '-d \'{"utterance":"可以自助加油吗"}\''
        ),
    ]
    for c in cmds:
        print('>>>', c[:100])
        _, o, _ = ssh.exec_command(c, timeout=60)
        print(o.read().decode('utf-8', errors='replace').strip())
    ssh.close()


if __name__ == '__main__':
    main()
