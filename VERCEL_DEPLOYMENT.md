# 🚀 Vercel Deployment Guide - Sanctity Ferme Plant Tracker

This guide will help you deploy your React + Express application to Vercel.

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] A Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] MongoDB database (MongoDB Atlas recommended for cloud deployment)
- [ ] Google Cloud Storage bucket for image storage
- [ ] Sentry account for error tracking (optional but recommended)
- [ ] All environment variables ready

## 🔧 Setup Steps

### 1. Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### 2. Prepare Your Project

The project is already configured with:
- `vercel.json` - Vercel configuration
- `api/index.js` - Serverless function wrapper for Express backend
- `.vercelignore` - Files to exclude from deployment

### 3. Environment Variables

You'll need to set the following environment variables in Vercel:

#### Required Variables

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Node Environment
NODE_ENV=production
```

#### Frontend Variables

```bash
# API URL (will be automatically set by Vercel, but you can override)
REACT_APP_API_URL=/api

# Mapbox (if using)
REACT_APP_MAPBOX_TOKEN=your-mapbox-token

# Sentry (optional)
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

#### Backend Variables

```bash
# Frontend URL (your Vercel deployment URL)
FRONTEND_URL=https://your-app.vercel.app

# Backend URL (same as FRONTEND_URL for Vercel)
BACKEND_URL=https://your-app.vercel.app

# Google Cloud Storage (for image uploads)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEYFILE=your-service-account-key-json-content
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name

# Sentry (optional)
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

### 4. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add all environment variables in the "Environment Variables" section
6. Click "Deploy"

#### Option B: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy (first time will ask questions)
vercel

# For production deployment
vercel --prod
```

### 5. Configure Build Settings

In Vercel dashboard, ensure these settings:

- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x or higher

## 🔍 Post-Deployment Configuration

### 1. Update CORS Settings

After deployment, update your backend CORS configuration if needed. The `backend/server.js` already handles this with the `FRONTEND_URL` environment variable.

### 2. Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test the health endpoint: `https://your-app.vercel.app/api/health`
3. Test authentication
4. Test image uploads (ensure Google Cloud Storage is configured)

### 3. Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## 🛠️ Troubleshooting

### Issue: Build Fails

**Solution**: Check build logs in Vercel dashboard. Common issues:
- Missing environment variables
- Build command incorrect
- Node version mismatch

### Issue: API Routes Return 404

**Solution**: 
- Verify `vercel.json` routes configuration
- Ensure `api/index.js` exists and exports the Express app
- Check that routes are prefixed with `/api`

### Issue: Database Connection Fails

**Solution**:
- Verify `MONGODB_URI` is set correctly
- Ensure MongoDB Atlas allows connections from Vercel IPs (0.0.0.0/0 for testing)
- Check network access settings in MongoDB Atlas

### Issue: Image Uploads Fail

**Solution**:
- Verify Google Cloud Storage credentials
- Ensure bucket permissions are correct
- Check that `GOOGLE_CLOUD_KEYFILE` contains valid JSON (not a file path)

### Issue: CORS Errors

**Solution**:
- Set `FRONTEND_URL` environment variable to your Vercel URL
- Ensure `BACKEND_URL` matches `FRONTEND_URL` for Vercel deployments
- Check browser console for specific CORS errors

## 📝 Environment Variables Reference

### Setting Environment Variables in Vercel

1. Go to your project in Vercel dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add each variable with its value
4. Select environments (Production, Preview, Development)
5. Redeploy after adding variables

### Important Notes

- **GOOGLE_CLOUD_KEYFILE**: This should be the JSON content of your service account key, not a file path. You can copy the entire JSON object and paste it as the value.
- **REACT_APP_API_URL**: For Vercel, set this to `/api` (relative path) so it works with the same domain.
- **MONGODB_URI**: Use MongoDB Atlas connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

## 🔄 Updating Your Deployment

### Automatic Deployments

Vercel automatically deploys when you push to your connected Git branch:
- `main`/`master` branch → Production
- Other branches → Preview deployments

### Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 📊 Monitoring

### Vercel Analytics

Enable Vercel Analytics in your project settings to monitor:
- Page views
- Performance metrics
- Error rates

### Function Logs

View serverless function logs in Vercel dashboard:
1. Go to your project
2. Click on "Functions" tab
3. View logs for each API route

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Use Vercel environment variables
2. **Use strong JWT secrets** - Minimum 32 characters
3. **Restrict MongoDB access** - Use IP whitelist in MongoDB Atlas
4. **Enable Vercel password protection** - For staging/preview deployments
5. **Use HTTPS** - Vercel provides this automatically

## 📈 Performance Optimization

1. **Enable Edge Caching** - Configure in `vercel.json` if needed
2. **Optimize Images** - Use Vercel Image Optimization
3. **Database Connection Pooling** - Already handled by Mongoose
4. **CDN** - Vercel provides global CDN automatically

## 🆘 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review function logs in Vercel dashboard
3. Test API endpoints directly
4. Verify environment variables are set correctly
5. Check MongoDB Atlas connection logs

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/)
- [Google Cloud Storage Setup](https://cloud.google.com/storage/docs)

---

**Note**: This deployment setup uses a single serverless function for all API routes. For better performance with high traffic, consider splitting routes into separate functions.

