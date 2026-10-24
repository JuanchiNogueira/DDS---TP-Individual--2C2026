import { describe, test, expect, jest } from '@jest/globals';
import { notFoundHandler } from '../../src/middlewares/notFoundHandler.js';
import { errorLogger } from '../../src/middlewares/errorLogger.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  DomainError,
  AppError
} from '../../src/domain/errors/DomainError.js';

describe('Error Middlewares Unit Tests', () => {
  describe('notFoundHandler', () => {
    test('debe llamar a next con una instancia de NotFoundError conteniendo la ruta original', () => {
      // Arrange
      const req = { originalUrl: '/api/v1/eventos/inexistente' };
      const res = {};
      const next = jest.fn();

      // Act
      notFoundHandler(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      const errorPasado = next.mock.calls[0][0];
      expect(errorPasado).toBeInstanceOf(NotFoundError);
      expect(errorPasado.statusCode).toBe(404);
      expect(errorPasado.message).toBe('Ruta /api/v1/eventos/inexistente no encontrada');
      expect(errorPasado.status).toBe('error');
    });
  });

  describe('errorLogger', () => {
    test('debe loggear los datos del error en consola y llamar a next con el mismo error', () => {
      // Arrange
      const err = new Error('Error simulado de base de datos');
      const req = { method: 'POST', originalUrl: '/api/v1/compras' };
      const res = {};
      const next = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      errorLogger(err, req, res, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/api/v1/compras',
          error: {
            name: 'Error',
            message: 'Error simulado de base de datos',
            stack: err.stack
          }
        })
      );
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(err);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('errorHandler', () => {
    test('debe delegar a next(err) si los encabezados ya fueron enviados (res.headersSent)', () => {
      // Arrange
      const err = new ValidationError('Error de validación');
      const req = {};
      const res = {
        headersSent: true,
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      // Act
      errorHandler(err, req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('debe responder con el statusCode, status, message y timestamp para errores de dominio (AppError/DomainError)', () => {
      // Arrange
      const err = new ConflictError('Cupo no disponible');
      const req = {};
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const res = {
        headersSent: false,
        status: statusMock
      };
      const next = jest.fn();

      // Act
      errorHandler(err, req, res, next);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        statusCode: 409,
        status: 'error',
        message: 'Cupo no disponible',
        timestamp: err.timestamp
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe responder con código 500 y mensaje genérico ante errores inesperados', () => {
      // Arrange
      const errInesperado = new TypeError('Error inesperado de tipo');
      const req = {};
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const res = {
        headersSent: false,
        status: statusMock
      };
      const next = jest.fn();

      // Act
      errorHandler(errInesperado, req, res, next);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          status: 'error',
          message: 'Error interno del servidor',
          timestamp: expect.any(String)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
