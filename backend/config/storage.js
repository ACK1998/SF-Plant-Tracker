const { uploadToGCS, deleteFromGCS } = require('./googleCloud');
const fs = require('fs').promises;
const path = require('path');

/**
 * Upload file to storage (GCS in production, local in development)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} destination - Destination path
 * @param {Object} metadata - File metadata
 * @returns {Object} Upload result with URL and metadata
 */
const uploadFile = async (fileBuffer, destination, metadata = {}) => {
  try {
    // Check if we're in a serverless environment
    const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    // In serverless or production with GCS, use Google Cloud Storage
    if (isServerless || (process.env.NODE_ENV === 'production' && process.env.GOOGLE_CLOUD_PROJECT_ID)) {
      if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
        throw new Error('Google Cloud Storage is required in serverless environments. Please configure GOOGLE_CLOUD_PROJECT_ID.');
      }
      // Use Google Cloud Storage
      const result = await uploadToGCS(fileBuffer, destination, metadata);
      return {
        url: result.url,
        filename: result.filename,
        size: result.size,
        mimetype: result.mimetype,
        storage: 'gcs'
      };
    } else {
      // Use local storage only in non-serverless development
      const uploadDir = path.join(__dirname, '../uploads/plant-images');
      const fullPath = path.join(uploadDir, destination);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, fileBuffer);
      
      // Return local URL
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
      return {
        url: `${baseUrl}/uploads/plant-images/${destination}`,
        filename: destination,
        size: fileBuffer.length,
        mimetype: metadata.mimetype || 'image/webp',
        storage: 'local'
      };
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Delete file from storage
 * @param {string} filename - Filename to delete
 * @returns {boolean} Success status
 */
const deleteFile = async (filename) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_CLOUD_PROJECT_ID) {
      // Delete from Google Cloud Storage
      await deleteFromGCS(filename);
      return true;
    } else {
      // Delete from local storage
      const filePath = path.join(__dirname, '../uploads/plant-images', filename);
      await fs.unlink(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Upload multiple image variants
 * @param {Object} variants - Image variants (thumbnail, medium, full)
 * @param {string} baseFilename - Base filename
 * @returns {Object} Upload results for all variants
 */
const uploadImageVariants = async (variants, baseFilename) => {
  const results = {};
  
  for (const [size, buffer] of Object.entries(variants)) {
    const filename = baseFilename.replace('.webp', `_${size}.webp`);
    results[size] = await uploadFile(buffer, filename, {
      mimetype: 'image/webp'
    });
  }
  
  return results;
};

/**
 * Delete multiple image variants
 * @param {string} baseFilename - Base filename
 * @returns {boolean} Success status
 */
const deleteImageVariants = async (baseFilename) => {
  const sizes = ['thumbnail', 'medium', 'full'];
  let allDeleted = true;
  
  for (const size of sizes) {
    const filename = baseFilename.replace('.webp', `_${size}.webp`);
    const deleted = await deleteFile(filename);
    if (!deleted) allDeleted = false;
  }
  
  return allDeleted;
};

module.exports = {
  uploadFile,
  deleteFile,
  uploadImageVariants,
  deleteImageVariants
};

