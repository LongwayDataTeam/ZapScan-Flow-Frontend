# Frontend Deployment Guide

This guide explains how to deploy the ZapScan frontend to connect with the deployed backend.

## 🚀 **Backend Status**

✅ **Backend is Live!**
- **Service URL:** `https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app`
- **Health Check:** ✅ Working
- **API Base:** `/api/v1/`

## 📁 **Frontend Configuration**

### **Environment Files:**
- `env.development` - For local development (localhost:8080)
- `env.production` - For production (deployed backend)

### **API Configuration:**
- `src/config/api.ts` - Centralized API endpoints
- Automatically uses the deployed backend URL

## 🔧 **Local Development**

### **Start Development Server:**
```bash
cd ZapScan-Flow-Frontend
npm install
npm start
```

The frontend will automatically connect to the deployed backend.

### **Environment Variables:**
- `REACT_APP_API_URL` - Backend URL (defaults to deployed URL)
- `REACT_APP_ENVIRONMENT` - Environment name

## 🌐 **Production Deployment**

### **Option 1: Deploy to Netlify**

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Drag and drop the `build` folder to Netlify
   - Or connect your GitHub repository

3. **Environment Variables in Netlify:**
   ```
   REACT_APP_API_URL=https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app
   REACT_APP_ENVIRONMENT=production
   ```

### **Option 2: Deploy to Vercel**

1. **Connect to Vercel:**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Environment Variables in Vercel:**
   ```
   REACT_APP_API_URL=https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app
   REACT_APP_ENVIRONMENT=production
   ```

### **Option 3: Deploy to GitHub Pages**

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages:**
   - Push to GitHub
   - Enable GitHub Pages in repository settings
   - Set source to `gh-pages` branch

## 🔗 **API Endpoints**

All endpoints are now connected to the deployed backend:

- **Health Check:** `/health`
- **Dashboard:** `/api/v1/dashboard/stats`
- **Tracking:** `/api/v1/tracking/stats`
- **Upload:** `/api/v1/trackers/upload/`
- **Scans:** `/api/v1/scan/label/`, `/api/v1/scan/packing/`, `/api/v1/scan/dispatch/`
- **Recent Scans:** `/api/v1/scan/recent/label`, `/api/v1/scan/recent/packing`, `/api/v1/scan/recent/dispatch`

## 🧪 **Testing**

### **Test Backend Connection:**
```bash
curl https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app/health
```

Expected response:
```json
{"status":"healthy","database":"firestore"}
```

### **Test Frontend:**
1. Start the development server: `npm start`
2. Open browser to `http://localhost:3000`
3. Check if data loads from the backend
4. Test scanning functionality

## 📊 **Features Available**

- ✅ **Dashboard** - Overview statistics
- ✅ **Upload** - Upload tracking data
- ✅ **Label Scanning** - Scan labels for tracking
- ✅ **Packing Scanning** - Scan products during packing
- ✅ **Dispatch Scanning** - Final dispatch scanning
- ✅ **Tracker Status** - View all trackers
- ✅ **Recent Scans** - View recent scanning activity

## 🔧 **Troubleshooting**

### **CORS Issues:**
- Backend is configured to allow all origins
- If issues persist, check browser console for CORS errors

### **API Connection Issues:**
- Verify backend URL is correct
- Check if backend is running: `curl /health`
- Ensure environment variables are set correctly

### **Build Issues:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm run build -- --reset-cache`

## 📞 **Support**

For deployment issues:
1. Check browser console for errors
2. Verify backend is accessible
3. Test API endpoints directly
4. Check environment variables are set correctly 