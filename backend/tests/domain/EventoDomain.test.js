import { describe, test, expect } from '@jest/globals';
import {
  Evento,
  Categoria,
  Usuario,
  TipoEntrada,
  ValidationError,
  NotFoundError
} from '../../src/domain/index.js';

describe('Evento Domain Entity', () => {
  const setupHelpers = () => {
    const organizador = new Usuario({ nombre: 'Carlos', apellido: 'Pérez' });
    const categoria = new Categoria({ nombre: 'Música', descripcion: 'Conciertos' });
    const tipo1 = new TipoEntrada({ id: 'te-1', nombre: 'Campo', precio: 5000, cupo: 100 });
    const tipo2 = new TipoEntrada({ id: 'te-2', nombre: 'VIP', precio: 15000, cupo: 20 });
    return { organizador, categoria, tipo1, tipo2 };
  };

  test('debe instanciar un evento válido con sus atributos y relaciones', () => {
    // Arrange
    const { organizador, categoria, tipo1 } = setupHelpers();
    const fecha = new Date('2026-12-15T20:00:00Z');

    // Act
    const evento = new Evento({
      nombre: 'Festival de Primavera',
      descripcion: 'Aire libre',
      categoria,
      fecha,
      tiposEntrada: [tipo1],
      multimedia: ['https://example.com/foto.jpg'],
      organizador
    });

    // Assert
    expect(evento.id).toBeDefined();
    expect(evento.nombre).toBe('Festival de Primavera');
    expect(evento.categoria).toBe(categoria);
    expect(evento.fecha).toEqual(fecha);
    expect(evento.organizador).toBe(organizador);
    expect(evento.tiposEntrada).toHaveLength(1);
    expect(evento.multimedia).toEqual(['https://example.com/foto.jpg']);
  });

  test('debe lanzar ValidationError si faltan atributos requeridos o son inválidos', () => {
    // Arrange
    const { organizador, categoria } = setupHelpers();

    // Act & Assert
    // Arrange
    const accionSinNombre = () =>
      new Evento({ categoria, fecha: new Date(), organizador });
    const accionSinCategoria = () =>
      new Evento({ nombre: 'Evt', fecha: new Date(), organizador });
    const accionSinFecha = () =>
      new Evento({ nombre: 'Evt', categoria, organizador });
    const accionSinOrganizador = () =>
      new Evento({ nombre: 'Evt', categoria, fecha: new Date() });

    // Act
    // (Ejecución dentro de las aserciones de error)

    // Assert
    expect(accionSinNombre).toThrow(ValidationError);
    expect(accionSinCategoria).toThrow(ValidationError);
    expect(accionSinFecha).toThrow(ValidationError);
    expect(accionSinOrganizador).toThrow(ValidationError);
  });

  test('debe verificar correctamente si el precio está dentro del rango con tuPrecioEstaEntre', () => {
    // Arrange
    const { organizador, categoria, tipo1, tipo2 } = setupHelpers();
    const evento = new Evento({
      nombre: 'Show Acústico',
      categoria,
      fecha: new Date(),
      tiposEntrada: [tipo1, tipo2], // 5000 y 15000
      organizador
    });

    // Act
    const rangoIncluyeTipo1 = evento.tuPrecioEstaEntre(4000, 6000);
    const rangoIncluyeTipo2 = evento.tuPrecioEstaEntre(12000, 20000);
    const rangoFuera = evento.tuPrecioEstaEntre(1000, 2000);

    // Assert
    expect(rangoIncluyeTipo1).toBe(true);
    expect(rangoIncluyeTipo2).toBe(true);
    expect(rangoFuera).toBe(false);
  });

  test('debe lanzar ValidationError en tuPrecioEstaEntre si min > max', () => {
    // Arrange
    const { organizador, categoria } = setupHelpers();
    const evento = new Evento({
      nombre: 'Show Acústico',
      categoria,
      fecha: new Date(),
      organizador
    });

    // Act
    const accionRangoInvertido = () => evento.tuPrecioEstaEntre(10000, 5000);

    // Assert
    expect(accionRangoInvertido).toThrow(ValidationError);
  });

  test('debe agregar y obtener tipos de entrada correctamente', () => {
    // Arrange
    const { organizador, categoria, tipo1 } = setupHelpers();
    const evento = new Evento({
      nombre: 'Teatro',
      categoria,
      fecha: new Date(),
      organizador
    });

    // Act
    evento.agregarTipoEntrada(tipo1);
    const entradaEncontrada = evento.obtenerTipoEntrada('te-1');

    // Assert
    expect(evento.tiposEntrada).toHaveLength(1);
    expect(entradaEncontrada.id).toBe('te-1');
  });

  test('debe lanzar NotFoundError al buscar un tipo de entrada inexistente', () => {
    // Arrange
    const { organizador, categoria } = setupHelpers();
    const evento = new Evento({
      nombre: 'Teatro',
      categoria,
      fecha: new Date(),
      organizador
    });

    // Act
    const accionBuscarInexistente = () => evento.obtenerTipoEntrada('id-inexistente');

    // Assert
    expect(accionBuscarInexistente).toThrow(NotFoundError);
  });

  test('debe verificar si el evento ya pasó con yaPaso', () => {
    // Arrange
    const { organizador, categoria } = setupHelpers();
    const fechaPasada = new Date('2026-01-01T12:00:00Z');
    const fechaFutura = new Date('2026-12-31T12:00:00Z');
    const fechaReferencia = new Date('2026-06-01T12:00:00Z');

    const eventoPasado = new Evento({
      nombre: 'Evento Pasado',
      categoria,
      fecha: fechaPasada,
      organizador
    });
    const eventoFuturo = new Evento({
      nombre: 'Evento Futuro',
      categoria,
      fecha: fechaFutura,
      organizador
    });

    // Act
    const yaPasoElEventoPasado = eventoPasado.yaPaso(fechaReferencia);
    const yaPasoElEventoFuturo = eventoFuturo.yaPaso(fechaReferencia);

    // Assert
    expect(yaPasoElEventoPasado).toBe(true);
    expect(yaPasoElEventoFuturo).toBe(false);
  });
});
