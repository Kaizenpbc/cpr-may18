# Deployment Guide

## Production Deployment

This guide covers deploying the CPR Training Management System to production environments.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Node.js**: 18.x or higher
- **PostgreSQL**: 12.x or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB available space
- **Network**: HTTPS-capable domain with SSL certificate

### Required Software
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx certbot

# CentOS/RHEL
sudo yum install -y nodejs npm postgresql postgresql-server nginx certbot
```

## Environment Setup

### 1. Database Configuration

#### PostgreSQL Setup
```bash
# Initialize PostgreSQL (CentOS only)
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE cpr_production;
CREATE USER cpr_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE cpr_production TO cpr_user;
\q
```

#### Database Security
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/12/main/postgresql.conf

# Update these settings:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
```

```bash
# Edit access control
sudo nano /etc/postgresql/12/main/pg_hba.conf

# Add/modify:
local   cpr_production  cpr_user                md5
host    cpr_production  cpr_user    127.0.0.1/32   md5
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 2. Application Deployment

#### Clone and Setup
```bash
# Create application directory
sudo mkdir -p /opt/cpr-training
sudo chown $USER:$USER /opt/cpr-training
cd /opt/cpr-training

# Clone repository
git clone <repository-url> .

# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

#### Environment Configuration
```bash
# Create production environment file
cp backend/.env.example backend/.env.production
```

Edit `backend/.env.production`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=cpr_user
DB_PASSWORD=secure_password_here
DB_NAME=cpr_production

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_here_min_32_chars

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=https://yourdomain.com

# Security
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/cpr-training/app.log
```

#### Build Application
```bash
# Build frontend
cd frontend
npm run build
cd ..

# Build backend
cd backend
npm run build
cd ..
```

### 3. Process Management with PM2

#### Install PM2
```bash
sudo npm install -g pm2
```

#### Create PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'cpr-backend',
      script: './backend/dist/index.js',
      cwd: '/opt/cpr-training',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: './backend/.env.production',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/cpr-training/backend-error.log',
      out_file: '/var/log/cpr-training/backend-out.log',
      log_file: '/var/log/cpr-training/backend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

#### Start Application
```bash
# Create log directory
sudo mkdir -p /var/log/cpr-training
sudo chown $USER:$USER /var/log/cpr-training

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the instructions provided by the command
```

### 4. Nginx Configuration

#### Install and Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cpr-training
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Frontend (React App)
    location / {
        root /opt/cpr-training/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Gzip Compression
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
```

#### Enable Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/cpr-training /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. SSL Certificate Setup

#### Using Let's Encrypt
```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 6. Firewall Configuration

#### UFW (Ubuntu)
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### Firewalld (CentOS)
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Monitoring and Logging

### 1. Application Monitoring

#### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart all

# Reload application (zero downtime)
pm2 reload all
```

#### Health Check Endpoint
The application includes a health check endpoint at `/health`:
```bash
curl https://yourdomain.com/api/health
```

### 2. Log Management

#### Log Rotation
Create `/etc/logrotate.d/cpr-training`:
```
/var/log/cpr-training/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop
iotop
nethogs
```

### 3. Database Monitoring

#### PostgreSQL Monitoring
```bash
# Monitor active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('cpr_production'));"

# Monitor slow queries
sudo -u postgres psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

## Backup and Recovery

### 1. Database Backup

#### Automated Backup Script
Create `/opt/cpr-training/scripts/backup.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/cpr-training"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cpr_production"
DB_USER="cpr_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
PGPASSWORD="secure_password_here" pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

#### Schedule Backups
```bash
# Make script executable
chmod +x /opt/cpr-training/scripts/backup.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/cpr-training/scripts/backup.sh" | crontab -
```

### 2. Application Backup

#### File System Backup
```bash
# Create application backup
tar -czf /opt/backups/cpr-training/app_backup_$(date +%Y%m%d).tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    /opt/cpr-training/
```

### 3. Recovery Procedures

#### Database Recovery
```bash
# Stop application
pm2 stop all

# Restore database
PGPASSWORD="secure_password_here" psql -h localhost -U cpr_user cpr_production < backup_file.sql

# Start application
pm2 start all
```

## Security Hardening

### 1. System Security

#### Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### Disable Root Login
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Set these values:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 2. Application Security

#### Environment Variables
- Use strong, unique passwords
- Generate secure JWT secrets (minimum 32 characters)
- Regularly rotate secrets
- Use environment-specific configurations

#### Rate Limiting
The application includes built-in rate limiting. Configure in production:
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # per window
```

### 3. Database Security

#### PostgreSQL Hardening
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/12/main/postgresql.conf

# Security settings:
ssl = on
log_connections = on
log_disconnections = on
log_statement = 'all'
```

## Performance Optimization

### 1. Application Performance

#### Node.js Optimization
```javascript
// In ecosystem.config.js
{
  instances: 'max',  // Use all CPU cores
  exec_mode: 'cluster',
  max_memory_restart: '1G',
  node_args: '--max-old-space-size=1024'
}
```

#### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_courses_organization_id ON courses(organization_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_date_requested ON courses(date_requested);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_instructor_availability_date ON instructor_availability(date);
```

### 2. Caching Strategy

#### Nginx Caching
```nginx
# Add to server block
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API caching for static data
location /api/course-types {
    proxy_pass http://localhost:3001/course-types;
    proxy_cache_valid 200 1h;
}
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Check database connection
sudo -u postgres psql -c "\l"
```

#### High Memory Usage
```bash
# Monitor memory
free -h
pm2 monit

# Restart application
pm2 restart all
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Performance Issues

#### Slow Database Queries
```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### High CPU Usage
```bash
# Check processes
top
htop

# Check PM2 processes
pm2 monit

# Scale down if needed
pm2 scale cpr-backend 1
```

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- Review application logs
- Check disk space usage
- Monitor database performance
- Review security logs

#### Monthly
- Update system packages
- Review and rotate logs
- Check backup integrity
- Performance optimization review

#### Quarterly
- Security audit
- Dependency updates
- Capacity planning review
- Disaster recovery testing

### Update Procedures

#### Application Updates
```bash
# Backup current version
cp -r /opt/cpr-training /opt/cpr-training-backup-$(date +%Y%m%d)

# Pull updates
cd /opt/cpr-training
git pull origin main

# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Build application
cd frontend && npm run build && cd ..
cd backend && npm run build && cd ..

# Restart application
pm2 reload all
```

#### Database Migrations
```bash
# Run migrations (if available)
cd backend
npm run migrate

# Or manually apply schema changes
sudo -u postgres psql cpr_production < migration.sql
```

## Support and Monitoring

### Health Checks
- Application: `https://yourdomain.com/api/health`
- Database: Monitor connection count and query performance
- System: Monitor CPU, memory, and disk usage

### Alerting
Set up monitoring alerts for:
- Application downtime
- High error rates
- Database connection issues
- High resource usage
- SSL certificate expiration

### Contact Information
- System Administrator: [contact info]
- Database Administrator: [contact info]
- Application Support: [contact info]

---

This deployment guide provides a comprehensive setup for production environments. Adjust configurations based on your specific requirements and infrastructure. 