#!/bin/bash

echo "🔧 Fixing nginx configuration issues..."

# Remove the broken symbolic link
sudo rm -f /etc/nginx/sites-enabled/movie-recommender

# Create a corrected nginx configuration
sudo tee /etc/nginx/sites-available/movie-recommender > /dev/null <<'EOF'
server {
    listen 80;
    server_name coolmovievectors.com www.coolmovievectors.com;

    # Serve React build files
    location / {
        root /var/www/movie-recommender/dist;
        try_files $uri $uri/ /index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Proxy API requests to Flask backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers for API
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization' always;
    }

    # Handle static assets
    location /static/ {
        root /var/www/movie-recommender;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression (fixed syntax)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF

# Create the symbolic link
sudo ln -sf /etc/nginx/sites-available/movie-recommender /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid!"

    # Restart services
    echo "🔄 Restarting services..."
    sudo systemctl restart nginx
    sudo systemctl restart movie-recommender

    # Check service status
    echo "📊 Service status:"
    sudo systemctl is-active nginx && echo "✅ Nginx is running" || echo "❌ Nginx failed"
    sudo systemctl is-active movie-recommender && echo "✅ Flask app is running" || echo "❌ Flask app failed"

    echo ""
    echo "🌐 Testing site..."
    curl -I http://localhost 2>/dev/null | head -1

    echo ""
    echo "✅ Fix complete! Site should be accessible at:"
    echo "   http://138.68.231.163"
    echo "   http://coolmovievectors.com (if DNS is configured)"

else
    echo "❌ Nginx configuration test failed!"
    echo "Please check the configuration manually."
fi