export class DomainError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = 'error';
    this.timestamp = new Date().toISOString();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const AppError = DomainError;

export class ValidationError extends DomainError {
  constructor(message = 'Datos de validación inválidos') {
    super(message, 400);
  }
}

export class ForbiddenDomainError extends DomainError {
  constructor(message = 'Operación no permitida por permisos de dominio') {
    super(message, 403);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Conflicto en la operación de dominio') {
    super(message, 409);
  }
}
