// Centralized logging service for the application

class Logger {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    // Set log level based on environment
    this.currentLevel = process.env.NODE_ENV === 'production' 
      ? this.logLevels.ERROR 
      : this.logLevels.DEBUG;
  }

  // Format log message with timestamp and context
  formatMessage(level, message, data = null, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      }
    };

    return logEntry;
  }

  // Send log to external service (placeholder for production)
  sendToExternalService(logEntry) {
    // In production, you would send this to a logging service like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Custom logging endpoint
    
    if (process.env.NODE_ENV === 'production') {
      // Example: fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) });
      console.log('Production log:', logEntry);
    }
  }

  // Error logging
  error(message, error = null, context = {}) {
    if (this.currentLevel >= this.logLevels.ERROR) {
      const logEntry = this.formatMessage('ERROR', message, error, context);
      
      console.error('🚨 ERROR:', message, error);
      this.sendToExternalService(logEntry);
    }
  }

  // Warning logging
  warn(message, data = null, context = {}) {
    if (this.currentLevel >= this.logLevels.WARN) {
      const logEntry = this.formatMessage('WARN', message, data, context);
      
      console.warn('⚠️ WARNING:', message, data);
      this.sendToExternalService(logEntry);
    }
  }

  // Info logging
  info(message, data = null, context = {}) {
    if (this.currentLevel >= this.logLevels.INFO) {
      const logEntry = this.formatMessage('INFO', message, data, context);
      
      console.info('ℹ️ INFO:', message, data);
      this.sendToExternalService(logEntry);
    }
  }

  // Debug logging
  debug(message, data = null, context = {}) {
    if (this.currentLevel >= this.logLevels.DEBUG) {
      const logEntry = this.formatMessage('DEBUG', message, data, context);
      
      console.debug('🔍 DEBUG:', message, data);
      this.sendToExternalService(logEntry);
    }
  }

  // API request logging
  logApiRequest(method, url, params = null, response = null, error = null) {
    const context = {
      type: 'API_REQUEST',
      method,
      url,
      params,
      responseStatus: response?.status,
      responseTime: response?.responseTime,
      error: error?.message
    };

    if (error) {
      this.error(`API Request Failed: ${method} ${url}`, error, context);
    } else {
      this.info(`API Request: ${method} ${url}`, { params, response }, context);
    }
  }

  // Performance logging
  logPerformance(operation, duration, details = {}) {
    const context = {
      type: 'PERFORMANCE',
      operation,
      duration,
      ...details
    };

    if (duration > 1000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, details, context);
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`, details, context);
    }
  }

  // User action logging
  logUserAction(action, details = {}) {
    const context = {
      type: 'USER_ACTION',
      action,
      ...details
    };

    this.info(`User Action: ${action}`, details, context);
  }

  // Error boundary logging
  logErrorBoundary(error, errorInfo, componentStack) {
    const context = {
      type: 'ERROR_BOUNDARY',
      componentStack,
      errorInfo
    };

    this.error('React Error Boundary caught error', error, context);
  }

  // Database operation logging
  logDatabaseOperation(operation, collection, query = null, result = null, error = null) {
    const context = {
      type: 'DATABASE',
      operation,
      collection,
      query,
      resultCount: result?.length || 0,
      error: error?.message
    };

    if (error) {
      this.error(`Database operation failed: ${operation} on ${collection}`, error, context);
    } else {
      this.debug(`Database operation: ${operation} on ${collection}`, { query, result }, context);
    }
  }

  // Authentication logging
  logAuth(action, userId = null, success = true, error = null) {
    const context = {
      type: 'AUTHENTICATION',
      action,
      userId,
      success,
      error: error?.message
    };

    if (error) {
      this.error(`Authentication failed: ${action}`, error, context);
    } else {
      this.info(`Authentication: ${action}`, { userId, success }, context);
    }
  }

  // Set log level dynamically
  setLogLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLevel = this.logLevels[level];
      this.info(`Log level changed to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  // Get current log level
  getLogLevel() {
    return Object.keys(this.logLevels).find(key => this.logLevels[key] === this.currentLevel);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
