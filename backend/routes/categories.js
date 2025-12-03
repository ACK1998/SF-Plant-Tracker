const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const { auth } = require('../middleware/auth');

// Helper function to check if user can edit a category
const canEditCategory = (user, category) => {
  // Super admin can edit any category
  if (user.role === 'super_admin') return true;
  
  // Check if required fields exist
  if (!category.organizationId || !user.organizationId) return false;
  
  // Org admin can edit any category in their organization
  if (user.role === 'org_admin' && category.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Domain admin can edit any category within their domain
  if (user.role === 'domain_admin' && 
      category.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Application user can only edit categories they created
  if (user.role === 'application_user' && 
      category.organizationId.toString() === user.organizationId.toString() &&
      category.createdBy.toString() === user._id.toString()) return true;
  
  return false;
};

// Helper function to check if user can delete a category
const canDeleteCategory = (user, category) => {
  // Super admin can delete any category
  if (user.role === 'super_admin') return true;
  
  // Check if required fields exist
  if (!category.organizationId || !user.organizationId) return false;
  
  // Org admin can delete any category in their organization
  if (user.role === 'org_admin' && category.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Domain admin can delete any category within their domain
  if (user.role === 'domain_admin' && 
      category.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Application user can only delete categories they created
  if (user.role === 'application_user' && 
      category.organizationId.toString() === user.organizationId.toString() &&
      category.createdBy.toString() === user._id.toString()) return true;
  
  return false;
};

// GET /api/categories - Get all categories with pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, organizationId } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    // Extract user's organizationId - handle both populated object and ObjectId
    const getUserOrgId = () => {
      if (!req.user.organizationId) return null;
      let orgId = null;
      // If it's a populated object, get the _id
      if (typeof req.user.organizationId === 'object' && req.user.organizationId._id) {
        orgId = req.user.organizationId._id;
      } else {
        // If it's already an ObjectId, use it
        orgId = req.user.organizationId;
      }
      // Ensure it's a proper ObjectId
      if (orgId && !mongoose.Types.ObjectId.isValid(orgId)) {
        console.warn('Invalid organizationId format:', orgId);
        return null;
      }
      return orgId ? new mongoose.Types.ObjectId(orgId) : null;
    };

    // Apply role-based filtering for categories
    if (req.user.role === 'super_admin') {
      // Super admin can see all categories (only filter if specifically requested)
      if (organizationId) {
        filter.organizationId = organizationId;
      }
      // If no organizationId specified, don't filter by organization (show all)
    } else {
      // Other users can only see categories from their organization
      const userOrgId = getUserOrgId();
      // Only filter by organizationId if it's actually set
      if (userOrgId) {
        filter.organizationId = userOrgId;
      } else {
        // If user doesn't have an organizationId, they might not see any categories
        // This is expected behavior - users should be assigned to an organization
        console.warn(`User ${req.user._id} (role: ${req.user.role}) has no organizationId assigned`);
      }
    }
    
    const categories = await Category.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name')
      .sort({ displayName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Category.countDocuments(filter);

    res.json({
      success: true,
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// GET /api/categories/all - Get all categories without pagination
router.get('/all', auth, async (req, res) => {
  try {
    const { organizationId } = req.query;

    // Build filter
    const filter = { isActive: true };

    // Extract user's organizationId - handle both populated object and ObjectId
    const getUserOrgId = () => {
      if (!req.user.organizationId) return null;
      let orgId = null;
      // If it's a populated object, get the _id
      if (typeof req.user.organizationId === 'object' && req.user.organizationId._id) {
        orgId = req.user.organizationId._id;
      } else {
        // If it's already an ObjectId, use it
        orgId = req.user.organizationId;
      }
      // Ensure it's a proper ObjectId
      if (orgId && !mongoose.Types.ObjectId.isValid(orgId)) {
        console.warn('Invalid organizationId format:', orgId);
        return null;
      }
      return orgId ? new mongoose.Types.ObjectId(orgId) : null;
    };

    // Apply role-based filtering for categories
    if (req.user.role === 'super_admin') {
      // Super admin can see all categories (only filter if specifically requested)
      if (organizationId) {
        filter.organizationId = organizationId;
      }
      // If no organizationId specified, don't filter by organization (show all)
    } else {
      // Other users can only see categories from their organization
      const userOrgId = getUserOrgId();
      // Only filter by organizationId if it's actually set
      if (userOrgId) {
        filter.organizationId = userOrgId;
      } else {
        // If user doesn't have an organizationId, they might not see any categories
        // This is expected behavior - users should be assigned to an organization
        console.warn(`User ${req.user._id} (role: ${req.user.role}) has no organizationId assigned`);
      }
    }
    
    const categories = await Category.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name')
      .sort({ displayName: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
});

// POST /api/categories - Create new category
router.post('/', auth, async (req, res) => {
  try {
    const { 
      name, 
      displayName, 
      emoji, 
      description, 
      color 
    } = req.body;

    // Validate required fields
    if (!name || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Name and display name are required'
      });
    }

    // Check if category with same name already exists in the organization
    const existingCategory = await Category.findOne({
      name: name.toLowerCase(),
      organizationId: req.user.organizationId?._id || req.user.organizationId
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    // Create new category
    const category = new Category({
      name: name.toLowerCase(),
      displayName,
      emoji: emoji || '🌱',
      description,
      color: color || '#4ade80',
      createdBy: req.user._id,
      organizationId: req.user.organizationId?._id || req.user.organizationId
    });

    const savedCategory = await category.save();
    
    // Populate the created category
    const populatedCategory = await Category.findById(savedCategory._id)
      .populate('createdBy', 'firstName lastName')
      .populate('organizationId', 'name');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check permissions
    if (!canEditCategory(req.user, category)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this category'
      });
    }

    const { 
      name, 
      displayName, 
      emoji, 
      description, 
      color 
    } = req.body;

    // Check if name is being changed and if it conflicts with existing category
    if (name && name.toLowerCase() !== category.name) {
      const existingCategory = await Category.findOne({
        name: name.toLowerCase(),
        organizationId: req.user.organizationId?._id || req.user.organizationId,
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'A category with this name already exists'
        });
      }
    }

    // Update category
    const updateData = {};
    if (name) updateData.name = name.toLowerCase();
    if (displayName) updateData.displayName = displayName;
    if (emoji) updateData.emoji = emoji;
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName')
     .populate('organizationId', 'name');

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check permissions
    if (!canDeleteCategory(req.user, category)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this category'
      });
    }

    // Check if category is default (prevent deletion of default categories)
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default categories'
      });
    }

    // Soft delete by setting isActive to false
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

module.exports = router;
