const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  // For development, you can also use service account credentials directly
  // credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
});

// Get the bucket
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'sanctity-ferme-plant-images';
const bucket = storage.bucket(bucketName);

// Upload file to Google Cloud Storage
const uploadToGCS = async (file, destination) => {
  try {
    const blob = bucket.file(destination);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('Error uploading to GCS:', error);
        reject(error);
      });

      blobStream.on('finish', async () => {
        // Make the file public
        await blob.makePublic();
        
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
        
        resolve({
          url: publicUrl,
          filename: destination,
          size: file.size,
          mimetype: file.mimetype
        });
      });

      blobStream.end(file.buffer);
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