#!/bin/bash
# Dev mode — runs backend + frontend with hot reload.
# Backend: uvicorn --reload (auto-restarts on Python changes)
# Frontend: vite dev (HMR, instant updates on React/CSS changes)
#
# Usage: ./dev.sh

set -e

cleanup() {
  echo ""
  echo "shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "done."
}
trap cleanup EXIT

# Backend
echo "▶ starting backend (http://localhost:8000)..."
cd backend
uv sync --extra dev 2>/dev/null
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Frontend
echo "▶ starting frontend (http://localhost:3000)..."
cd frontend
npm install --silent 2>/dev/null
npx vite --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!
cd ..

echo ""
echo "═══════════════════════════════════════════"
echo "  company dev mode"
echo "  canvas:  http://localhost:3000"
echo "  api:     http://localhost:8000"
echo "  ctrl+c to stop"
echo "═══════════════════════════════════════════"
echo ""

wait
