import { NotFoundError } from '../domain/errors/DomainError.js';

export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Ruta ${req.originalUrl} no encontrada`));
};

export default notFoundHandler;
