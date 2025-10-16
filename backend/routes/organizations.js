const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/organizations
// @desc    Get all organizations (filtered by user role)
// @access  Private (super_admin, org_admin, domain_admin)
router.get('/', auth, authorize('super_admin', 'org_admin', 'domain_admin'), async (req, res) => {
  try {
    let filter = { isActive: true };
    
    // If user is not super_admin, only show their organization
    if (req.user.role !== 'super_admin') {
      filter._id = req.user.organizationId;
    }
    
    const organizations = await Organization.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/organizations/:id
// @desc    Get single organization
// @access  Private (super_admin, org_admin, domain_admin)
router.get('/:id', auth, authorize('super_admin', 'org_admin', 'domain_admin'), async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Check if user has access to this organization
    if (req.user.role !== 'super_admin' && 
        organization._id.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ message: 'Access denied to this organization' });
    }
    
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/organizations
// @desc    Create new organization
// @access  Private (super_admin only)
router.post('/', auth, authorize('super_admin'), async (req, res) => {
  try {
    const orgData = {
      ...req.body,
      createdBy: req.user._id
    };

    const organization = new Organization(orgData);
    await organization.save();
    
    const populatedOrg = await Organization.findById(organization._id)
      .populate('createdBy', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      data: populatedOrg
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/organizations/:id
// @desc    Update organization
// @access  Private (super_admin only)
router.put('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName');
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/organizations/:id
// @desc    Delete organization (soft delete)
// @access  Private (super_admin only)
router.delete('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 