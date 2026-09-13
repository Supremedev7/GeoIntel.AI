# ============================================================
# GeoIntel Core — Production Dockerfile
# Team Data Miners | SIH 2026 | PS SIH26023
# Multi-stage build: React frontend + FastAPI backend
# ============================================================

# --- Stage 1: Build React Frontend ---
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Python Backend ---
FROM python:3.11-slim AS runtime

# System dependencies for OCR (tesseract) and PDF processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend static files
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create storage directories
RUN mkdir -p /app/backend/storage/pdfs \
             /app/backend/storage/chroma \
             /app/backend/storage/reports

# Environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

# Health check respecting dynamic cloud PORT
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import os, urllib.request; p = os.environ.get('PORT', '8000'); urllib.request.urlopen(f'http://localhost:{p}/api/health')" || exit 1

# Run the application
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
