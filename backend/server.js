const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { initSentry, sentryRequestHandler, sentryErrorHandler } = require('./config/sentry');
const { generalLimiter, authLimiter, uploadLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Initialize Sentry first
initSentry();

// Validate required environment variables for production
// Don't exit in serverless mode - let the API handler deal with it
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (process.env.NODE_ENV === 'production' && !isServerless) {
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
} else {
  // Set default JWT_SECRET for development only
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'default-jwt-secret-for-development-only';
    logger.warn('Using default JWT_SECRET. Set JWT_SECRET in .env for production.');
  }
}

// We'll connect to MongoDB during startup (and skip in test environment)

const app = express();

// Initialize Sentry request handler
sentryRequestHandler(app);

// Security middleware with production CSP configuration
const cspDirectives = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  scriptSrc: ["'self'"],
  imgSrc: ["'self'", "data:", "blob:", "https://storage.googleapis.com"],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
};

// Add development URLs for CSP in development
if (process.env.NODE_ENV !== 'production') {
  cspDirectives.imgSrc.push("http://localhost:5001", "http://localhost:3000");
  cspDirectives.connectSrc.push("http://localhost:5001", "http://localhost:3000");
}

// Add production URLs if provided
if (process.env.BACKEND_URL) {
  cspDirectives.imgSrc.push(process.env.BACKEND_URL);
  cspDirectives.connectSrc.push(process.env.BACKEND_URL);
}
if (process.env.FRONTEND_URL) {
  cspDirectives.imgSrc.push(process.env.FRONTEND_URL);
  cspDirectives.connectSrc.push(process.env.FRONTEND_URL);
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
}));

// Enable compression
app.use(compression());

// CORS middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-frontend-domain.com']
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('dev'));
}

// Apply rate limiting
app.use('/api', generalLimiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes with rate limiting
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/dev', require('./routes/dev'));
app.use('/api/plants', require('./routes/plants'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/domains', require('./routes/domains'));
app.use('/api/plots', require('./routes/plots'));
app.use('/api/users', require('./routes/users'));
app.use('/api/plant-images', uploadLimiter, require('./routes/plantImages'));
app.use('/api/plant-types', require('./routes/plantTypes'));
app.use('/api/plant-varieties', require('./routes/plantVarieties'));
app.use('/api/categories', require('./routes/categories'));

// Serve uploaded plant images with CORS headers
app.use('/uploads/plant-images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}, express.static(path.join(__dirname, 'uploads/plant-images')));

// Health check routes (both root and API level)
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('./package.json').version
  };
  
  res.status(200).json(healthCheck);
});

app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('./package.json').version
  };
  
  res.status(200).json(healthCheck);
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: '🌱 Sanctity Ferme Plant Tracker API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize Sentry error handler
sentryErrorHandler(app);

// Error handling middleware
app.use(errorHandler);

// Only start server if not in test environment and not in serverless (Vercel) environment
// Vercel sets VERCEL=1 environment variable
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (process.env.NODE_ENV !== 'test' && !isServerless) {
  (async () => {
    try {
      await connectDB();

      const PORT = process.env.PORT || 5001;
      const server = app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
        logger.info(`🔍 Health check: http://localhost:${PORT}/health`);
      });

      // Graceful shutdown handlers (registered once at startup)
      const gracefulShutdown = async (signal) => {
        logger.info(`${signal} received, shutting down gracefully`);
        server.close(async () => {
          logger.info('HTTP server closed');
          try {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
            process.exit(0);
          } catch (err) {
            logger.error('Error during shutdown:', err);
            process.exit(1);
          }
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (err) {
      logger.error('Failed to start server:', err);
      process.exit(1);
    }
  })();
} else if (isServerless) {
  // For serverless environments, connect to DB on first request
  // Connection will be reused across invocations
  (async () => {
    try {
      // Only connect if not already connected
      if (mongoose.connection.readyState === 0) {
        await connectDB();
      }
    } catch (err) {
      logger.error('Failed to connect to database in serverless environment:', err);
    }
  })();
}

module.exports = app;