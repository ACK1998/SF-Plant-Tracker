const winston = require('winston');
const path = require('path');

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create transports array
const transports = [];

// In serverless environments, only use console logging (Vercel captures console output)
if (isServerless) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
} else {
  // In non-serverless environments, use file logging
  const fs = require('fs');
  const logsDir = path.join(__dirname, '../logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    try {
      fs.mkdirSync(logsDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create logs directory:', error.message);
    }
  }

  // Add file transports only if directory exists or was created
  if (fs.existsSync(logsDir)) {
    transports.push(
      // Write all logs with level 'error' and below to error.log
      new winston.transports.File({ 
        filename: path.join(logsDir, 'error.log'), 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Write all logs with level 'info' and below to combined.log
      new winston.transports.File({ 
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  }

  // Always add console transport in non-serverless environments
  transports.push(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { 
    service: 'sanctity-ferme-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: transports,
});

// Create a stream object for Morgan HTTP request logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;

