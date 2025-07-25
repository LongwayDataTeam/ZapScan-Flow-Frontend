# Production Deployment Guide - ZapScan Frontend

## Overview
This guide covers deploying the ZapScan Frontend to production with all optimizations and security measures in place.

## Prerequisites
- Node.js 18+ installed
- Docker (optional, for containerized deployment)
- Access to production environment variables

## Quick Start

### 1. Environment Setup
```bash
# Copy production environment file
cp env.production .env.production

# Verify environment variables
cat .env.production
```

### 2. Install Dependencies
```bash
npm ci --only=production
```

### 3. Build for Production
```bash
# Build with optimizations
npm run build:prod

# Or use the deployment script
chmod +x deploy-production.sh
./deploy-production.sh
```

## Production Optimizations

### Build Optimizations
- Source maps disabled for smaller bundle size
- Tree shaking enabled
- Code splitting for better caching
- Minification and compression

### Security Features
- Content Security Policy (CSP) headers
- XSS protection
- Frame options
- HTTPS enforcement
- Non-root Docker user

### Performance Features
- Service Worker for caching
- Gzip compression
- Static asset caching
- Lazy loading support

## Deployment Options

### Option 1: Static File Server
```bash
# Build the application
npm run build:prod

# Serve with any static server
npx serve -s build -l 3000
```

### Option 2: Docker Deployment
```bash
# Build Docker image
docker build -t zapscan-frontend:latest .

# Run container
docker run -p 80:80 zapscan-frontend:latest
```

### Option 3: Nginx Deployment
```bash
# Build application
npm run build:prod

# Copy to nginx directory
sudo cp -r build/* /var/www/html/

# Configure nginx (see nginx.conf)
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo systemctl restart nginx
```

## Environment Variables

### Required Variables
```bash
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
```

### Optional Variables
```bash
REACT_APP_ENABLE_LOGGING=false
REACT_APP_ENABLE_ANALYTICS=true
GENERATE_SOURCEMAP=false
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CSP headers set
- [ ] Non-root user in Docker
- [ ] Environment variables secured
- [ ] Error boundaries implemented
- [ ] Input validation in place

## Performance Checklist

- [ ] Bundle size optimized
- [ ] Code splitting implemented
- [ ] Service worker registered
- [ ] Static assets cached
- [ ] Gzip compression enabled
- [ ] CDN configured (if applicable)

## Monitoring and Logging

### Error Tracking
The application includes error boundaries that catch React errors and display user-friendly messages.

### Performance Monitoring
Consider integrating with:
- Google Analytics
- Sentry for error tracking
- New Relic for performance monitoring

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules build
   npm ci
   npm run build:prod
   ```

2. **Docker Build Fails**
   ```bash
   # Check Dockerfile syntax
   docker build --no-cache -t zapscan-frontend .
   ```

3. **Nginx Issues**
   ```bash
   # Check nginx configuration
   nginx -t
   # Restart nginx
   sudo systemctl restart nginx
   ```

### Health Checks
```bash
# Check if application is running
curl -f http://localhost/health

# Check Docker container
docker ps
docker logs <container-id>
```

## Rollback Strategy

1. **Keep previous versions**
   ```bash
   # Tag Docker images
   docker tag zapscan-frontend:latest zapscan-frontend:v1.0.0
   ```

2. **Database backups** (if applicable)
3. **Environment variable backups**

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor bundle size
- Review security headers
- Check error logs
- Update SSL certificates

### Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit

# Rebuild and redeploy
npm run build:prod
```

## Support

For issues or questions:
1. Check the logs
2. Review error boundaries
3. Verify environment variables
4. Test in staging environment first

## License
This deployment guide is part of the ZapScan Flow project. 