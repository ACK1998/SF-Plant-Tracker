import * as Sentry from '@sentry/react';

// Initialize Sentry
const initSentry = () => {
  if (process.env.REACT_APP_SENTRY_DSN && process.env.REACT_APP_ENVIRONMENT === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.REACT_APP_ENVIRONMENT,
      tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      beforeSend(event) {
        // Filter out development errors
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.value?.includes('localhost') || error?.value?.includes('development')) {
            return null;
          }
        }
        return event;
      },
    });

    console.log('✅ Sentry initialized for frontend error tracking');
  } else {
    console.log('⚠️ Sentry not initialized - DSN not provided or not in production');
  }
};

// Capture exceptions
const captureException = (error, context = {}) => {
  if (process.env.REACT_APP_SENTRY_DSN && process.env.REACT_APP_ENVIRONMENT === 'production') {
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
  if (process.env.REACT_APP_SENTRY_DSN && process.env.REACT_APP_ENVIRONMENT === 'production') {
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureMessage(message);
    });
  }
};

// Add breadcrumb
const addBreadcrumb = (message, category = 'custom', level = 'info', data = {}) => {
  if (process.env.REACT_APP_SENTRY_DSN && process.env.REACT_APP_ENVIRONMENT === 'production') {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }
};

export {
  initSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  Sentry
};

