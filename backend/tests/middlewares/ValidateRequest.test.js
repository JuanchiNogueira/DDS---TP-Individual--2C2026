import { describe, test, expect, jest } from '@jest/globals';
import { z } from 'zod';
import { validateRequest } from '../../src/middlewares/validateRequest.js';
import { ValidationError } from '../../src/domain/errors/DomainError.js';

describe('validateRequest Middleware Unit Tests', () => {
  const schema = {
    body: z.object({
      nombre: z.string().min(1, 'El nombre es requerido'),
      edad: z.coerce.number().min(18, 'Debe ser mayor de edad')
    }),
    query: z.object({
      filtro: z.string().optional()
    }),
    params: z.object({
      id: z.string().min(1, 'ID requerido')
    })
  };

  test('debe llamar a next() sin error y transformar datos parseados cuando la validación pasa', () => {
    // Arrange
    const req = {
      body: { nombre: 'Lucas', edad: '25' },
      query: { filtro: 'activos' },
      params: { id: 'usr-10' }
    };
    const res = {};
    const next = jest.fn();
    const middleware = validateRequest(schema);

    // Act
    middleware(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.body.edad).toBe(25); // coerción numérica
    expect(req.body.nombre).toBe('Lucas');
  });

  test('debe llamar a next con ValidationError si el body es inválido', () => {
    // Arrange
    const req = {
      body: { nombre: '', edad: 15 }, // nombre vacío y menor de 18
      query: {},
      params: { id: 'usr-1' }
    };
    const res = {};
    const next = jest.fn();
    const middleware = validateRequest(schema);

    // Act
    middleware(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    const errorCapturado = next.mock.calls[0][0];
    expect(errorCapturado).toBeInstanceOf(ValidationError);
    expect(errorCapturado.statusCode).toBe(400);
    expect(errorCapturado.message).toContain('nombre');
  });

  test('debe llamar a next con ValidationError si los params son inválidos', () => {
    // Arrange
    const req = {
      body: { nombre: 'Lucas', edad: 20 },
      query: {},
      params: { id: '' }
    };
    const res = {};
    const next = jest.fn();
    const middleware = validateRequest(schema);

    // Act
    middleware(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    const errorCapturado = next.mock.calls[0][0];
    expect(errorCapturado).toBeInstanceOf(ValidationError);
    expect(errorCapturado.message).toContain('id');
  });
});
