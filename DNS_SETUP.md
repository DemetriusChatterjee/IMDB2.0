# DNS Configuration for coolmovievectors.com

## 🌐 DNS Records to Create

Once you have your Digital Ocean server IP, configure these DNS records with your domain registrar:

### Required DNS Records:
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

### Example (if your server IP is 1.2.3.4):
```
A    @               1.2.3.4     3600
A    www             1.2.3.4     3600
```

## 🕐 DNS Propagation

- **Propagation Time**: 15 minutes to 24 hours
- **Check Status**: Use tools like whatsmydns.net
- **Verify**: `nslookup coolmovievectors.com`

## ✅ Verification

Before running the deployment script, verify DNS is working:

```bash
# Should return your server IP
nslookup coolmovievectors.com
nslookup www.coolmovievectors.com

# Should show your server IP
dig +short coolmovievectors.com
dig +short www.coolmovievectors.com
```

## 🚀 After DNS is Ready

Run the deployment script which will:
1. ✅ Configure Nginx for your domain
2. ✅ Auto-install SSL certificate
3. ✅ Setup automatic certificate renewal
4. ✅ Configure security headers
5. ✅ Enable HTTPS redirect

Your site will be live at:
- **🔒 https://coolmovievectors.com**
- **🔒 https://www.coolmovievectors.com**

## 🔧 Common DNS Providers

### Namecheap
1. Go to Domain List → Manage
2. Advanced DNS → Add New Record
3. Add the A records above

### GoDaddy
1. Go to DNS Management
2. Add A records for @ and www

### Cloudflare
1. Go to DNS → Records
2. Add A records (set proxy to "DNS only" initially)

### Google Domains
1. Go to DNS → Custom records
2. Add A records for @ and www

---

**⚠️ Important**: Wait for full DNS propagation before running `./deploy.sh` or the SSL certificate creation will fail!