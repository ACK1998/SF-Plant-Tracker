# ⚡ Vercel Quick Start Guide

## 🚀 Quick Deployment Steps

### 1. Connect Your Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your Git repository
4. Vercel will auto-detect the settings

### 2. Configure Build Settings

In the Vercel project settings, set:

- **Framework Preset**: Other
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install && cd backend && npm install`

### 3. Set Environment Variables

Go to **Settings → Environment Variables** and add:

#### Critical Variables (Required)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-minimum-32-characters-long
NODE_ENV=production
```

#### Frontend Variables
```
REACT_APP_API_URL=/api
REACT_APP_MAPBOX_TOKEN=your-mapbox-token (if using Mapbox)
```

#### Backend Variables
```
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-app.vercel.app
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEYFILE={"type":"service_account",...} (full JSON content)
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
```

### 4. Deploy

Click **"Deploy"** and wait for the build to complete!

### 5. Test Your Deployment

- Frontend: `https://your-app.vercel.app`
- API Health: `https://your-app.vercel.app/api/health`

## 📝 Important Notes

1. **GOOGLE_CLOUD_KEYFILE**: Paste the entire JSON content of your service account key file, not a file path.

2. **REACT_APP_API_URL**: Use `/api` (relative path) so it works with your Vercel domain.

3. **MongoDB Atlas**: Make sure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or add Vercel's IP ranges.

4. **First Deployment**: The first deployment may take longer as it installs all dependencies.

## 🔧 Troubleshooting

### Build Fails
- Check that both `npm install` commands run (root and backend)
- Verify all environment variables are set
- Check build logs in Vercel dashboard

### API Returns 404
- Verify `api/index.js` exists
- Check that routes start with `/api`
- Review function logs in Vercel dashboard

### Database Connection Fails
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access
- Review function logs for connection errors

## 📚 Full Documentation

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed documentation.

