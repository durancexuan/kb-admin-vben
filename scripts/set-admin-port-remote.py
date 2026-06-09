#!/usr/bin/env python3
"""在服务器上将管理端端口改为 5556 并重建 Nginx 容器。"""
import paramiko

HOST = '192.168.13.7'
USER = 'user'
PASSWORD = 'abc@2026'
ADMIN_PORT = '5556'
REMOTE = '/home/user/kb-admin/deploy'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

def run(cmd: str) -> None:
    print('$', cmd)
    _, o, e = ssh.exec_command(cmd, timeout=120)
    code = o.channel.recv_exit_status()
    out = o.read().decode()
    err = e.read().decode()
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip())
    if code != 0:
        raise SystemExit(code)

run(
    f"grep -q '^ADMIN_PORT=' {REMOTE}/.env 2>/dev/null && "
    f"sed -i 's/^ADMIN_PORT=.*/ADMIN_PORT={ADMIN_PORT}/' {REMOTE}/.env || "
    f"echo 'ADMIN_PORT={ADMIN_PORT}' >> {REMOTE}/.env"
)
run(
    f'cd {REMOTE} && '
    f'(docker compose -f docker-compose.full.yml up -d nginx '
    f'|| echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.full.yml up -d nginx)'
)
run(f'curl -sf -o /dev/null -w "%{{http_code}}" http://127.0.0.1:{ADMIN_PORT}/ || true')
print(f'\n管理端： http://{HOST}:{ADMIN_PORT}/')
ssh.close()
