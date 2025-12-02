#!/usr/bin/env bash

# Exit on error
set -e

# Move to script directory so paths are stable
cd "$(dirname "$0")"

echo "Starting backend…"
# Optional: use venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi
python3 backend_api.py &
BACKEND_PID=$!

echo "Starting frontend…"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "--------------------------------"
echo "CineAI running:"
echo "  Backend:  http://localhost:5001"
echo "  Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."
echo "--------------------------------"
echo ""

# Trap Ctrl+C to stop both processes
trap "echo 'Stopping…'; kill $BACKEND_PID $FRONTEND_PID" INT

# Wait so frontend stays running
wait
