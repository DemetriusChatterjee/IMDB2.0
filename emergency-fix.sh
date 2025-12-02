#!/bin/bash

echo "🚨 Emergency fix for 504 timeout..."

# Stop the broken service
sudo systemctl stop movie-recommender

# Add emergency swap
sudo swapoff -a
sudo fallocate -l 1G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

echo "💾 Memory after adding swap:"
free -h

# Test if Flask can start manually
echo "🧪 Testing Flask manually..."
cd /var/www/movie-recommender
source venv/bin/activate

# Kill any hanging python processes
sudo pkill -f backend_api.py

# Try to start Flask with timeout
timeout 30 python backend_api.py &
FLASK_PID=$!
sleep 10

# Check if Flask is responding
if curl -m 5 http://localhost:5000/api/movies 2>/dev/null | grep -q movies; then
    echo "✅ Flask is working!"
    kill $FLASK_PID

    # Start the service
    sudo systemctl start movie-recommender
    echo "✅ Service started"
else
    echo "❌ Flask still hanging. Let's check what's wrong..."
    kill $FLASK_PID 2>/dev/null

    # Check if it's a ChromaDB loading issue
    echo "🔍 Checking if ChromaDB data is causing issues..."
    ls -la Data/trailer_db/

    echo ""
    echo "🔧 Try running Flask manually to see the error:"
    echo "cd /var/www/movie-recommender"
    echo "source venv/bin/activate"
    echo "python backend_api.py"
fi