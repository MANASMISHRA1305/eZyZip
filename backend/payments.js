const express = require('express');
const Razorpay = require('razorpay');
const jwt = require('jsonwebtoken');
const { pool } = require('./database');

const router = express.Router();

// Initialize Razorpay (optional)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

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

// Create Razorpay order
router.post('/razorpay/create-order', authenticateToken, async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        status: 'error',
        message: 'Razorpay not configured'
      });
    }
    
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and amount are required'
      });
    }

    // Verify order belongs to user
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const order = orders[0];
    if (order.payment_status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Order payment already processed'
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${order.order_number}`,
      notes: {
        orderId: orderId,
        orderNumber: order.order_number
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Store payment record
    await pool.execute(
      `INSERT INTO payments (order_id, payment_id, amount, currency, status, method, gateway) 
       VALUES (?, ?, ?, ?, 'pending', 'razorpay', 'razorpay')`,
      [orderId, razorpayOrder.id, amount, 'INR']
    );

    res.json({
      status: 'success',
      data: {
        order: razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment order'
    });
  }
});

// Verify Razorpay payment
router.post('/razorpay/verify', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID, payment ID, and signature are required'
      });
    }

    // Verify payment signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment signature'
      });
    }

    // Get order details
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Update payment status
    await connection.execute(
      'UPDATE payments SET status = ?, gateway_payment_id = ? WHERE order_id = ? AND payment_id = ?',
      ['captured', paymentId, orderId, paymentId]
    );

    // Update order status
    await connection.execute(
      'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
      ['paid', 'confirmed', orderId]
    );

    // Create admin notification
    await connection.execute(
      `INSERT INTO admin_notifications (type, title, message, order_id) 
       VALUES ('payment_received', 'Payment Received', 
       'Payment received for order #${order.order_number} - ₹${order.final_amount}', ?)`,
      [orderId]
    );

    await connection.commit();

    // Emit real-time notification to admin
    req.io.to('admin-room').emit('payment-received', {
      orderId,
      orderNumber: order.order_number,
      amount: order.final_amount,
      timestamp: new Date()
    });

    res.json({
      status: 'success',
      message: 'Payment verified successfully',
      data: {
        orderId,
        paymentId,
        status: 'paid'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Verify payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Payment verification failed'
    });
  } finally {
    connection.release();
  }
});

// Confirm COD payment
router.post('/cod/confirm', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required'
      });
    }

    // Verify order belongs to user
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND payment_method = "cod"',
      [orderId, req.user.userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'COD order not found'
      });
    }

    const order = orders[0];

    // Update order status
    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['confirmed', orderId]
    );

    // Create payment record for COD
    await pool.execute(
      `INSERT INTO payments (order_id, amount, currency, status, method, gateway) 
       VALUES (?, ?, 'INR', 'pending', 'cod', 'cod')`,
      [orderId, order.final_amount]
    );

    // Create admin notification
    await pool.execute(
      `INSERT INTO admin_notifications (type, title, message, order_id) 
       VALUES ('new_order', 'New COD Order', 
       'New COD order #${order.order_number} - ₹${order.final_amount}', ?)`,
      [orderId]
    );

    // Emit real-time notification to admin
    req.io.to('admin-room').emit('new-cod-order', {
      orderId,
      orderNumber: order.order_number,
      amount: order.final_amount,
      timestamp: new Date()
    });

    res.json({
      status: 'success',
      message: 'COD order confirmed successfully',
      data: {
        orderId,
        status: 'confirmed'
      }
    });

  } catch (error) {
    console.error('Confirm COD error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to confirm COD order'
    });
  }
});

module.exports = router;