# Company — single container: OpenClaw + FastAPI + React frontend
# For now this builds the backend + frontend. OpenClaw integration TBD.

FROM python:3.12-slim AS backend

WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./backend/
RUN pip install uv && cd backend && uv sync --extra dev

COPY backend/ ./backend/
COPY plan.md ./plan.md
COPY project.yaml ./project.yaml

# Frontend build
FROM node:20-slim AS frontend

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Final image
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Backend
COPY --from=backend /app/backend ./backend
COPY plan.md ./plan.md
COPY project.yaml ./project.yaml
RUN cd backend && uv sync

# Frontend static files (served by FastAPI)
COPY --from=frontend /app/frontend/dist ./frontend/dist

EXPOSE 8000

CMD ["sh", "-c", "cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
