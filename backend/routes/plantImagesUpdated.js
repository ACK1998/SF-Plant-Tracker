const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const PlantImage = require('../models/PlantImage');
const Plant = require('../models/Plant');
const { auth } = require('../middleware/auth');
const { processImage, generateImageFilename, validateImage } = require('../utils/imageProcessor');
const { uploadImageVariants, deleteImageVariants } = require('../config/storage');
const logger = require('../config/logger');

const router = express.Router();

// Configure multer for file uploads (memory storage for processing)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all images for a plant
router.get('/plant/:plantId', auth, async (req, res) => {
  try {
    const { plantId } = req.params;
    
    // Verify plant exists and user has access
    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }

    const images = await PlantImage.find({ 
      plantId, 
      isActive: true 
    }).populate('uploadedBy', 'firstName lastName');

    const formattedImages = images.map(img => ({
      id: img._id,
      url: img.imageUrl,
      thumbnailUrl: img.thumbnailUrl,
      mediumUrl: img.mediumUrl,
      month: img.month,
      monthName: img.monthName,
      uploadedAt: img.createdAt,
      description: img.description,
      size: img.fileSizeMB + ' MB',
      uploadedBy: img.uploadedBy ? `${img.uploadedBy.firstName} ${img.uploadedBy.lastName}` : 'Unknown'
    }));

    res.json({
      success: true,
      data: formattedImages
    });
  } catch (error) {
    logger.error('Error fetching plant images:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch plant images' 
    });
  }
});

// Upload a new plant image with compression
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    const { plantId, month, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Validate image
    try {
      validateImage(file);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Validate plant exists
    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plant not found' 
      });
    }

    // Check if image already exists for this month
    const existingImage = await PlantImage.findOne({ 
      plantId, 
      month, 
      isActive: true 
    });

    if (existingImage) {
      return res.status(409).json({ 
        success: false, 
        message: 'Image already exists for this month' 
      });
    }

    // Process image with compression
    const quality = parseInt(process.env.IMAGE_QUALITY) || 80;
    const processedImage = await processImage(file.buffer, file.originalname, quality);
    
    // Generate base filename
    const baseFilename = generateImageFilename(file.originalname);
    
    // Upload all variants to storage
    const uploadResults = await uploadImageVariants(processedImage.variants, baseFilename);
    
    // Get month name
    const [year, monthNum] = month.split('-');
    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    // Generate unique image key
    const imageKey = `plant-${plantId}-${month}-${Date.now()}`;

    // Create plant image record
    const plantImage = new PlantImage({
      plantId,
      month,
      monthName,
      imageUrl: uploadResults.full.url,
      thumbnailUrl: uploadResults.thumbnail.url,
      mediumUrl: uploadResults.medium.url,
      imageKey,
      description: description || '',
      uploadedBy: req.user._id,
      fileSizeMB: (processedImage.metadata.size / (1024 * 1024)).toFixed(2),
      isActive: true
    });

    await plantImage.save();

    // Update plant's last updated timestamp
    await Plant.findByIdAndUpdate(plantId, { 
      updatedAt: new Date() 
    });

    logger.info(`Image uploaded successfully for plant ${plantId}, month ${month}`);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: plantImage._id,
        url: plantImage.imageUrl,
        thumbnailUrl: plantImage.thumbnailUrl,
        mediumUrl: plantImage.mediumUrl,
        month: plantImage.month,
        monthName: plantImage.monthName,
        description: plantImage.description,
        uploadedAt: plantImage.createdAt
      }
    });

  } catch (error) {
    logger.error('Error uploading plant image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

// Replace an existing plant image
router.put('/replace/:imageId', auth, upload.single('image'), async (req, res) => {
  try {
    const { imageId } = req.params;
    const { description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Find existing image
    const existingImage = await PlantImage.findById(imageId);
    if (!existingImage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    // Validate image
    try {
      validateImage(file);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Process new image with compression
    const quality = parseInt(process.env.IMAGE_QUALITY) || 80;
    const processedImage = await processImage(file.buffer, file.originalname, quality);
    
    // Generate new base filename
    const baseFilename = generateImageFilename(file.originalname);
    
    // Upload new variants
    const uploadResults = await uploadImageVariants(processedImage.variants, baseFilename);
    
    // Delete old image variants
    await deleteImageVariants(existingImage.imageKey);

    // Update image record
    existingImage.imageUrl = uploadResults.full.url;
    existingImage.thumbnailUrl = uploadResults.thumbnail.url;
    existingImage.mediumUrl = uploadResults.medium.url;
    existingImage.description = description || existingImage.description;
    existingImage.fileSizeMB = (processedImage.metadata.size / (1024 * 1024)).toFixed(2);
    existingImage.updatedAt = new Date();

    await existingImage.save();

    logger.info(`Image replaced successfully for image ${imageId}`);

    res.json({
      success: true,
      message: 'Image replaced successfully',
      data: {
        id: existingImage._id,
        url: existingImage.imageUrl,
        thumbnailUrl: existingImage.thumbnailUrl,
        mediumUrl: existingImage.mediumUrl,
        description: existingImage.description,
        updatedAt: existingImage.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error replacing plant image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to replace image'
    });
  }
});

// Delete a plant image
router.delete('/:imageId', auth, async (req, res) => {
  try {
    const { imageId } = req.params;

    const plantImage = await PlantImage.findById(imageId);
    if (!plantImage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    // Soft delete - mark as inactive
    plantImage.isActive = false;
    await plantImage.save();

    // Optionally delete from storage (uncomment if you want hard delete)
    // await deleteImageVariants(plantImage.imageKey);

    logger.info(`Image deleted successfully: ${imageId}`);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting plant image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
});

// Get missing months for a plant
router.get('/missing-months/:plantId', auth, async (req, res) => {
  try {
    const { plantId } = req.params;

    // Verify plant exists
    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }

    // Get all months with images
    const images = await PlantImage.find({ 
      plantId, 
      isActive: true 
    }).select('month');

    const existingMonths = new Set(images.map(img => img.month));

    // Generate list of months since planting
    const plantedDate = new Date(plant.plantedDate);
    const currentDate = new Date();
    const missingMonths = [];

    let checkDate = new Date(plantedDate.getFullYear(), plantedDate.getMonth(), 1);
    
    while (checkDate <= currentDate) {
      const monthString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!existingMonths.has(monthString)) {
        missingMonths.push({
          month: monthString,
          monthName: checkDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
      }
      
      checkDate.setMonth(checkDate.getMonth() + 1);
    }

    res.json({
      success: true,
      data: missingMonths
    });

  } catch (error) {
    logger.error('Error fetching missing months:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch missing months'
    });
  }
});

module.exports = router;






