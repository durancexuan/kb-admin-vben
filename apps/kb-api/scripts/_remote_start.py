#!/usr/bin/env python3
"""远程启动/检查 kb-admin 现网服务（Postgres + 可选 BGE + kb-api）。"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import paramiko

REPO_ROOT = Path(__file__).resolve().parents[3]
COMPOSE_LOCAL = REPO_ROOT / 'deploy' / 'docker-compose.full.yml'

HOST = '192.168.13.7'
USER = 'user'
PASSWORD = 'abc@2026'
DEPLOY_DIR = '/home/user/kb-admin/deploy'
ENV_FILE = '/home/user/kb-admin/apps/kb-api/.env'
COMPOSE_FILE = 'docker-compose.full.yml'
KB_API_PORT = 8089
ROBOT_API_KEY = 'abba8fd282de1bd03366be58664a033a'

BGE_ENV_BLOCK = """\
# --- BGE semantic embedding (auto-managed by _remote_start.py) ---
EMBEDDING_API_URL=http://bge-embedding:8090/embed
EMBEDDING_API_FORMAT=simple
EMBEDDING_API_MODEL=BAAI/bge-small-zh-v1.5
EMBEDDING_DIM=512
EMBEDDING_API_TIMEOUT_MS=60000
"""

LOCAL_HASH_ENV_BLOCK = """\
# --- local-hash fallback (BGE unavailable) ---
EMBEDDING_DIM=512
EMBEDDING_MODEL=local-hash-v1
"""


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 900) -> tuple[str, str, int]:
    print('$', cmd)
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip(), file=sys.stderr)
    return out, err, exit_code


def compose(ssh: paramiko.SSHClient, args: str, timeout: int = 900) -> int:
    cmd = (
        f'cd {DEPLOY_DIR} && '
        f'(docker compose -f {COMPOSE_FILE} {args} || '
        f'echo "{PASSWORD}" | sudo -S docker compose -f {COMPOSE_FILE} {args})'
    )
    _, _, code = run(ssh, cmd, timeout=timeout)
    return code


def bge_healthy(ssh: paramiko.SSHClient) -> bool:
    out, _, _ = run(
        ssh,
        (
            'docker exec kb-bge-embedding python -c '
            '"import urllib.request; '
            'print(urllib.request.urlopen('
            '\\"http://127.0.0.1:8090/health\\", timeout=3).read().decode())" '
            '2>/dev/null || echo BGE_FAIL'
        ),
        timeout=20,
    )
    normalized = out.replace(' ', '')
    return 'BGE_FAIL' not in out and ('"ok":true' in normalized or '"ok":true,' in normalized)


def wait_bge(ssh: paramiko.SSHClient, max_wait_sec: int = 360) -> bool:
    deadline = time.time() + max_wait_sec
    while time.time() < deadline:
        if bge_healthy(ssh):
            print('bge-embedding healthy')
            return True
        print('waiting for bge-embedding...')
        time.sleep(15)
    return False


def patch_env(ssh: paramiko.SSHClient, block: str) -> None:
    run(
        ssh,
        (
            f"python3 - <<'PY'\n"
            f"from pathlib import Path\n"
            f"path = Path('{ENV_FILE}')\n"
            f"text = path.read_text(encoding='utf-8') if path.exists() else ''\n"
            f"lines = []\n"
            f"skip = False\n"
            f"for line in text.splitlines():\n"
            f"    if line.startswith('# --- BGE ') or line.startswith('# --- local-hash '):\n"
            f"        skip = True\n"
            f"        continue\n"
            f"    if skip:\n"
            f"        if line.startswith('# ---'):\n"
            f"            skip = False\n"
            f"        elif line.startswith('EMBEDDING_'):\n"
            f"            continue\n"
            f"        else:\n"
            f"            skip = False\n"
            f"    if not skip and not line.startswith('EMBEDDING_'):\n"
            f"        lines.append(line)\n"
            f"block = '''{block}'''.strip()\n"
            f"out = '\\n'.join(lines).rstrip() + '\\n\\n' + block + '\\n'\n"
            f"path.write_text(out, encoding='utf-8')\n"
            f"print('patched', path)\n"
            f"PY"
        ),
        timeout=60,
    )


def wait_kb_api(ssh: paramiko.SSHClient, max_wait_sec: int = 120) -> bool:
    deadline = time.time() + max_wait_sec
    while time.time() < deadline:
        out, _, _ = run(
            ssh,
            f'curl -sf http://127.0.0.1:{KB_API_PORT}/health || echo HEALTH_FAIL',
            timeout=20,
        )
        if 'HEALTH_FAIL' not in out:
            try:
                line = [ln for ln in out.strip().splitlines() if ln.startswith('{')][-1]
                payload = json.loads(line)
                emb = payload.get('embedding', {})
                print(
                    'kb-api health ok:',
                    f"mode={emb.get('mode')}",
                    f"model={emb.get('model')}",
                )
            except (json.JSONDecodeError, IndexError):
                print('kb-api health ok')
            return True
        print('waiting for kb-api...')
        time.sleep(8)
    return False


def main() -> int:
    sys.stdout.reconfigure(encoding='utf-8')

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    if COMPOSE_LOCAL.exists():
        sftp = ssh.open_sftp()
        sftp.put(str(COMPOSE_LOCAL), f'{DEPLOY_DIR}/{COMPOSE_FILE}')
        sftp.close()
        print('uploaded docker-compose.full.yml')

    print('=== cleanup orphan containers ===')
    compose(ssh, 'up -d --remove-orphans postgres', timeout=300)
    run(ssh, 'docker rm -f kb-embedding-prod 2>/dev/null || true')

    print('\n=== start bge-embedding (optional) ===')
    compose(ssh, 'up -d --build bge-embedding', timeout=1800)
    use_bge = wait_bge(ssh)

    if use_bge:
        patch_env(ssh, BGE_ENV_BLOCK)
        print('embedding mode: BGE semantic')
    else:
        print('bge-embedding unavailable, fallback to local-hash-v1')
        run(ssh, 'docker logs kb-bge-embedding --tail 30 2>&1')
        patch_env(ssh, LOCAL_HASH_ENV_BLOCK)

    print('\n=== start kb-api ===')
    code = compose(ssh, 'up -d --build kb-api', timeout=1200)
    if code != 0: 
        ssh.close()
        return code

    if not wait_kb_api(ssh):
        run(ssh, 'docker logs kb-api-prod --tail 80 2>&1')
        ssh.close()
        return 1

    print('\n=== robot query smoke test ===')
    body = json.dumps({'utterance': '卫生间在哪里'}, ensure_ascii=False)
    run(
        ssh,
        (
            f'curl -sf -X POST http://127.0.0.1:{KB_API_PORT}/api/robot/knowledge/query '
            f'-H "Content-Type: application/json" '
            f'-H "X-Robot-Api-Key: {ROBOT_API_KEY}" '
            f"-d '{body}' || echo ROBOT_FAIL"
        ),
        timeout=60,
    )

    print('\n=== final status ===')
    compose(ssh, 'ps -a')
    ssh.close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
