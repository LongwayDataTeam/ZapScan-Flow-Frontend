# Vercel Deployment Guide - ZapScan Frontend

## Overview
This guide covers deploying the ZapScan Frontend to Vercel with all production optimizations.

## Prerequisites
- Vercel account (free tier available)
- Git repository with your code
- Backend API URL ready

## Quick Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Production ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub/GitLab/Bitbucket account
   - Click "New Project"
   - Import your repository

3. **Configure Project Settings**
   - **Framework Preset**: Create React App
   - **Root Directory**: `ZapScan-Flow-Frontend` (if in subdirectory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm ci`

4. **Set Environment Variables**
   In the Vercel dashboard, go to Settings → Environment Variables:
   ```
   REACT_APP_API_URL=https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app
   REACT_APP_ENVIRONMENT=production
   REACT_APP_DEBUG=false
   REACT_APP_ENABLE_LOGGING=false
   REACT_APP_ENABLE_ANALYTICS=true
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd ZapScan-Flow-Frontend
   vercel
   ```

4. **Follow the prompts**
   - Link to existing project or create new
   - Set environment variables when prompted
   - Deploy to production

## Environment Variables

### Required Variables
Set these in Vercel dashboard (Settings → Environment Variables):

```bash
REACT_APP_API_URL=https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
```

### Optional Variables
```bash
REACT_APP_ENABLE_LOGGING=false
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_NAME=ZapScan Flow
REACT_APP_VERSION=1.0.0
```

## Vercel Configuration

The `vercel.json` file includes:
- **Build Configuration**: Optimized for React apps
- **Routing**: SPA routing with fallback to index.html
- **Security Headers**: CSP, XSS protection, etc.
- **Caching**: Static assets cached for 1 year
- **Performance**: Gzip compression, CDN distribution

## Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to Vercel dashboard → Settings → Domains
   - Add your domain (e.g., `app.zapscan.com`)

2. **Configure DNS**
   - Add CNAME record pointing to Vercel
   - Or use Vercel's nameservers

3. **SSL Certificate**
   - Vercel automatically provides SSL certificates
   - Force HTTPS in vercel.json

## Performance Optimizations

### Automatic Optimizations
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Gzip compression
- ✅ Static asset caching
- ✅ Edge functions support
- ✅ Automatic scaling

### Build Optimizations
- ✅ Source maps disabled
- ✅ Tree shaking enabled
- ✅ Code splitting
- ✅ Minification

## Monitoring & Analytics

### Vercel Analytics
1. Enable in project settings
2. View performance metrics
3. Monitor Core Web Vitals

### Error Tracking
Consider integrating:
- Sentry for error tracking
- Google Analytics for user behavior

## Deployment Workflow

### Development
```bash
# Local development
npm start

# Test build
npm run build
```

### Staging
```bash
# Deploy to preview
vercel --target preview
```

### Production
```bash
# Deploy to production
vercel --prod
```

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check build logs in Vercel dashboard
   # Verify environment variables
   # Test locally: npm run build
   ```

2. **Environment Variables Not Working**
   - Check variable names (must start with `REACT_APP_`)
   - Redeploy after adding variables
   - Verify in browser console

3. **API Connection Issues**
   - Check CORS settings on backend
   - Verify API URL is correct
   - Test API endpoint directly

4. **Routing Issues**
   - Verify vercel.json routes
   - Check for 404 errors
   - Ensure SPA routing is configured

### Debug Commands
```bash
# Test build locally
npm run build

# Check bundle size
npm run build && du -sh build/static/js/*

# Lint code
npm run lint

# Type check
npm run type-check
```

## Post-Deployment Checklist

- [ ] App loads without errors
- [ ] API calls work correctly
- [ ] All routes function properly
- [ ] Service worker registers
- [ ] Security headers are present
- [ ] Performance is acceptable
- [ ] Mobile responsiveness works
- [ ] Error boundaries catch errors

## Maintenance

### Regular Tasks
- Monitor Vercel analytics
- Update dependencies monthly
- Check for security vulnerabilities
- Review performance metrics

### Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit

# Redeploy
vercel --prod
```

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: Available in dashboard
- **Community**: Vercel Discord/Forums

## Cost Optimization

### Free Tier Limits
- 100GB bandwidth/month
- 100GB storage
- 100GB function execution time
- Unlimited deployments

### Pro Tier ($20/month)
- 1TB bandwidth
- 1TB storage
- Team collaboration
- Custom domains
- Priority support

## Security Best Practices

- ✅ Environment variables secured
- ✅ HTTPS enforced
- ✅ Security headers configured
- ✅ CSP headers set
- ✅ Input validation implemented
- ✅ Error boundaries in place

Your ZapScan Frontend is now production-ready on Vercel! 🚀 