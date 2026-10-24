import { describe, test, expect } from '@jest/globals';
import { Resenia } from '../../src/domain/Resenia.js';
import { Usuario } from '../../src/domain/Usuario.js';
import { Evento } from '../../src/domain/Evento.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { Compra } from '../../src/domain/Compra.js';
import { EstadoCompra } from '../../src/domain/EstadoCompra.js';
import { ValidationError, ConflictError } from '../../src/domain/errors/DomainError.js';

describe('Resenia Domain Entity', () => {
  const setupHelpers = () => {
    const comprador = new Usuario({ nombre: 'Sofía', apellido: 'Paz' });
    const organizador = new Usuario({ nombre: 'Martín', apellido: 'Bossi' });
    const categoria = new Categoria({ nombre: 'Stand Up' });
    const tipoEntrada = new TipoEntrada({ nombre: 'Fila 1', precio: 6000, cupo: 10 });
    const evento = new Evento({
      nombre: 'Noche de Comedia',
      categoria,
      fecha: new Date('2026-11-20T21:00:00Z'),
      organizador
    });

    return { comprador, organizador, categoria, tipoEntrada, evento };
  };

  test('debe instanciar una reseña válida con sus atributos completos', () => {
    // Arrange
    const { comprador, evento } = setupHelpers();
    const datosResenia = {
      comprador,
      evento,
      detalle: 'Excelente show, nos reímos muchísimo.',
      puntuacion: 5
    };

    // Act
    const resenia = new Resenia(datosResenia);

    // Assert
    expect(resenia.id).toBeDefined();
    expect(resenia.comprador).toBe(comprador);
    expect(resenia.evento).toBe(evento);
    expect(resenia.detalle).toBe('Excelente show, nos reímos muchísimo.');
    expect(resenia.puntuacion).toBe(5);
    expect(resenia.fecha).toBeInstanceOf(Date);
  });

  test('debe lanzar ValidationError ante puntuaciones fuera del rango 1 a 5', () => {
    // Arrange
    const { comprador, evento } = setupHelpers();

    // Act & Assert
    // Arrange
    const puntuacionCero = () =>
      new Resenia({ comprador, evento, detalle: 'Malo', puntuacion: 0 });
    const puntuacionSeis = () =>
      new Resenia({ comprador, evento, detalle: 'Excesivo', puntuacion: 6 });
    const puntuacionNaN = () =>
      new Resenia({ comprador, evento, detalle: 'Inválido', puntuacion: NaN });

    // Act
    // (Ejecución dentro de las aserciones de error)

    // Assert
    expect(puntuacionCero).toThrow(ValidationError);
    expect(puntuacionSeis).toThrow(ValidationError);
    expect(puntuacionNaN).toThrow(ValidationError);
  });

  test('debe lanzar ValidationError si falta el detalle o está en blanco', () => {
    // Arrange
    const { comprador, evento } = setupHelpers();

    // Act
    const sinDetalle = () => new Resenia({ comprador, evento, detalle: '', puntuacion: 4 });
    const detalleEspacios = () =>
      new Resenia({ comprador, evento, detalle: '   ', puntuacion: 4 });

    // Assert
    expect(sinDetalle).toThrow(ValidationError);
    expect(detalleEspacios).toThrow(ValidationError);
  });

  test('debe crear una reseña desde una compra con entrada UTILIZADA', () => {
    // Arrange
    const { comprador, organizador, evento, tipoEntrada } = setupHelpers();
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.CONFIRMADA
    });
    compra.marcarComoUtilizada(organizador);

    // Act
    const resenia = Resenia.crearDesdeCompra(compra, {
      detalle: 'Entrada utilizada, el show fue increíble.',
      puntuacion: 4.5
    });

    // Assert
    expect(resenia.id).toBeDefined();
    expect(resenia.comprador).toBe(comprador);
    expect(resenia.evento).toBe(evento);
    expect(resenia.detalle).toBe('Entrada utilizada, el show fue increíble.');
    expect(resenia.puntuacion).toBe(4.5);
  });

  test('debe lanzar ConflictError al intentar reseñar una compra que NO fue UTILIZADA', () => {
    // Arrange
    const { comprador, evento, tipoEntrada } = setupHelpers();
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.CONFIRMADA
    });

    // Act
    const accionReseniarSinUso = () =>
      Resenia.crearDesdeCompra(compra, {
        detalle: 'Aún no fui pero opino',
        puntuacion: 3
      });

    // Assert
    expect(accionReseniarSinUso).toThrow(ConflictError);
  });
});
