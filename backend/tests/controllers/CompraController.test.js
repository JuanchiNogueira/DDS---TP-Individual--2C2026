import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { CompraController } from '../../src/controllers/CompraController.js';

describe('CompraController Unit Tests', () => {
  let mockCompraService;
  let controller;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockCompraService = {
      realizarCompra: jest.fn(),
      listarComprasPorComprador: jest.fn(),
      listarComprasPorEvento: jest.fn(),
      cancelarCompra: jest.fn(),
      actualizarEstadoCompra: jest.fn(),
      enviarMensaje: jest.fn()
    };
    controller = new CompraController({ compraService: mockCompraService });

    const jsonMock = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnValue({ json: jsonMock }),
      json: jsonMock
    };
    mockNext = jest.fn();
  });

  describe('realizarCompra', () => {
    test('debe responder 201 con la compra creada', async () => {
      // Arrange
      const compraMock = { id: 'c-1', total: 5000 };
      mockCompraService.realizarCompra.mockResolvedValue(compraMock);
      const req = { body: { compradorId: 'comp-1', cantidad: 1 } };

      // Act
      await controller.realizarCompra(req, mockRes, mockNext);

      // Assert
      expect(mockCompraService.realizarCompra).toHaveBeenCalledWith(req.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: compraMock
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe delegar a next(error) ante error en compra', async () => {
      // Arrange
      const error = new Error('Cupo no disponible');
      mockCompraService.realizarCompra.mockRejectedValue(error);
      const req = { body: {} };

      // Act
      await controller.realizarCompra(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('listarComprasPorComprador', () => {
    test('debe responder 200 con las compras del comprador', async () => {
      // Arrange
      const comprasMock = [{ id: 'c-1', diasFaltantes: 5 }];
      mockCompraService.listarComprasPorComprador.mockResolvedValue(comprasMock);
      const req = { params: { compradorId: 'comp-1' } };

      // Act
      await controller.listarComprasPorComprador(req, mockRes, mockNext);

      // Assert
      expect(mockCompraService.listarComprasPorComprador).toHaveBeenCalledWith('comp-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: comprasMock
      });
    });

    test('debe delegar a next(error) si falla la obtención', async () => {
      // Arrange
      const error = new Error('Comprador inexistente');
      mockCompraService.listarComprasPorComprador.mockRejectedValue(error);
      const req = { params: { compradorId: 'comp-x' } };

      // Act
      await controller.listarComprasPorComprador(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('listarComprasPorEvento', () => {
    test('debe responder 200 con compras por evento y cupos disponibles', async () => {
      // Arrange
      const dataMock = { compras: [], entradasDisponibles: [] };
      mockCompraService.listarComprasPorEvento.mockResolvedValue(dataMock);
      const req = { params: { eventoId: 'evt-1' }, query: { organizadorId: 'org-1' } };

      // Act
      await controller.listarComprasPorEvento(req, mockRes, mockNext);

      // Assert
      expect(mockCompraService.listarComprasPorEvento).toHaveBeenCalledWith('evt-1', 'org-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: dataMock
      });
    });

    test('debe delegar a next(error) ante permisos denegados', async () => {
      // Arrange
      const error = new Error('Forbidden');
      mockCompraService.listarComprasPorEvento.mockRejectedValue(error);
      const req = { params: { eventoId: 'evt-1' }, query: { organizadorId: 'org-ajeno' } };

      // Act
      await controller.listarComprasPorEvento(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelarCompra', () => {
    test('debe responder 200 con la compra cancelada', async () => {
      // Arrange
      const compraCancelada = { id: 'c-1', estado: 'CANCELADA' };
      mockCompraService.cancelarCompra.mockResolvedValue(compraCancelada);
      const req = { params: { id: 'c-1' }, body: { usuarioId: 'comp-1' } };

      // Act
      await controller.cancelarCompra(req, mockRes, mockNext);

      // Assert
      expect(mockCompraService.cancelarCompra).toHaveBeenCalledWith('c-1', 'comp-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: compraCancelada
      });
    });

    test('debe delegar a next(error) ante error de cancelación', async () => {
      // Arrange
      const error = new Error('Compra ya utilizada');
      mockCompraService.cancelarCompra.mockRejectedValue(error);
      const req = { params: { id: 'c-1' }, body: { usuarioId: 'comp-1' } };

      // Act
      await controller.cancelarCompra(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('actualizarEstadoCompra', () => {
    test('debe responder 200 con el estado actualizado', async () => {
      // Arrange
      const compraActualizada = { id: 'c-1', estado: 'CONFIRMADA' };
      mockCompraService.actualizarEstadoCompra.mockResolvedValue(compraActualizada);
      const req = {
        params: { id: 'c-1' },
        body: { estado: 'CONFIRMADA', usuarioId: 'org-1' }
      };

      // Act
      await controller.actualizarEstadoCompra(req, mockRes, mockNext);

      // Assert
      expect(mockCompraService.actualizarEstadoCompra).toHaveBeenCalledWith(
        'c-1',
        'CONFIRMADA',
        'org-1'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: compraActualizada
      });
    });
  });

  describe('enviarMensaje', () => {
    test('debe responder 201 con el mensaje enviado', async () => {
      // Arrange
      const mensajeMock = { id: 'm-1', mensaje: 'Hola' };
      mockCompraService.enviarMensaje.mockResolvedValue(mensajeMock);
      const req = {
        params: { id: 'c-1' },
        body: { usuarioId: 'comp-1', texto: 'Hola' }
      };

      // Act
      await controller.enviarMensaje(req, mockRes, mockNext);

      // Assert
      expect(mockCompraService.enviarMensaje).toHaveBeenCalledWith('c-1', 'comp-1', 'Hola');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mensajeMock
      });
    });

    test('debe delegar a next(error) ante error en envío de mensaje', async () => {
      // Arrange
      const error = new Error('Permiso denegado');
      mockCompraService.enviarMensaje.mockRejectedValue(error);
      const req = { params: { id: 'c-1' }, body: { usuarioId: 'otro', texto: 'Hola' } };

      // Act
      await controller.enviarMensaje(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
