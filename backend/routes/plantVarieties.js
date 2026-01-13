const express = require('express');
const router = express.Router();
const PlantVariety = require('../models/PlantVariety');
const PlantType = require('../models/PlantType');
const { auth } = require('../middleware/auth');
const { searchPlantVariety, isTrefleConfigured } = require('../utils/trefleApi');

// Helper function to check if user can edit a plant variety
const canEditPlantVariety = (user, plantVariety) => {
  // Super admin can edit any plant variety
  if (user.role === 'super_admin') return true;
  
  // Check if required fields exist
  if (!plantVariety.organizationId || !user.organizationId) return false;
  
  // Org admin can edit any plant variety in their organization
  if (user.role === 'org_admin' && plantVariety.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Domain admin can edit any plant variety within their domain
  if (user.role === 'domain_admin' && 
      plantVariety.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Application user can only edit plant varieties they created
  if (user.role === 'application_user' && 
      plantVariety.organizationId.toString() === user.organizationId.toString() &&
      plantVariety.createdBy.toString() === user._id.toString()) return true;
  
  return false;
};

// Helper function to check if user can delete a plant variety
const canDeletePlantVariety = (user, plantVariety) => {
  // Super admin can delete any plant variety
  if (user.role === 'super_admin') return true;
  
  // Check if required fields exist
  if (!plantVariety.organizationId || !user.organizationId) return false;
  
  // Org admin can delete any plant variety in their organization
  if (user.role === 'org_admin' && plantVariety.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Domain admin can delete any plant variety within their domain
  if (user.role === 'domain_admin' && 
      plantVariety.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Application user can only delete plant varieties they created
  if (user.role === 'application_user' && 
      plantVariety.organizationId.toString() === user.organizationId.toString() &&
      plantVariety.createdBy.toString() === user._id.toString()) return true;
  
  return false;
};

// GET /api/plant-varieties - Get all plant varieties with pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, plantTypeId, search, organizationId } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };
    
    if (plantTypeId) {
      filter.plantTypeId = plantTypeId;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Apply role-based filtering for plant varieties
    if (req.user.role === 'super_admin') {
      // Super admin can see all plant varieties (only filter if specifically requested)
      if (organizationId) {
        filter.organizationId = organizationId;
      }
      // If no organizationId specified, don't filter by organization (show all)
    } else {
      // Other users can only see plant varieties from their organization
      const userOrgId = req.user.organizationId?._id || req.user.organizationId;
      filter.organizationId = userOrgId;
    }
    
    const plantVarieties = await PlantVariety.find(filter)
      .populate('plantTypeId', 'name category emoji')
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PlantVariety.countDocuments(filter);

    res.json({
      success: true,
      data: plantVarieties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching plant varieties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant varieties',
      error: error.message
    });
  }
});

// GET /api/plant-varieties/all - Get all plant varieties without pagination
router.get('/all', auth, async (req, res) => {
  try {
    const { plantTypeId, search } = req.query;

    // Build filter
    const filter = { isActive: true };
    
    if (plantTypeId) {
      filter.plantTypeId = plantTypeId;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Apply role-based filtering for plant varieties
    if (req.user.role === 'super_admin') {
      // Super admin can see all plant varieties (only filter if specifically requested)
      // No additional filtering for super admin
    } else {
      // Other users can only see plant varieties from their organization
      const userOrgId = req.user.organizationId?._id || req.user.organizationId;
      filter.organizationId = userOrgId;
    }
    
    const plantVarieties = await PlantVariety.find(filter)
      .populate('plantTypeId', 'name category emoji')
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name')
      .sort({ name: 1 });

    // Add editable flag to each plant variety
    const plantVarietiesWithEditFlag = plantVarieties.map(plantVariety => {
      const plantVarietyObj = plantVariety.toObject();
      plantVarietyObj.editable = canEditPlantVariety(req.user, plantVariety);
      return plantVarietyObj;
    });

    res.json({
      success: true,
      data: plantVarietiesWithEditFlag
    });
  } catch (error) {
    console.error('Error fetching all plant varieties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant varieties',
      error: error.message
    });
  }
});

// GET /api/plant-varieties/by-type/:plantTypeId - Get varieties by plant type
router.get('/by-type/:plantTypeId', auth, async (req, res) => {
  try {
    const { plantTypeId } = req.params;
    const { organizationId } = req.query;

    const filter = { 
      plantTypeId,
      isActive: true
    };

    // Apply role-based filtering for plant varieties
    if (req.user.role === 'super_admin') {
      // Super admin can see all plant varieties (only filter if specifically requested)
      if (organizationId) {
        filter.organizationId = organizationId;
      }
      // If no organizationId specified, don't filter by organization (show all)
    } else {
      // Other users can only see plant varieties from their organization
      const userOrgId = req.user.organizationId?._id || req.user.organizationId;
      filter.organizationId = userOrgId;
    }
    
    const plantVarieties = await PlantVariety.find(filter)
      .populate('plantTypeId', 'name category emoji')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: plantVarieties
    });
  } catch (error) {
    console.error('Error fetching plant varieties by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant varieties',
      error: error.message
    });
  }
});

