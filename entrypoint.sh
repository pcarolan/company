#!/bin/sh
set -e

MODE="${1:-all}"

case "$MODE" in
  all)
    echo "=== company: starting all services ==="
    exec supervisord -n -c /etc/supervisor/conf.d/company.conf
    ;;
  backend)
    echo "=== company: backend only ==="
    cd /app/backend
    exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
    ;;
  frontend-dev)
    echo "=== company: frontend dev server ==="
    cd /app/frontend-src
    npm install
    exec npx vite --host 0.0.0.0 --port 3000
    ;;
  openclaw)
    echo "=== company: openclaw gateway ==="
    exec openclaw gateway --bind lan --port 18789
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: docker run company [all|backend|frontend-dev|openclaw]"
    exit 1
    ;;
esac
