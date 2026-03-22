# Company — single container, multiple entrypoints
#
# Everything lives in one image. Run with different commands:
#   docker run company                    # all services (default)
#   docker run company backend            # backend only
#   docker run company frontend-dev       # frontend dev server
#   docker run company openclaw           # openclaw gateway

# --- Stage 1: Build frontend ---
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Final image ---
FROM python:3.12-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl nodejs npm supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Backend
COPY backend/pyproject.toml backend/uv.lock ./backend/
RUN cd backend && uv sync --extra dev
COPY backend/ ./backend/

# Frontend dist (served by backend in production)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Frontend source (for dev mode)
COPY frontend/ ./frontend-src/

# Project files
COPY plan.md project.yaml ./

# Supervisor config — runs all services
COPY supervisord.conf /etc/supervisor/conf.d/company.conf

EXPOSE 8000

# Entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["all"]
