const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncLocalCart
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(authenticate);

// GET /api/v1/cart - Get user's cart
router.get('/', getCart);

// POST /api/v1/cart/add - Add item to cart
router.post('/add', addToCart);

// PUT /api/v1/cart/update - Update cart item quantity
router.put('/update', updateCartItem);

// DELETE /api/v1/cart/remove - Remove item from cart
router.delete('/remove', removeFromCart);

// DELETE /api/v1/cart/clear - Clear entire cart
router.delete('/clear', clearCart);

// POST /api/v1/cart/sync - Sync local cart to backend (when user registers)
router.post('/sync', syncLocalCart);

module.exports = router; 