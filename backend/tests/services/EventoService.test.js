import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { EventoService } from '../../src/services/EventoService.js';
import { Evento } from '../../src/domain/Evento.js';
import { Usuario } from '../../src/domain/Usuario.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { NotFoundError } from '../../src/domain/errors/DomainError.js';

describe('EventoService Unit Tests with Mocks', () => {
  let mockEventoRepo;
  let mockUsuarioRepo;
  let mockCategoriaRepo;
  let mockReseniaRepo;
  let eventoService;

  beforeEach(() => {
    mockEventoRepo = {
      guardar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarConFiltros: jest.fn()
    };
    mockUsuarioRepo = {
      buscarPorId: jest.fn()
    };
    mockCategoriaRepo = {
      buscarPorId: jest.fn(),
      listarTodas: jest.fn()
    };
    mockReseniaRepo = {
      calcularPromedioPorOrganizador: jest.fn(),
      buscarPorOrganizador: jest.fn()
    };

    eventoService = new EventoService({
      eventoRepository: mockEventoRepo,
      usuarioRepository: mockUsuarioRepo,
      categoriaRepository: mockCategoriaRepo,
      reseniaRepository: mockReseniaRepo
    });
  });

  describe('crearEvento', () => {
    test('debe crear y guardar un evento exitosamente cuando organizador y categoría existen', async () => {
      // Arrange
      const organizador = new Usuario({ id: 'org-1', nombre: 'Charly', apellido: 'García' });
      const categoria = new Categoria({ id: 'cat-1', nombre: 'Rock' });
      mockUsuarioRepo.buscarPorId.mockResolvedValue(organizador);
      mockCategoriaRepo.buscarPorId.mockResolvedValue(categoria);
      mockEventoRepo.guardar.mockImplementation(async (ev) => ev);

      const eventoData = {
        nombre: 'Quilmes Rock',
        descripcion: 'Festival anual',
        categoriaId: 'cat-1',
        fecha: new Date('2027-03-01T20:00:00Z'),
        tiposEntrada: [
          { nombre: 'Campo', precio: 5000, cupo: 100 }
        ],
        multimedia: ['foto.jpg'],
        organizadorId: 'org-1'
      };

      // Act
      const resultado = await eventoService.crearEvento(eventoData);

      // Assert
      expect(mockUsuarioRepo.buscarPorId).toHaveBeenCalledWith('org-1');
      expect(mockCategoriaRepo.buscarPorId).toHaveBeenCalledWith('cat-1');
      expect(mockEventoRepo.guardar).toHaveBeenCalledTimes(1);
      expect(resultado).toBeInstanceOf(Evento);
      expect(resultado.nombre).toBe('Quilmes Rock');
      expect(resultado.organizador).toBe(organizador);
      expect(resultado.categoria).toBe(categoria);
    });

    test('debe lanzar NotFoundError si el organizador no existe', async () => {
      // Arrange
      mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

      const eventoData = {
        nombre: 'Show',
        categoriaId: 'cat-1',
        organizadorId: 'org-inexistente'
      };

      // Act & Assert
      // Arrange / Act / Assert
      await expect(eventoService.crearEvento(eventoData)).rejects.toThrow(NotFoundError);
      expect(mockEventoRepo.guardar).not.toHaveBeenCalled();
    });

    test('debe lanzar NotFoundError si la categoría no existe', async () => {
      // Arrange
      const organizador = new Usuario({ id: 'org-1', nombre: 'Charly', apellido: 'García' });
      mockUsuarioRepo.buscarPorId.mockResolvedValue(organizador);
      mockCategoriaRepo.buscarPorId.mockResolvedValue(null);

      const eventoData = {
        nombre: 'Show',
        categoriaId: 'cat-inexistente',
        organizadorId: 'org-1'
      };

      // Act & Assert
      // Arrange / Act / Assert
      await expect(eventoService.crearEvento(eventoData)).rejects.toThrow(NotFoundError);
      expect(mockEventoRepo.guardar).not.toHaveBeenCalled();
    });
  });

  describe('buscarEventos', () => {
    test('debe enriquecer eventos con el puntaje promedio del organizador y ordenar por precio asc', async () => {
      // Arrange
      const organizador = new Usuario({ id: 'org-1', nombre: 'Charly', apellido: 'García' });
      const categoria = new Categoria({ id: 'cat-1', nombre: 'Rock' });
      const t1 = new TipoEntrada({ nombre: 'Entrada Cara', precio: 10000, cupo: 20 });
      const t2 = new TipoEntrada({ nombre: 'Entrada Barata', precio: 3000, cupo: 50 });

      const evCaro = new Evento({
        id: 'ev-caro',
        nombre: 'VIP Fest',
        categoria,
        fecha: new Date('2027-01-01'),
        tiposEntrada: [t1],
        organizador
      });
      const evBarato = new Evento({
        id: 'ev-barato',
        nombre: 'Popular Fest',
        categoria,
        fecha: new Date('2027-02-01'),
        tiposEntrada: [t2],
        organizador
      });

      mockEventoRepo.buscarConFiltros.mockResolvedValue([evCaro, evBarato]);
      mockReseniaRepo.calcularPromedioPorOrganizador.mockResolvedValue(4.8);

      // Act
      const resultados = await eventoService.buscarEventos({
        ordenarPor: 'precio',
        orden: 'asc'
      });

      // Assert
      expect(mockEventoRepo.buscarConFiltros).toHaveBeenCalledTimes(1);
      expect(mockReseniaRepo.calcularPromedioPorOrganizador).toHaveBeenCalledWith('org-1');
      expect(resultados[0].id).toBe('ev-barato');
      expect(resultados[1].id).toBe('ev-caro');
      expect(resultados[0].puntajeOrganizador).toBe(4.8);
    });

    test('debe ordenar por puntaje descendente por defecto', async () => {
      // Arrange
      const org1 = new Usuario({ id: 'org-1', nombre: 'Productor A', apellido: 'P' });
      const org2 = new Usuario({ id: 'org-2', nombre: 'Productor B', apellido: 'P' });
      const categoria = new Categoria({ id: 'cat-1', nombre: 'Rock' });
      const t = new TipoEntrada({ nombre: 'G', precio: 5000, cupo: 10 });

      const ev1 = new Evento({ id: 'e-1', nombre: 'Ev 1', categoria, fecha: new Date(), tiposEntrada: [t], organizador: org1 });
      const ev2 = new Evento({ id: 'e-2', nombre: 'Ev 2', categoria, fecha: new Date(), tiposEntrada: [t], organizador: org2 });

      mockEventoRepo.buscarConFiltros.mockResolvedValue([ev1, ev2]);
      mockReseniaRepo.calcularPromedioPorOrganizador
        .mockImplementation(async (id) => (id === 'org-1' ? 3.5 : 4.9));

      // Act
      const resultados = await eventoService.buscarEventos({ ordenarPor: 'puntaje' });

      // Assert
      expect(resultados[0].id).toBe('e-2'); // 4.9 primero
      expect(resultados[1].id).toBe('e-1'); // 3.5 segundo
      expect(resultados[0].puntajeOrganizador).toBe(4.9);
      expect(resultados[1].puntajeOrganizador).toBe(3.5);
    });

    test('debe ordenar por fecha descendente cuando se especifica orden desc', async () => {
      // Arrange
      const org = new Usuario({ id: 'org-1', nombre: 'Productor', apellido: 'P' });
      const cat = new Categoria({ id: 'cat-1', nombre: 'Rock' });
      const t = new TipoEntrada({ nombre: 'G', precio: 1000, cupo: 10 });

      const evTemprano = new Evento({ id: 'e-1', nombre: 'Temprano', categoria: cat, fecha: new Date('2027-01-10'), tiposEntrada: [t], organizador: org });
      const evTardio = new Evento({ id: 'e-2', nombre: 'Tardío', categoria: cat, fecha: new Date('2027-05-20'), tiposEntrada: [t], organizador: org });

      mockEventoRepo.buscarConFiltros.mockResolvedValue([evTemprano, evTardio]);
      mockReseniaRepo.calcularPromedioPorOrganizador.mockResolvedValue(4.0);

      // Act
      const resultados = await eventoService.buscarEventos({ ordenarPor: 'fecha', orden: 'desc' });

      // Assert
      expect(resultados[0].id).toBe('e-2');
      expect(resultados[1].id).toBe('e-1');
    });
  });

  describe('obtenerDetalleEvento', () => {
    test('debe devolver el detalle completo del evento incluyendo puntaje y reseñas del organizador', async () => {
      // Arrange
      const org = new Usuario({ id: 'org-1', nombre: 'Charly', apellido: 'García' });
      const cat = new Categoria({ id: 'cat-1', nombre: 'Rock' });
      const t = new TipoEntrada({ nombre: 'Campo', precio: 5000, cupo: 25 });
      const evento = new Evento({ id: 'evt-10', nombre: 'Show Rock', categoria: cat, fecha: new Date(), tiposEntrada: [t], organizador: org });
      const mockResenias = [{ id: 'res-1', detalle: 'Genial', puntuacion: 5 }];

      mockEventoRepo.buscarPorId.mockResolvedValue(evento);
      mockReseniaRepo.calcularPromedioPorOrganizador.mockResolvedValue(4.9);
      mockReseniaRepo.buscarPorOrganizador.mockResolvedValue(mockResenias);

      // Act
      const detalle = await eventoService.obtenerDetalleEvento('evt-10');

      // Assert
      expect(mockEventoRepo.buscarPorId).toHaveBeenCalledWith('evt-10');
      expect(mockReseniaRepo.calcularPromedioPorOrganizador).toHaveBeenCalledWith('org-1');
      expect(mockReseniaRepo.buscarPorOrganizador).toHaveBeenCalledWith('org-1');
      expect(detalle.evento).toBe(evento);
      expect(detalle.tiposEntrada).toHaveLength(1);
      expect(detalle.tiposEntrada[0].cupo).toBe(25);
      expect(detalle.puntajeOrganizador).toBe(4.9);
      expect(detalle.resenias).toEqual(mockResenias);
    });

    test('debe lanzar NotFoundError si el evento no existe', async () => {
      // Arrange
      mockEventoRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      // Arrange / Act / Assert
      await expect(eventoService.obtenerDetalleEvento('evt-inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listarCategorias', () => {
    test('debe delegar en categoriaRepository.listarTodas', async () => {
      // Arrange
      const categorias = [new Categoria({ id: 'c-1', nombre: 'Rock' })];
      mockCategoriaRepo.listarTodas.mockResolvedValue(categorias);

      // Act
      const resultado = await eventoService.listarCategorias();

      // Assert
      expect(mockCategoriaRepo.listarTodas).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(categorias);
    });
  });
});
