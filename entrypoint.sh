#!/bin/sh
set -e

MODE="${1:-all}"

case "$MODE" in
  all|backend)
    echo "=== company: backend (serves frontend) ==="
    cd /app/backend
    exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
    ;;
  frontend-dev)
    echo "=== company: frontend dev server ==="
    cd /app/frontend-src
    npm install
    exec npx vite --host 0.0.0.0 --port 3000
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: docker run company [all|backend|frontend-dev]"
    exit 1
    ;;
esac
