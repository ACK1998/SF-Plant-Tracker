// Vercel serverless function wrapper for Express backend
const connectDB = require('../backend/config/database');
const mongoose = require('mongoose');

// Ensure database connection for serverless functions
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await connectDB();
    isConnected = true;
  } catch (error) {
    console.error('Database connection error:', error);
    // Don't throw - let the request continue, connection will retry
  }
};

// Initialize database connection
connectToDatabase();

// Import the Express app (this will not start the HTTP server in serverless mode)
// The app is exported directly - Vercel's @vercel/node will handle it
module.exports = require('../backend/server');

