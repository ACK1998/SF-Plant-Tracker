const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const PlantImage = require('../models/PlantImage');
const Plant = require('../models/Plant');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/plant-images');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const plantId = req.body.plantId;
    const month = req.body.month;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `plant-${plantId}-${month}-${timestamp}${ext}`);
  }
});

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
    fileSize: 5 * 1024 * 1024 // 5MB limit
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
    console.error('Error fetching plant images:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch plant images' 
    });
  }
});

// Upload a new plant image
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
      // Delete the uploaded file since we won't use it
      await fs.unlink(file.path);
      return res.status(409).json({ 
        success: false, 
        message: 'Image already exists for this month' 
      });
    }

    // Create image URL (in production, this would be a CDN URL)
    const imageUrl = `/uploads/plant-images/${file.filename}`;

    // Generate unique image key
    const imageKey = `plant-${plantId}-${month}-${Date.now()}`;

    // Create plant image record
    const plantImage = new PlantImage({
      plantId,
      month,
      imageUrl,
      imageKey,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      description: description || `Plant photo for ${month}`,
      uploadedBy: req.user._id
    });

    await plantImage.save();

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: plantImage._id,
        url: plantImage.imageUrl,
        month: plantImage.month,
        monthName: plantImage.monthName,
        uploadedAt: plantImage.createdAt,
        description: plantImage.description,
        size: plantImage.fileSizeMB + ' MB'
      }
    });
  } catch (error) {
    console.error('Error uploading plant image:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload image' 
    });
  }
});

// Upload a plant image from URL
router.post('/upload-url', auth, async (req, res) => {
  try {
    const { plantId, month, imageUrl, description } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image URL provided' 
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

    // Generate unique image key
    const imageKey = `plant-${plantId}-${month}-${Date.now()}`;

    // Create plant image record with URL
    const plantImage = new PlantImage({
      plantId,
      month,
      imageUrl,
      imageKey,
      fileName: 'URL Image',
      fileSize: 0,
      mimeType: 'image/jpeg',
      description: description || `Plant photo for ${month}`,
      uploadedBy: req.user._id
    });

    await plantImage.save();

    res.status(201).json({
      success: true,
      message: 'Image URL uploaded successfully',
      data: {
        id: plantImage._id,
        url: plantImage.imageUrl,
        month: plantImage.month,
        monthName: plantImage.monthName,
        uploadedAt: plantImage.createdAt,
        description: plantImage.description,
        size: 'URL Image'
      }
    });
  } catch (error) {
    console.error('Error uploading plant image URL:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload image URL' 
    });
  }
});

// Replace existing image for a month
router.put('/replace/:imageId', auth, upload.single('image'), async (req, res) => {
  try {
    const { imageId } = req.params;
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
      await fs.unlink(file.path);
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    // Delete old file
    try {
      const oldFilePath = path.join(__dirname, '..', existingImage.imageUrl);
      await fs.unlink(oldFilePath);
    } catch (error) {
      console.error('Error deleting old file:', error);
    }

    // Update image record
    existingImage.imageUrl = `/uploads/plant-images/${file.filename}`;
    existingImage.fileName = file.originalname;
    existingImage.fileSize = file.size;
    existingImage.mimeType = file.mimetype;
    existingImage.uploadedBy = req.user._id;
    existingImage.updatedAt = new Date();

    await existingImage.save();

    res.status(201).json({
      success: true,
      message: 'Image replaced successfully',
      data: {
        id: existingImage._id,
        url: existingImage.imageUrl,
        month: existingImage.month,
        monthName: existingImage.monthName,
        uploadedAt: existingImage.updatedAt,
        description: existingImage.description,
        size: existingImage.fileSizeMB + ' MB'
      }
    });
  } catch (error) {
    console.error('Error replacing plant image:', error);
    
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

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

    const image = await PlantImage.findById(imageId);
    if (!image) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    // Soft delete
    image.isActive = false;
    await image.save();

    // Optionally delete the file from disk
    try {
      const filePath = path.join(__dirname, '..', image.imageUrl);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file from disk:', error);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plant image:', error);
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
    
    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plant not found' 
      });
    }

    const missingMonths = await PlantImage.getMissingMonths(
      plantId, 
      plant.plantedDate, 
      new Date(),
      plant // Pass plant object to consider main image
    );

    res.json({
      success: true,
      data: missingMonths
    });
  } catch (error) {
    console.error('Error getting missing months:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get missing months' 
    });
  }
});

module.exports = router; 