const express = require('express');
const router = express.Router();
const PlantType = require('../models/PlantType');
const Category = require('../models/Category');
const { auth } = require('../middleware/auth');

// Helper function to check if user can edit a plant type
const canEditPlantType = (user, plantType) => {
  // Super admin can edit any plant type
  if (user.role === 'super_admin') return true;
  
  // Check if required fields exist
  if (!plantType.organizationId || !user.organizationId) return false;
  
  // Org admin can edit any plant type in their organization
  if (user.role === 'org_admin' && plantType.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Domain admin can edit any plant type within their domain
  if (user.role === 'domain_admin' && 
      plantType.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Application user can only edit plant types they created
  if (user.role === 'application_user' && 
      plantType.organizationId.toString() === user.organizationId.toString() &&
      plantType.createdBy.toString() === user._id.toString()) return true;
  
  return false;
};

// Helper function to check if user can delete a plant type
const canDeletePlantType = (user, plantType) => {
  // Super admin can delete any plant type
  if (user.role === 'super_admin') return true;
  
  // Check if required fields exist
  if (!plantType.organizationId || !user.organizationId) return false;
  
  // Org admin can delete any plant type in their organization
  if (user.role === 'org_admin' && plantType.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Domain admin can delete any plant type within their domain
  if (user.role === 'domain_admin' && 
      plantType.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Application user can only delete plant types they created
  if (user.role === 'application_user' && 
      plantType.organizationId.toString() === user.organizationId.toString() &&
      plantType.createdBy.toString() === user._id.toString()) return true;
  
  return false;
};

// GET /api/plant-types - Get all plant types with pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, organizationId } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Apply role-based filtering for plant types
    if (req.user.role === 'super_admin') {
      // Super admin can see all plant types (only filter if specifically requested)
      if (organizationId) {
        filter.organizationId = organizationId;
      }
      // If no organizationId specified, don't filter by organization (show all)
    } else {
      // Other users can only see plant types from their organization
      const userOrgId = req.user.organizationId?._id || req.user.organizationId;
      filter.organizationId = userOrgId;
    }
    
    const plantTypes = await PlantType.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PlantType.countDocuments(filter);
    
    // Add editable flag to each plant type
    const plantTypesWithEditFlag = plantTypes.map(plantType => {
      const plantTypeObj = plantType.toObject();
      plantTypeObj.editable = canEditPlantType(req.user, plantType);
      return plantTypeObj;
    });

    res.json({
      success: true,
      data: plantTypesWithEditFlag,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching plant types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant types',
      error: error.message
    });
  }
});

// GET /api/plant-types/all - Get all plant types without pagination
router.get('/all', auth, async (req, res) => {
  try {
    const { category, search } = req.query;

    // Build filter
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Apply role-based filtering for plant types
    if (req.user.role === 'super_admin') {
      // Super admin can see all plant types (only filter if specifically requested)
      // No additional filtering for super admin
    } else {
      // Other users can only see plant types from their organization
      const userOrgId = req.user.organizationId?._id || req.user.organizationId;
      filter.organizationId = userOrgId;
    }
    
    const plantTypes = await PlantType.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name')
      .sort({ name: 1 });

    // Add editable flag to each plant type
    const plantTypesWithEditFlag = plantTypes.map(plantType => {
      const plantTypeObj = plantType.toObject();
      plantTypeObj.editable = canEditPlantType(req.user, plantType);
      return plantTypeObj;
    });

    res.json({
      success: true,
      data: plantTypesWithEditFlag
    });
  } catch (error) {
    console.error('Error fetching all plant types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant types',
      error: error.message
    });
  }
});

// GET /api/plant-types/:id - Get single plant type
router.get('/:id', auth, async (req, res) => {
  try {
    const plantType = await PlantType.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name');

    if (!plantType) {
      return res.status(404).json({
        success: false,
        message: 'Plant type not found'
      });
    }

    res.json({
      success: true,
      data: plantType
    });
  } catch (error) {
    console.error('Error fetching plant type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant type',
      error: error.message
    });
  }
});

