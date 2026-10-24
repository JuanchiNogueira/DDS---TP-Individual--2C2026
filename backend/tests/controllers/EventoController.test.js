import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { EventoController } from '../../src/controllers/EventoController.js';

describe('EventoController Unit Tests', () => {
  let mockEventoService;
  let controller;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockEventoService = {
      listarCategorias: jest.fn(),
      buscarEventos: jest.fn(),
      obtenerDetalleEvento: jest.fn(),
      crearEvento: jest.fn()
    };
    controller = new EventoController({ eventoService: mockEventoService });

    const jsonMock = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnValue({ json: jsonMock }),
      json: jsonMock
    };
    mockNext = jest.fn();
  });

  describe('listarCategorias', () => {
    test('debe responder 200 con la lista de categorías', async () => {
      // Arrange
      const categoriasMock = [{ id: 'cat-1', nombre: 'Rock' }];
      mockEventoService.listarCategorias.mockResolvedValue(categoriasMock);
      const req = {};

      // Act
      await controller.listarCategorias(req, mockRes, mockNext);

      // Assert
      expect(mockEventoService.listarCategorias).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: categoriasMock
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe delegar a next(error) si el servicio falla', async () => {
      // Arrange
      const error = new Error('Error al listar categorías');
      mockEventoService.listarCategorias.mockRejectedValue(error);
      const req = {};

      // Act
      await controller.listarCategorias(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('buscarEventos', () => {
    test('debe responder 200 con eventos filtrados', async () => {
      // Arrange
      const eventosMock = [{ id: 'evt-1', nombre: 'Show' }];
      mockEventoService.buscarEventos.mockResolvedValue(eventosMock);
      const req = { query: { texto: 'Show' } };

      // Act
      await controller.buscarEventos(req, mockRes, mockNext);

      // Assert
      expect(mockEventoService.buscarEventos).toHaveBeenCalledWith({ texto: 'Show' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: eventosMock
      });
    });

    test('debe delegar a next(error) si buscarEventos lanza excepción', async () => {
      // Arrange
      const error = new Error('Falla en búsqueda');
      mockEventoService.buscarEventos.mockRejectedValue(error);
      const req = { query: {} };

      // Act
      await controller.buscarEventos(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('obtenerDetalleEvento', () => {
    test('debe responder 200 con el detalle del evento', async () => {
      // Arrange
      const detalleMock = { id: 'evt-1', nombre: 'Show VIP', puntajeOrganizador: 4.8 };
      mockEventoService.obtenerDetalleEvento.mockResolvedValue(detalleMock);
      const req = { params: { id: 'evt-1' } };

      // Act
      await controller.obtenerDetalleEvento(req, mockRes, mockNext);

      // Assert
      expect(mockEventoService.obtenerDetalleEvento).toHaveBeenCalledWith('evt-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: detalleMock
      });
    });

    test('debe delegar a next(error) si el evento no existe', async () => {
      // Arrange
      const error = new Error('Evento no encontrado');
      mockEventoService.obtenerDetalleEvento.mockRejectedValue(error);
      const req = { params: { id: 'evt-inexistente' } };

      // Act
      await controller.obtenerDetalleEvento(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('crearEvento', () => {
    test('debe responder 201 con el evento creado', async () => {
      // Arrange
      const eventoCreado = { id: 'evt-new', nombre: 'Nuevo Evento' };
      mockEventoService.crearEvento.mockResolvedValue(eventoCreado);
      const req = { body: { nombre: 'Nuevo Evento' } };

      // Act
      await controller.crearEvento(req, mockRes, mockNext);

      // Assert
      expect(mockEventoService.crearEvento).toHaveBeenCalledWith({ nombre: 'Nuevo Evento' });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: eventoCreado
      });
    });

    test('debe delegar a next(error) ante error en creación', async () => {
      // Arrange
      const error = new Error('Datos inválidos');
      mockEventoService.crearEvento.mockRejectedValue(error);
      const req = { body: {} };

      // Act
      await controller.crearEvento(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
