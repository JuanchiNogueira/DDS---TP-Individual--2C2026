import { z } from 'zod';
import { ValidationError } from '../domain/errors/DomainError.js';

export const validateRequest = ({ body, query, params } = {}) => {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const mensajeDetallado = error.issues
          .map((e) => {
            const campo = e.path.length > 0 ? e.path.join('.') : 'campo';
            return `${campo}: ${e.message}`;
          })
          .join(', ');
        return next(new ValidationError(mensajeDetallado));
      }
      if (error && (Array.isArray(error.errors) || Array.isArray(error.issues))) {
        const items = error.issues || error.errors;
        const mensajeDetallado = items
          .map((e) => {
            const campo = e.path && e.path.length > 0 ? e.path.join('.') : 'campo';
            return `${campo}: ${e.message}`;
          })
          .join(', ');
        return next(new ValidationError(mensajeDetallado));
      }
      return next(new ValidationError(error.message || 'Error de validación'));
    }
  };
};

export default validateRequest;
