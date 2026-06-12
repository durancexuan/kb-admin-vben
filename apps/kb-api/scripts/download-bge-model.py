#!/usr/bin/env python3
"""下载 BAAI/bge-small-zh-v1.5 到 apps/kb-api/models，供离线部署打包。"""
from __future__ import annotations

import os
import sys
from pathlib import Path

MODEL_ID = 'BAAI/bge-small-zh-v1.5'
ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / 'models'


def main() -> int:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault('HF_HOME', str(MODELS_DIR))
    os.environ.setdefault('HF_ENDPOINT', 'https://hf-mirror.com')

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print('请先安装: pip install sentence-transformers', file=sys.stderr)
        return 1

    print(f'[bge] downloading {MODEL_ID} -> {MODELS_DIR}')
    model = SentenceTransformer(MODEL_ID)
    dim = model.get_sentence_embedding_dimension()
    probe = model.encode('知识库向量探针', normalize_embeddings=True)
    print(f'[bge] ok dim={dim} probe_len={len(probe)}')
    print(f'[bge] cache: {MODELS_DIR}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
