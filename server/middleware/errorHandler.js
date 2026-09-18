/**
 * Global standardized error handler middleware.
 */
export function errorHandler(err, req, res, next) {
  console.error('[API Error]', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR');

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    }
  });
}

export default errorHandler;