// GET /api/plant-varieties/fetch-from-trefle - Fetch variety data from Trefle API
router.get('/fetch-from-trefle', auth, async (req, res) => {
  try {
    const { varietyName, plantTypeName } = req.query;

    if (!varietyName) {
      return res.status(400).json({
        success: false,
        message: 'varietyName query parameter is required'
      });
    }

    if (!isTrefleConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Trefle API is not configured. Please set TREFLE_API_TOKEN environment variable.'
      });
    }

    const varietyData = await searchPlantVariety(varietyName, plantTypeName);

    if (!varietyData) {
      return res.status(404).json({
        success: false,
        message: 'No variety data found for the given search query'
      });
    }

    res.json({
      success: true,
      data: varietyData,
      source: 'trefle'
    });
  } catch (error) {
    console.error('Error fetching from Trefle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch variety data from Trefle API',
      error: error.message
    });
  }
});

// GET /api/plant-varieties/:id - Get single plant variety
router.get('/:id', auth, async (req, res) => {
  try {
    const plantVariety = await PlantVariety.findById(req.params.id)
      .populate('plantTypeId', 'name category emoji')
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name');

    if (!plantVariety) {
      return res.status(404).json({
        success: false,
        message: 'Plant variety not found'
      });
    }

    res.json({
      success: true,
      data: plantVariety
    });
  } catch (error) {
    console.error('Error fetching plant variety:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant variety',
      error: error.message
    });
  }
});

