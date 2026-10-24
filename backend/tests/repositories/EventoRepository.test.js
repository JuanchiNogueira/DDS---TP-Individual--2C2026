import { describe, test, expect, beforeEach } from '@jest/globals';
import { EventoRepository } from '../../src/repositories/EventoRepository.js';
import { Evento } from '../../src/domain/Evento.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { Usuario } from '../../src/domain/Usuario.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';

describe('EventoRepository Unit Tests', () => {
  let repository;
  let organizador1;
  let organizador2;
  let categoriaRock;
  let categoriaTeatro;

  beforeEach(() => {
    repository = new EventoRepository();
    organizador1 = new Usuario({ id: 'org-1', nombre: 'Charly', apellido: 'García' });
    organizador2 = new Usuario({ id: 'org-2', nombre: 'Pedro', apellido: 'Teatral' });
    categoriaRock = new Categoria({ id: 'cat-rock', nombre: 'Rock' });
    categoriaTeatro = new Categoria({ id: 'cat-teatro', nombre: 'Teatro' });
  });

  test('debe guardar y recuperar un evento por ID', () => {
    // Arrange
    const entrada = new TipoEntrada({ nombre: 'Campo', precio: 5000, cupo: 100 });
    const evento = new Evento({
      id: 'evt-1',
      nombre: 'Festival Rock',
      descripcion: 'Recital masivo',
      categoria: categoriaRock,
      fecha: new Date('2027-01-01T20:00:00Z'),
      tiposEntrada: [entrada],
      organizador: organizador1
    });

    // Act
    const guardado = repository.guardar(evento);
    const recuperado = repository.buscarPorId('evt-1');

    // Assert
    expect(guardado).toBe(evento);
    expect(recuperado).toBe(evento);
    expect(recuperado.nombre).toBe('Festival Rock');
  });

  test('debe buscar eventos por ID del organizador', () => {
    // Arrange
    const entrada1 = new TipoEntrada({ nombre: 'Campo', precio: 5000, cupo: 50 });
    const entrada2 = new TipoEntrada({ nombre: 'Platea', precio: 8000, cupo: 30 });

    const ev1 = new Evento({
      id: 'e-1',
      nombre: 'Rock Fest',
      categoria: categoriaRock,
      fecha: new Date(),
      tiposEntrada: [entrada1],
      organizador: organizador1
    });
    const ev2 = new Evento({
      id: 'e-2',
      nombre: 'Acústico Rock',
      categoria: categoriaRock,
      fecha: new Date(),
      tiposEntrada: [entrada1],
      organizador: organizador1
    });
    const ev3 = new Evento({
      id: 'e-3',
      nombre: 'Comedia Teatral',
      categoria: categoriaTeatro,
      fecha: new Date(),
      tiposEntrada: [entrada2],
      organizador: organizador2
    });

    repository.guardar(ev1);
    repository.guardar(ev2);
    repository.guardar(ev3);

    // Act
    const eventosOrg1 = repository.buscarPorOrganizador('org-1');
    const eventosOrg2 = repository.buscarPorOrganizador('org-2');
    const eventosOrgInexistente = repository.buscarPorOrganizador('org-999');

    // Assert
    expect(eventosOrg1).toHaveLength(2);
    expect(eventosOrg1).toContain(ev1);
    expect(eventosOrg1).toContain(ev2);
    expect(eventosOrg2).toHaveLength(1);
    expect(eventosOrg2).toContain(ev3);
    expect(eventosOrgInexistente).toEqual([]);
  });

  test('debe buscar con filtros de texto case-insensitive en nombre y descripción', () => {
    // Arrange
    const entrada = new TipoEntrada({ nombre: 'General', precio: 3000, cupo: 20 });
    const ev1 = new Evento({
      id: 'e-1',
      nombre: 'FESTIVAL PRIMAVERA',
      descripcion: 'música y diversión al sol',
      categoria: categoriaRock,
      fecha: new Date(),
      tiposEntrada: [entrada],
      organizador: organizador1
    });
    const ev2 = new Evento({
      id: 'e-2',
      nombre: 'Show de Standup',
      descripcion: 'El mejor show de comedia de Primavera',
      categoria: categoriaTeatro,
      fecha: new Date(),
      tiposEntrada: [entrada],
      organizador: organizador2
    });
    const ev3 = new Evento({
      id: 'e-3',
      nombre: 'Concierto de Invierno',
      descripcion: 'Música clásica en sala cerrada',
      categoria: categoriaTeatro,
      fecha: new Date(),
      tiposEntrada: [entrada],
      organizador: organizador2
    });

    repository.guardar(ev1);
    repository.guardar(ev2);
    repository.guardar(ev3);

    // Act
    const resultadosNombre = repository.buscarConFiltros({ texto: 'primavera' });
    const resultadosDescripcion = repository.buscarConFiltros({ texto: 'clásica' });
    const resultadosSinCoincidencia = repository.buscarConFiltros({ texto: 'jazz' });

    // Assert
    expect(resultadosNombre).toHaveLength(2);
    expect(resultadosNombre).toContain(ev1);
    expect(resultadosNombre).toContain(ev2);
    expect(resultadosDescripcion).toHaveLength(1);
    expect(resultadosDescripcion).toContain(ev3);
    expect(resultadosSinCoincidencia).toHaveLength(0);
  });

  test('debe buscar con filtros por categoría y rango de precios', () => {
    // Arrange
    const entradaBarata = new TipoEntrada({ nombre: 'Popular', precio: 2000, cupo: 50 });
    const entradaMedia = new TipoEntrada({ nombre: 'General', precio: 5000, cupo: 50 });
    const entradaCara = new TipoEntrada({ nombre: 'VIP', precio: 12000, cupo: 10 });

    const evRockBarato = new Evento({
      id: 'ev-rb',
      nombre: 'Rock Barato',
      categoria: categoriaRock,
      fecha: new Date(),
      tiposEntrada: [entradaBarata],
      organizador: organizador1
    });
    const evRockCaro = new Evento({
      id: 'ev-rc',
      nombre: 'Rock Premium VIP',
      categoria: categoriaRock,
      fecha: new Date(),
      tiposEntrada: [entradaCara],
      organizador: organizador1
    });
    const evTeatroMedio = new Evento({
      id: 'ev-tm',
      nombre: 'Obra de Teatro',
      categoria: categoriaTeatro,
      fecha: new Date(),
      tiposEntrada: [entradaMedia],
      organizador: organizador2
    });

    repository.guardar(evRockBarato);
    repository.guardar(evRockCaro);
    repository.guardar(evTeatroMedio);

    // Act
    const filtroPorCategoria = repository.buscarConFiltros({ categoriaId: 'cat-rock' });
    const filtroPorPrecio = repository.buscarConFiltros({ precioMin: 4000, precioMax: 10000 });
    const filtroCombinado = repository.buscarConFiltros({
      categoriaId: 'cat-rock',
      precioMin: 10000,
      precioMax: 15000
    });
    const filtroRangoInvertido = repository.buscarConFiltros({ precioMin: 15000, precioMax: 5000 });

    // Assert
    expect(filtroPorCategoria).toHaveLength(2);
    expect(filtroPorCategoria).toContain(evRockBarato);
    expect(filtroPorCategoria).toContain(evRockCaro);

    expect(filtroPorPrecio).toHaveLength(1);
    expect(filtroPorPrecio).toContain(evTeatroMedio);

    expect(filtroCombinado).toHaveLength(1);
    expect(filtroCombinado).toContain(evRockCaro);

    expect(filtroRangoInvertido).toHaveLength(0);
  });

  test('debe limpiar todos los eventos almacenados', () => {
    // Arrange
    const entrada = new TipoEntrada({ nombre: 'General', precio: 3000, cupo: 20 });
    const evento = new Evento({
      id: 'e-1',
      nombre: 'Show',
      categoria: categoriaRock,
      fecha: new Date(),
      tiposEntrada: [entrada],
      organizador: organizador1
    });
    repository.guardar(evento);

    // Act
    repository.limpiar();

    // Assert
    expect(repository.listarTodos()).toHaveLength(0);
    expect(repository.buscarPorId('e-1')).toBeNull();
  });
});
