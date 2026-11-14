#!/usr/bin/env bash
set -e

echo "=========================================="
echo "    STARTING PAYTM SAATHI MVP"
echo "=========================================="

# 1. Start Backend on port 8000
echo "[1/3] Starting FastAPI backend on http://localhost:8000 ..."
python3 -m uvicorn server:app --app-dir backend --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 2. Start Web Dashboard on port 5173
echo "[2/3] Starting Web Dashboard on http://localhost:5173 ..."
(cd frontend && npm run dev -- --host 0.0.0.0 --port 5173) &
DASHBOARD_PID=$!

# 3. Start Dedicated Mobile Simulator on port 5174
echo "[3/3] Starting Paytm for Business Mobile Simulator on http://localhost:5174 ..."
(cd frontend && npx vite --config vite.mobile.config.js --host 0.0.0.0 --port 5174) &
MOBILE_PID=$!

echo ""
echo "Paytm Saathi is running!"
echo "📱 Mobile App Simulator (Light Theme): http://localhost:5174"
echo "💻 Web Analytics Dashboard:             http://localhost:5173"
echo "⚙️ Backend API & Swagger:                http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers."

trap "kill $BACKEND_PID $DASHBOARD_PID $MOBILE_PID 2>/dev/null" EXIT
wait
