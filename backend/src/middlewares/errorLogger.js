export const errorLogger = (err, req, res, next) => {
  console.error({
    timestamp: new Date().toISOString(),
    method: req?.method,
    path: req?.originalUrl || req?.url,
    error: {
      name: err?.name,
      message: err?.message,
      stack: err?.stack
    }
  });
  next(err);
};

export default errorLogger;
