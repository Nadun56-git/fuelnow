/**
 * FuelNow - Main Server Entry Point
 * Express + Socket.io + MongoDB
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require('./config/db');

// Route imports
const stationRoutes = require('./routes/stationRoutes');
const fuelRoutes = require('./routes/fuelRoutes');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');
const { initializeSocketHandlers } = require('./socket/socketHandlers');

// Initialize Express app
const app = express();

// Create HTTP server only for non-serverless runtimes
const server = http.createServer(app);

// Socket.io is incompatible with Vercel serverless functions.
// Enable it only when explicitly requested.
const ENABLE_SOCKET_IO = process.env.ENABLE_SOCKET_IO === 'true' && process.env.VERCEL !== '1';
const io = ENABLE_SOCKET_IO
  ? new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PATCH'],
        credentials: true,
      },
    })
  : null;

// Make io accessible to routes (may be null)
app.set('io', io);

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Logging middleware
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/stations', stationRoutes);
app.use('/api/stations', fuelRoutes); // Mount fuel routes under /api/stations for PATCH /:id/fuel

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FuelNow API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global error handler
app.use(errorHandler);

// Initialize Socket.io handlers (only when enabled)
if (io) {
  initializeSocketHandlers(io);
}

// Start server only when running as a long-lived Node process (not in Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 FuelNow server running on port ${PORT}`);
    if (io) console.log(`📡 Socket.io initialized for real-time updates`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error(err.stack);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

module.exports = { app, server, io };
