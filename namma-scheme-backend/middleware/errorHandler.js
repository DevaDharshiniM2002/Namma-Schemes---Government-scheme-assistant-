// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log error details
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    status: err.status || 500,
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // MongoDB connection error
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error',
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  const message = isDevelopment ? err.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { error: err.message, stack: err.stack }),
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
};

// Uncaught exception handler
const uncaughtExceptionHandler = (err) => {
  console.error('[UNCAUGHT EXCEPTION]', {
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
  });
  // Gracefully restart or log for monitoring
  process.exit(1);
};

// Unhandled rejection handler
const unhandledRejectionHandler = (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', {
    timestamp: new Date().toISOString(),
    reason,
    promise,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  uncaughtExceptionHandler,
  unhandledRejectionHandler,
};
