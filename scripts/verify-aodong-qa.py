#!/usr/bin/env python3
import json
import sys
import urllib.request

import paramiko

HOST = '192.168.13.7'
USER = 'user'
PASSWORD = 'abc@2026'
API_KEY = 'abba8fd282de1bd03366be58664a033a'

QUERIES = [
    '北京奥东加油站具体位置在哪里',
    '奥东加油站地址在哪里',
    '可以开发票吗',
    '积分怎么累计',
    '奥东加油站营业时间多久',
    '本站有哪些油品',
    '能给电动车充电吗',
]


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15)

    _, stdout, _ = ssh.exec_command(
        'docker exec kb-postgres-prod psql -U kb -d kb -c '
        '"SELECT status, COUNT(*) FROM kb_qa GROUP BY status ORDER BY status;"',
        timeout=30,
    )
    print('--- qa status counts ---')
    print(stdout.read().decode('utf-8', 'replace'))
    ssh.close()

    print('--- robot query ---')
    for utterance in QUERIES:
        body = json.dumps({'utterance': utterance}, ensure_ascii=False).encode()
        req = urllib.request.Request(
            f'http://{HOST}:8089/api/robot/knowledge/query',
            data=body,
            headers={
                'Content-Type': 'application/json',
                'X-Robot-Api-Key': API_KEY,
            },
            method='POST',
        )
        data = json.loads(urllib.request.urlopen(req, timeout=15).read().decode())
        item = data['data']
        print(f'Q: {utterance}')
        print(f'   library={item.get("library")} hit={item.get("hit")} display={item.get("display")}')
        if item.get('speak'):
            print(f'   speak: {item["speak"][:100]}…')
        print()


if __name__ == '__main__':
    main()
