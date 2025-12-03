# Vercel Troubleshooting Guide

## Serverless Function Crashes

If you're seeing `FUNCTION_INVOCATION_FAILED` errors, check the following:

### 1. Install Command Configuration

**Critical:** In Vercel Dashboard → Settings → General → Build & Development Settings:

**Install Command must be:**
```
npm install && cd backend && npm install
```

This ensures both frontend and backend dependencies are installed.

### 2. Check Function Logs

1. Go to your deployment in Vercel
2. Click on "Functions" tab
3. Click on the function (usually `api/index.js`)
4. View the logs to see the actual error

### 3. Common Issues

#### Issue: MODULE_NOT_FOUND errors
**Solution:** Backend dependencies not installed
- Verify Install Command is set correctly (see #1)
- Redeploy after fixing

#### Issue: Missing environment variables
**Solution:** Set required variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`

#### Issue: Database connection fails
**Solution:** 
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access (allow 0.0.0.0/0 for Vercel)
- Verify database credentials

### 4. Testing the API

After deployment, test:
- Health check: `https://your-app.vercel.app/api/health`
- Should return: `{"status":"OK",...}`

### 5. Debugging Steps

1. **Check Build Logs:**
   - Look for "Installing dependencies" section
   - Verify both `npm install` commands run successfully

2. **Check Function Logs:**
   - Look for error messages
   - Check for missing modules

3. **Test Locally:**
   ```bash
   npm install
   cd backend && npm install
   node api/index.js
   ```

### 6. Environment Variables Checklist

Required:
- [ ] `MONGODB_URI`
- [ ] `JWT_SECRET`
- [ ] `NODE_ENV=production`

Recommended:
- [ ] `FRONTEND_URL`
- [ ] `BACKEND_URL`
- [ ] `REACT_APP_API_URL=/api`

Optional:
- [ ] `SENTRY_DSN`
- [ ] `GOOGLE_CLOUD_PROJECT_ID`
- [ ] `GOOGLE_CLOUD_KEYFILE`
- [ ] `GOOGLE_CLOUD_BUCKET_NAME`

