const Sentry = require('@sentry/node');

// Initialize Sentry
const initSentry = () => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Note: Express integration is handled via sentryRequestHandler() and sentryErrorHandler()
        // which are called after the Express app is created, avoiding circular dependency
      ],
    });

    console.log('✅ Sentry initialized for error tracking');
  } else {
    console.log('⚠️ Sentry not initialized - DSN not provided or not in production');
  }
};

// Sentry request handler
const sentryRequestHandler = (app) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    app.use(Sentry.requestHandler());
    app.use(Sentry.tracingHandler());
  }
};

// Sentry error handler
const sentryErrorHandler = (app) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    app.use(Sentry.errorHandler());
  }
};

// Capture unhandled exceptions
const captureException = (error, context = {}) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  }
};

// Capture messages
const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureMessage(message);
    });
  }
};

module.exports = {
  initSentry,
  sentryRequestHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  Sentry
};

