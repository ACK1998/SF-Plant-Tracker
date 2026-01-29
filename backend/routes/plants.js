const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Plant = require('../models/Plant');
const Plot = require('../models/Plot');
const PlantImage = require('../models/PlantImage');
const PlantType = require('../models/PlantType');
const PlantVariety = require('../models/PlantVariety');
const { auth, authorize } = require('../middleware/auth');


// Helper function to check if user can edit a plant
const canEditPlant = (user, plant) => {
  // Super admin can edit any plant
  if (user.role === 'super_admin') return true;
  
  // Check if required fields exist
  if (!plant.organizationId || !user.organizationId) return false;
  
  // Org admin can edit any plant in their organization
  if (user.role === 'org_admin') {
    const userOrgId = user.organizationId?._id || user.organizationId;
    const plantOrgId = plant.organizationId?._id || plant.organizationId;
    
    return userOrgId && plantOrgId && userOrgId.toString() === plantOrgId.toString();
  }
  
  // Domain admin can only edit plants in their domain
  if (user.role === 'domain_admin') {
    const userOrgId = user.organizationId?._id || user.organizationId;
    const plantOrgId = plant.organizationId?._id || plant.organizationId;
    const userDomainId = user.domainId?._id || user.domainId;
    const plantDomainId = plant.domainId?._id || plant.domainId;
    
    return userOrgId && plantOrgId && userOrgId.toString() === plantOrgId.toString() &&
           userDomainId && plantDomainId && userDomainId.toString() === plantDomainId.toString();
  }
  
  // Application user can only edit plants in their assigned plots
  if (user.role === 'application_user') {
    const userOrgId = user.organizationId?._id || user.organizationId;
    const plantOrgId = plant.organizationId?._id || plant.organizationId;
    const userPlotIds = user.plotIds?.map(p => p._id || p).filter(id => id != null) || (user.plotId ? [user.plotId._id || user.plotId].filter(id => id != null) : []);
    const plantPlotId = plant.plotId?._id || plant.plotId;
    
    return userOrgId && plantOrgId && userOrgId.toString() === plantOrgId.toString() &&
           userPlotIds && userPlotIds.length > 0 && userPlotIds.some(userPlotId => userPlotId.toString() === plantPlotId.toString());
  }
  
  return false;
};

// @route   GET /api/plants
// @desc    Get all plants (filtered by user role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { organizationId, plotId, domainId, health, growthStage, type, category, variety, search, notUpdatedMonthly, hasRecentImages, page = 1, limit = 10 } = req.query;
    
    const filter = { isActive: true };
    
    // Apply role-based filtering
    if (req.user.role === 'org_admin') {
      // Org admin can see all plants in their organization
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'domain_admin') {
      // Domain admin can see all plants in their organization
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'application_user') {
      // Application user can see all plants in their organization
      filter.organizationId = req.user.organizationId;
    }
    // Super admin can see all plants (no additional filtering)
    
    // Apply additional filters from query parameters (but don't override role-based organizationId)
    if (plotId) filter.plotId = plotId;
    if (domainId) filter.domainId = domainId;
    if (health) filter.health = health;
    if (growthStage) filter.growthStage = growthStage;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (variety) filter.variety = variety;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { variety: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // When hasRecentImages or notUpdatedMonthly: filter by plant IDs at query level (before pagination)
    const useRecentImagesFilter = hasRecentImages === 'true' || notUpdatedMonthly === 'true';
    if (useRecentImagesFilter) {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const plantIdsWithRecentImages = await PlantImage.find({
        month: currentMonth,
        isActive: true
      }).distinct('plantId');

      if (hasRecentImages === 'true') {
        filter._id = { $in: plantIdsWithRecentImages };
      } else {
        filter._id = { $nin: plantIdsWithRecentImages };
      }
      if (!filter.health) {
        filter.health = { $ne: 'deceased' };
      }
    }

    const plants = await Plant.find(filter)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Plant.countDocuments(filter);

    // Add editable flag and handle plantedBy name
    const plantsWithEditFlag = plants.map(plant => {
      const plantObj = plant.toObject();
      plantObj.editable = canEditPlant(req.user, plant);
      
      // Handle plantedBy - if empty, use username, otherwise use full name
      if (!plantObj.plantedBy || !plantObj.plantedBy.firstName) {
        plantObj.plantedBy = {
          _id: plantObj.plantedBy?._id || null,
          firstName: plantObj.plantedBy?.username || plantObj.planter || 'Unknown',
          lastName: ''
        };
      } else {
        plantObj.plantedBy = {
          _id: plantObj.plantedBy._id,
          firstName: `${plantObj.plantedBy.firstName} ${plantObj.plantedBy.lastName}`.trim(),
          lastName: ''
        };
      }
      
      return plantObj;
    });
    
    res.json({
      success: true,
      data: plantsWithEditFlag,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/plants/dashboard
// @desc    Get plants for dashboard (no filtering, all data)
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    
    // Apply role-based filtering only
    if (req.user.role === 'org_admin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'domain_admin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'application_user') {
      filter.organizationId = req.user.organizationId;
    }
    
    const plants = await Plant.find(filter)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    const total = await Plant.countDocuments(filter);
    
    res.json({
      success: true,
      data: plants,
      total
    });
  } catch (error) {
    console.error('Error fetching dashboard plants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard plants',
      error: error.message
    });
  }
});

