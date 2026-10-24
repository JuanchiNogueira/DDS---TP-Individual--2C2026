import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { SeedController } from '../../src/controllers/SeedController.js';

describe('SeedController Unit Tests', () => {
  let mockSeedFn;
  let controller;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockSeedFn = jest.fn();
    controller = new SeedController({ seedFn: mockSeedFn });

    const jsonMock = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnValue({ json: jsonMock }),
      json: jsonMock
    };
    mockNext = jest.fn();
  });

  describe('seed', () => {
    test('debe responder 201 con los datos sembrados', async () => {
      // Arrange
      const seedDataMock = { usuarios: 4, eventos: 4 };
      mockSeedFn.mockReturnValue(seedDataMock);
      const req = {};

      // Act
      await controller.seed(req, mockRes, mockNext);

      // Assert
      expect(mockSeedFn).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: seedDataMock
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe delegar a next(error) si seedFn lanza una excepción', async () => {
      // Arrange
      const error = new Error('Error al sembrar base de datos');
      mockSeedFn.mockImplementation(() => {
        throw error;
      });
      const req = {};

      // Act
      await controller.seed(req, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
