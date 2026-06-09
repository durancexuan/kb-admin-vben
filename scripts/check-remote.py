#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.13.7', username='user', password='abc@2026', timeout=20)
for cmd in [
    'docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"',
    'docker logs kb-api-prod --tail 50 2>&1',
    'docker logs kb-admin-nginx --tail 20 2>&1',
]:
    print('$', cmd)
    _, o, e = ssh.exec_command(cmd)
    print(o.read().decode())
    err = e.read().decode()
    if err.strip():
        print(err)
ssh.close()
