#!/usr/bin/env python3
import paramiko
import json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.13.7', username='user', password='abc@2026', timeout=20)
_, o, _ = ssh.exec_command('docker inspect kb-api-prod --format "{{json .Config.Env}}"')
env = json.loads(o.read().decode())
for item in sorted(env):
    if 'DATABASE' in item or 'POSTGRES' in item or 'ACCESS' in item:
        print(item)
ssh.close()
