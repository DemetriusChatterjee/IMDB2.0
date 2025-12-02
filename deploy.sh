#!/bin/bash

# Digital Ocean Deployment Script for coolmovievectors.com
echo "🚀 Setting up Movie Recommender on Digital Ocean..."
echo "📁 Project files should already be rsynced to this directory"
echo "💾 ChromaDB data will be preserved from your local Data/ folder"
echo ""

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.9+ and pip
sudo apt install -y python3 python3-pip python3-venv

# Install nginx for reverse proxy
sudo apt install -y nginx

# Create application directory and set permissions
sudo mkdir -p /var/www/movie-recommender
sudo chown -R $USER:$USER /var/www/movie-recommender

# Since you're rsyncing the entire project, copy everything to the web directory
echo "📦 Copying project files to /var/www/movie-recommender..."
cp -r ./* /var/www/movie-recommender/
cp -r ./.[^.]* /var/www/movie-recommender/ 2>/dev/null || true  # Copy hidden files

# Navigate to app directory
cd /var/www/movie-recommender

# Set proper permissions for the Data directory (ChromaDB needs write access)
sudo chown -R $USER:$USER ./Data/
chmod -R 755 ./Data/

echo "✅ ChromaDB data directory configured with proper permissions"

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install

# Build React app
npm run build

# Create systemd service for the Python backend
sudo tee /etc/systemd/system/movie-recommender.service > /dev/null <<EOF
[Unit]
Description=Movie Recommender Flask App
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/movie-recommender
Environment=PATH=/var/www/movie-recommender/venv/bin
ExecStart=/var/www/movie-recommender/venv/bin/python backend_api.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Configure nginx for coolmovievectors.com
sudo tee /etc/nginx/sites-available/movie-recommender > /dev/null <<EOF
server {
    listen 80;
    server_name coolmovievectors.com www.coolmovievectors.com;

    # Serve React build files
    location / {
        root /var/www/movie-recommender/dist;
        try_files \$uri \$uri/ /index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Proxy API requests to Flask backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

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

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
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

# Enable nginx site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/movie-recommender /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Start and enable services
sudo systemctl daemon-reload
sudo systemctl enable movie-recommender
sudo systemctl start movie-recommender
sudo systemctl enable nginx
sudo systemctl restart nginx

# Setup firewall
sudo ufw allow 22  # SSH
sudo ufw allow 80  # HTTP
sudo ufw allow 443 # HTTPS
sudo ufw --force enable

# Install and setup SSL with Let's Encrypt
echo "🔒 Setting up SSL certificate for coolmovievectors.com..."
sudo apt install -y certbot python3-certbot-nginx

# Wait for DNS propagation message
echo "⚠️  IMPORTANT: Make sure your domain coolmovievectors.com points to this server IP before continuing!"
echo "   DNS A Record: coolmovievectors.com -> $(curl -s http://checkip.amazonaws.com/)"
echo "   DNS A Record: www.coolmovievectors.com -> $(curl -s http://checkip.amazonaws.com/)"
echo ""
read -p "Press Enter once DNS is configured and propagated (may take up to 24 hours)..."

# Obtain SSL certificate
sudo certbot --nginx -d coolmovievectors.com -d www.coolmovievectors.com --non-interactive --agree-tos --email admin@coolmovievectors.com

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test auto-renewal
sudo certbot renew --dry-run

echo "✅ Deployment complete!"
echo "🌐 Your app is available at:"
echo "   🔓 http://coolmovievectors.com (redirects to HTTPS)"
echo "   🔒 https://coolmovievectors.com"
echo ""
echo "📊 Check service status:"
echo "  sudo systemctl status movie-recommender"
echo "  sudo systemctl status nginx"
echo ""
echo "📝 View logs:"
echo "  sudo journalctl -u movie-recommender -f"
echo "  sudo tail -f /var/log/nginx/access.log"