const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
// Support both production (JSON string) and development (file path) methods
let storageConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
};

// For production/serverless (Vercel): Use JSON string from environment variable
if (process.env.GOOGLE_CLOUD_KEYFILE) {
  try {
    storageConfig.credentials = JSON.parse(process.env.GOOGLE_CLOUD_KEYFILE);
  } catch (error) {
    console.error('Error parsing GOOGLE_CLOUD_KEYFILE:', error);
    throw new Error('Invalid GOOGLE_CLOUD_KEYFILE format. Must be valid JSON string.');
  }
} 
// For local development: Use file path
else if (process.env.GOOGLE_CLOUD_KEY_FILE) {
  storageConfig.keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
} 
// Fallback: Try to use Application Default Credentials (for GCP environments)
else {
  console.warn('No GCP credentials provided. Using Application Default Credentials if available.');
}

const storage = new Storage(storageConfig);

// Get the bucket
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'sanctity-ferme-plant-images';
const bucket = storage.bucket(bucketName);

// Upload file to Google Cloud Storage
// Supports both formats:
// 1. (fileBuffer, destination, metadata) - from storage.js
// 2. (file, destination) - legacy format with file.buffer and file.mimetype
const uploadToGCS = async (fileOrBuffer, destination, metadata = {}) => {
  try {
    // Determine if first param is a buffer or file object
    let fileBuffer, mimetype, size;
    
    if (Buffer.isBuffer(fileOrBuffer)) {
      // New format: (fileBuffer, destination, metadata)
      fileBuffer = fileOrBuffer;
      mimetype = metadata.mimetype || 'image/webp';
      size = fileBuffer.length;
    } else {
      // Legacy format: (file, destination) where file has .buffer and .mimetype
      fileBuffer = fileOrBuffer.buffer;
      mimetype = fileOrBuffer.mimetype || 'image/webp';
      size = fileOrBuffer.size || fileBuffer.length;
    }

    const blob = bucket.file(destination);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: mimetype,
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('Error uploading to GCS:', error);
        reject(error);
      });

      blobStream.on('finish', async () => {
        // With uniform bucket-level access, we can't set individual object ACLs
        // The bucket must be configured for public access at the bucket level
        // If the bucket allows public access, files will be accessible via public URL
        try {
          // Try to make public (will fail if uniform bucket-level access is enabled)
          await blob.makePublic();
        } catch (error) {
          // If uniform bucket-level access is enabled, this will fail
          // That's okay - the bucket-level permissions will control access
          if (error.code === 400 && error.message?.includes('uniform bucket-level access')) {
            console.log('Bucket uses uniform bucket-level access. File access controlled by bucket permissions.');
          } else {
            // Log other errors but don't fail the upload
            console.warn('Could not make file public:', error.message);
          }
        }
        
        // Get the public URL (will work if bucket allows public access)
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
        
        resolve({
          url: publicUrl,
          filename: destination,
          size: size,
          mimetype: mimetype
        });
      });

      blobStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Error in uploadToGCS:', error);
    throw error;
  }
};

// Delete file from Google Cloud Storage
const deleteFromGCS = async (filename) => {
  try {
    const file = bucket.file(filename);
    await file.delete();
    console.log(`File ${filename} deleted from GCS`);
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    throw error;
  }
};

// Get signed URL for private files (if needed)
const getSignedUrl = async (filename, expirationMinutes = 60) => {
  try {
    const file = bucket.file(filename);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expirationMinutes * 60 * 1000,
    });
    return signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

module.exports = {
  storage,
  bucket,
  uploadToGCS,
  deleteFromGCS,
  getSignedUrl,
  bucketName
}; 