const express = require('express');
const jwt = require('jsonwebtoken');
const db = require("./config/database");


const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [cartItems] = await pool.execute(`
      SELECT c.*, p.name, p.price, p.image, p.stock_quantity
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND p.is_active = TRUE
      ORDER BY c.created_at DESC
    `, [req.user.userId]);

    res.json({
      status: 'success',
      data: {
        cart: {
          items: cartItems.map(item => ({
            id: item.id,
            productId: item.product_id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            stockQuantity: item.stock_quantity,
            totalPrice: item.price * item.quantity
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cart'
    });
  }
});

// Add item to cart
router.post('/items', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID and valid quantity required'
      });
    }

    // Check if product exists and is active
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const product = products[0];
    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient stock'
      });
    }

    // Check if item already exists in cart
    const [existingItems] = await pool.execute(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.userId, productId]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient stock for requested quantity'
        });
      }

      await pool.execute(
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [newQuantity, req.user.userId, productId]
      );
    } else {
      // Add new item
      await pool.execute(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.userId, productId, quantity]
      );
    }

    res.json({
      status: 'success',
      message: 'Item added to cart successfully'
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add item to cart'
    });
  }
});

// Update cart item quantity
router.put('/items/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid quantity required'
      });
    }

    // Check product stock
    const [products] = await pool.execute(
      'SELECT stock_quantity FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    if (products[0].stock_quantity < quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient stock'
      });
    }

    // Update cart item
    const [result] = await pool.execute(
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, req.user.userId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart item not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Cart updated successfully'
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update cart'
    });
  }
});

// Remove item from cart
router.delete('/items/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.userId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart item not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Item removed from cart successfully'
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove item from cart'
    });
  }
});

// Clear entire cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM cart WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({
      status: 'success',
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cart'
    });
  }
});

module.exports = router;