#!/usr/bin/env python3
"""从服务器 BGE 容器导出模型缓存到本地 apps/kb-api/models。"""
from __future__ import annotations

import io
import sys
import tarfile
from pathlib import Path

import paramiko

HOST, USER, PASSWORD = '192.168.13.7', 'user', 'abc@2026'
REMOTE_TAR = '/tmp/bge-models.tar.gz'
LOCAL_MODELS = Path(__file__).resolve().parents[1] / 'models'


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 600) -> tuple[str, int]:
    print('$', cmd)
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip(), file=sys.stderr)
    return out, code


def main() -> int:
    sys.stdout.reconfigure(encoding='utf-8')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    out, code = run(
        ssh,
        'docker exec kb-bge-embedding sh -c "test -d /models && find /models -name config.json | head -1"',
        timeout=60,
    )
    if code != 0 or not out.strip():
        print('server BGE model not found in container', file=sys.stderr)
        ssh.close()
        return 1

    run(
        ssh,
        f'docker exec kb-bge-embedding tar -czf - -C /models . > {REMOTE_TAR}',
        timeout=600,
    )
    sftp = ssh.open_sftp()
    with sftp.file(REMOTE_TAR, 'rb') as remote_file:
        data = remote_file.read()
    sftp.close()
    run(ssh, f'rm -f {REMOTE_TAR}')

    LOCAL_MODELS.mkdir(parents=True, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as tar:
        tar.extractall(LOCAL_MODELS)
    configs = list(LOCAL_MODELS.rglob('config.json'))
    print(f'exported to {LOCAL_MODELS}, config.json count={len(configs)}')
    ssh.close()
    return 0 if configs else 1


if __name__ == '__main__':
    raise SystemExit(main())
