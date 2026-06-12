#!/usr/bin/env python3
"""全栈部署：playground + mock + kb-api + BGE 离线模型 → 192.168.13.7"""

from __future__ import annotations

import io
import os
import subprocess
import sys
import tarfile
import time
from pathlib import Path

import paramiko

HOST = os.environ.get('KB_DEPLOY_HOST', '192.168.13.7')
USER = os.environ.get('KB_DEPLOY_USER', 'user')
PASSWORD = os.environ.get('KB_DEPLOY_PASSWORD', 'abc@2026')
REMOTE_ROOT = os.environ.get('KB_DEPLOY_ROOT', '/home/user/kb-admin')
ADMIN_PORT = os.environ.get('KB_ADMIN_PORT', '5556')
KB_API_PORT = os.environ.get('KB_API_PORT', '8089')

REPO = Path(__file__).resolve().parents[1]
DEPLOY = REPO / 'deploy'
PLAY_DIST = REPO / 'playground' / 'dist'
MOCK_OUTPUT = REPO / 'apps' / 'backend-mock' / '.output'
KB_API = REPO / 'apps' / 'kb-api'
MODELS_DIR = KB_API / 'models'
DOWNLOAD_MODEL_SCRIPT = KB_API / 'scripts' / 'download-bge-model.py'


def run_local(command: list[str], cwd: Path | None = None, timeout: int = 1800) -> None:
    print(f'[local] {" ".join(command)}')
    subprocess.run(command, cwd=cwd or REPO, check=True, timeout=timeout, shell=False)


def ensure_bge_model() -> None:
    marker = MODELS_DIR / 'hub'
    if marker.exists() and any(marker.rglob('config.json')):
        print(f'[bge] model cache exists: {MODELS_DIR}')
        return
    print('[bge] downloading model (first run may take a few minutes)...')
    run_local([sys.executable, str(DOWNLOAD_MODEL_SCRIPT)], timeout=3600)
    if not any(MODELS_DIR.rglob('config.json')):
        raise RuntimeError(f'BGE model missing under {MODELS_DIR}')


def ensure_builds() -> None:
    if not PLAY_DIST.exists():
        print('[build] playground production...')
        run_local(['pnpm', 'build:play'], timeout=1800)
    if not MOCK_OUTPUT.exists():
        print('[build] backend-mock nitro...')
        run_local(['pnpm', 'build'], cwd=REPO / 'apps' / 'backend-mock', timeout=600)
    if not PLAY_DIST.exists() or not MOCK_OUTPUT.exists():
        raise RuntimeError('构建产物缺失，请检查 build 日志')


def patch_kb_api_env() -> bytes:
    example = KB_API / '.env.production.example'
    content = example.read_text(encoding='utf-8')
    content = content.replace('POSTGRES_PASSWORD=请改成强密码', 'POSTGRES_PASSWORD=kb_prod_2026')
    content = content.replace('ROBOT_API_KEY=请改成随机长密钥', 'ROBOT_API_KEY=abba8fd282de1bd03366be58664a033a')
    content = content.replace('ACCESS_TOKEN_SECRET=请改成随机长字符串', 'ACCESS_TOKEN_SECRET=access_token_secret')
    return content.encode('utf-8')


def build_tarball() -> bytes:
    buffer = io.BytesIO()
    skip_dirs = {'.git', 'node_modules', '.nitro'}

    with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
        def add_file(local: Path, arc: str) -> None:
            tar.add(local, arcname=arc.replace('\\', '/'))

        def add_tree(local_root: Path, arc_root: str) -> None:
            for path in local_root.rglob('*'):
                if not path.is_file():
                    continue
                rel = path.relative_to(local_root)
                if any(part in skip_dirs for part in rel.parts):
                    continue
                add_file(path, f'{arc_root}/{rel}'.replace('\\', '/'))

        add_tree(PLAY_DIST, 'deploy/playground-dist')
        add_tree(MOCK_OUTPUT, 'deploy/backend-mock-output')
        for folder in ('sql', 'src', 'scripts', 'seed-data', 'models'):
            add_tree(KB_API / folder, f'apps/kb-api/{folder}')
        for name in (
            'Dockerfile.standalone',
            'Dockerfile.bge-embedding',
            'package.standalone.json',
            'requirements-bge.txt',
            'tsconfig.json',
            'docker-compose.prod.yml',
        ):
            add_file(KB_API / name, f'apps/kb-api/{name}')
        add_file(KB_API / 'package.standalone.json', 'apps/kb-api/package.json')

        env_bytes = patch_kb_api_env()
        info = tarfile.TarInfo(name='apps/kb-api/.env')
        info.size = len(env_bytes)
        tar.addfile(info, io.BytesIO(env_bytes))

        add_tree(DEPLOY / 'nginx', 'deploy/nginx')
        add_file(DEPLOY / 'docker-compose.full.yml', 'deploy/docker-compose.full.yml')

        deploy_env = (
            f'POSTGRES_PASSWORD=kb_prod_2026\n'
            f'KB_API_PORT={KB_API_PORT}\n'
            f'ADMIN_PORT={ADMIN_PORT}\n'
        ).encode('utf-8')
        info = tarfile.TarInfo(name='deploy/.env')
        info.size = len(deploy_env)
        tar.addfile(info, io.BytesIO(deploy_env))

    buffer.seek(0)
    return buffer.read()


