import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { CompraService } from '../../src/services/CompraService.js';
import { Compra } from '../../src/domain/Compra.js';
import { EstadoCompra } from '../../src/domain/EstadoCompra.js';
import { Usuario } from '../../src/domain/Usuario.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { Evento } from '../../src/domain/Evento.js';
import {
  NotFoundError,
  ForbiddenDomainError,
  ConflictError
} from '../../src/domain/errors/DomainError.js';

describe('CompraService Unit Tests with Mocks', () => {
  let mockCompraRepo;
  let mockUsuarioRepo;
  let mockEventoRepo;
  let compraService;

  let comprador;
  let organizador;
  let categoria;
  let tipoEntrada;
  let evento;

  beforeEach(() => {
    mockCompraRepo = {
      guardar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorComprador: jest.fn(),
      buscarPorEvento: jest.fn()
    };
    mockUsuarioRepo = {
      buscarPorId: jest.fn()
    };
    mockEventoRepo = {
      buscarPorId: jest.fn()
    };

    compraService = new CompraService({
      compraRepository: mockCompraRepo,
      usuarioRepository: mockUsuarioRepo,
      eventoRepository: mockEventoRepo
    });

    comprador = new Usuario({ id: 'comp-1', nombre: 'Ana', apellido: 'Compradora' });
    organizador = new Usuario({ id: 'org-1', nombre: 'Carlos', apellido: 'Organizador' });
    categoria = new Categoria({ id: 'cat-1', nombre: 'Rock' });
    tipoEntrada = new TipoEntrada({
      id: 'te-1',
      nombre: 'General',
      precio: 4000,
      cupo: 10
    });
    evento = new Evento({
      id: 'evt-1',
      nombre: 'Show Rock',
      categoria,
      fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // En 5 días
      tiposEntrada: [tipoEntrada],
      organizador
    });
  });

  describe('realizarCompra', () => {
    test('debe realizar la compra, descontar cupo y guardar en repositorio', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(comprador);
      mockEventoRepo.buscarPorId.mockResolvedValue(evento);
      mockCompraRepo.guardar.mockImplementation(async (c) => c);

      // Act
      const compra = await compraService.realizarCompra({
        compradorId: 'comp-1',
        eventoId: 'evt-1',
        tipoEntradaId: 'te-1',
        cantidad: 3,
        confirmarInmediatamente: true
      });

      // Assert
      expect(mockUsuarioRepo.buscarPorId).toHaveBeenCalledWith('comp-1');
      expect(mockEventoRepo.buscarPorId).toHaveBeenCalledWith('evt-1');
      expect(mockCompraRepo.guardar).toHaveBeenCalledTimes(1);
      expect(compra).toBeInstanceOf(Compra);
      expect(compra.cantidad).toBe(3);
      expect(compra.total).toBe(12000); // 3 * 4000
      expect(compra.estado).toBe(EstadoCompra.CONFIRMADA);
      expect(tipoEntrada.cupo).toBe(7);
    });

    test('debe permitir crear compra con estado PENDIENTE cuando confirmarInmediatamente es false', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(comprador);
      mockEventoRepo.buscarPorId.mockResolvedValue(evento);
      mockCompraRepo.guardar.mockImplementation(async (c) => c);

      // Act
      const compra = await compraService.realizarCompra({
        compradorId: 'comp-1',
        eventoId: 'evt-1',
        tipoEntradaId: 'te-1',
        cantidad: 1,
        confirmarInmediatamente: false
      });

      // Assert
      expect(compra.estado).toBe(EstadoCompra.PENDIENTE);
    });

    test('debe lanzar NotFoundError si el comprador no existe', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        compraService.realizarCompra({
          compradorId: 'comp-inexistente',
          eventoId: 'evt-1',
          tipoEntradaId: 'te-1',
          cantidad: 1
        })
      ).rejects.toThrow(NotFoundError);
      expect(mockCompraRepo.guardar).not.toHaveBeenCalled();
    });

    test('debe lanzar NotFoundError si el evento no existe', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(comprador);
      mockEventoRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        compraService.realizarCompra({
          compradorId: 'comp-1',
          eventoId: 'evt-inexistente',
          tipoEntradaId: 'te-1',
          cantidad: 1
        })
      ).rejects.toThrow(NotFoundError);
      expect(mockCompraRepo.guardar).not.toHaveBeenCalled();
    });

    test('debe lanzar ConflictError si la cantidad supera el cupo disponible', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(comprador);
      mockEventoRepo.buscarPorId.mockResolvedValue(evento);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        compraService.realizarCompra({
          compradorId: 'comp-1',
          eventoId: 'evt-1',
          tipoEntradaId: 'te-1',
          cantidad: 15
        })
      ).rejects.toThrow(ConflictError);
      expect(mockCompraRepo.guardar).not.toHaveBeenCalled();
    });
  });

  describe('listarComprasPorComprador', () => {
    test('debe retornar las compras calculando diasFaltantes para CONFIRMADA y null para PENDIENTE', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(comprador);

      const compraConfirmada = new Compra({
        id: 'c-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1,
        estado: EstadoCompra.CONFIRMADA
      });

      const compraPendiente = new Compra({
        id: 'c-2',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1,
        estado: EstadoCompra.PENDIENTE
      });

      mockCompraRepo.buscarPorComprador.mockResolvedValue([compraConfirmada, compraPendiente]);

      // Act
      const resultado = await compraService.listarComprasPorComprador('comp-1');

      // Assert
      expect(mockUsuarioRepo.buscarPorId).toHaveBeenCalledWith('comp-1');
      expect(mockCompraRepo.buscarPorComprador).toHaveBeenCalledWith('comp-1');
      expect(resultado).toHaveLength(2);
      expect(resultado[0].diasFaltantes).toBeGreaterThan(0);
      expect(resultado[1].diasFaltantes).toBeNull();
    });

    test('debe lanzar NotFoundError si el comprador no existe', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        compraService.listarComprasPorComprador('comp-no-existe')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('listarComprasPorEvento', () => {
    test('debe devolver compras agrupadas por estado y resumen de cupos para el organizador', async () => {
      // Arrange
      mockEventoRepo.buscarPorId.mockResolvedValue(evento);

      const compra1 = new Compra({
        id: 'c-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1,
        estado: EstadoCompra.CONFIRMADA
      });
      const compra2 = new Compra({
        id: 'c-2',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 2,
        estado: EstadoCompra.PENDIENTE
      });

      mockCompraRepo.buscarPorEvento.mockResolvedValue([compra1, compra2]);

      // Act
      const resultado = await compraService.listarComprasPorEvento('evt-1', 'org-1');

      // Assert
      expect(mockEventoRepo.buscarPorId).toHaveBeenCalledWith('evt-1');
      expect(mockCompraRepo.buscarPorEvento).toHaveBeenCalledWith('evt-1');
      expect(resultado.compras).toHaveLength(2);
      expect(resultado.comprasPorEstado.CONFIRMADA).toHaveLength(1);
      expect(resultado.comprasPorEstado.PENDIENTE).toHaveLength(1);
      expect(resultado.entradasDisponibles).toHaveLength(1);
      expect(resultado.entradasDisponibles[0].nombre).toBe('General');
    });

    test('debe lanzar ForbiddenDomainError si el usuario no es el organizador del evento', async () => {
      // Arrange
      mockEventoRepo.buscarPorId.mockResolvedValue(evento);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        compraService.listarComprasPorEvento('evt-1', 'usuario-ajeno')
      ).rejects.toThrow(ForbiddenDomainError);
    });

    test('debe lanzar NotFoundError si el evento no existe', async () => {
      // Arrange
      mockEventoRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        compraService.listarComprasPorEvento('evt-inexistente', 'org-1')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('cancelarCompra', () => {
    test('debe cancelar compra válida, restituir cupo y guardar en repositorio', async () => {
      // Arrange
      const compra = new Compra({
        id: 'c-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 2,
        estado: EstadoCompra.CONFIRMADA
      });
      const cupoPrevio = tipoEntrada.cupo; // 8

      mockCompraRepo.buscarPorId.mockResolvedValue(compra);
      mockUsuarioRepo.buscarPorId.mockResolvedValue(comprador);
      mockCompraRepo.guardar.mockImplementation(async (c) => c);

      // Act
      const resultado = await compraService.cancelarCompra('c-1', 'comp-1');

      // Assert
      expect(mockCompraRepo.buscarPorId).toHaveBeenCalledWith('c-1');
      expect(mockUsuarioRepo.buscarPorId).toHaveBeenCalledWith('comp-1');
      expect(mockCompraRepo.guardar).toHaveBeenCalledWith(compra);
      expect(resultado.estado).toBe(EstadoCompra.CANCELADA);
      expect(tipoEntrada.cupo).toBe(cupoPrevio + 2); // 10
    });

    test('debe lanzar ConflictError al intentar cancelar una compra que ya fue utilizada', async () => {
      // Arrange
      const compra = new Compra({
        id: 'c-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1,
        estado: EstadoCompra.CONFIRMADA
      });
      compra.marcarComoUtilizada(organizador);

      mockCompraRepo.buscarPorId.mockResolvedValue(compra);
      mockUsuarioRepo.buscarPorId.mockResolvedValue(comprador);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(compraService.cancelarCompra('c-1', 'comp-1')).rejects.toThrow(ConflictError);
      expect(mockCompraRepo.guardar).not.toHaveBeenCalled();
    });
  });

  describe('enviarMensaje', () => {
    test('debe agregar mensaje en el chat de la compra y guardar el cambio', async () => {
      // Arrange
      const compra = new Compra({
        id: 'c-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1
      });

      mockCompraRepo.buscarPorId.mockResolvedValue(compra);
      mockUsuarioRepo.buscarPorId.mockResolvedValue(comprador);
      mockCompraRepo.guardar.mockImplementation(async (c) => c);

      // Act
      const mensaje = await compraService.enviarMensaje('c-1', 'comp-1', 'Hola, consulta de horario');

      // Assert
      expect(mockCompraRepo.buscarPorId).toHaveBeenCalledWith('c-1');
      expect(mockUsuarioRepo.buscarPorId).toHaveBeenCalledWith('comp-1');
      expect(mockCompraRepo.guardar).toHaveBeenCalledWith(compra);
      expect(mensaje.mensaje).toBe('Hola, consulta de horario');
      expect(mensaje.usuario).toBe(comprador);
      expect(compra.mensajes).toHaveLength(1);
    });

    test('debe lanzar ForbiddenDomainError si un usuario externo intenta enviar un mensaje', async () => {
      // Arrange
      const compra = new Compra({
        id: 'c-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1
      });
      const tercero = new Usuario({ id: 'usr-3', nombre: 'Tercero', apellido: 'T' });

      mockCompraRepo.buscarPorId.mockResolvedValue(compra);
      mockUsuarioRepo.buscarPorId.mockResolvedValue(tercero);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        compraService.enviarMensaje('c-1', 'usr-3', 'Mensaje invasor')
      ).rejects.toThrow(ForbiddenDomainError);
      expect(mockCompraRepo.guardar).not.toHaveBeenCalled();
    });
  });

  describe('actualizarEstadoCompra', () => {
    test('debe actualizar el estado de la compra y guardarla', async () => {
      // Arrange
      const compra = new Compra({
        id: 'c-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1,
        estado: EstadoCompra.PENDIENTE
      });

      mockCompraRepo.buscarPorId.mockResolvedValue(compra);
      mockUsuarioRepo.buscarPorId.mockResolvedValue(organizador);
      mockCompraRepo.guardar.mockImplementation(async (c) => c);

      // Act
      const resultado = await compraService.actualizarEstadoCompra(
        'c-1',
        EstadoCompra.CONFIRMADA,
        'org-1'
      );

      // Assert
      expect(mockCompraRepo.buscarPorId).toHaveBeenCalledWith('c-1');
      expect(mockUsuarioRepo.buscarPorId).toHaveBeenCalledWith('org-1');
      expect(mockCompraRepo.guardar).toHaveBeenCalledWith(compra);
      expect(resultado.estado).toBe(EstadoCompra.CONFIRMADA);
      expect(compra.historialEstados).toHaveLength(2);
    });
  });
});