// @route   GET /api/plants/mapview
// @desc    Get plants for map view (with optional bounds filtering)
// @access  Private
router.get('/mapview', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    
    // Apply role-based filtering only
    if (req.user.role === 'org_admin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'domain_admin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'application_user') {
      filter.organizationId = req.user.organizationId;
    }
    
    // Optional bounds filtering (viewport-based)
    const { swLng, swLat, neLng, neLat } = req.query;
    if (swLng && swLat && neLng && neLat) {
      // Filter plants within viewport bounds
      filter.longitude = {
        $gte: parseFloat(swLng),
        $lte: parseFloat(neLng)
      };
      filter.latitude = {
        $gte: parseFloat(swLat),
        $lte: parseFloat(neLat)
      };
    }
    
    const plants = await Plant.find(filter)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    const total = await Plant.countDocuments(filter);
    
    res.json({
      success: true,
      data: plants,
      total
    });
  } catch (error) {
    console.error('Error fetching mapview plants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mapview plants',
      error: error.message
    });
  }
});

// @route   GET /api/plants/with-recent-images
// @desc    Get plants that have recent images (current month only)
// @access  Private
router.get('/with-recent-images', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    
    // Apply role-based filtering
    if (req.user.role === 'org_admin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'domain_admin') {
      filter.domainId = req.user.domainId;
    } else if (req.user.role === 'application_user') {
      filter.organizationId = req.user.organizationId;
    }

    const plants = await Plant.find(filter)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    // Get current month in YYYY-MM format
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all plant IDs that have images for current month only
    const plantsWithRecentImages = await PlantImage.find({
      month: currentMonth,
      isActive: true
    }).distinct('plantId');
    
    // Filter plants that have recent images
    const plantsWithImages = plants.filter(plant => {
      // Exclude deceased plants
      if (plant.health === 'deceased') {
        return false;
      }
      
      // If plant has recent images, include it
      return plantsWithRecentImages.some(plantId => plantId.toString() === plant._id.toString());
    });

    const total = plantsWithImages.length;
    
    res.json({
      success: true,
      data: plantsWithImages,
      total
    });
  } catch (error) {
    console.error('Error fetching plants with recent images:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch plants with recent images' 
    });
  }
});

// @route   GET /api/plants/not-updated-monthly
// @desc    Get plants that haven't been updated in the current month
// @access  Private
router.get('/not-updated-monthly', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    
    // Apply role-based filtering only
    if (req.user.role === 'org_admin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'domain_admin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'application_user') {
      filter.organizationId = req.user.organizationId;
    }
    
    // Calculate date one month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Find plants that either:
    // 1. Have no status history (never updated)
    // 2. Have status history but the last update was more than a month ago
    const plants = await Plant.find(filter)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    // Get current month in YYYY-MM format
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all plant IDs that have images for current month only
    const plantsWithRecentImages = await PlantImage.find({
      month: currentMonth,
      isActive: true
    }).distinct('plantId');
    
    // Filter plants that haven't been updated in the last month
    const plantsNotUpdatedMonthly = plants.filter(plant => {
      // Exclude deceased plants - they don't need monthly image updates
      if (plant.health === 'deceased') {
        return false;
      }
      
      // If plant has no recent images, it needs monthly update
      return !plantsWithRecentImages.some(plantId => plantId.toString() === plant._id.toString());
    });

    const total = plantsNotUpdatedMonthly.length;
    
    res.json({
      success: true,
      data: plantsNotUpdatedMonthly,
      total
    });
  } catch (error) {
    console.error('Error fetching plants not updated monthly:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plants not updated monthly',
      error: error.message
    });
  }
});

