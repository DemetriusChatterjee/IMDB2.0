#!/bin/bash

echo "🚀 Fast-start deployment for Cool Movie Vectors"
echo "Assumes project is already built locally and rsynced to current directory"

# Exit on any error
set -e

# Get current directory as project directory
PROJECT_DIR=$(pwd)

echo "📂 Working in: $PROJECT_DIR"

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
apt install -y python3 python3-venv python3-pip nginx certbot python3-certbot-nginx ufw

# Verify project files exist
echo "🔍 Verifying project files..."
if [ ! -f "$PROJECT_DIR/backend_api.py" ] || [ ! -f "$PROJECT_DIR/fast-start.sh" ]; then
    echo "❌ Error: Required files not found in $PROJECT_DIR"
    echo "Make sure you rsynced the project and are running from the project directory"
    exit 1
fi

# Set correct permissions
echo "🔧 Setting permissions..."
chown -R www-data:www-data $PROJECT_DIR

# Set up Python virtual environment
echo "🐍 Setting up Python environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies with CPU-only PyTorch
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip

# Install regular packages first
echo "📦 Installing core packages..."
pip install --no-cache-dir flask flask-cors chromadb sentence-transformers scikit-learn pandas

# Install PyTorch CPU-only version separately
echo "🧠 Installing PyTorch (CPU-only version)..."
pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install any remaining requirements
if [ -f "requirements.txt" ]; then
    echo "📋 Installing remaining requirements..."
    pip install --no-cache-dir -r requirements.txt || echo "⚠️ Some requirements may have failed, continuing..."
fi

# Configure firewall
echo "🔒 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Create nginx configuration
echo "⚙️ Setting up Nginx configuration..."
cat > /etc/nginx/sites-available/movie-recommender << EOF
server {
    listen 80;
    server_name coolmovievectors.com www.coolmovievectors.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Serve static files
    location / {
        root $PROJECT_DIR/dist;
        try_files \$uri \$uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/movie-recommender /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Start and enable nginx
echo "🌐 Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Create systemd service for Flask backend
echo "⚡ Setting up Flask service..."
cat > /etc/systemd/system/movie-recommender.service << EOF
[Unit]
Description=Cool Movie Vectors Flask Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$PROJECT_DIR
Environment=PATH=$PROJECT_DIR/venv/bin
Environment=FLASK_APP=backend_api.py
Environment=FLASK_ENV=production
ExecStart=$PROJECT_DIR/venv/bin/python backend_api.py
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=movie-recommender

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start the service
echo "🔄 Starting Flask service..."
systemctl daemon-reload
systemctl start movie-recommender
systemctl enable movie-recommender

# Check if service is running
echo "🔍 Checking service status..."
if systemctl is-active --quiet movie-recommender; then
    echo "✅ Flask service is running"
else
    echo "❌ Flask service failed to start. Checking logs:"
    journalctl -u movie-recommender --no-pager -n 20
fi

# Set up SSL certificate
echo "🔐 Setting up SSL certificate..."
certbot --nginx -d coolmovievectors.com -d www.coolmovievectors.com --non-interactive --agree-tos --email noreply@coolmovievectors.com --redirect

# Final status check
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🔗 Your site should be available at:"
echo "   https://coolmovievectors.com"
echo ""
echo "📊 Service status:"
systemctl status movie-recommender --no-pager -l
echo ""
echo "🌐 Nginx status:"
systemctl status nginx --no-pager -l
echo ""
echo "📋 To check logs:"
echo "   Flask: journalctl -u movie-recommender -f"
echo "   Nginx: tail -f /var/log/nginx/error.log"
echo ""
echo "🔧 To restart services:"
echo "   systemctl restart movie-recommender"
echo "   systemctl restart nginx"