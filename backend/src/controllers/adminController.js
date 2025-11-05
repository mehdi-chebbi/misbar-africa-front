const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Get all users with pagination and filtering
 */
const getAllUsers = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';

    const result = await User.getAll(page, limit, search, role);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: 'Internal server error'
    });
  }
};

/**
 * Get single user by ID
 */
const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        error: 'Invalid ID format'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User does not exist'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: 'Internal server error'
    });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    const { email, role, is_active } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        error: 'Invalid ID format'
      });
    }

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User does not exist'
      });
    }

    // If changing email, check if email already exists
    if (email && email !== existingUser.email) {
      const emailExists = await User.findByEmail(email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
          error: 'Email conflict'
        });
      }
    }

    // Update user
    const updatedUser = await User.update(userId, { email, role, is_active });

    // Log activity
    await User.logActivity(req.user.id, 'user_updated',
      `Updated user ${existingUser.email}`, req.ip);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: 'Internal server error'
    });
  }
};

/**
 * Delete user (soft delete - deactivate)
 */
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        error: 'Invalid ID format'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User does not exist'
      });
    }

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
        error: 'Self-deletion not allowed'
      });
    }

    // Prevent deleting admin users (optional protection)
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user',
        error: 'Admin deletion not allowed'
      });
    }

    // Deactivate user (soft delete)
    await User.deactivate(userId);

    // Log activity
    await User.logActivity(req.user.id, 'user_deleted',
      `Deactivated user ${user.email}`, req.ip);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: 'Internal server error'
    });
  }
};

/**
 * Get system statistics
 */
const getStats = async (req, res) => {
  try {
    const stats = await User.getStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: 'Internal server error'
    });
  }
};

/**
 * Get user activity logs
 */
const getActivityLogs = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const userId = req.query.userId ? parseInt(req.query.userId) : null;
    const action = req.query.action || null;

    const result = await User.getActivityLogs(page, limit, userId, action);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity logs',
      error: 'Internal server error'
    });
  }
};

// Validation rules
const updateUserValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const getUserValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role filter must be either "user" or "admin"')
];

const getLogsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  query('action')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Action must be less than 50 characters')
];

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStats,
  getActivityLogs,
  updateUserValidation,
  getUserValidation,
  getLogsValidation
};