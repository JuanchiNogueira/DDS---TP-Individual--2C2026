import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { ReseniaController } from '../../src/controllers/ReseniaController.js';

describe('ReseniaController Unit Tests', () => {
  let mockReseniaService;
  let controller;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReseniaService = {
      crearResenia: jest.fn(),
      listarReseniasPorOrganizador: jest.fn()
    };
    controller = new ReseniaController({ reseniaService: mockReseniaService });

    const jsonMock = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnValue({ json: jsonMock }),
      json: jsonMock
    };
    mockNext = jest.fn();
  });

  describe('crearResenia', () => {
    test('debe responder 201 con la reseña creada', async () => {
      // Arrange
      const reseniaMock = { id: 'r-1', puntuacion: 5, detalle: 'Excelente' };
      mockReseniaService.crearResenia.mockResolvedValue(reseniaMock);
      const req = { body: { compraId: 'c-1', compradorId: 'u-1', puntuacion: 5, detalle: 'Excelente' } };

      // Act
      await controller.crearResenia(req, mockRes, mockNext);

      // Assert
      expect(mockReseniaService.crearResenia).toHaveBeenCalledWith(req.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: reseniaMock
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe delegar a next(error) ante error en creación', async () => {
      // Arrange
      const error = new Error('No utilizada');
      mockReseniaService.crearResenia.mockRejectedValue(error);
      const req = { body: {} };

      // Act
      await controller.crearResenia(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('listarReseniasPorOrganizador', () => {
    test('debe responder 200 con promedio y reseñas del organizador', async () => {
      // Arrange
      const resultadoMock = { promedio: 4.5, resenias: [] };
      mockReseniaService.listarReseniasPorOrganizador.mockResolvedValue(resultadoMock);
      const req = { params: { organizadorId: 'org-1' } };

      // Act
      await controller.listarReseniasPorOrganizador(req, mockRes, mockNext);

      // Assert
      expect(mockReseniaService.listarReseniasPorOrganizador).toHaveBeenCalledWith('org-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: resultadoMock
      });
    });

    test('debe delegar a next(error) si falla la consulta', async () => {
      // Arrange
      const error = new Error('Error de lectura');
      mockReseniaService.listarReseniasPorOrganizador.mockRejectedValue(error);
      const req = { params: { organizadorId: 'org-1' } };

      // Act
      await controller.listarReseniasPorOrganizador(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
