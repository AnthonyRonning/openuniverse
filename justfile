# OpenCCP Development Commands

# Default: show available commands
default:
    @just --list

# Initialize the database schema
db-init:
    just db-migrate

# Run all schema migrations (safe to run multiple times)
db-migrate:
    #!/usr/bin/env bash
    for f in backend/db/schema*.sql; do echo "Running $f"; psql -h localhost -p 5433 -U openccp_user openccp -f "$f"; done

# Reset database (drop and recreate all tables)
db-reset:
    psql -h localhost -p 5433 -U openccp_user openccp -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    just db-init

# Connect to the database
db:
    psql -h localhost -p 5433 -U openccp_user openccp

# Install backend dependencies
backend-install:
    cd backend && uv venv && VIRTUAL_ENV=.venv uv pip install -r requirements.txt

# Run backend server (from project root so imports work)
backend:
    backend/.venv/bin/uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000

# Install frontend dependencies
frontend-install:
    cd frontend && bun install

# Run frontend dev server
frontend:
    cd frontend && bun dev

# Install all dependencies
install: backend-install frontend-install

# Run everything (use with terminal multiplexer or run separately)
dev:
    @echo "Run 'just backend' and 'just frontend' in separate terminals"

# Scrape a Twitter account (requires backend running)
scrape username:
    curl -X POST http://localhost:8000/api/scrape \
      -H "Content-Type: application/json" \
      -d '{"username": "{{username}}", "include_tweets": true, "include_following": true, "include_followers": true}'

# Analyze all accounts for camp membership
analyze:
    curl -X POST http://localhost:8000/api/analyze -H "Content-Type: application/json" -d '{}'

# Check stats
stats:
    curl -s http://localhost:8000/api/stats | jq
