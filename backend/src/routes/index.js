const express = require('express');

// Import route modules
const authRoutes = require('./auth');
const adminRoutes = require('./admin');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

module.exports = router;