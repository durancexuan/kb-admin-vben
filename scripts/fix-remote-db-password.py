#!/usr/bin/env python3
import paramiko
import time

PASSWORD = 'abc@2026'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.13.7', username='user', password=PASSWORD, timeout=20)

cmds = [
    """docker exec kb-postgres-prod psql -U kb -d kb -c "ALTER USER kb WITH PASSWORD 'kb_prod_2026';" """,  # noqa: E501
    'docker restart kb-api-prod',
]
for cmd in cmds:
    print('$', cmd)
    _, o, e = ssh.exec_command(cmd)
    print(o.read().decode())
    err = e.read().decode()
    if err.strip():
        print(err)

time.sleep(10)
_, o, _ = ssh.exec_command('curl -sf http://127.0.0.1:8089/health')
print('health:', o.read().decode())
ssh.close()
