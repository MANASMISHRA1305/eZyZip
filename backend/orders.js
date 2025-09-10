const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('./database');

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

// Create order
router.post('/', authenticateToken, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress.firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
  body('shippingAddress.lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
  body('shippingAddress.email').isEmail().withMessage('Valid email is required'),
  body('shippingAddress.phone').isMobilePhone('en-IN').withMessage('Valid phone number is required'),
  body('shippingAddress.street').trim().isLength({ min: 5 }).withMessage('Street address is required'),
  body('shippingAddress.city').trim().isLength({ min: 2 }).withMessage('City is required'),
  body('shippingAddress.state').trim().isLength({ min: 2 }).withMessage('State is required'),
  body('shippingAddress.pincode').isPostalCode('IN').withMessage('Valid pincode is required'),
  body('payment.method').isIn(['razorpay', 'upi', 'cod']).withMessage('Valid payment method is required')
], async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items, shippingAddress, payment } = req.body;

    // Generate order number
    const orderNumber = 'GC' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const [products] = await connection.execute(
        'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
        [item.product]
      );

      if (products.length === 0) {
        throw new Error(`Product with ID ${item.product} not found`);
      }

      const product = products[0];
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        quantity: item.quantity,
        totalPrice: itemTotal
      });
    }

    const gstAmount = subtotal * 0.18; // 18% GST
    const shippingAmount = 0; // Free shipping
    const finalAmount = subtotal + gstAmount + shippingAmount;

    // Create order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (order_number, user_id, total_amount, gst_amount, shipping_amount, 
       final_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, req.user.userId, subtotal, gstAmount, shippingAmount, finalAmount, payment.method]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of orderItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, 
         price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.productName, item.productImage, 
         item.price, item.quantity, item.totalPrice]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    // Insert shipping address
    await connection.execute(
      `INSERT INTO shipping_addresses (order_id, first_name, last_name, email, phone, 
       street, city, state, pincode, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, shippingAddress.firstName, shippingAddress.lastName, 
       shippingAddress.email, shippingAddress.phone, shippingAddress.street,
       shippingAddress.city, shippingAddress.state, shippingAddress.pincode, 
       shippingAddress.country || 'India']
    );

    // Clear user's cart
    await connection.execute(
      'DELETE FROM cart WHERE user_id = ?',
      [req.user.userId]
    );

    // Create admin notification
    await connection.execute(
      `INSERT INTO admin_notifications (type, title, message, order_id) 
       VALUES ('new_order', 'New Order Received', 
       'New order #${orderNumber} has been placed by ${shippingAddress.firstName} ${shippingAddress.lastName}', ?)`,
      [orderId]
    );

    await connection.commit();

    // Emit real-time notification to admin
    req.io.to('admin-room').emit('new-order', {
      orderId,
      orderNumber,
      customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      amount: finalAmount,
      timestamp: new Date()
    });

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        order: {
          id: orderId,
          orderNumber,
          totalAmount: subtotal,
          gstAmount,
          shippingAmount,
          finalAmount,
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: payment.method,
          items: orderItems,
          shippingAddress
        }
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create order'
    });
  } finally {
    connection.release();
  }
});

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.execute(`
      SELECT o.*, sa.first_name, sa.last_name, sa.email, sa.phone, sa.street, 
             sa.city, sa.state, sa.pincode, sa.country
      FROM orders o
      LEFT JOIN shipping_addresses sa ON o.id = sa.order_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.userId]);

    // Get order items for each order
    for (let order of orders) {
      const [items] = await pool.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }

    res.json({
      status: 'success',
      data: {
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          gstAmount: order.gst_amount,
          shippingAmount: order.shipping_amount,
          finalAmount: order.final_amount,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          createdAt: order.created_at,
          items: order.items,
          shippingAddress: {
            firstName: order.first_name,
            lastName: order.last_name,
            email: order.email,
            phone: order.phone,
            street: order.street,
            city: order.city,
            state: order.state,
            pincode: order.pincode,
            country: order.country
          }
        }))
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.execute(`
      SELECT o.*, sa.first_name, sa.last_name, sa.email, sa.phone, sa.street, 
             sa.city, sa.state, sa.pincode, sa.country
      FROM orders o
      LEFT JOIN shipping_addresses sa ON o.id = sa.order_id
      WHERE o.id = ? AND o.user_id = ?
    `, [id, req.user.userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Get order items
    const [items] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );

    res.json({
      status: 'success',
      data: {
        order: {
          id: order.id,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          gstAmount: order.gst_amount,
          shippingAmount: order.shipping_amount,
          finalAmount: order.final_amount,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          createdAt: order.created_at,
          items: items,
          shippingAddress: {
            firstName: order.first_name,
            lastName: order.last_name,
            email: order.email,
            phone: order.phone,
            street: order.street,
            city: order.city,
            state: order.state,
            pincode: order.pincode,
            country: order.country
          }
        }
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order'
    });
  }
});

