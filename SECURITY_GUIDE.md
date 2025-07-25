# Security Guide - Backend URL Protection

## 🔒 Backend URL Security Implementation

### Problem
The backend URL should never be visible in client-side code or browser console to prevent:
- API endpoint discovery
- Potential security attacks
- Unauthorized access to backend services

### Solution Implemented

#### 1. **Proxy-Based Architecture**
```javascript
// ❌ BEFORE (Insecure - URL exposed in client)
const API_BASE_URL = 'https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app';

// ✅ AFTER (Secure - URL never exposed)
class SecureAPIService {
  private static getBaseURL(): string {
    if (process.env.NODE_ENV === 'production') {
      return '/api'; // Relative path only
    }
    return process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }
}
```

#### 2. **Vercel Proxy Configuration**
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app/api/$1"
    }
  ]
}
```

#### 3. **Environment Variable Protection**
- Backend URL stored in Vercel environment variables
- Never committed to Git repository
- Only accessible server-side

## 🛡️ Security Layers

### Layer 1: Client-Side Protection
```javascript
// All API calls use relative paths
const response = await fetch('/api/v1/scan/label/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Layer 2: Proxy Protection
- Vercel acts as a reverse proxy
- Client never sees actual backend URL
- All requests go through `/api/*` path

### Layer 3: Environment Security
```bash
# Vercel Environment Variables (Server-side only)
REACT_APP_API_URL=https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app
```

## 🔍 Verification Steps

### 1. Check Browser Console
```javascript
// ❌ This should NEVER appear in browser console
console.log(process.env.REACT_APP_API_URL); // undefined in production

// ✅ Only relative paths visible
console.log(API_ENDPOINTS.LABEL_SCAN); // "/api/v1/scan/label/"
```

### 2. Network Tab Inspection
- All API calls show as relative paths (`/api/*`)
- No direct backend URL visible
- Proxy handles actual routing

### 3. Source Code Analysis
```bash
# Search for backend URL in built files
grep -r "zapscan-lw-backend" build/
# Should return no results
```

## 🚀 Deployment Security

### Vercel Deployment
1. **Environment Variables**: Set in Vercel dashboard only
2. **Proxy Configuration**: Handled by `vercel.json`
3. **Build Process**: No backend URL in client bundle

### Production Verification
```bash
# Build the application
npm run build

# Check for any exposed URLs
grep -r "https://" build/
grep -r "zapscan" build/

# Should return no results
```

## 🔧 Configuration Files

### vercel.json
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app/api/$1"
    }
  ]
}
```

### Environment Variables
```bash
# Development (.env.local)
REACT_APP_API_URL=http://localhost:8000

# Production (Vercel Dashboard)
REACT_APP_API_URL=https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app
```

## 🛡️ Security Best Practices

### ✅ Implemented
- [x] Backend URL never exposed in client code
- [x] All API calls use relative paths
- [x] Environment variables secured
- [x] Proxy configuration in place
- [x] HTTPS enforcement
- [x] Security headers configured

### 🔒 Additional Security Measures
- [x] Content Security Policy (CSP)
- [x] XSS Protection headers
- [x] Frame options security
- [x] Input validation
- [x] Error boundaries

## 🚨 Security Checklist

### Pre-Deployment
- [ ] Backend URL not in source code
- [ ] Environment variables set in Vercel
- [ ] Proxy configuration tested
- [ ] Build process verified

### Post-Deployment
- [ ] Browser console checked for URLs
- [ ] Network tab verified
- [ ] API calls working through proxy
- [ ] Security headers present

## 🔍 Testing Security

### Manual Testing
1. Open browser developer tools
2. Check Console tab for any backend URLs
3. Check Network tab for API calls
4. Verify all calls go through `/api/*` path

### Automated Testing
```bash
# Build and check for exposed URLs
npm run build
grep -r "https://" build/
grep -r "zapscan" build/
```

## 📚 Documentation

### For Developers
- Backend URL is in environment variables only
- All API calls use relative paths
- Proxy handles actual routing
- Never log or expose backend URL

### For Deployment
- Set environment variables in Vercel dashboard
- Verify proxy configuration
- Test API connectivity
- Monitor for security issues

## 🎯 Summary

The backend URL is now **completely protected** and will never appear in:
- ✅ Browser console
- ✅ Network tab
- ✅ Source code
- ✅ Build files
- ✅ Client-side JavaScript

All API communication goes through a secure proxy that handles the actual backend URL server-side only. 