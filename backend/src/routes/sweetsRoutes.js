const express = require('express');
const router = express.Router();
const {
  addSweet,
  getAllSweets,
  searchSweets,
  updateSweet,
  deleteSweet,
  purchaseSweet,
  restockSweet
} = require('../controllers/sweetsController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllSweets);
router.get('/search', searchSweets);

// Protected routes (require authentication)
router.post('/', protect, addSweet);
router.put('/:id', protect, updateSweet);
router.post('/:id/purchase', protect, purchaseSweet);

// Admin-only routes
router.delete('/:id', protect, authorize('admin'), deleteSweet);
router.post('/:id/restock', protect, authorize('admin'), restockSweet);

module.exports = router;
