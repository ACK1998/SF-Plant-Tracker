const sharp = require('sharp');
const path = require('path');

/**
 * Process and compress images to multiple sizes
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} filename - Original filename
 * @param {number} quality - Quality for WebP compression (default: 80)
 * @returns {Object} Processed image variants
 */
const processImage = async (imageBuffer, filename, quality = 80) => {
  try {
    const baseFilename = path.parse(filename).name;
    const variants = {};

    // Generate thumbnail (150px)
    variants.thumbnail = await sharp(imageBuffer)
      .resize(150, 150, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();

    // Generate medium size (600px)
    variants.medium = await sharp(imageBuffer)
      .resize(600, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();

    // Generate full size (1200px max)
    variants.full = await sharp(imageBuffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();

    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    return {
      variants,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: imageBuffer.length,
        thumbnailSize: variants.thumbnail.length,
        mediumSize: variants.medium.length,
        fullSize: variants.full.length
      }
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Generate responsive image filenames
 * @param {string} originalFilename - Original filename
 * @param {string} suffix - Suffix to add (e.g., 'thumb', 'medium', 'full')
 * @returns {string} Generated filename
 */
const generateImageFilename = (originalFilename, suffix = '') => {
  const parsed = path.parse(originalFilename);
  const timestamp = Date.now();
  const suffixStr = suffix ? `_${suffix}` : '';
  return `${parsed.name}_${timestamp}${suffixStr}.webp`;
};

/**
 * Get image dimensions without processing
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Object} Image dimensions and metadata
 */
const getImageMetadata = async (imageBuffer) => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    throw new Error('Failed to get image metadata');
  }
};

/**
 * Validate image file
 * @param {Object} file - Multer file object
 * @returns {boolean} Whether file is valid
 */
const validateImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
  }

  return true;
};

module.exports = {
  processImage,
  generateImageFilename,
  getImageMetadata,
  validateImage
};

