const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      select: 'name image price description shop'
    });

    if (!cart) {
      return res.json({
        success: true,
        cartItems: [],
        totalQuantity: 0,
        totalAmount: 0,
        billAmount: 0
      });
    }

    // Convert cart items to the format expected by frontend
    const cartItems = [];
    let totalQuantity = 0;
    let totalAmount = 0;
    let billAmount = 0;

    cart.items.forEach(item => {
      cartItems.push({
        product: {
          id: item.productId._id.toString(),
          title: item.productId.name,
          image: item.productId.image,
          price: item.productId.price,
          newPrice: item.productId.price, // Use regular price since no discount price field
          mrp: item.productId.price, // Use regular price as MRP
          subTitle: item.productId.description,
          shopId: item.productId.shop
        },
        quantity: item.quantity
      });

      totalQuantity += item.quantity;
      totalAmount += item.productId.price * item.quantity;
      billAmount += item.productId.price * item.quantity; // Use regular price for bill amount
    });

    // console.log('📦 Cart items retrieved successfully:', cartItems.length, 'items found')

    res.json({
      success: true,
      cartItems,
      totalQuantity,
      totalAmount,
      billAmount
    });
  } catch (error) {
    console.error('❌ Failed to fetch user cart:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1, shopId } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId,
        items: [{
          productId,
          quantity,
          shopId
        }]
      });
    } else {
      // Check if product already exists in cart
      const existingItem = cart.items.find(item => 
        item.productId.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          productId,
          quantity,
          shopId
        });
      }
    }

    await cart.save();

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.productId',
      select: 'name image price description shop'
    });

    // Convert to frontend format
    const cartItems = [];
    let totalQuantity = 0;
    let totalAmount = 0;
    let billAmount = 0;

    updatedCart.items.forEach(item => {
      cartItems.push({
        product: {
          id: item.productId._id.toString(),
          title: item.productId.name,
          image: item.productId.image,
          price: item.productId.price,
          newPrice: item.productId.price, // Use regular price since no discount price field
          mrp: item.productId.price, // Use regular price as MRP
          subTitle: item.productId.description,
          shopId: item.productId.shop
        },
        quantity: item.quantity
      });

      totalQuantity += item.quantity;
      totalAmount += item.productId.price * item.quantity;
      billAmount += item.productId.price * item.quantity; // Use regular price for bill amount
    });

    res.json({
      success: true,
      cartItems,
      totalQuantity,
      totalAmount,
      billAmount
    });
  } catch (error) {
    console.error('❌ Failed to add item to cart:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (quantity === 0) {
      // Remove item from cart
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.productId',
      select: 'name image price description shop'
    });

    // Convert to frontend format
    const cartItems = [];
    let totalQuantity = 0;
    let totalAmount = 0;
    let billAmount = 0;

    updatedCart.items.forEach(item => {
      cartItems.push({
        product: {
          id: item.productId._id.toString(),
          title: item.productId.name,
          image: item.productId.image,
          price: item.productId.price,
          newPrice: item.productId.price, // Use regular price since no discount price field
          mrp: item.productId.price, // Use regular price as MRP
          subTitle: item.productId.description,
          shopId: item.productId.shop
        },
        quantity: item.quantity
      });

      totalQuantity += item.quantity;
      totalAmount += item.productId.price * item.quantity;
      billAmount += item.productId.price * item.quantity; // Use regular price for bill amount
    });

    res.json({
      success: true,
      cartItems,
      totalQuantity,
      totalAmount,
      billAmount
    });
  } catch (error) {
    console.error('❌ Failed to update cart item quantity:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.productId',
      select: 'name image price description shop'
    });

    // Convert to frontend format
    const cartItems = [];
    let totalQuantity = 0;
    let totalAmount = 0;
    let billAmount = 0;

    updatedCart.items.forEach(item => {
      cartItems.push({
        product: {
          id: item.productId._id.toString(),
          title: item.productId.name,
          image: item.productId.image,
          price: item.productId.price,
          newPrice: item.productId.price, // Use regular price since no discount price field
          mrp: item.productId.price, // Use regular price as MRP
          subTitle: item.productId.description,
          shopId: item.productId.shop
        },
        quantity: item.quantity
      });

      totalQuantity += item.quantity;
      totalAmount += item.productId.price * item.quantity;
      billAmount += item.productId.price * item.quantity; // Use regular price for bill amount
    });

    res.json({
      success: true,
      cartItems,
      totalQuantity,
      totalAmount,
      billAmount
    });
  } catch (error) {
    console.error('❌ Failed to remove item from cart:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.json({
        success: true,
        message: 'Cart is already empty'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cartItems: [],
      totalQuantity: 0,
      totalAmount: 0,
      billAmount: 0
    });
  } catch (error) {
    console.error('❌ Failed to clear user cart:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

// Sync local cart to backend (when user registers)
exports.syncLocalCart = async (req, res) => {
  try {
    console.log('🛒 Starting cart synchronization process...');
    console.log('📋 Received cart data:', JSON.stringify(req.body, null, 2));
    console.log('👤 User authentication verified:', req.user ? 'User logged in' : 'No user found');
    
    if (!req.user) {
      console.log('❌ Authentication failed: No user found in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userId = req.user.userId;
    console.log('🆔 Processing cart for user ID:', userId);
    
    const { items } = req.body;
    console.log('📦 Items to synchronize:', items ? `${items.length} items` : 'No items');

    if (!Array.isArray(items)) {
      console.log('❌ Validation error: Items must be an array format');
      return res.status(400).json({
        success: false,
        message: 'Invalid items format'
      });
    }

    let cart = await Cart.findOne({ userId });
    console.log('🛒 Cart lookup result:', cart ? `Found existing cart with ${cart.items.length} items` : 'No existing cart found');
    
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      console.log('🆕 Created new empty cart for user');
    }

    // Add all items from local cart
    for (const item of items) {
      console.log('🔄 Processing cart item:', `Product ID: ${item.productId}, Quantity: ${item.quantity}`);
      
      // Validate item structure
      if (!item || !item.productId || !item.quantity) {
        console.log('❌ Invalid item structure detected:', JSON.stringify(item));
        continue; // Skip invalid items
      }
      
      const existingItem = cart.items.find(cartItem => 
        cartItem.productId.toString() === item.productId
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
        console.log('➕ Updated existing item quantity:', `Product ${item.productId} quantity increased to ${existingItem.quantity}`);
      } else {
        cart.items.push({
          productId: item.productId,
          quantity: item.quantity,
          shopId: item.shopId || null
        });
        console.log('🆕 Added new item to cart:', `Product ${item.productId} with quantity ${item.quantity}`);
      }
    }

    await cart.save();
    console.log('💾 Cart data saved successfully to database');

    // Return updated cart with populated product data
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.productId',
      select: 'name image price description shop'
    });

    // Convert to frontend format
    const cartItems = [];
    let totalQuantity = 0;
    let totalAmount = 0;
    let billAmount = 0;

    updatedCart.items.forEach(item => {
      cartItems.push({
        product: {
          id: item.productId._id.toString(),
          title: item.productId.name,
          image: item.productId.image,
          price: item.productId.price,
          newPrice: item.productId.price, // Use regular price since no discount price field
          mrp: item.productId.price, // Use regular price as MRP
          subTitle: item.productId.description,
          shopId: item.productId.shop
        },
        quantity: item.quantity
      });

      totalQuantity += item.quantity;
      totalAmount += item.productId.price * item.quantity;
      billAmount += item.productId.price * item.quantity; // Use regular price for bill amount
    });

    res.json({
      success: true,
      message: 'Cart synced successfully',
      cartItems,
      totalQuantity,
      totalAmount,
      billAmount
    });
  } catch (error) {
    console.error('❌ Cart synchronization failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sync cart'
    });
  }
};