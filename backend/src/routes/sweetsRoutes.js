const express = require('express');
const router = express.Router();
const {
  addSweet,
  getAllSweets,
  searchSweets,
  updateSweet,
  deleteSweet
} = require('../controllers/sweetsController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllSweets);
router.get('/search', searchSweets);

// Protected routes (require authentication)
router.post('/', protect, addSweet);
router.put('/:id', protect, updateSweet);

// Admin-only routes
router.delete('/:id', protect, authorize('admin'), deleteSweet);

module.exports = router;
