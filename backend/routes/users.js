const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { canCreateUser } = require('../middleware/userCreation');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (super_admin, org_admin, domain_admin only)
router.get('/', auth, authorize('super_admin', 'org_admin', 'domain_admin'), async (req, res) => {
  try {
    const { organizationId, role, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };
    
    if (organizationId) filter.organizationId = organizationId;
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .populate({
        path: 'organizationId',
        select: 'name',
        model: 'Organization'
      })
      .populate({
        path: 'domainId',
        select: 'name',
        model: 'Domain'
      })
      .populate({
        path: 'plotIds',
        select: 'name',
        model: 'Plot'
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('GET /api/users - Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (super_admin, org_admin, domain_admin only)
router.get('/:id', auth, authorize('super_admin', 'org_admin', 'domain_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'organizationId',
        select: 'name',
        model: 'Organization'
      })
      .populate({
        path: 'domainId',
        select: 'name',
        model: 'Domain'
      })
      .populate({
        path: 'plotIds',
        select: 'name',
        model: 'Plot'
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (super_admin, org_admin, domain_admin only)
router.post('/', auth, authorize('super_admin', 'org_admin', 'domain_admin'), canCreateUser, async (req, res) => {
  try {
    // Auto-set organizationId for org_admin and domain_admin if not provided
    const userData = { ...req.body };
    
    if (req.user.role === 'org_admin' || req.user.role === 'domain_admin') {
      const userOrgId = req.user.organizationId?._id || req.user.organizationId;
      if (!userData.organizationId) {
        userData.organizationId = userOrgId;
      }
    }
    
    // Auto-set domainId for domain_admin if not provided
    if (req.user.role === 'domain_admin') {
      const userDomainId = req.user.domainId?._id || req.user.domainId;
      if (!userData.domainId) {
        userData.domainId = userDomainId;
      }
    }
    
    const user = new User(userData);
    await user.save();
    
    // Return user without password and populated
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate({
        path: 'organizationId',
        select: 'name',
        model: 'Organization'
      })
      .populate({
        path: 'domainId',
        select: 'name',
        model: 'Domain'
      })
      .populate({
        path: 'plotIds',
        select: 'name',
        model: 'Plot'
      });
    
    const userResponse = populatedUser.toJSON();
    
    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (super_admin, org_admin, domain_admin only)
router.put('/:id', auth, authorize('super_admin', 'org_admin', 'domain_admin'), async (req, res) => {
  try {
    // Get the user being edited
    const userToEdit = await User.findById(req.params.id);
    
    if (!userToEdit) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent non-super-admin users from editing super admin users
    if (userToEdit.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        message: 'You do not have permission to edit super admin users' 
      });
    }
    
    // Check if user is editing their own profile
    const isEditingOwnProfile = req.params.id === req.user._id.toString();
    
    // Remove password from update if not provided
    const updateData = { ...req.body };
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }
    
    // Prevent users from changing their own role and organization
    if (isEditingOwnProfile) {
      // No one can change their own role
      if (updateData.role && updateData.role !== req.user.role) {
        return res.status(403).json({ 
          message: 'You cannot change your own role' 
        });
      }
      
      // Domain admins and org admins cannot change their own organization
      if ((req.user.role === 'domain_admin' || req.user.role === 'org_admin') && 
          updateData.organizationId && 
          updateData.organizationId !== req.user.organizationId.toString()) {
        return res.status(403).json({ 
          message: 'You cannot change your own organization' 
        });
      }
      
      // Domain admins cannot change their own domain
      if (req.user.role === 'domain_admin' && 
          updateData.domainId && 
          updateData.domainId !== req.user.domainId.toString()) {
        return res.status(403).json({ 
          message: 'You cannot change your own domain' 
        });
      }
    }
    
    // Update the user (reuse userToEdit variable)
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Explicitly populate all related fields
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate({
        path: 'organizationId',
        select: 'name',
        model: 'Organization'
      })
      .populate({
        path: 'domainId',
        select: 'name',
        model: 'Domain'
      })
      .populate({
        path: 'plotIds',
        select: 'name',
        model: 'Plot'
      });
    
    res.status(200).json({
      success: true,
      data: populatedUser
    });
  } catch (error) {
    console.error('PUT /api/users/:id - Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private (super_admin, org_admin, domain_admin only)
router.delete('/:id', auth, authorize('super_admin', 'org_admin', 'domain_admin'), async (req, res) => {
  try {
    // Get the user being deleted
    const userToDelete = await User.findById(req.params.id);
    
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent non-super-admin users from deleting super admin users
    if (userToDelete.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        message: 'You do not have permission to delete super admin users' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 