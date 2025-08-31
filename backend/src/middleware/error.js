function notFound(req, res, next) {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const code = err.statusCode || 500;
  res.status(code).json({ message: err.message || 'Server error' });
}

export { notFound, errorHandler };
