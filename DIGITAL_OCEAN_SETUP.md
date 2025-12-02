# Digital Ocean Deployment Guide

## Quick Deployment Steps

### 1. Create Digital Ocean Droplet
- **Recommended**: Ubuntu 22.04 LTS
- **Size**: 2GB RAM minimum (4GB+ recommended for ML models)
- **Storage**: 25GB+ SSD
- Add your SSH key

### 2. Upload Your Code (Including ChromaDB Data!)
```bash
# From your local machine - rsync the entire project
rsync -avz --progress /path/to/IMDB2.0/ root@your-server-ip:/root/IMDB2.0/

# Alternative: rsync with exclude for faster uploads (if needed)
rsync -avz --progress --exclude 'node_modules' --exclude '.git' /path/to/IMDB2.0/ root@your-server-ip:/root/IMDB2.0/
```

**💾 Advantage**: Your entire ChromaDB database in `Data/` folder transfers perfectly!

### 3. Run Deployment Script
```bash
# SSH into your server
ssh root@your-server-ip

# Navigate to uploaded directory
cd /root/IMDB2.0

# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

### 4. Configure DNS (BEFORE running deploy script!)
Point your domain to the server:
- **A Record**: `coolmovievectors.com` → `your-server-ip`
- **A Record**: `www.coolmovievectors.com` → `your-server-ip`

### 5. Access Your App
- **🔒 HTTPS**: `https://coolmovievectors.com`
- **🔓 HTTP**: `http://coolmovievectors.com` (redirects to HTTPS)
- **⚙️ API**: `https://coolmovievectors.com/api/movies`

---

## Manual Setup (Alternative)

If you prefer manual setup:

### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and dependencies
sudo apt install -y python3 python3-pip python3-venv nginx
```

### Setup Application
```bash
# Create app directory
sudo mkdir -p /var/www/movie-recommender
sudo chown $USER:$USER /var/www/movie-recommender

# Copy your files
cp -r * /var/www/movie-recommender/
cd /var/www/movie-recommender

# Python setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Node.js setup
npm install
npm run build
```

### Configure Services
The deploy.sh script will:
- Create systemd service for Flask backend
- Configure nginx reverse proxy
- Setup firewall rules
- Start all services

---

## Advantages Over Vercel

✅ **Persistent Data**: ChromaDB files stay intact
✅ **Full ML Support**: No memory/timeout limits
✅ **Custom Configuration**: Full server control
✅ **Better Performance**: Dedicated resources
✅ **Cost Effective**: ~$12-24/month for good specs

## Monitoring & Maintenance

### Check Service Status
```bash
sudo systemctl status movie-recommender
sudo systemctl status nginx
```

### View Logs
```bash
# Backend logs
sudo journalctl -u movie-recommender -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart movie-recommender
sudo systemctl restart nginx
```

## Security Recommendations

1. **Setup SSL** with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

2. **Configure Firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   ```

3. **Regular Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Backup ChromaDB Data

Since your ChromaDB data is included, set up automatic backups:

```bash
# Create backup script
cat > /home/$USER/backup-movie-data.sh << 'EOF'
#!/bin/bash
cd /var/www/movie-recommender
tar -czf "/home/$USER/movie-data-backup-$(date +%Y%m%d_%H%M%S).tar.gz" Data/
# Keep only last 7 backups
find /home/$USER -name "movie-data-backup-*.tar.gz" -type f -mtime +7 -delete
EOF

chmod +x /home/$USER/backup-movie-data.sh

# Setup daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/backup-movie-data.sh") | crontab -
```

**Restore backup if needed:**
```bash
cd /var/www/movie-recommender
tar -xzf /home/$USER/movie-data-backup-YYYYMMDD_HHMMSS.tar.gz
sudo systemctl restart movie-recommender
```

Your Digital Ocean setup will be much more robust than Vercel for this ML-heavy application! 🚀