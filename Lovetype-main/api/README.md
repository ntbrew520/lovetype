# Lovetype Compatibility API (MVP)

FastAPI ベースの相性診断 API。Render へのデプロイを想定。

## エンドポイント
- `GET /health` : `{"status":"ok"}` + データ在否
- `GET /types` : 16タイプの配列（`love_params.csv` 由来）
- `POST /score` : 入力 `{ "typeA": "...", "typeB": "..." }` を受け、仕様どおりの JSON を返す

## 必要ファイル（/api 配下）
- `love_params.csv`
- `centroids.json`（または `Centroids.json`）
- `mapping.json`（または `Mapping.json`）
- `copy.json`（または `Copy.json`）
- （任意）`constants.json` … `trust_high`, `margin_hybrid`, `weights`, `trust_divisor` を上書き可

## Render （Web Service）
- **Root Directory**: `/api`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
  - ※Root を `/api` にしているためモジュール名は `main:app` でOK
- **Environment**: `PYTHON_VERSION=3.11`
