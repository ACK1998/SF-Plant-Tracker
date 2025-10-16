const express = require('express');
const router = express.Router();
const Plot = require('../models/Plot');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/plots
// @desc    Get all plots
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { organizationId, domainId, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };
    
    // Apply role-based filtering
    if (req.user.role === 'org_admin') {
      // Org admin can see all plots in their organization
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'domain_admin') {
      // Domain admin can see all plots in their organization
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'application_user') {
      // Application user can see all plots in their organization
      filter.organizationId = req.user.organizationId;
    }
    // Super admin can see all plots (no additional filtering)
    
    // Apply additional filters from query parameters (but don't override role-based organizationId)
    if (domainId && domainId !== 'undefined' && domainId !== 'null') {
      filter.domainId = domainId;
    }

    const plots = await Plot.find(filter)
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Plot.countDocuments(filter);
    
    res.json({
      success: true,
      data: plots,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/plots/:id
// @desc    Get single plot
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id)
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('createdBy', 'firstName lastName');
    
    if (!plot) {
      return res.status(404).json({ message: 'Plot not found' });
    }
    
    res.json({
      success: true,
      data: plot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/plots
// @desc    Create new plot
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const plotData = {
      ...req.body,
      createdBy: req.user._id
    };

    const plot = new Plot(plotData);
    await plot.save();
    
    const populatedPlot = await Plot.findById(plot._id)
      .populate('domainId', 'name')
      .populate('organizationId', 'name')
      .populate('createdBy', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      data: populatedPlot
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/plots/:id
// @desc    Update plot
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // First, get the existing plot to preserve the createdBy field
    const existingPlot = await Plot.findById(req.params.id);
    if (!existingPlot) {
      return res.status(404).json({ message: 'Plot not found' });
    }

    // Prepare update data, preserving the createdBy field
    const updateData = {
      ...req.body,
      createdBy: existingPlot.createdBy // Preserve the original createdBy
    };

    const plot = await Plot.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('domainId', 'name')
    .populate('organizationId', 'name')
    .populate('createdBy', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      data: plot
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/plots/:id
// @desc    Delete plot (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const plot = await Plot.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!plot) {
      return res.status(404).json({ message: 'Plot not found' });
    }
    
    res.json({
      success: true,
      message: 'Plot deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 