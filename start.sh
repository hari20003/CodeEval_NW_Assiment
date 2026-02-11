#!/usr/bin/env bash
set -e

echo "Starting PostgreSQL..."
service postgresql start

sudo -u postgres psql -c "ALTER USER postgres PASSWORD '2003';" || true

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='exam_portal'" | grep -q 1 || sudo -u postgres createdb exam_portal

echo "PostgreSQL ready. Starting FastAPI..."
cd /app/backend
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
