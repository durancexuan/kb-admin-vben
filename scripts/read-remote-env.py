#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.13.7', username='user', password='abc@2026', timeout=20)
for path in [
    '/home/user/kb-admin/apps/kb-api/.env',
    '/home/user/kb-admin/deploy/../apps/kb-api/.env',
]:
    _, o, _ = ssh.exec_command(f'cat {path} 2>/dev/null || true')
    text = o.read().decode().strip()
    if text:
        print('---', path, '---')
        print(text)
ssh.close()