// @route   GET /api/plants/:id
// @desc    Get single plant
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username')
      .populate('statusHistory.updatedBy', 'firstName lastName');
    
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    
    // Add editable flag and handle plantedBy name
    const plantObj = plant.toObject();
    plantObj.editable = canEditPlant(req.user, plant);
    
    // Handle plantedBy - if empty, use username, otherwise use full name
    if (!plantObj.plantedBy || !plantObj.plantedBy.firstName) {
      plantObj.plantedBy = {
        _id: plantObj.plantedBy?._id || null,
        firstName: plantObj.plantedBy?.username || plantObj.planter || 'Unknown',
        lastName: ''
      };
    } else {
      plantObj.plantedBy = {
        _id: plantObj.plantedBy._id,
        firstName: `${plantObj.plantedBy.firstName} ${plantObj.plantedBy.lastName}`.trim(),
        lastName: ''
      };
    }
    
    res.json({
      success: true,
      data: plantObj
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/plants
// @desc    Create new plant
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    console.log('POST /api/plants - Request body:', req.body);
    console.log('POST /api/plants - User:', {
      _id: req.user._id,
      role: req.user.role,
      organizationId: req.user.organizationId?._id || req.user.organizationId,
      domainId: req.user.domainId?._id || req.user.domainId,
      plotIds: req.user.plotIds?.map(p => p._id || p) || (req.user.plotId ? [req.user.plotId._id || req.user.plotId] : [])
    });
    // For application users, ensure they can only create plants in their assigned plots
    if (req.user.role === 'application_user') {
      const userPlotIds = req.user.plotIds?.map(p => p._id || p) || (req.user.plotId ? [req.user.plotId._id || req.user.plotId] : []);
      
      if (req.body.plotId) {
        // Verify the selected plot belongs to one of the user's assigned plots
        if (!userPlotIds.some(userPlotId => userPlotId.toString() === req.body.plotId.toString())) {
          return res.status(403).json({ 
            message: 'You can only create plants in your assigned plots.' 
          });
        }
      } else {
        // If no plot is specified and user has only one plot, auto-assign it
        if (userPlotIds.length === 1) {
          req.body.plotId = userPlotIds[0];
        } else {
          return res.status(400).json({ 
            message: 'Plot selection is required when you have access to multiple plots.' 
          });
        }
      }
    }
    
    // For domain_admin users, ensure they can only create plants in their domain
    if (req.user.role === 'domain_admin') {
      if (!req.body.plotId) {
        return res.status(400).json({ 
          message: 'Plot selection is required for domain admins.' 
        });
      }
      
      // Verify the selected plot belongs to the user's domain
      const selectedPlot = await Plot.findById(req.body.plotId);
      
      // Debug logging
      console.log('Domain admin validation - User:', {
        userId: req.user._id,
        userRole: req.user.role,
        userDomainId: req.user.domainId,
        userOrgId: req.user.organizationId
      });
      console.log('Domain admin validation - Plot:', {
        plotId: req.body.plotId,
        plotDomainId: selectedPlot?.domainId,
        plotOrgId: selectedPlot?.organizationId
      });
      console.log('Domain admin validation - Comparisons:', {
        domainMatch: selectedPlot?.domainId?.toString() === req.user.domainId?.toString(),
        orgMatch: selectedPlot?.organizationId?.toString() === req.user.organizationId?.toString()
      });
      
      if (!selectedPlot) {
        return res.status(400).json({ 
          message: 'Selected plot not found.' 
        });
      }
      
      // Handle both object and string IDs for comparison
      const userDomainId = req.user.domainId?._id || req.user.domainId;
      const userOrgId = req.user.organizationId?._id || req.user.organizationId;
      const plotDomainId = selectedPlot.domainId?._id || selectedPlot.domainId;
      const plotOrgId = selectedPlot.organizationId?._id || selectedPlot.organizationId;
      
      console.log('Domain admin validation - Final comparisons:', {
        userDomainId: String(userDomainId),
        plotDomainId: String(plotDomainId),
        userOrgId: String(userOrgId),
        plotOrgId: String(plotOrgId),
        domainMatch: String(userDomainId) === String(plotDomainId),
        orgMatch: String(userOrgId) === String(plotOrgId)
      });
      
      if (String(userDomainId) !== String(plotDomainId) || 
          String(userOrgId) !== String(plotOrgId)) {
        return res.status(403).json({ 
          message: 'You can only create plants in plots within your domain.' 
        });
      }
    }
    
    // Preprocess the data to handle organizationId object
    const processedBody = { ...req.body };
    
    // Handle organizationId if it's an object
    if (processedBody.organizationId && typeof processedBody.organizationId === 'object') {
      processedBody.organizationId = processedBody.organizationId._id;
    }
    
    const plantData = {
      ...processedBody,
      plantedBy: req.user._id,
      planter: req.body.planter || `${req.user.firstName} ${req.user.lastName}`
    };

    const plant = new Plant(plantData);
    await plant.save();
    
    const populatedPlant = await Plant.findById(plant._id)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username');
    
    res.status(201).json({
      success: true,
      data: populatedPlant
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/plants/:id
// @desc    Update plant
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // First, find the plant to check permissions
    const existingPlant = await Plant.findById(req.params.id);
    
    if (!existingPlant) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    
    // Check if user has permission to edit this plant
    if (!canEditPlant(req.user, existingPlant)) {
      return res.status(403).json({ 
        message: 'You do not have permission to edit this plant. You can only edit plants in your assigned plot.' 
      });
    }
    
    const plant = await Plant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('plotId', 'name')
    .populate('domainId', 'name')
    .populate('organizationId', 'name')
    .populate('plantedBy', 'firstName lastName username');
    
    res.status(200).json({
      success: true,
      data: plant
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/plants/:id
// @desc    Delete plant (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // First, find the plant to check permissions
    const existingPlant = await Plant.findById(req.params.id);
    
    if (!existingPlant) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    
    // Check if user has permission to delete this plant
    if (!canEditPlant(req.user, existingPlant)) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this plant. You can only delete plants in your assigned plot.' 
      });
    }
    
    const plant = await Plant.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Plant deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/plants/:id/status
// @desc    Add status update
// @access  Private
router.post('/:id/status', auth, async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    
    // Check if user has permission to update this plant's status
    if (!canEditPlant(req.user, plant)) {
      return res.status(403).json({ 
        message: 'You do not have permission to update this plant. You can only update plants in your assigned plot.' 
      });
    }
    
    const statusUpdate = {
      ...req.body,
      updatedBy: req.user._id,
      date: new Date()
    };
    
    plant.statusHistory.push(statusUpdate);
    plant.health = req.body.health;
    plant.growthStage = req.body.growthStage;
    
    if (req.body.status === 'harvested') {
      plant.actualHarvestDate = new Date();
    }
    
    await plant.save();
    
    const populatedPlant = await Plant.findById(plant._id)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username')
      .populate('statusHistory.updatedBy', 'firstName lastName');
    
    res.json({
      success: true,
      data: populatedPlant
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/plants/export/csv
// @desc    Export plants to CSV
// @access  Private
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { organizationId, plotId, domainId, health, growthStage, type, category, variety, search } = req.query;
    
    const filter = { isActive: true };
    
    // Apply role-based filtering
    if (req.user.role === 'org_admin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'domain_admin') {
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'application_user') {
      filter.organizationId = req.user.organizationId;
    }
    
    // Apply additional filters
    if (plotId) filter.plotId = plotId;
    if (domainId) filter.domainId = domainId;
    if (health) filter.health = health;
    if (growthStage) filter.growthStage = growthStage;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (variety) filter.variety = variety;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { variety: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const plants = await Plant.find(filter)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvHeaders = [
      'Plant ID',
      'Name',
      'Type',
      'Variety',
      'Category',
      'Description',
      'Health',
      'Growth Stage',
      'Plot',
      'Domain',
      'Organization',
      'Planted By',
      'Planted Date',
      'Expected Harvest Date',
      'Actual Harvest Date',
      'Location',
      'Created At',
      'Updated At'
    ];

    const csvRows = plants.map(plant => [
      plant._id,
      plant.name || '',
      plant.type || '',
      plant.variety || '',
      plant.category || '',
      plant.description || '',
      plant.health || '',
      plant.growthStage || '',
      plant.plotId?.name || '',
      plant.domainId?.name || '',
      plant.organizationId?.name || '',
      plant.plantedBy ? `${plant.plantedBy.firstName || ''} ${plant.plantedBy.lastName || ''}`.trim() : '',
      plant.plantedDate ? new Date(plant.plantedDate).toISOString().split('T')[0] : '',
      plant.expectedHarvestDate ? new Date(plant.expectedHarvestDate).toISOString().split('T')[0] : '',
      plant.actualHarvestDate ? new Date(plant.actualHarvestDate).toISOString().split('T')[0] : '',
      plant.location || '',
      plant.createdAt ? new Date(plant.createdAt).toISOString().split('T')[0] : '',
      plant.updatedAt ? new Date(plant.updatedAt).toISOString().split('T')[0] : ''
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="plants_export_${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ message: 'Failed to export plants to CSV' });
  }
});

// @route   POST /api/plants/import/csv
// @desc    Import plants from CSV
// @access  Private
router.post('/import/csv', auth, async (req, res) => {
  try {
    const { csvData, updateExisting = false } = req.body;
    
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ message: 'Invalid CSV data format' });
    }

    const results = {
      imported: 0,
      updated: 0,
      errors: [],
      skipped: 0
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed
      
      try {
        // Skip empty rows
        if (!row.name || !row.type) {
          results.skipped++;
          continue;
        }

        // Check if plant already exists (by name and type)
        const existingPlant = await Plant.findOne({
          name: row.name,
          type: row.type,
          isActive: true
        });

        if (existingPlant) {
          if (updateExisting) {
            // Update existing plant
            const updateData = {
              variety: row.variety || existingPlant.variety,
              category: row.category || existingPlant.category,
              description: row.description || existingPlant.description,
              health: row.health || existingPlant.health,
              growthStage: row.growthStage || existingPlant.growthStage,
              expectedHarvestDate: row.expectedHarvestDate ? new Date(row.expectedHarvestDate) : existingPlant.expectedHarvestDate,
              location: row.location || existingPlant.location
            };

            await Plant.findByIdAndUpdate(existingPlant._id, updateData);
            results.updated++;
          } else {
            results.skipped++;
          }
          continue;
        }

        // Create new plant
        const plantData = {
          name: row.name,
          type: row.type,
          variety: row.variety || '',
          category: row.category || '',
          description: row.description || '',
          health: row.health || 'healthy',
          growthStage: row.growthStage || 'seedling',
          organizationId: req.user.organizationId,
          plantedBy: req.user._id,
          plantedDate: row.plantedDate ? new Date(row.plantedDate) : new Date(),
          expectedHarvestDate: row.expectedHarvestDate ? new Date(row.expectedHarvestDate) : null,
          location: row.location || '',
          statusHistory: [{
            date: new Date(),
            status: 'planted',
            health: row.health || 'healthy',
            growthStage: row.growthStage || 'seedling',
            notes: 'Imported from CSV',
            updatedBy: req.user._id,
          }]
        };

        // Try to find plot by name if provided
        if (row.plot) {
          const plot = await Plot.findOne({ name: row.plot, isActive: true });
          if (plot) {
            plantData.plotId = plot._id;
          }
        }

        await Plant.create(plantData);
        results.imported++;

      } catch (error) {
        results.errors.push({
          row: rowNumber,
          error: error.message,
          data: row
        });
      }
    }

    res.json({
      success: true,
      message: `Import completed: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped, ${results.errors.length} errors`,
      results
    });

  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ message: 'Failed to import plants from CSV' });
  }
});

// @route   GET /api/plants/public/:id
// @desc    Get single plant for public viewing (no auth required)
// @access  Public
router.get('/public/:id', async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id)
      .populate('plotId', 'name')
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('plantedBy', 'firstName lastName username');
    
    if (!plant || !plant.isActive) {
      return res.status(404).json({ 
        success: false,
        message: 'Plant not found or inactive' 
      });
    }
    
    // Format the response for public viewing
    const plantObj = plant.toObject();
    
    // Handle plantedBy - if empty, use username, otherwise use full name
    if (!plantObj.plantedBy || !plantObj.plantedBy.firstName) {
      plantObj.plantedBy = {
        firstName: plantObj.plantedBy?.username || plantObj.planter || 'Unknown',
        lastName: ''
      };
    } else {
      plantObj.plantedBy = {
        firstName: `${plantObj.plantedBy.firstName} ${plantObj.plantedBy.lastName}`.trim(),
        lastName: ''
      };
    }
    
    // Calculate plant age
    const plantedDate = new Date(plantObj.plantedDate);
    const now = new Date();
    const ageInDays = Math.floor((now - plantedDate) / (1000 * 60 * 60 * 24));
    const ageInMonths = Math.floor(ageInDays / 30);
    const ageInYears = Math.floor(ageInDays / 365);
    
    let ageString = '';
    if (ageInYears > 0) {
      ageString = `${ageInYears} year${ageInYears > 1 ? 's' : ''}`;
    } else if (ageInMonths > 0) {
      ageString = `${ageInMonths} month${ageInMonths > 1 ? 's' : ''}`;
    } else {
      ageString = `${ageInDays} day${ageInDays > 1 ? 's' : ''}`;
    }
    
    plantObj.age = ageString;
    plantObj.plantedDateFormatted = plantedDate.toLocaleDateString();
    
    // Try to fetch PlantType and PlantVariety details if available
    try {
      // Find PlantType by name (always try to fetch, even if variety is missing)
      if (plantObj.type) {
        // Try to match by organizationId first (more accurate), then fall back to name only
        let plantType;
        if (plantObj.organizationId) {
          const orgId = plantObj.organizationId._id || plantObj.organizationId;
          plantType = await PlantType.findOne({ 
            name: plantObj.type,
            organizationId: orgId,
            isActive: true
          });
        }
        
        // Fall back to name-only match if organizationId match didn't work
        if (!plantType) {
          plantType = await PlantType.findOne({ 
            name: plantObj.type,
            isActive: true
          });
        }
        
        if (plantType) {
          plantObj.plantTypeDetails = plantType.toObject();
        }
      }
      
      // Find PlantVariety by name and type if variety is specified
      // Note: plant.variety field must be set on the plant record for this to work
      if (plantObj.variety && plantObj.type && plantObj.organizationId) {
        const plantTypeForVariety = await PlantType.findOne({ 
          name: plantObj.type,
          isActive: true
        });
        
        if (plantTypeForVariety) {
          // Handle organizationId - it might be an ObjectId or a populated object
          const orgId = plantObj.organizationId._id || plantObj.organizationId;
          
          const plantVariety = await PlantVariety.findOne({
            name: { $regex: new RegExp(`^${plantObj.variety}$`, 'i') },
            plantTypeId: plantTypeForVariety._id,
            organizationId: orgId,
            isActive: true
          }).populate('plantTypeId', 'name category emoji');
          
          if (plantVariety) {
            plantObj.plantVarietyDetails = plantVariety.toObject();
          }
        }
      }
    } catch (varietyError) {
      // Don't fail the request if variety lookup fails - just log and continue
      console.warn('Error fetching plant variety details:', varietyError.message);
    }
    
    // Try to fetch Wikipedia summary (optional, don't fail if it doesn't work)
    try {
      const { fetchWikipediaSummary } = require('../utils/wikipediaApi');
      
      // Build search term - prefer type over name
      let searchTerm = plantObj.type || plantObj.name;
      if (plantObj.variety && plantObj.type) {
        searchTerm = `${plantObj.variety} ${plantObj.type}`;
      } else if (plantObj.variety) {
        searchTerm = plantObj.variety;
      }
      
      const wikipediaData = await fetchWikipediaSummary(searchTerm);
      if (wikipediaData) {
        plantObj.wikipediaData = wikipediaData;
      }
    } catch (wikipediaError) {
      // Silently fail - Wikipedia data is optional
      console.warn('Error fetching Wikipedia data:', wikipediaError.message);
    }
    
    res.json({
      success: true,
      data: plantObj
    });
  } catch (error) {
    console.error('Public plant fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;