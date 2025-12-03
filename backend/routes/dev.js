const express = require('express');
const router = express.Router();

// Development-only routes
if (process.env.NODE_ENV === 'development') {
  // Reset rate limiting (development only)
  router.post('/reset-rate-limit', (req, res) => {
    // Note: This is a placeholder. In a real implementation, you'd need to
    // clear the rate limit store. For express-rate-limit with memory store,
    // you'd need to restart the server or implement a custom store.
    res.json({
      success: true,
      message: 'Rate limiting will be reset on server restart',
      note: 'In development, restart the server to clear rate limits'
    });
  });

  // Get rate limit info
  router.get('/rate-limit-info', (req, res) => {
    res.json({
      authLimiter: {
        windowMs: '15 minutes',
        maxRequests: 5,
        message: 'Too many authentication attempts, please try again later.'
      },
      generalLimiter: {
        windowMs: process.env.RATE_LIMIT_WINDOW_MS || '15 minutes',
        maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
        message: 'Too many requests from this IP, please try again later.'
      }
    });
  });
}

module.exports = router;


