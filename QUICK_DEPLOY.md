# 🚀 Quick Deploy to coolmovievectors.com

## Super Fast 4-Step Setup

### 1. 📋 Setup DNS First
Point your domain registrar to your Digital Ocean server:
```
A Record: coolmovievectors.com → YOUR_SERVER_IP
A Record: www.coolmovievectors.com → YOUR_SERVER_IP
```

### 2. 📁 Upload Everything
```bash
# From your local machine
rsync -avz --progress ./IMDB2.0/ root@YOUR_SERVER_IP:/root/IMDB2.0/
```

### 3. 🔧 Deploy
```bash
# SSH to server
ssh root@YOUR_SERVER_IP

# Run deployment
cd /root/IMDB2.0
./deploy.sh
```

### 4. 🌐 Visit Your Site
**https://coolmovievectors.com** 🎬✨

---

## 💡 What Happens During Deploy:

✅ **Installs**: Node.js, Python, Nginx, SSL cert
✅ **Preserves**: Your entire ChromaDB database
✅ **Configures**: Domain, HTTPS, security headers
✅ **Automates**: SSL renewal, service management

## 🎯 Perfect for rsync because:

- **No file exclusions needed** - all data preserved
- **ChromaDB stays intact** - full vector database
- **ML models work** - no serverless limitations
- **Fast deploys** - just rsync + run script

**Total time**: ~10-15 minutes including SSL setup! 🚀