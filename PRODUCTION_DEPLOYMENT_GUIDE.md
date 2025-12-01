# 🚀 Production Deployment Guide - Sanctity Ferme Plant Tracker

This guide provides step-by-step instructions for deploying the Sanctity Ferme Plant Tracker application to production.

## 📋 Prerequisites

Before starting the deployment, ensure you have:

- [ ] AWS account with EC2 instance or similar cloud server
- [ ] MongoDB database (self-hosted or MongoDB Atlas)
- [ ] Google Cloud Storage bucket for image storage
- [ ] Sentry account for error tracking
- [ ] Domain name and SSL certificates
- [ ] Node.js 18+ installed on server
- [ ] PM2 process manager installed

## 🏗️ Infrastructure Setup

### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install additional tools
sudo apt install -y nginx certbot python3-certbot-nginx git
```

### 2. Database Setup

For self-hosted MongoDB:

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Google Cloud Storage Setup

1. Create a Google Cloud Project
2. Enable Cloud Storage API
3. Create a service account
4. Download the service account key JSON file
5. Create a storage bucket for plant images

## 🔧 Application Deployment

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-username/sanctity-ferme-plant-tracker.git
cd sanctity-ferme-plant-tracker

# Install dependencies
npm install
cd backend && npm install && cd ..
```

### 2. Environment Configuration

Create production environment files:

**Backend (.env):**
```bash
# Copy example file
cp backend/.env.production.example backend/.env

# Edit with your values
nano backend/.env
```

**Frontend (.env):**
```bash
# Copy example file
cp .env.production.example .env

# Edit with your values
nano .env
```

### 3. Build Application

```bash
# Build frontend
npm run build:production

# Run pre-deployment checks
chmod +x scripts/pre-deployment-check.sh
./scripts/pre-deployment-check.sh
```

### 4. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🌐 Nginx Configuration

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/sanctity-ferme
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend (React App)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /uploads {
        proxy_pass http://localhost:5001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5001;
        access_log off;
    }
}
```

### 2. Enable Site and Restart Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sanctity-ferme /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 3. SSL Certificate Setup

```bash
# Install SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring and Logging

### 1. PM2 Monitoring

```bash
# Monitor application
pm2 monit

# View logs
pm2 logs

# Check status
pm2 status
```

### 2. Log Management

```bash
# Log rotation setup
sudo nano /etc/logrotate.d/sanctity-ferme
```

```
/var/www/sanctity-ferme/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Health Monitoring

Set up monitoring for:
- Application health: `https://your-domain.com/health`
- Database connectivity
- Disk space
- Memory usage
- SSL certificate expiry

## 🔄 Deployment Updates

### 1. Update Process

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install
cd backend && npm install && cd ..

# Build frontend
npm run build:production

# Run tests
npm test
cd backend && npm test && cd ..

# Restart application
pm2 restart all
```

### 2. Rollback Process

```bash
# Rollback to previous version
git checkout previous-commit-hash

# Rebuild and restart
npm run build:production
pm2 restart all
```

## 🛠️ Troubleshooting

### Common Issues

**1. Application won't start**
```bash
# Check logs
pm2 logs

# Check environment variables
pm2 env 0

# Restart with fresh environment
pm2 restart all --update-env
```

**2. Database connection issues**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
cat backend/.env | grep MONGODB_URI
```

**3. Image upload issues**
```bash
# Check Google Cloud credentials
cat backend/.env | grep GOOGLE_CLOUD

# Verify bucket permissions
gsutil ls gs://your-bucket-name
```

**4. SSL certificate issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

### Performance Optimization

**1. Enable Gzip Compression**
- Already configured in the application

**2. Database Optimization**
- Add indexes for frequently queried fields
- Monitor slow queries

**3. CDN Setup**
- Configure CloudFlare or AWS CloudFront
- Cache static assets

## 📈 Scaling

### Horizontal Scaling

1. Set up load balancer (AWS ALB, Nginx, etc.)
2. Deploy multiple application instances
3. Use session storage (Redis) for shared sessions
4. Configure database clustering

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Implement caching (Redis)
4. Use database read replicas

## 🔐 Security Checklist

- [ ] SSL certificates installed and auto-renewing
- [ ] Firewall configured (only ports 80, 443, 22)
- [ ] Database secured with authentication
- [ ] Environment variables properly set
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured

## 📞 Support

For deployment issues:

1. Check application logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system resources: `htop`, `df -h`
4. Verify environment configuration
5. Test database connectivity

## 🎉 Post-Deployment

After successful deployment:

1. Test all application features
2. Verify image uploads work
3. Check error tracking in Sentry
4. Monitor application performance
5. Set up automated backups
6. Configure monitoring alerts

---

**Remember**: Always test deployments in a staging environment first!






