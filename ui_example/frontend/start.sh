#!/bin/bash

# Startup script for IMDB 2.0 Movie Recommender

echo "======================================"
echo "IMDB 2.0 - Movie Recommender"
echo "======================================"
echo ""

# Create necessary directories
mkdir -p trailers thumbnails

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start backend in background
echo ""
echo "Starting backend server on port 5000..."
python backend_api.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "======================================"
echo "Application started successfully!"
echo "======================================"
echo "Backend API: http://localhost:5000"
echo "Frontend UI: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait
