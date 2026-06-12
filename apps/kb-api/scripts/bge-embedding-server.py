#!/usr/bin/env python3
"""本地 BGE 语义向量服务（sentence-transformers，离线推理）。"""
from __future__ import annotations

import os

from flask import Flask, jsonify, request
from sentence_transformers import SentenceTransformer

MODEL_ID = os.environ.get('BGE_MODEL', 'BAAI/bge-small-zh-v1.5')
PORT = int(os.environ.get('PORT', '8090'))
OFFLINE = os.environ.get('HF_HUB_OFFLINE', '').lower() in {'1', 'true', 'yes'}

app = Flask(__name__)
model = SentenceTransformer(MODEL_ID, local_files_only=OFFLINE)
EMBED_DIM = model.get_sentence_embedding_dimension()


@app.get('/health')
def health() -> tuple[object, int]:
    return (
        jsonify(
            {
                'dim': EMBED_DIM,
                'model': MODEL_ID,
                'ok': True,
                'provider': 'sentence-transformers',
            },
        ),
        200,
    )


@app.post('/embed')
def embed() -> tuple[object, int]:
    payload = request.get_json(force=True, silent=True) or {}
    text = payload.get('input') or payload.get('inputs') or ''
    if not str(text).strip():
        return jsonify({'error': 'input is required'}), 400

    vector = model.encode(str(text), normalize_embeddings=True)
    return jsonify({'embedding': vector.tolist()}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)
