#!/bin/bash

echo "🔍 Debugging API issues..."

echo "1. Checking if Flask is running on port 5000:"
sudo netstat -tlnp | grep :5000

echo ""
echo "2. Testing Flask API directly:"
curl -s http://localhost:5000/api/movies | head -c 200
echo ""

echo ""
echo "3. Testing through nginx:"
curl -s http://localhost/api/movies | head -c 200
echo ""

echo ""
echo "4. Flask service status:"
sudo systemctl status movie-recommender --no-pager

echo ""
echo "5. Recent Flask logs:"
sudo journalctl -u movie-recommender --no-pager --lines=10

echo ""
echo "6. Checking Flask process:"
ps aux | grep backend_api.py

echo ""
echo "7. Testing if backend_api.py can run manually:"
cd /var/www/movie-recommender
if [ -f "backend_api.py" ]; then
    echo "✅ backend_api.py exists"
    python3 -c "import backend_api; print('✅ Python imports work')" 2>&1
else
    echo "❌ backend_api.py not found!"
    ls -la
fi

echo ""
echo "8. Checking Data directory:"
if [ -d "/var/www/movie-recommender/Data" ]; then
    echo "✅ Data directory exists"
    ls -la /var/www/movie-recommender/Data/
else
    echo "❌ Data directory missing!"
fi