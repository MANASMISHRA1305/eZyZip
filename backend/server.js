const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { testConnection } = require('./database');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const cartRoutes = require('./cart');
const orderRoutes = require('./orders');
const paymentRoutes = require('./payments');
const adminApiRoutes = require('./admin-api');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:5500", "file://"],
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:5500", "file://"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve admin frontend from this backend folder (development)
app.use('/admin', express.static(__dirname));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminApiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Glow Candles API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Socket.io for real-time notifications
io.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);
  
  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin joined admin room');
  });
  
  socket.on('disconnect', () => {
    console.log('Admin disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await testConnection();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`�� Health check: http://localhost:${PORT}/api/health`);
      console.log(`👑 Admin Dashboard: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();