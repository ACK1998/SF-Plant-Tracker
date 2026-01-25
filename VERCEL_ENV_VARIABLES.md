# 🔑 Vercel Environment Variables Required

## ✅ Required Environment Variables

### Database
```
MONGODB_URI=mongodb+srv://username@password@cluster.mongodb.net/database
```
- **Required**: Yes
- **Description**: MongoDB connection string (MongoDB Atlas recommended). The connection string should follow the format: mongodb+srv protocol, followed by username and password separated by colon, then @ symbol, then cluster hostname, then database name.

### Authentication
```
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```
- **Required**: Yes
- **Description**: Secret key for JWT token signing (minimum 32 characters)

### Environment
```
NODE_ENV=production
```
- **Required**: Yes
- **Description**: Set to 'production' for Vercel deployment

### Google Cloud Storage (for image uploads)
```
GOOGLE_CLOUD_PROJECT_ID=sanctityferme
```
- **Required**: Yes (for image uploads)
- **Description**: Your Google Cloud Project ID

```
GOOGLE_CLOUD_KEYFILE={"type":"service_account","project_id":"sanctityferme",...}
```
- **Required**: Yes (for image uploads)
- **Description**: **ENTIRE JSON content** of your service account key file as a single-line string
- **Important**: Paste the complete JSON object, not a file path
- **Format**: The entire content of `google-cloud-key.json` as a single string

```
GOOGLE_CLOUD_BUCKET_NAME=sanctity-ferme-plant-images
```
- **Required**: No (has default: 'sanctity-ferme-plant-images')
- **Description**: Google Cloud Storage bucket name for storing images

### URLs (Recommended)
```
FRONTEND_URL=https://your-app.vercel.app
```
- **Required**: Recommended
- **Description**: Your Vercel deployment URL (for CORS and CSP)

```
BACKEND_URL=https://your-app.vercel.app
```
- **Required**: Recommended
- **Description**: Same as FRONTEND_URL for Vercel (for CORS and CSP)

## 📋 Frontend Environment Variables (if needed)

### API Configuration
```
REACT_APP_API_URL=/api
```
- **Required**: No (defaults to relative path)
- **Description**: API endpoint path (use `/api` for Vercel)

### Mapbox (if using maps)
```
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
```
- **Required**: No
- **Description**: Mapbox access token for map features

## 🔧 Optional Environment Variables

### Sentry (Error Tracking)
```
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
REACT_APP_SENTRY_DSN=your-sentry-dsn
```
- **Required**: No
- **Description**: Sentry configuration for error tracking

### Trefle API (Plant Data)
```
TREFLE_API_TOKEN=your-trefle-api-token
```
- **Required**: No
- **Description**: Trefle API token for auto-populating plant variety data

## 📝 How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `GOOGLE_CLOUD_KEYFILE`)
   - **Value**: The variable value
   - **Environment**: Select `Production`, `Preview`, and/or `Development` as needed
4. Click **Save**

## ⚠️ Important Notes

### GOOGLE_CLOUD_KEYFILE Format
The `GOOGLE_CLOUD_KEYFILE` must be the **entire JSON content** as a single-line string. 

**Example format:**
```
GOOGLE_CLOUD_KEYFILE={"type":"service_account","project_id":"sanctityferme","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```

**To get this value:**
1. Open your `google-cloud-key.json` file
2. Copy the entire JSON content
3. Remove all line breaks and format as a single line
4. Paste into Vercel environment variables

### MongoDB Atlas Network Access
Make sure your MongoDB Atlas cluster allows connections from:
- `0.0.0.0/0` (all IPs) OR
- Vercel's IP ranges (check Vercel documentation for current IPs)

## ✅ Quick Checklist

Before deploying, ensure you have:
- [ ] `MONGODB_URI` set
- [ ] `JWT_SECRET` set (32+ characters)
- [ ] `NODE_ENV=production` set
- [ ] `GOOGLE_CLOUD_PROJECT_ID` set
- [ ] `GOOGLE_CLOUD_KEYFILE` set (full JSON as string)
- [ ] `GOOGLE_CLOUD_BUCKET_NAME` set (or using default)
- [ ] `FRONTEND_URL` set to your Vercel URL
- [ ] `BACKEND_URL` set to your Vercel URL
- [ ] MongoDB Atlas network access configured
- [ ] Google Cloud Storage bucket created and permissions set
