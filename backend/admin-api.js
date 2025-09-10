const express = require('express');
const { pool } = require('./database');

const router = express.Router();

// Basic admin login that accepts your provided credentials
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'mrmahmood832@gmail.com' && password === 'ahmad123') {
    return res.json({
      status: 'success',
      data: {
        user: { firstName: 'Admin', lastName: 'User', email, role: 'admin' },
        token: 'local-admin-token'
      }
    });
  }
  return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
});

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ todayOrders }]] = await pool.query("SELECT COUNT(*) AS todayOrders FROM orders WHERE DATE(created_at)=CURDATE()");
    const [[{ totalRevenue }]] = await pool.query('SELECT IFNULL(SUM(final_amount),0) AS totalRevenue FROM orders WHERE payment_status<>\'failed\'' );
    const [[{ pendingOrders }]] = await pool.query("SELECT COUNT(*) AS pendingOrders FROM orders WHERE status='pending'");

    const [recentOrders] = await pool.query(
      'SELECT id, order_number AS orderNumber, final_amount AS finalAmount, status, payment_status AS paymentStatus, created_at AS createdAt FROM orders ORDER BY created_at DESC LIMIT 5'
    );

    return res.json({
      status: 'success',
      data: {
        statistics: { totalOrders, todayOrders, totalRevenue, pendingOrders },
        recentOrders
      }
    });
  } catch (e) {
    console.error('Admin dashboard error:', e);
    return res.status(500).json({ status: 'error', message: 'Failed to load dashboard' });
  }
});

// Orders list with basic pagination/filters
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '20');
    const offset = (page - 1) * limit;

    const [orders] = await pool.query(
      `SELECT o.id, o.order_number AS orderNumber, o.final_amount AS finalAmount, o.status, o.payment_status AS paymentStatus, o.created_at AS createdAt,
              sa.first_name, sa.last_name, sa.email
       FROM orders o
       LEFT JOIN shipping_addresses sa ON sa.order_id = o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM orders');

    return res.json({
      status: 'success',
      data: {
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          finalAmount: o.finalAmount,
          status: o.status,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
          customer: { name: `${o.first_name || ''} ${o.last_name || ''}`.trim(), email: o.email }
        })),
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total }
      }
    });
  } catch (e) {
    console.error('Admin orders error:', e);
    return res.status(500).json({ status: 'error', message: 'Failed to load orders' });
  }
});

// Single order details
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT o.*, sa.first_name, sa.last_name, sa.email, sa.phone, sa.street, sa.city, sa.state, sa.pincode, sa.country
       FROM orders o LEFT JOIN shipping_addresses sa ON sa.order_id = o.id WHERE o.id=?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Order not found' });
    const order = rows[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id=?', [id]);

    return res.json({
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
          items,
          customer: {
            name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
            email: order.email,
            phone: order.phone
          },
          customerAddress: {
            street: order.street,
            city: order.city,
            state: order.state,
            pincode: order.pincode,
            country: order.country
          }
        }
      }
    });
  } catch (e) {
    console.error('Admin order details error:', e);
    return res.status(500).json({ status: 'error', message: 'Failed to load order' });
  }
});

// Update order status (basic)
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['pending','confirmed','processing','shipped','delivered','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ status: 'error', message: 'Invalid status' });
    await pool.query('UPDATE orders SET status=? WHERE id=?', [status, id]);
    return res.json({ status: 'success', message: 'Status updated' });
  } catch (e) {
    console.error('Admin update status error:', e);
    return res.status(500).json({ status: 'error', message: 'Failed to update status' });
  }
});

// Products list for admin
router.get('/products', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return res.json({ status: 'success', data: { products } });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Failed to load products' });
  }
});

// Notifications list
router.get('/notifications', async (req, res) => {
  try {
    const [notifications] = await pool.query('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50');
    return res.json({ status: 'success', data: { notifications } });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Failed to load notifications' });
  }
});

// Mark notification read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE admin_notifications SET is_read=TRUE WHERE id=?', [id]);
    return res.json({ status: 'success' });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Failed to update notification' });
  }
});

module.exports = router;


