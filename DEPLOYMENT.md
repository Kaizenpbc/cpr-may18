# Deployment Guide

This guide provides instructions for deploying the CPR application in different environments.

## Prerequisites

- Node.js 18.x or later
- PostgreSQL 14.x or later
- npm 9.x or later
- Git

## Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd cpr-may18
```

2. Install dependencies:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. Create environment files:

Backend (.env):
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=cpr_db

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret
REFRESH_TOKEN_SECRET=your-secure-refresh-token-secret

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

Frontend (.env):
```env
REACT_APP_API_URL=https://your-backend-domain.com/api/v1
```

## Database Setup

1. Create the database:
```sql
CREATE DATABASE cpr_db;
```

2. Run migrations:
```bash
npm run migrate
```

3. Seed initial data (if needed):
```bash
npm run seed
```

## Building the Application

1. Build the frontend:
```bash
cd frontend
npm run build
cd ..
```

2. Build the backend:
```bash
npm run build
```

## Deployment Options

### Option 1: Docker Deployment

1. Build Docker images:
```bash
# Build backend image
docker build -t cpr-backend .

# Build frontend image
cd frontend
docker build -t cpr-frontend .
cd ..
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### Option 2: Traditional Deployment

1. Start the backend server:
```bash
npm run start
```

2. Serve the frontend:
```bash
# Using nginx
sudo cp frontend/build/* /var/www/html/
```

## Production Considerations

### Security
- Use strong, unique secrets for JWT tokens
- Enable HTTPS
- Configure CORS properly
- Set up rate limiting
- Use secure cookie settings

### Performance
- Enable compression
- Configure caching
- Use a CDN for static assets
- Set up proper logging

### Monitoring
- Set up error tracking (e.g., Sentry)
- Configure health checks
- Monitor server resources
- Set up alerts

## Troubleshooting

### Common Issues

1. Database Connection Issues
- Verify database credentials
- Check if PostgreSQL is running
- Ensure database exists

2. JWT Authentication Issues
- Verify JWT secrets are set
- Check token expiration
- Ensure proper CORS configuration

3. Frontend API Connection Issues
- Verify API URL configuration
- Check CORS settings
- Ensure proper credentials handling

### Logs

- Backend logs: `logs/backend.log`
- Frontend logs: Browser console
- Database logs: PostgreSQL logs

## Maintenance

### Regular Tasks
- Monitor error logs
- Check database performance
- Update dependencies
- Backup database

### Backup Strategy
1. Database backups:
```bash
pg_dump cpr_db > backup.sql
```

2. Configuration backups:
```bash
cp .env .env.backup
```

## Support

For issues and support:
1. Check the troubleshooting guide
2. Review the documentation
3. Contact the development team 