// POST /api/plant-types - Create new plant type
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, emoji, description, growingSeason, sunRequirement, waterRequirement } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    // Validate that the category exists
    const categoryExists = await Category.findOne({ 
      name: category,
      isActive: true,
      organizationId: req.user.organizationId?._id || req.user.organizationId
    });

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category does not exist or is not active'
      });
    }
    
    // Check if user has permission to create plant types
    if (req.user.role === 'application_user') {
      // Application users can create plant types within their organization
      // This check is now handled by the organizationId assignment below
    }
    
    // For super_admin, we need to get an organization ID
    let organizationId;
    if (req.user.role === 'super_admin') {
      // Get the first organization for super admin
      const Organization = require('../models/Organization');
      const organization = await Organization.findOne();
      if (!organization) {
        return res.status(400).json({
          success: false,
          message: 'No organization found for super admin'
        });
      }
      organizationId = organization._id;
    } else {
      organizationId = req.user.organizationId;
    }

    // Check if plant type already exists
    const existingType = await PlantType.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      organizationId: organizationId
    });

    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'Plant type with this name already exists'
      });
    }

    const plantType = new PlantType({
      name: name.trim(),
      category,
      emoji: emoji || '🌱',
      description: description?.trim(),
      growingSeason,
      sunRequirement,
      waterRequirement,
      createdBy: req.user._id,
      organizationId: organizationId
    });

    await plantType.save();

    const populatedPlantType = await PlantType.findById(plantType._id)
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name');

    res.status(201).json({
      success: true,
      message: 'Plant type created successfully',
      data: populatedPlantType
    });
  } catch (error) {
    console.error('Error creating plant type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create plant type',
      error: error.message
    });
  }
});

// PUT /api/plant-types/:id - Update plant type
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, emoji, description, growingSeason, sunRequirement, waterRequirement, isActive } = req.body;

    const plantType = await PlantType.findById(req.params.id);

    if (!plantType) {
      return res.status(404).json({
        success: false,
        message: 'Plant type not found'
      });
    }
    
    // Check if user has permission to edit this plant type
    if (!canEditPlantType(req.user, plantType)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this plant type.'
      });
    }

    // Check if name is being changed and if it conflicts with existing
    if (name && name !== plantType.name) {
      const existingType = await PlantType.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        organizationId: req.user.organizationId,
        _id: { $ne: req.params.id }
      });

      if (existingType) {
        return res.status(400).json({
          success: false,
          message: 'Plant type with this name already exists'
        });
      }
    }

    // Validate that the category exists if it's being changed
    if (category && category !== plantType.category) {
      const categoryExists = await Category.findOne({ 
        name: category,
        isActive: true,
        organizationId: req.user.organizationId?._id || req.user.organizationId
      });

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category does not exist or is not active'
        });
      }
    }

    // Update fields
    if (name) plantType.name = name.trim();
    if (category) plantType.category = category;
    if (emoji) plantType.emoji = emoji;
    if (description !== undefined) plantType.description = description?.trim();
    if (growingSeason) plantType.growingSeason = growingSeason;
    if (sunRequirement) plantType.sunRequirement = sunRequirement;
    if (waterRequirement) plantType.waterRequirement = waterRequirement;
    if (isActive !== undefined) plantType.isActive = isActive;

    await plantType.save();

    const updatedPlantType = await PlantType.findById(plantType._id)
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name');

    res.json({
      success: true,
      message: 'Plant type updated successfully',
      data: updatedPlantType
    });
  } catch (error) {
    console.error('Error updating plant type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plant type',
      error: error.message
    });
  }
});

// DELETE /api/plant-types/:id - Soft delete plant type
router.delete('/:id', auth, async (req, res) => {
  try {
    const plantType = await PlantType.findById(req.params.id);

    if (!plantType) {
      return res.status(404).json({
        success: false,
        message: 'Plant type not found'
      });
    }
    
    // Check if user has permission to delete this plant type
    if (!canDeletePlantType(req.user, plantType)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this plant type.'
      });
    }

    // Soft delete
    plantType.isActive = false;
    await plantType.save();

    res.json({
      success: true,
      message: 'Plant type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plant type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete plant type',
      error: error.message
    });
  }
});

module.exports = router;
