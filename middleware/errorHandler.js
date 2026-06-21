const errorHandler = (err, req, res, next) => {
  console.error(`${err.name || 'Error'}:`, err.message);

  let statusCode = err.statusCode || 500;

  if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    error: err.message
  });
};

module.exports = errorHandler;