// POST /api/plant-varieties - Create new plant variety
router.post('/', auth, async (req, res) => {
  try {
    const { 
      name, 
      plantTypeId, 
      description, 
      characteristics, 
      growingInfo,
      autoPopulateFromTrefle = false
    } = req.body;

    // Validate required fields
    if (!name || !plantTypeId) {
      return res.status(400).json({
        success: false,
        message: 'Name and plant type are required'
      });
    }

    // Verify plant type exists and populate organizationId
    const plantType = await PlantType.findById(plantTypeId).populate('organizationId');
    if (!plantType) {
      return res.status(400).json({
        success: false,
        message: 'Plant type not found'
      });
    }

    // For super_admin, use the organizationId from the plant type
    // For other users, use their organizationId
    const organizationId = req.user.role === 'super_admin' 
      ? plantType.organizationId 
      : req.user.organizationId;

    // Check if variety already exists for this plant type
    const existingVariety = await PlantVariety.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      plantTypeId,
      organizationId: organizationId
    });

    if (existingVariety) {
      return res.status(400).json({
        success: false,
        message: 'Variety with this name already exists for this plant type'
      });
    }

    // Auto-populate from Trefle if requested and no data provided
    let finalDescription = description?.trim();
    let finalCharacteristics = characteristics || {};
    let finalGrowingInfo = growingInfo || {};

    if (autoPopulateFromTrefle && isTrefleConfigured() && !description && !characteristics && !growingInfo) {
      try {
        const trefleData = await searchPlantVariety(name, plantType.name);
        
        if (trefleData) {
          // Merge Trefle data (only fill in missing fields)
          finalDescription = finalDescription || trefleData.description || null;
          finalCharacteristics = {
            ...(trefleData.characteristics || {}),
            ...finalCharacteristics
          };
          finalGrowingInfo = {
            ...(trefleData.growingInfo || {}),
            ...finalGrowingInfo
          };
        }
      } catch (trefleError) {
        // Log error but don't fail the request - continue with user-provided data
        console.warn('Failed to auto-populate from Trefle:', trefleError.message);
      }
    }

    const plantVariety = new PlantVariety({
      name: name.trim(),
      plantTypeId,
      plantTypeName: plantType.name,
      description: finalDescription,
      characteristics: Object.keys(finalCharacteristics).length > 0 ? finalCharacteristics : undefined,
      growingInfo: Object.keys(finalGrowingInfo).length > 0 ? finalGrowingInfo : undefined,
      createdBy: req.user._id,
      organizationId: organizationId
    });

    await plantVariety.save();

    const populatedPlantVariety = await PlantVariety.findById(plantVariety._id)
      .populate('plantTypeId', 'name category emoji')
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name');

    res.status(201).json({
      success: true,
      message: 'Plant variety created successfully',
      data: populatedPlantVariety
    });
  } catch (error) {
    console.error('Error creating plant variety:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create plant variety',
      error: error.message
    });
  }
});

// PUT /api/plant-varieties/:id - Update plant variety
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      characteristics, 
      growingInfo, 
      isActive 
    } = req.body;

    const plantVariety = await PlantVariety.findById(req.params.id);

    if (!plantVariety) {
      return res.status(404).json({
        success: false,
        message: 'Plant variety not found'
      });
    }

    // Check if user has permission to edit this plant variety
    if (!canEditPlantVariety(req.user, plantVariety)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this plant variety.'
      });
    }

    // Check if name is being changed and if it conflicts with existing
    if (name && name !== plantVariety.name) {
      const existingVariety = await PlantVariety.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        plantTypeId: plantVariety.plantTypeId,
        organizationId: req.user.organizationId,
        _id: { $ne: req.params.id }
      });

      if (existingVariety) {
        return res.status(400).json({
          success: false,
          message: 'Variety with this name already exists for this plant type'
        });
      }
    }

    // Update fields
    if (name) plantVariety.name = name.trim();
    if (description !== undefined) plantVariety.description = description?.trim();
    if (characteristics) plantVariety.characteristics = characteristics;
    if (growingInfo) plantVariety.growingInfo = growingInfo;
    if (isActive !== undefined) plantVariety.isActive = isActive;

    await plantVariety.save();

    const updatedPlantVariety = await PlantVariety.findById(plantVariety._id)
      .populate('plantTypeId', 'name category emoji')
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name');

    res.json({
      success: true,
      message: 'Plant variety updated successfully',
      data: updatedPlantVariety
    });
  } catch (error) {
    console.error('Error updating plant variety:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plant variety',
      error: error.message
    });
  }
});

// DELETE /api/plant-varieties/:id - Soft delete plant variety
router.delete('/:id', auth, async (req, res) => {
  try {
    const plantVariety = await PlantVariety.findById(req.params.id);

    if (!plantVariety) {
      return res.status(404).json({
        success: false,
        message: 'Plant variety not found'
      });
    }

    // Check if user has permission to delete this plant variety
    if (!canDeletePlantVariety(req.user, plantVariety)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this plant variety.'
      });
    }

    // Soft delete
    plantVariety.isActive = false;
    await plantVariety.save();

    res.json({
      success: true,
      message: 'Plant variety deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plant variety:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete plant variety',
      error: error.message
    });
  }
});

module.exports = router;
