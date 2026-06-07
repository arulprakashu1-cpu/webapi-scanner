#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "=== Security Header Scanner ==="
echo "Starting backend (port 8001) and frontend (port 5174)..."

# Backend setup
if [ ! -d "$BACKEND_DIR/venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv "$BACKEND_DIR/venv"
fi

echo "Installing backend dependencies..."
"$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt" -q

# Frontend setup
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd "$FRONTEND_DIR" && npm install
fi

# Start backend
cd "$BACKEND_DIR"
"$BACKEND_DIR/venv/bin/uvicorn" src.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

# Start frontend
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== Services running ==="
echo "Backend API:  http://localhost:8001"
echo "Frontend:     http://localhost:5174"
echo "API Docs:     http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
