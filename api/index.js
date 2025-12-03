// Vercel serverless function wrapper for Express backend
// Set Vercel environment flag before loading server
process.env.VERCEL = '1';

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
} catch (error) {
  console.error('Failed to load backend modules:', error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  // Re-throw with more context
  throw new Error(`Backend dependencies not found. Make sure backend dependencies are installed. Original error: ${error.message}`);
}

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
        if (!process.env.MONGODB_URI) {
          throw new Error('MONGODB_URI environment variable is not set');
        }
        await connectDB();
        isConnected = true;
      }
      connectionPromise = null;
    } catch (error) {
      console.error('Database connection error:', error);
      connectionPromise = null;
      throw error; // Re-throw so we can handle it properly
    }
  })();

  await connectionPromise;
};

// Import the Express app (this will not start the HTTP server in serverless mode)
let app;
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
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          missingVars: missingVars.length > 0 ? missingVars : undefined
        } : undefined,
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
  // Wrap in promise to ensure we wait for Express to finish
  return new Promise((resolve) => {
    try {
      console.log(`[API Handler] ${req.method} ${req.url}`);
      
      // Check for missing environment variables
      if (missingVars.length > 0) {
        console.error('[API Handler] Missing environment variables:', missingVars);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Server configuration error',
            error: `Missing required environment variables: ${missingVars.join(', ')}`,
            hint: 'Please set these in Vercel Environment Variables'
          });
        }
        return resolve();
      }

      // Connect to database if not already connected
      connectToDatabase()
        .then(() => {
          console.log('[API Handler] Database connected');
          
          // Intercept res.end to know when Express is done
          const originalEnd = res.end.bind(res);
          res.end = function(...args) {
            console.log(`[API Handler] Response sent: ${res.statusCode}`);
            originalEnd(...args);
            resolve();
          };
          
          // Handle Express app
          try {
            app(req, res);
          } catch (expressError) {
            console.error('[API Handler] Express app error:', expressError);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: 'Express error',
                error: expressError.message
              });
            } else {
              resolve();
            }
          }
        })
        .catch((dbError) => {
          console.error('[API Handler] Database connection failed:', dbError);
          console.error('[API Handler] Error details:', {
            message: dbError.message,
            stack: dbError.stack,
            code: dbError.code
          });
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Database connection failed',
              error: process.env.NODE_ENV === 'development' ? dbError.message : 'Unable to connect to database',
              details: process.env.NODE_ENV === 'development' ? {
                code: dbError.code,
                stack: dbError.stack
              } : undefined
            });
          }
          resolve();
        });
      
    } catch (error) {
      console.error('[API Handler] Unhandled error:', error);
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
            details: process.env.NODE_ENV === 'development' ? {
              stack: error.stack,
              name: error.name,
              code: error.code
            } : undefined
          });
        } catch (jsonError) {
          console.error('[API Handler] Failed to send error response:', jsonError);
        }
      }
      resolve();
    }
  });
};

