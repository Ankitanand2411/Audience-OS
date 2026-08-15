#!/usr/bin/env bash

echo "=========================================="
echo " Starting AudienceOS Full-Stack Application"
echo "=========================================="

# Kill any existing processes on ports 8000 & 5173
echo "Cleaning ports 8000 and 5173..."
fuser -k 8000/tcp 5173/tcp 2>/dev/null || true
pkill -f uvicorn 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Activate virtual environment
source .venv/bin/activate

# Start FastAPI Backend in background
echo "Starting FastAPI Backend Server on http://localhost:8000..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start Vite Frontend
echo "Starting Vite Frontend App on http://localhost:5173..."
cd frontend
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT
