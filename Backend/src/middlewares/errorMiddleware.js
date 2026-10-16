const errorHandler = (err, req, res, next) => {
  console.error(`❌ [Error Log] ${err.stack}`);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Terjadi kesalahan pada internal server.'
  });
};

module.exports = errorHandler;