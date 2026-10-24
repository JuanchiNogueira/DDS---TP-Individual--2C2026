import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { UsuarioService } from '../../src/services/UsuarioService.js';
import { Usuario } from '../../src/domain/Usuario.js';
import { Evento } from '../../src/domain/Evento.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { NotFoundError } from '../../src/domain/errors/DomainError.js';

describe('UsuarioService Unit Tests with Mocks', () => {
  let mockUsuarioRepo;
  let mockEventoRepo;
  let usuarioService;

  let usuario;
  let evento;

  beforeEach(() => {
    mockUsuarioRepo = {
      listarTodos: jest.fn(),
      buscarPorId: jest.fn(),
      guardar: jest.fn()
    };
    mockEventoRepo = {
      buscarPorId: jest.fn()
    };

    usuarioService = new UsuarioService({
      usuarioRepository: mockUsuarioRepo,
      eventoRepository: mockEventoRepo
    });

    usuario = new Usuario({ id: 'usr-1', nombre: 'Lucas', apellido: 'Fernández' });
    const categoria = new Categoria({ id: 'cat-1', nombre: 'Música' });
    const organizador = new Usuario({ id: 'org-1', nombre: 'Charly', apellido: 'García' });
    evento = new Evento({
      id: 'evt-1',
      nombre: 'Concierto',
      categoria,
      fecha: new Date(),
      organizador
    });
  });

  describe('listarUsuarios', () => {
    test('debe listar todos los usuarios llamando al repositorio', async () => {
      // Arrange
      const lista = [usuario];
      mockUsuarioRepo.listarTodos.mockResolvedValue(lista);

      // Act
      const resultado = await usuarioService.listarUsuarios();

      // Assert
      expect(mockUsuarioRepo.listarTodos).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(lista);
    });
  });

  describe('obtenerUsuarioPorId', () => {
    test('debe retornar el usuario cuando existe', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(usuario);

      // Act
      const resultado = await usuarioService.obtenerUsuarioPorId('usr-1');

      // Assert
      expect(mockUsuarioRepo.buscarPorId).toHaveBeenCalledWith('usr-1');
      expect(resultado).toBe(usuario);
    });

    test('debe lanzar NotFoundError si el usuario no existe', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(usuarioService.obtenerUsuarioPorId('usr-inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('toggleFavorito', () => {
    test('debe agregar el evento a favoritos si no lo tenía y guardar el cambio', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(usuario);
      mockEventoRepo.buscarPorId.mockResolvedValue(evento);
      mockUsuarioRepo.guardar.mockImplementation(async (u) => u);

      // Act
      const resultado = await usuarioService.toggleFavorito('usr-1', 'evt-1');

      // Assert
      expect(mockUsuarioRepo.buscarPorId).toHaveBeenCalledWith('usr-1');
      expect(mockEventoRepo.buscarPorId).toHaveBeenCalledWith('evt-1');
      expect(mockUsuarioRepo.guardar).toHaveBeenCalledWith(usuario);
      expect(resultado.esFavorito('evt-1')).toBe(true);
    });

    test('debe remover el evento de favoritos si ya lo tenía y guardar el cambio', async () => {
      // Arrange
      usuario.agregarFavorito(evento);
      mockUsuarioRepo.buscarPorId.mockResolvedValue(usuario);
      mockEventoRepo.buscarPorId.mockResolvedValue(evento);
      mockUsuarioRepo.guardar.mockImplementation(async (u) => u);

      // Act
      const resultado = await usuarioService.toggleFavorito('usr-1', 'evt-1');

      // Assert
      expect(mockUsuarioRepo.buscarPorId).toHaveBeenCalledWith('usr-1');
      expect(mockEventoRepo.buscarPorId).toHaveBeenCalledWith('evt-1');
      expect(mockUsuarioRepo.guardar).toHaveBeenCalledWith(usuario);
      expect(resultado.esFavorito('evt-1')).toBe(false);
    });

    test('debe lanzar NotFoundError si el usuario no existe', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(usuarioService.toggleFavorito('usr-no-existe', 'evt-1')).rejects.toThrow(NotFoundError);
      expect(mockUsuarioRepo.guardar).not.toHaveBeenCalled();
    });

    test('debe lanzar NotFoundError si el evento no existe', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(usuario);
      mockEventoRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(usuarioService.toggleFavorito('usr-1', 'evt-no-existe')).rejects.toThrow(NotFoundError);
      expect(mockUsuarioRepo.guardar).not.toHaveBeenCalled();
    });
  });
});
