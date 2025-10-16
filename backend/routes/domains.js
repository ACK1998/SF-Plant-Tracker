const express = require('express');
const router = express.Router();
const Domain = require('../models/Domain');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/domains
// @desc    Get all domains (filtered by user role)
// @access  Private (super_admin, org_admin, domain_admin)
router.get('/', auth, authorize('super_admin', 'org_admin', 'domain_admin'), async (req, res) => {
  try {
    console.log('Domain GET - Request query:', req.query);
    console.log('Domain GET - User:', req.user._id);
    
    const { organizationId, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };
    
    // Apply role-based filtering
    if (req.user.role === 'org_admin') {
      // Org admin can see all domains in their organization
      filter.organizationId = req.user.organizationId;
    } else if (req.user.role === 'domain_admin') {
      // Domain admin can see all domains in their organization (not just their own domain)
      filter.organizationId = req.user.organizationId;
    }
    // Super admin can see all domains (no additional filtering)
    
    // Only filter by organizationId if it's explicitly provided and user has permission
    if (organizationId && organizationId !== 'undefined' && organizationId !== 'null') {
      if (req.user.role === 'super_admin' || 
          (req.user.role === 'org_admin' && organizationId === req.user.organizationId.toString())) {
        filter.organizationId = organizationId;
      }
    }

    console.log('Domain GET - Filter:', filter);

    const domains = await Domain.find(filter)
      .populate('organizationId', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Domain.countDocuments(filter);
    
    console.log('Domain GET - Found domains:', domains.length);
    
    res.json({
      success: true,
      data: domains,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Domain GET - Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/domains/:id
// @desc    Get single domain
// @access  Private (super_admin, org_admin, domain_admin)
router.get('/:id', auth, authorize('super_admin', 'org_admin', 'domain_admin'), async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id)
      .populate('organizationId', 'name')
      .populate('createdBy', 'firstName lastName');
    
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    
    // Check if user has access to this domain
    if (req.user.role === 'domain_admin' && 
        domain._id.toString() !== req.user.domainId.toString()) {
      return res.status(403).json({ message: 'Access denied to this domain' });
    }
    
    if (req.user.role !== 'super_admin' && 
        domain.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ message: 'Access denied to this domain' });
    }
    
    res.json({
      success: true,
      data: domain
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/domains
// @desc    Create new domain
// @access  Private (super_admin, org_admin only)
router.post('/', auth, authorize('super_admin', 'org_admin'), async (req, res) => {
  try {
    console.log('Domain POST - Request body:', req.body);
    console.log('Domain POST - User:', req.user._id);
    
    const domainData = {
      ...req.body,
      createdBy: req.user._id
    };

    console.log('Domain POST - Domain data to save:', domainData);

    const domain = new Domain(domainData);
    await domain.save();
    
    console.log('Domain POST - Domain saved successfully:', domain._id);
    
    const populatedDomain = await Domain.findById(domain._id)
      .populate('organizationId', 'name')
      .populate('createdBy', 'firstName lastName');
    
    console.log('Domain POST - Populated domain:', populatedDomain);
    
    res.status(201).json({
      success: true,
      data: populatedDomain
    });
  } catch (error) {
    console.error('Domain POST - Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/domains/:id
// @desc    Update domain
// @access  Private (super_admin, org_admin only)
router.put('/:id', auth, authorize('super_admin', 'org_admin'), async (req, res) => {
  try {
    console.log('Domain PUT - Request params:', req.params);
    console.log('Domain PUT - Request body:', req.body);
    console.log('Domain PUT - User:', req.user._id);
    
    // Remove fields that shouldn't be updated
    const { _id, createdBy, createdAt, updatedAt, ...updateData } = req.body;
    
    console.log('Domain PUT - Cleaned update data:', updateData);
    
    const domain = await Domain.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('organizationId', 'name')
    .populate('createdBy', 'firstName lastName');
    
    if (!domain) {
      console.log('Domain PUT - Domain not found:', req.params.id);
      return res.status(404).json({ message: 'Domain not found' });
    }
    
    console.log('Domain PUT - Domain updated successfully:', domain);
    
    res.status(200).json({
      success: true,
      data: domain
    });
  } catch (error) {
    console.error('Domain PUT - Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/domains/:id
// @desc    Delete domain (soft delete)
// @access  Private (super_admin, org_admin only)
router.delete('/:id', auth, authorize('super_admin', 'org_admin'), async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    
    res.json({
      success: true,
      message: 'Domain deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 