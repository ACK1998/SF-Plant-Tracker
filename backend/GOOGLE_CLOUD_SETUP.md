# 🌤️ Google Cloud Storage Setup Guide

## Prerequisites
1. Google Cloud Platform account
2. Google Cloud project
3. Google Cloud Storage bucket

## Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your **Project ID**

## Step 2: Enable Google Cloud Storage API
1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Cloud Storage"
3. Enable "Cloud Storage API"

## Step 3: Create a Storage Bucket
1. Go to "Cloud Storage" > "Buckets"
2. Click "Create Bucket"
3. Choose a unique name (e.g., `sanctity-ferme-plant-images`)
4. Choose location (recommend: same region as your app)
5. Choose "Standard" storage class
6. Set access control to "Uniform"
7. Click "Create"

## Step 4: Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `plant-tracker-storage`
4. Description: `Service account for plant image uploads`
5. Click "Create and Continue"

## Step 5: Grant Permissions
1. Add these roles to the service account:
   - **Storage Object Admin** (for full access to bucket)
   - **Storage Object Viewer** (for reading files)
2. Click "Continue" and "Done"

## Step 6: Create Service Account Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Click "Create"
6. Download the JSON file

## Step 7: Configure Your Application
1. Copy the downloaded JSON file to `config/google-cloud-key.json`
2. Update your `.env` file:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
   GOOGLE_CLOUD_KEY_FILE=./config/google-cloud-key.json
   ```

## Step 8: Test the Setup
1. Restart your server
2. Try uploading an image
3. Check your Google Cloud Storage bucket for the uploaded file

## Security Notes
- ✅ Never commit `google-cloud-key.json` to version control
- ✅ Use environment variables for sensitive data
- ✅ Consider using Google Cloud IAM roles for production
- ✅ Enable Cloud Audit Logs for monitoring

## Troubleshooting
- **Permission Denied**: Check service account roles
- **Bucket Not Found**: Verify bucket name and project ID
- **Authentication Failed**: Check service account key file
- **CORS Issues**: Configure CORS on your bucket if needed

## Cost Optimization
- Use **Standard** storage for frequently accessed images
- Use **Nearline** for older images (accessed < once per month)
- Use **Coldline** for archived images (accessed < once per year)
- Set up **Lifecycle Management** to automatically move files

## Example Bucket CORS Configuration
```json
[
  {
    "origin": ["http://localhost:3000", "https://yourdomain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
``` 