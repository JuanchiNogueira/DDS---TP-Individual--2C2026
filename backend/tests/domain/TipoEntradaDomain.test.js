import { describe, test, expect } from '@jest/globals';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { ValidationError, ConflictError } from '../../src/domain/errors/DomainError.js';

describe('TipoEntrada Domain Entity', () => {
  test('debe instanciar correctamente con cupo, precio y nombre', () => {
    // Arrange
    const datosEntrada = {
      nombre: 'General',
      descripcion: 'Acceso general al predio',
      precio: 4500,
      cupo: 50
    };

    // Act
    const tipoEntrada = new TipoEntrada(datosEntrada);

    // Assert
    expect(tipoEntrada.id).toBeDefined();
    expect(tipoEntrada.nombre).toBe('General');
    expect(tipoEntrada.descripcion).toBe('Acceso general al predio');
    expect(tipoEntrada.precio).toBe(4500);
    expect(tipoEntrada.cupo).toBe(50);
    expect(tipoEntrada.cupoInicial).toBe(50);
  });

  test('debe validar disponibilidad mediante hayCupoPara', () => {
    // Arrange
    const tipoEntrada = new TipoEntrada({
      nombre: 'VIP',
      precio: 10000,
      cupo: 10
    });

    // Act
    const puedePara5 = tipoEntrada.hayCupoPara(5);
    const puedePara10 = tipoEntrada.hayCupoPara(10);
    const puedePara15 = tipoEntrada.hayCupoPara(15);
    const puedeParaCero = tipoEntrada.hayCupoPara(0);
    const puedeParaNegativo = tipoEntrada.hayCupoPara(-2);

    // Assert
    expect(puedePara5).toBe(true);
    expect(puedePara10).toBe(true);
    expect(puedePara15).toBe(false);
    expect(puedeParaCero).toBe(false);
    expect(puedeParaNegativo).toBe(false);
  });

  test('debe descontar cupo exitosamente si hay suficiente disponibilidad', () => {
    // Arrange
    const tipoEntrada = new TipoEntrada({
      nombre: 'Platea',
      precio: 7000,
      cupo: 20
    });

    // Act
    tipoEntrada.descontarCupo(8);

    // Assert
    expect(tipoEntrada.cupo).toBe(12);
  });

  test('debe lanzar ConflictError al intentar descontar más cupo del disponible', () => {
    // Arrange
    const tipoEntrada = new TipoEntrada({
      nombre: 'Campo',
      precio: 3000,
      cupo: 5
    });

    // Act
    const accionSobrepasarCupo = () => tipoEntrada.descontarCupo(6);

    // Assert
    expect(accionSobrepasarCupo).toThrow(ConflictError);
    expect(tipoEntrada.cupo).toBe(5);
  });

  test('debe lanzar ValidationError al intentar descontar cantidades inválidas', () => {
    // Arrange
    const tipoEntrada = new TipoEntrada({
      nombre: 'Campo',
      precio: 3000,
      cupo: 10
    });

    // Act
    const accionCero = () => tipoEntrada.descontarCupo(0);
    const accionNegativo = () => tipoEntrada.descontarCupo(-1);
    const accionDecimal = () => tipoEntrada.descontarCupo(2.5);

    // Assert
    expect(accionCero).toThrow(ValidationError);
    expect(accionNegativo).toThrow(ValidationError);
    expect(accionDecimal).toThrow(ValidationError);
  });

  test('debe restituir cupo correctamente', () => {
    // Arrange
    const tipoEntrada = new TipoEntrada({
      nombre: 'Platea',
      precio: 8000,
      cupo: 10
    });
    tipoEntrada.descontarCupo(6); // Quedan 4

    // Act
    tipoEntrada.restituirCupo(3);

    // Assert
    expect(tipoEntrada.cupo).toBe(7);
  });

  test('debe lanzar ValidationError al intentar restituir cantidades menores o iguales a cero', () => {
    // Arrange
    const tipoEntrada = new TipoEntrada({
      nombre: 'Platea',
      precio: 8000,
      cupo: 10
    });

    // Act
    const accionCero = () => tipoEntrada.restituirCupo(0);
    const accionNegativo = () => tipoEntrada.restituirCupo(-5);

    // Assert
    expect(accionCero).toThrow(ValidationError);
    expect(accionNegativo).toThrow(ValidationError);
  });
});
