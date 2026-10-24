import { describe, test, expect } from '@jest/globals';
import {
  Compra,
  EstadoCompra,
  Usuario,
  Categoria,
  TipoEntrada,
  Evento,
  ConflictError,
  ValidationError,
  ForbiddenDomainError
} from '../../src/domain/index.js';

describe('Compra Domain Entity', () => {
  const setupFixtures = () => {
    const organizador = new Usuario({ id: 'org-1', nombre: 'Carlos', apellido: 'Organizador' });
    const comprador = new Usuario({ id: 'comp-1', nombre: 'Ana', apellido: 'Compradora' });
    const tercero = new Usuario({ id: 'usr-ext', nombre: 'Pedro', apellido: 'Tercero' });
    const categoria = new Categoria({ nombre: 'Música' });
    const tipoEntrada = new TipoEntrada({
      id: 'te-1',
      nombre: 'Campo',
      precio: 4000,
      cupo: 10
    });
    const fechaFutura = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // en 7 días
    const evento = new Evento({
      id: 'evt-1',
      nombre: 'Recital Rock',
      categoria,
      fecha: fechaFutura,
      tiposEntrada: [tipoEntrada],
      organizador
    });

    return { organizador, comprador, tercero, categoria, tipoEntrada, evento, fechaFutura };
  };

  test('debe crear una compra exitosamente respetando el cupo y descontándolo', () => {
    // Arrange
    const { comprador, evento, tipoEntrada } = setupFixtures();
    const cupoInicial = tipoEntrada.cupo; // 10

    // Act
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 4,
      estado: EstadoCompra.CONFIRMADA
    });

    // Assert
    expect(compra.id).toBeDefined();
    expect(compra.cantidad).toBe(4);
    expect(compra.total).toBe(16000); // 4 * 4000
    expect(compra.estado).toBe(EstadoCompra.CONFIRMADA);
    expect(tipoEntrada.cupo).toBe(cupoInicial - 4); // 6
    expect(compra.historialEstados).toHaveLength(1);
    expect(compra.historialEstados[0].estado).toBe(EstadoCompra.CONFIRMADA);
  });

  test('debe lanzar ConflictError al intentar comprar una cantidad superior al cupo', () => {
    // Arrange
    const { comprador, evento, tipoEntrada } = setupFixtures();
    const cupoInicial = tipoEntrada.cupo; // 10

    // Act
    const accionSuperarCupo = () =>
      new Compra({
        comprador,
        evento,
        tipoEntrada,
        cantidad: 11
      });

    // Assert
    expect(accionSuperarCupo).toThrow(ConflictError);
    expect(tipoEntrada.cupo).toBe(cupoInicial);
  });

  test('debe lanzar ValidationError ante parámetros inválidos en la creación', () => {
    // Arrange
    const { comprador, evento, tipoEntrada } = setupFixtures();

    // Act & Assert
    // Arrange
    const sinComprador = () => new Compra({ evento, tipoEntrada, cantidad: 1 });
    const cantidadCero = () => new Compra({ comprador, evento, tipoEntrada, cantidad: 0 });
    const cantidadNegativa = () => new Compra({ comprador, evento, tipoEntrada, cantidad: -3 });

    // Act
    // (Ejecución dentro de las aserciones de error)

    // Assert
    expect(sinComprador).toThrow(ValidationError);
    expect(cantidadCero).toThrow(ValidationError);
    expect(cantidadNegativa).toThrow(ValidationError);
  });

  test('debe calcular días faltantes correctamente cuando la compra está CONFIRMADA', () => {
    // Arrange
    const { comprador, evento, tipoEntrada } = setupFixtures();
    const fechaReferencia = new Date('2026-10-10T00:00:00Z');
    evento.fecha = new Date('2026-10-15T00:00:00Z'); // 5 días de diferencia

    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 2,
      estado: EstadoCompra.CONFIRMADA
    });

    // Act
    const diasFaltantes = compra.calcularDiasFaltantes(fechaReferencia);

    // Assert
    expect(diasFaltantes).toBe(5);
  });

  test('debe lanzar ConflictError al calcular días faltantes si el estado no es CONFIRMADA', () => {
    // Arrange
    const { comprador, evento, tipoEntrada } = setupFixtures();
    const compraPendiente = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.PENDIENTE
    });

    // Act
    const accionCalcularPendiente = () => compraPendiente.calcularDiasFaltantes();

    // Assert
    expect(accionCalcularPendiente).toThrow(ConflictError);
  });

  test('debe cancelar una compra válida, restituir el cupo y actualizar su estado a CANCELADA', () => {
    // Arrange
    const { comprador, evento, tipoEntrada } = setupFixtures();
    const cupoInicial = tipoEntrada.cupo;
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 3,
      estado: EstadoCompra.CONFIRMADA
    });
    const fechaPrevioAlEvento = new Date(evento.fecha.getTime() - 48 * 60 * 60 * 1000);

    // Act
    compra.cancelar(comprador, fechaPrevioAlEvento, 'Imprevisto personal');

    // Assert
    expect(compra.estado).toBe(EstadoCompra.CANCELADA);
    expect(tipoEntrada.cupo).toBe(cupoInicial);
    const ultimoCambio = compra.historialEstados.at(-1);
    expect(ultimoCambio.estado).toBe(EstadoCompra.CANCELADA);
    expect(ultimoCambio.quien).toBe(comprador);
    expect(ultimoCambio.motivo).toBe('Imprevisto personal');
  });

  test('debe lanzar ConflictError al cancelar una compra en estado UTILIZADA', () => {
    // Arrange
    const { comprador, organizador, evento, tipoEntrada } = setupFixtures();
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.CONFIRMADA
    });
    compra.marcarComoUtilizada(organizador);

    // Act
    const accionCancelarUtilizada = () => compra.cancelar(comprador);

    // Assert
    expect(accionCancelarUtilizada).toThrow(ConflictError);
  });

  test('debe lanzar ConflictError al cancelar una compra de un evento que ya pasó', () => {
    // Arrange
    const { comprador, evento, tipoEntrada } = setupFixtures();
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.CONFIRMADA
    });
    const fechaPosterior = new Date(evento.fecha.getTime() + 1000 * 60 * 60);

    // Act
    const accionCancelarPasado = () => compra.cancelar(comprador, fechaPosterior);

    // Assert
    expect(accionCancelarPasado).toThrow(ConflictError);
  });

  test('debe lanzar ConflictError al cancelar una compra ya CANCELADA', () => {
    // Arrange
    const { comprador, evento, tipoEntrada } = setupFixtures();
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.CONFIRMADA
    });
    const fechaPrevia = new Date(evento.fecha.getTime() - 10000);
    compra.cancelar(comprador, fechaPrevia);

    // Act
    const accionReCancelar = () => compra.cancelar(comprador, fechaPrevia);

    // Assert
    expect(accionReCancelar).toThrow(ConflictError);
  });

  test('debe permitir el intercambio de mensajes entre comprador y organizador', () => {
    // Arrange
    const { comprador, organizador, evento, tipoEntrada } = setupFixtures();
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 2
    });

    // Act
    const msgComprador = compra.agregarMensaje(comprador, '¿El estacionamiento es gratuito?');
    const msgOrganizador = compra.agregarMensaje(organizador, 'Sí, dentro del predio.');

    // Assert
    expect(compra.mensajes).toHaveLength(2);
    expect(msgComprador.usuario).toBe(comprador);
    expect(msgComprador.mensaje).toBe('¿El estacionamiento es gratuito?');
    expect(msgOrganizador.usuario).toBe(organizador);
    expect(msgOrganizador.mensaje).toBe('Sí, dentro del predio.');
  });

  test('debe lanzar ForbiddenDomainError si un tercero intenta enviar mensajes', () => {
    // Arrange
    const { comprador, tercero, evento, tipoEntrada } = setupFixtures();
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad: 1
    });

    // Act
    const accionMensajeTercero = () => compra.agregarMensaje(tercero, 'Mensaje no autorizado');

    // Assert
    expect(accionMensajeTercero).toThrow(ForbiddenDomainError);
    expect(compra.mensajes).toHaveLength(0);
  });
});
