# ============================================================
# GeoIntel Core — Root Production Dockerfile
# Team Data Miners | Smart India Hackathon 2026 | PS SIH26023
# Multi-stage build: React 18 + Vite frontend -> FastAPI Python 3.11 backend
# ============================================================

# --- Stage 1: Build React Frontend ---
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY cmpdi-ai-reporting/frontend/package.json cmpdi-ai-reporting/frontend/package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install
COPY cmpdi-ai-reporting/frontend/ ./
RUN npm run build

# --- Stage 2: Python Backend with OCR & PDF Engine ---
FROM python:3.11-slim AS runtime

# Install system dependencies for Tesseract OCR and PDF processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python backend requirements
COPY cmpdi-ai-reporting/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY cmpdi-ai-reporting/backend/ ./backend/

# Copy built frontend static files from Stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create persistent storage directories
RUN mkdir -p /app/backend/storage/pdfs \
             /app/backend/storage/chroma \
             /app/backend/storage/reports

# Set environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

EXPOSE 8000

# Health check respecting dynamic cloud PORT
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import os, urllib.request; p = os.environ.get('PORT', '8000'); urllib.request.urlopen(f'http://localhost:{p}/api/health')" || exit 1

# Launch uvicorn serving FastAPI + mounted React frontend
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]

