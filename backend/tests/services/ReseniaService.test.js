import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { ReseniaService } from '../../src/services/ReseniaService.js';
import { Resenia } from '../../src/domain/Resenia.js';
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

describe('ReseniaService Unit Tests with Mocks', () => {
  let mockReseniaRepo;
  let mockCompraRepo;
  let reseniaService;

  let comprador;
  let organizador;
  let categoria;
  let tipoEntrada;
  let evento;

  beforeEach(() => {
    mockReseniaRepo = {
      guardar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorEvento: jest.fn(),
      buscarPorOrganizador: jest.fn(),
      calcularPromedioPorOrganizador: jest.fn()
    };
    mockCompraRepo = {
      buscarPorId: jest.fn()
    };

    reseniaService = new ReseniaService({
      reseniaRepository: mockReseniaRepo,
      compraRepository: mockCompraRepo
    });

    comprador = new Usuario({ id: 'comp-1', nombre: 'Ana', apellido: 'Compradora' });
    organizador = new Usuario({ id: 'org-1', nombre: 'Charly', apellido: 'García' });
    categoria = new Categoria({ id: 'cat-1', nombre: 'Rock' });
    tipoEntrada = new TipoEntrada({ id: 'te-1', nombre: 'Campo', precio: 5000, cupo: 20 });
    evento = new Evento({
      id: 'evt-1',
      nombre: 'Show',
      categoria,
      fecha: new Date('2025-01-01T20:00:00Z'),
      tiposEntrada: [tipoEntrada],
      organizador
    });
  });

  describe('crearResenia', () => {
    test('debe crear y guardar una reseña exitosamente para una compra UTILIZADA', async () => {
      // Arrange
      const compra = new Compra({
        id: 'compra-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1,
        estado: EstadoCompra.CONFIRMADA
      });
      compra.marcarComoUtilizada(organizador);

      mockCompraRepo.buscarPorId.mockResolvedValue(compra);
      mockReseniaRepo.buscarPorEvento.mockResolvedValue([]);
      mockReseniaRepo.guardar.mockImplementation(async (r) => r);

      // Act
      const resenia = await reseniaService.crearResenia({
        compraId: 'compra-1',
        compradorId: 'comp-1',
        puntuacion: 5,
        detalle: 'Increíble experiencia y acústica.'
      });

      // Assert
      expect(mockCompraRepo.buscarPorId).toHaveBeenCalledWith('compra-1');
      expect(mockReseniaRepo.buscarPorEvento).toHaveBeenCalledWith('evt-1');
      expect(mockReseniaRepo.guardar).toHaveBeenCalledTimes(1);
      expect(resenia).toBeInstanceOf(Resenia);
      expect(resenia.puntuacion).toBe(5);
      expect(resenia.detalle).toBe('Increíble experiencia y acústica.');
      expect(resenia.comprador).toBe(comprador);
      expect(resenia.evento).toBe(evento);
    });

    test('debe lanzar NotFoundError si la compra no existe', async () => {
      // Arrange
      mockCompraRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        reseniaService.crearResenia({
          compraId: 'compra-inexistente',
          compradorId: 'comp-1',
          puntuacion: 5,
          detalle: 'Detalle'
        })
      ).rejects.toThrow(NotFoundError);
      expect(mockReseniaRepo.guardar).not.toHaveBeenCalled();
    });

    test('debe lanzar ForbiddenDomainError si el usuario no es el comprador de la compra', async () => {
      // Arrange
      const compra = new Compra({
        id: 'compra-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1
      });
      compra.marcarComoUtilizada(organizador);

      mockCompraRepo.buscarPorId.mockResolvedValue(compra);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        reseniaService.crearResenia({
          compraId: 'compra-1',
          compradorId: 'otro-comprador',
          puntuacion: 4,
          detalle: 'Comentario'
        })
      ).rejects.toThrow(ForbiddenDomainError);
      expect(mockReseniaRepo.guardar).not.toHaveBeenCalled();
    });

    test('debe lanzar ConflictError si ya existe una reseña para esa compra', async () => {
      // Arrange
      const compra = new Compra({
        id: 'compra-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1
      });
      compra.marcarComoUtilizada(organizador);

      const reseniaPrevia = new Resenia({
        compraId: 'compra-1',
        comprador,
        evento,
        detalle: 'Ya opiné',
        puntuacion: 4
      });

      mockCompraRepo.buscarPorId.mockResolvedValue(compra);
      mockReseniaRepo.buscarPorEvento.mockResolvedValue([reseniaPrevia]);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        reseniaService.crearResenia({
          compraId: 'compra-1',
          compradorId: 'comp-1',
          puntuacion: 5,
          detalle: 'Opinión repetida'
        })
      ).rejects.toThrow(ConflictError);
      expect(mockReseniaRepo.guardar).not.toHaveBeenCalled();
    });

    test('debe lanzar ConflictError si la compra no está en estado UTILIZADA', async () => {
      // Arrange
      const compraConfirmada = new Compra({
        id: 'compra-1',
        comprador,
        evento,
        tipoEntrada,
        cantidad: 1,
        estado: EstadoCompra.CONFIRMADA
      });

      mockCompraRepo.buscarPorId.mockResolvedValue(compraConfirmada);
      mockReseniaRepo.buscarPorEvento.mockResolvedValue([]);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(
        reseniaService.crearResenia({
          compraId: 'compra-1',
          compradorId: 'comp-1',
          puntuacion: 5,
          detalle: 'No fui todavía'
        })
      ).rejects.toThrow(ConflictError);
      expect(mockReseniaRepo.guardar).not.toHaveBeenCalled();
    });
  });

  describe('listarReseniasPorOrganizador', () => {
    test('debe retornar promedio y reseñas del organizador', async () => {
      // Arrange
      const mockResenias = [
        new Resenia({ comprador, evento, detalle: 'Genial', puntuacion: 5 })
      ];
      mockReseniaRepo.calcularPromedioPorOrganizador.mockResolvedValue(5.0);
      mockReseniaRepo.buscarPorOrganizador.mockResolvedValue(mockResenias);

      // Act
      const resultado = await reseniaService.listarReseniasPorOrganizador('org-1');

      // Assert
      expect(mockReseniaRepo.calcularPromedioPorOrganizador).toHaveBeenCalledWith('org-1');
      expect(mockReseniaRepo.buscarPorOrganizador).toHaveBeenCalledWith('org-1');
      expect(resultado.promedio).toBe(5.0);
      expect(resultado.resenias).toEqual(mockResenias);
    });
  });
});
