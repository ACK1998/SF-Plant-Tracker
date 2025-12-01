const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    }
  });
};

const isProduction = process.env.NODE_ENV === 'production';

const generalLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || (isProduction ? 15 * 60 * 1000 : 60 * 1000),
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || (isProduction ? 100 : 1000),
  'Too many requests from this IP, please try again later.'
);

const authLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || (isProduction ? 15 * 60 * 1000 : 60 * 1000),
  parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 10) || (isProduction ? 5 : 200),
  'Too many authentication attempts, please try again later.'
);

const uploadLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS, 10) || (isProduction ? 60 * 60 * 1000 : 15 * 60 * 1000),
  parseInt(process.env.RATE_LIMIT_UPLOAD_MAX_REQUESTS, 10) || (isProduction ? 10 : 100),
  'Too many file uploads, please try again later.'
);

const strictLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_STRICT_WINDOW_MS, 10) || (isProduction ? 5 * 60 * 1000 : 60 * 1000),
  parseInt(process.env.RATE_LIMIT_STRICT_MAX_REQUESTS, 10) || (isProduction ? 3 : 50),
  'Too many sensitive operations, please try again later.'
);

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  strictLimiter
};

