import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { UsuarioController } from '../../src/controllers/UsuarioController.js';

describe('UsuarioController Unit Tests', () => {
  let mockUsuarioService;
  let controller;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockUsuarioService = {
      listarUsuarios: jest.fn(),
      obtenerUsuarioPorId: jest.fn(),
      toggleFavorito: jest.fn()
    };
    controller = new UsuarioController({ usuarioService: mockUsuarioService });

    const jsonMock = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnValue({ json: jsonMock }),
      json: jsonMock
    };
    mockNext = jest.fn();
  });

  describe('listarUsuarios', () => {
    test('debe responder 200 con la lista de usuarios', async () => {
      // Arrange
      const usuariosMock = [{ id: 'usr-1', nombre: 'Ana' }];
      mockUsuarioService.listarUsuarios.mockResolvedValue(usuariosMock);
      const req = {};

      // Act
      await controller.listarUsuarios(req, mockRes, mockNext);

      // Assert
      expect(mockUsuarioService.listarUsuarios).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: usuariosMock
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe delegar a next(error) ante error del servicio', async () => {
      // Arrange
      const error = new Error('Error al listar');
      mockUsuarioService.listarUsuarios.mockRejectedValue(error);
      const req = {};

      // Act
      await controller.listarUsuarios(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('obtenerUsuarioPorId', () => {
    test('debe responder 200 con el usuario encontrado', async () => {
      // Arrange
      const usuarioMock = { id: 'usr-1', nombre: 'Ana' };
      mockUsuarioService.obtenerUsuarioPorId.mockResolvedValue(usuarioMock);
      const req = { params: { id: 'usr-1' } };

      // Act
      await controller.obtenerUsuarioPorId(req, mockRes, mockNext);

      // Assert
      expect(mockUsuarioService.obtenerUsuarioPorId).toHaveBeenCalledWith('usr-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: usuarioMock
      });
    });

    test('debe delegar a next(error) si el usuario no existe', async () => {
      // Arrange
      const error = new Error('Usuario no encontrado');
      mockUsuarioService.obtenerUsuarioPorId.mockRejectedValue(error);
      const req = { params: { id: 'usr-inexistente' } };

      // Act
      await controller.obtenerUsuarioPorId(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('toggleFavorito', () => {
    test('debe responder 200 con el usuario y el favorito actualizado', async () => {
      // Arrange
      const usuarioActualizado = { id: 'usr-1', favoritos: [{ id: 'evt-1' }] };
      mockUsuarioService.toggleFavorito.mockResolvedValue(usuarioActualizado);
      const req = { params: { id: 'usr-1' }, body: { eventoId: 'evt-1' } };

      // Act
      await controller.toggleFavorito(req, mockRes, mockNext);

      // Assert
      expect(mockUsuarioService.toggleFavorito).toHaveBeenCalledWith('usr-1', 'evt-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: usuarioActualizado
      });
    });

    test('debe delegar a next(error) ante error en toggleFavorito', async () => {
      // Arrange
      const error = new Error('Evento no encontrado');
      mockUsuarioService.toggleFavorito.mockRejectedValue(error);
      const req = { params: { id: 'usr-1' }, body: { eventoId: 'evt-x' } };

      // Act
      await controller.toggleFavorito(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