module.exports = router;

// Guest checkout (no auth) - saves order from frontend cart without requiring login
router.post('/guest', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { items, shippingAddress, payment } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No items provided' });
    }
    if (!shippingAddress || !payment || !payment.method) {
      return res.status(400).json({ status: 'error', message: 'Invalid request body' });
    }

    // Generate order number
    const orderNumber = 'GC' + Date.now().toString(36).toUpperCase();

    // Build items ensuring a valid product_id exists (insert placeholder products if needed)
    let subtotal = 0;
    const normalizedItems = [];

    for (const item of items) {
      const name = String(item.name || '').trim();
      if (!name) continue;

      // Parse price like "Rs. 199"
      const priceNumber = parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) || 0;
      const quantity = parseInt(item.quantity || 1);

      subtotal += priceNumber * quantity;

      // Find or create product by name
      let productId;
      const [existing] = await connection.execute('SELECT id FROM products WHERE name = ? LIMIT 1', [name]);
      if (existing.length > 0) {
        productId = existing[0].id;
      } else {
        const [insertP] = await connection.execute(
          'INSERT INTO products (name, description, price, image, category, stock_quantity, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
          [name, '', priceNumber, item.image || null, 'guest', 1000]
        );
        productId = insertP.insertId;
      }

      normalizedItems.push({
        productId,
        productName: name,
        productImage: item.image || null,
        price: priceNumber,
        quantity,
        totalPrice: priceNumber * quantity
      });
    }

    if (normalizedItems.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid items provided' });
    }

    const gstAmount = subtotal * 0.18;
    const shippingAmount = 0;
    const finalAmount = subtotal + gstAmount + shippingAmount;

    const initialStatus = payment.method === 'cod' ? 'pending' : 'confirmed';
    const paymentStatus = payment.method === 'cod' ? 'pending' : 'paid';

    // Create order (no user_id for guest)
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (order_number, user_id, total_amount, gst_amount, shipping_amount, final_amount, status, payment_status, payment_method, payment_id)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, subtotal, gstAmount, shippingAmount, finalAmount, initialStatus, paymentStatus, payment.method, payment.paymentId || null]
    );

    const orderId = orderResult.insertId;

    // Insert items
    for (const it of normalizedItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, it.productId, it.productName, it.productImage, it.price, it.quantity, it.totalPrice]
      );
    }

    // Insert shipping address
    await connection.execute(
      `INSERT INTO shipping_addresses (order_id, first_name, last_name, email, phone, street, city, state, pincode, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        shippingAddress.firstName,
        shippingAddress.lastName,
        shippingAddress.email,
        shippingAddress.phone,
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.pincode,
        shippingAddress.country || 'India'
      ]
    );

    // Notification for admin
    await connection.execute(
      `INSERT INTO admin_notifications (type, title, message, order_id) VALUES (?, ?, ?, ?)`,
      [
        payment.method === 'cod' ? 'new_order' : 'payment_received',
        payment.method === 'cod' ? 'New COD Order' : 'Payment Received',
        payment.method === 'cod'
          ? `New COD order #${orderNumber} - ₹${finalAmount}`
          : `Payment received for order #${orderNumber} - ₹${finalAmount}`,
        orderId
      ]
    );

    await connection.commit();

    // Realtime emit
    try {
      if (req.io) {
        const event = payment.method === 'cod' ? 'new-cod-order' : 'payment-received';
        req.io.to('admin-room').emit(event, {
          orderId,
          orderNumber,
          amount: finalAmount,
          timestamp: new Date()
        });
      }
    } catch (e) {
      // ignore socket errors
    }

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        order: {
          id: orderId,
          orderNumber,
          finalAmount,
          status: initialStatus,
          paymentStatus,
          paymentMethod: payment.method
        }
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Guest order error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create order' });
  } finally {
    connection.release();
  }
});