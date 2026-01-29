const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const PlantImage = require('../models/PlantImage');
const Plant = require('../models/Plant');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Configure multer for file uploads
// Use memory storage in serverless (Vercel), disk storage in development
const storage = isServerless 
  ? multer.memoryStorage() // Store in memory for serverless
  : multer.diskStorage({
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

// Get recent image uploads (for dashboard Recent Activity)
router.get('/recent', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === 'org_admin' || req.user.role === 'domain_admin' || req.user.role === 'application_user') {
      filter.organizationId = req.user.organizationId;
    }

    const plants = await Plant.find(filter).select('_id').lean();
    const plantIds = plants.map(p => p._id);
    if (plantIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const images = await PlantImage.find({
      plantId: { $in: plantIds },
      isActive: true,
      createdAt: { $gte: since }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('plantId', 'name health')
      .populate('uploadedBy', 'firstName lastName')
      .lean();

    const data = images.map(img => ({
      id: img._id,
      plantId: img.plantId?._id,
      plantName: img.plantId?.name,
      plantHealth: img.plantId?.health,
      month: img.month,
      uploadedAt: img.createdAt,
      uploadedBy: img.uploadedBy ? `${img.uploadedBy.firstName || ''} ${img.uploadedBy.lastName || ''}`.trim() || 'Unknown' : 'Unknown'
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching recent plant images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent plant images',
      error: error.message
    });
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

    // Check if image already exists for this month (including inactive ones)
    // The unique index prevents duplicates regardless of isActive status
    const existingImage = await PlantImage.findOne({ 
      plantId, 
      month
    });
    
    // Upload file to storage (GCS or local)
    const { uploadFile } = require('../config/storage');
    const destination = `plant-${plantId}-${month}-${Date.now()}${path.extname(file.originalname)}`;
    
    // Get file buffer (for memory storage) or read from disk
    let fileBuffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else {
      fileBuffer = await fs.readFile(file.path);
    }
    
    // Upload to storage (GCS or local)
    const uploadResult = await uploadFile(fileBuffer, destination, {
      mimetype: file.mimetype
    });
    
    // Clean up local file if it was saved to disk
    if (file.path && !isServerless) {
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.error('Error deleting temporary file:', error);
      }
    }

    let plantImage;
    
    if (existingImage) {
      // Update existing image instead of creating new one
      // Delete old file from storage (GCS or local)
      try {
        const { deleteFile } = require('../config/storage');
        // Extract filename from imageUrl (could be GCS URL or local path)
        const oldUrl = existingImage.imageUrl;
        let oldFilename;
        if (oldUrl.startsWith('http')) {
          // GCS URL: https://storage.googleapis.com/bucket-name/filename
          oldFilename = oldUrl.split('/').pop();
        } else {
          // Local path: /uploads/plant-images/filename
          oldFilename = oldUrl.split('/').pop();
        }
        await deleteFile(oldFilename);
      } catch (error) {
        console.error('Error deleting old image file:', error);
        // Continue anyway - we'll upload the new file
      }

      // Update existing image record
      plantImage = existingImage;
      plantImage.imageUrl = uploadResult.url;
      plantImage.imageKey = `plant-${plantId}-${month}-${Date.now()}`;
      plantImage.fileName = file.originalname;
      plantImage.fileSize = uploadResult.size;
      plantImage.mimeType = uploadResult.mimetype;
      plantImage.description = description || `Plant photo for ${month}`;
      plantImage.uploadedBy = req.user._id;
      plantImage.isActive = true; // Reactivate if it was inactive
      plantImage.updatedAt = new Date();
      
      await plantImage.save();
      await Plant.findByIdAndUpdate(plantId, { $set: { updatedAt: new Date() } });
    } else {
      // Create new image record
      const imageKey = `plant-${plantId}-${month}-${Date.now()}`;

      plantImage = new PlantImage({
        plantId,
        month,
        imageUrl: uploadResult.url,
        imageKey,
        fileName: file.originalname,
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimetype,
        description: description || `Plant photo for ${month}`,
        uploadedBy: req.user._id
      });

      await plantImage.save();
      await Plant.findByIdAndUpdate(plantId, { $set: { updatedAt: new Date() } });
    }

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
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Image already exists for this month. Please try again or use the replace function.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    await Plant.findByIdAndUpdate(plantId, { $set: { updatedAt: new Date() } });

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
    await Plant.findByIdAndUpdate(existingImage.plantId, { $set: { updatedAt: new Date() } });

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