def run_remote(ssh: paramiko.SSHClient, command: str, timeout: int = 1800) -> str:
    print(f'$ {command}')
    _, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip(), file=sys.stderr)
    if code != 0:
        raise RuntimeError(f'failed ({code}): {command}')
    return out


def docker_compose(ssh: paramiko.SSHClient, args: str, timeout: int = 2400) -> None:
    cmd = (
        f'cd {REMOTE_ROOT}/deploy && '
        f'(docker compose -f docker-compose.full.yml {args} '
        f'|| echo "{PASSWORD}" | sudo -S docker compose -f docker-compose.full.yml {args})'
    )
    run_remote(ssh, cmd, timeout=timeout)


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    ensure_bge_model()
    ensure_builds()
    payload = build_tarball()
    print(f'[deploy] tarball {len(payload) / 1024 / 1024:.2f} MB → {USER}@{HOST}')

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    sftp = ssh.open_sftp()
    try:
        run_remote(ssh, f'mkdir -p {REMOTE_ROOT}')
        remote_tar = f'{REMOTE_ROOT}/full-deploy.tar.gz'
        with sftp.file(remote_tar, 'wb') as remote_file:
            remote_file.write(payload)
        run_remote(
            ssh,
            f'cd {REMOTE_ROOT} && tar -xzf full-deploy.tar.gz && rm -f full-deploy.tar.gz',
        )
        run_remote(
            ssh,
            'rm -f /home/user/kb-admin/apps/kb-api/sql/008_robot_doc.sql '
            '/home/user/kb-admin/apps/kb-api/sql/009_seed_robot_doc.sql',
        )
        run_remote(ssh, 'docker rm -f kb-embedding-prod 2>/dev/null || true')
        docker_compose(ssh, 'up -d --build --remove-orphans', timeout=3600)
        time.sleep(20)
        run_remote(ssh, f'curl -sf http://127.0.0.1:{KB_API_PORT}/health || true')
        run_remote(
            ssh,
            'docker exec kb-api-prod pnpm exec tsx scripts/seed-robot-docs.ts '
            '2>/dev/null || echo seed-robot-docs skipped',
            timeout=300,
        )
        run_remote(
            ssh,
            (
                f'curl -sf -X POST http://127.0.0.1:{KB_API_PORT}/api/robot/knowledge/query '
                f'-H "Content-Type: application/json" '
                f'-H "X-Robot-Api-Key: abba8fd282de1bd03366be58664a033a" '
                f'-d \'{{"utterance":"卫生间在哪里"}}\' || echo ROBOT_FAIL'
            ),
            timeout=60,
        )
        run_remote(ssh, f'curl -sf -o /dev/null -w "%{{http_code}}" http://127.0.0.1:{ADMIN_PORT}/ || true')
        docker_compose(ssh, 'ps -a')
        print('')
        print('========== 全栈部署完成 ==========')
        print(f'管理端： http://{HOST}:{ADMIN_PORT}/')
        print(f'kb-api：  http://{HOST}:{KB_API_PORT}/health')
        print(f'机器人：  POST http://{HOST}:{KB_API_PORT}/api/robot/knowledge/query')
        print('登录账号：vben / 123456')
    finally:
        sftp.close()
        ssh.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:  # noqa: BLE001
        print(f'[deploy] failed: {error}', file=sys.stderr)
        sys.exit(1)
