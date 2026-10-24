import { DomainError, AppError } from '../domain/errors/DomainError.js';

export const errorHandler = (err, req, res, next) => {
  if (res?.headersSent) {
    return next(err);
  }

  if (err instanceof DomainError || err instanceof AppError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      status: err.status || 'error',
      message: err.message,
      timestamp: err.timestamp || new Date().toISOString()
    });
  }

  return res.status(500).json({
    statusCode: 500,
    status: 'error',
    message: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
};

export default errorHandler;
