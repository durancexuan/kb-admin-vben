#!/usr/bin/env python3
import json
import sys
import urllib.request

HOST = '192.168.13.7'
KEY = 'abba8fd282de1bd03366be58664a033a'

QUERIES = [
    '站经理是谁',
    '奥东加油站地址在哪里',
    '卫生间在哪里',
    '可口可乐多少钱',
]

def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    for utterance in QUERIES:
        body = json.dumps({'utterance': utterance}, ensure_ascii=False).encode()
        req = urllib.request.Request(
            f'http://{HOST}:8089/api/robot/knowledge/query',
            data=body,
            headers={
                'Content-Type': 'application/json',
                'X-Robot-Api-Key': KEY,
            },
            method='POST',
        )
        data = json.loads(urllib.request.urlopen(req, timeout=15).read().decode())
        item = data['data']
        print(
            f'{utterance} -> library={item.get("library")} hit={item.get("hit")} '
            f'conf={item.get("confidence")}'
        )
        if item.get('library') == 'robot-doc':
            print('  ERROR: robot-doc should not appear')


if __name__ == '__main__':
    main()
