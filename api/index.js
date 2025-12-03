// Vercel serverless function wrapper for Express backend
// Set Vercel environment flag before loading server
process.env.VERCEL = '1';

// Global error handlers to catch any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  console.error('[UNCAUGHT EXCEPTION] Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
  console.error('[UNHANDLED REJECTION] Promise:', promise);
});

// Check for required environment variables before loading server
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.error('Please set the following in Vercel Environment Variables:');
  missingVars.forEach(v => console.error(`  - ${v}`));
}

// Try to load backend dependencies with better error handling
let connectDB, mongoose;
try {
  connectDB = require('../backend/config/database');
  mongoose = require('mongoose');
  console.log('✅ Backend modules loaded');
} catch (error) {
  console.error('❌ Failed to load backend modules:', error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  // Don't throw - we'll handle it in the handler
}

// Ensure database connection for serverless functions
let isConnected = false;
let connectionPromise = null;

const connectToDatabase = async () => {
  // Check if already connected
  if (mongoose && mongoose.connection.readyState === 1) {
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
      if (mongoose && mongoose.connection.readyState === 0) {
        if (!process.env.MONGODB_URI) {
          throw new Error('MONGODB_URI environment variable is not set');
        }
        if (!connectDB) {
          throw new Error('Database connection module not loaded');
        }
        await connectDB();
        isConnected = true;
      }
      connectionPromise = null;
    } catch (error) {
      console.error('Database connection error:', error);
      connectionPromise = null;
      throw error;
    }
  })();

  await connectionPromise;
};

// Import the Express app (this will not start the HTTP server in serverless mode)
let app;
let appLoadError = null;

try {
  app = require('../backend/server');
  console.log('✅ Express app loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Express app:', error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    requireStack: error.requireStack
  });
  appLoadError = error;
  
  // Create a minimal error app that provides helpful error messages
  try {
    const express = require('express');
    app = express();
    app.use((req, res) => {
      const errorMessage = error.code === 'MODULE_NOT_FOUND' 
        ? 'Backend dependencies not installed. Please ensure backend dependencies are installed during build.'
        : error.message;
      
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: errorMessage,
        details: {
          code: error.code,
          missingVars: missingVars.length > 0 ? missingVars : undefined
        },
        hint: error.code === 'MODULE_NOT_FOUND' 
          ? 'Check Vercel build logs to ensure backend dependencies are installed'
          : 'Check environment variables and function logs'
      });
    });
  } catch (expressError) {
    console.error('Even Express failed to load:', expressError);
    // Last resort - return a simple function
    app = (req, res) => {
      res.status(500).json({
        success: false,
        message: 'Critical server error',
        error: 'Unable to initialize server. Please check logs.',
        originalError: error.message
      });
    };
  }
}

// Export as Vercel serverless function
// Vercel will call this function for each request
module.exports = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log(`[API Handler] ${req.method} ${req.url} - Start`);
    
    // Check if app failed to load
    if (appLoadError) {
      console.error('[API Handler] App failed to load, returning error');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: appLoadError.message,
        code: appLoadError.code
      });
    }
    
    // Check for missing environment variables
    if (missingVars.length > 0) {
      console.error('[API Handler] Missing environment variables:', missingVars);
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: `Missing required environment variables: ${missingVars.join(', ')}`,
        hint: 'Please set these in Vercel Environment Variables'
      });
    }

    // Connect to database if not already connected
    try {
      await connectToDatabase();
      console.log(`[API Handler] Database connected, readyState: ${mongoose?.connection?.readyState || 'N/A'}`);
    } catch (dbError) {
      console.error('[API Handler] Database connection failed:', dbError);
      console.error('[API Handler] Error details:', {
        message: dbError.message,
        stack: dbError.stack,
        code: dbError.code,
        name: dbError.name
      });
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: dbError.message,
        details: {
          code: dbError.code,
          name: dbError.name
        }
      });
    }
    
    // Handle the request with Express app
    // Wrap in try-catch to catch any synchronous errors
    try {
      app(req, res);
    } catch (expressError) {
      console.error('[API Handler] Express app error:', expressError);
      console.error('[API Handler] Express error stack:', expressError.stack);
      
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Express error',
          error: expressError.message,
          details: {
            name: expressError.name,
            code: expressError.code
          }
        });
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[API Handler] ${req.method} ${req.url} - Completed in ${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API Handler] ${req.method} ${req.url} - Error after ${duration}ms:`, error);
    console.error('[API Handler] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    if (!res.headersSent) {
      try {
        res.status(500).json({ 
          success: false, 
          message: 'Internal server error',
          error: error.message,
          details: {
            name: error.name,
            code: error.code
          }
        });
      } catch (jsonError) {
        console.error('[API Handler] Failed to send error response:', jsonError);
      }
    }
  }
};
