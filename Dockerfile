# Company — single container, multiple entrypoints
#
#   docker build -t company .
#   docker run -p 8000:8000 company              # all services (default)
#   docker run -p 8000:8000 company backend      # backend only
#   docker run -p 3000:3000 company frontend-dev # vite dev server

# --- Stage 1: Build frontend ---
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Final image ---
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Backend dependencies (install first for layer caching)
COPY backend/pyproject.toml ./backend/
RUN cd backend && uv sync

# Backend source
COPY backend/ ./backend/

# Frontend dist (served by FastAPI)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Project files
COPY plan.md ./
COPY project.yaml ./

# Entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["all"]
