/**
 * MongoDB Database Configuration
 * Establishes connection using Mongoose
 */

const mongoose = require('mongoose');

let connectingPromise = null;

const connectDB = async () => {
  // Reuse existing connection in serverless environments
  if (mongoose.connection?.readyState === 1) return mongoose.connection;
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    try {
      const conn = await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://localhost:27017/fuelnow',
        {}
      );

      console.log(
        `✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`
      );

      // Handle connection events (register once)
      if (!mongoose.connection.__fuelnowListenersAttached) {
        mongoose.connection.__fuelnowListenersAttached = true;

        mongoose.connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
          console.warn('⚠️ MongoDB disconnected.');
        });

        mongoose.connection.on('reconnected', () => {
          console.log('✅ MongoDB reconnected successfully');
        });

        // Graceful shutdown only for non-serverless runtimes
        if (process.env.VERCEL !== '1') {
          process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('👋 MongoDB connection closed through app termination');
            process.exit(0);
          });
        }
      }

      return conn.connection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      console.error('Please ensure MONGO_URI is correct');
      // In serverless environments, do not kill the process; let the request fail.
      if (process.env.VERCEL !== '1') {
        process.exit(1);
      }
      throw error;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
};

module.exports = connectDB;
