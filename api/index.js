// Vercel serverless function wrapper for Express backend
const connectDB = require('../backend/config/database');
const mongoose = require('mongoose');

// Ensure database connection for serverless functions
let isConnected = false;
let connectionPromise = null;

const connectToDatabase = async () => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  // Start new connection
  connectionPromise = (async () => {
    try {
      if (mongoose.connection.readyState === 0) {
        await connectDB();
        isConnected = true;
      }
      connectionPromise = null;
    } catch (error) {
      console.error('Database connection error:', error);
      connectionPromise = null;
      // Don't throw - let the request continue, connection will retry
    }
  })();

  await connectionPromise;
};

// Import the Express app (this will not start the HTTP server in serverless mode)
const app = require('../backend/server');

// Export as Vercel serverless function
// Vercel will call this function for each request
module.exports = async (req, res) => {
  try {
    // Connect to database if not already connected
    await connectToDatabase();
    
    // Handle the request with Express app
    // Note: Express app routes are already prefixed with /api
    // Vercel rewrites /api/* to this function, so the path includes /api
    app(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

