import { describe, test, expect, beforeEach } from '@jest/globals';
import { ReseniaRepository } from '../../src/repositories/ReseniaRepository.js';
import { Resenia } from '../../src/domain/Resenia.js';
import { Usuario } from '../../src/domain/Usuario.js';
import { Evento } from '../../src/domain/Evento.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';

describe('ReseniaRepository Unit Tests', () => {
  let repository;
  let comprador1;
  let comprador2;
  let organizador1;
  let organizador2;
  let evento1;
  let evento2;

  beforeEach(() => {
    repository = new ReseniaRepository();
    comprador1 = new Usuario({ id: 'comp-1', nombre: 'Ana', apellido: 'Gómez' });
    comprador2 = new Usuario({ id: 'comp-2', nombre: 'Lucas', apellido: 'Díaz' });
    organizador1 = new Usuario({ id: 'org-1', nombre: 'Carlos', apellido: 'Productor' });
    organizador2 = new Usuario({ id: 'org-2', nombre: 'Laura', apellido: 'Teatral' });
    const categoria = new Categoria({ nombre: 'Música' });
    const entrada = new TipoEntrada({ nombre: 'General', precio: 3000, cupo: 50 });

    evento1 = new Evento({
      id: 'evt-1',
      nombre: 'Show 1',
      categoria,
      fecha: new Date('2025-01-01T20:00:00Z'),
      tiposEntrada: [entrada],
      organizador: organizador1
    });

    evento2 = new Evento({
      id: 'evt-2',
      nombre: 'Show 2',
      categoria,
      fecha: new Date('2025-02-01T20:00:00Z'),
      tiposEntrada: [entrada],
      organizador: organizador2
    });
  });

  test('debe guardar y recuperar una reseña por ID', () => {
    // Arrange
    const resenia = new Resenia({
      id: 'res-1',
      comprador: comprador1,
      evento: evento1,
      detalle: 'Muy buen show',
      puntuacion: 4
    });

    // Act
    const guardada = repository.guardar(resenia);
    const recuperada = repository.buscarPorId('res-1');

    // Assert
    expect(guardada).toBe(resenia);
    expect(recuperada).toBe(resenia);
    expect(recuperada.puntuacion).toBe(4);
  });

  test('debe buscar reseñas por ID de evento', () => {
    // Arrange
    const r1 = new Resenia({ id: 'r-1', comprador: comprador1, evento: evento1, detalle: 'Genial', puntuacion: 5 });
    const r2 = new Resenia({ id: 'r-2', comprador: comprador2, evento: evento1, detalle: 'Bueno', puntuacion: 4 });
    const r3 = new Resenia({ id: 'r-3', comprador: comprador1, evento: evento2, detalle: 'Regular', puntuacion: 3 });

    repository.guardar(r1);
    repository.guardar(r2);
    repository.guardar(r3);

    // Act
    const reseniasEvento1 = repository.buscarPorEvento('evt-1');
    const reseniasEvento2 = repository.buscarPorEvento('evt-2');

    // Assert
    expect(reseniasEvento1).toHaveLength(2);
    expect(reseniasEvento1).toContain(r1);
    expect(reseniasEvento1).toContain(r2);
    expect(reseniasEvento2).toHaveLength(1);
    expect(reseniasEvento2).toContain(r3);
  });

  test('debe buscar reseñas por ID del organizador', () => {
    // Arrange
    const r1 = new Resenia({ id: 'r-1', comprador: comprador1, evento: evento1, detalle: 'Genial', puntuacion: 5 });
    const r2 = new Resenia({ id: 'r-2', comprador: comprador2, evento: evento2, detalle: 'Excelente', puntuacion: 4 });

    repository.guardar(r1);
    repository.guardar(r2);

    // Act
    const reseniasOrg1 = repository.buscarPorOrganizador('org-1');
    const reseniasOrg2 = repository.buscarPorOrganizador('org-2');

    // Assert
    expect(reseniasOrg1).toHaveLength(1);
    expect(reseniasOrg1).toContain(r1);
    expect(reseniasOrg2).toHaveLength(1);
    expect(reseniasOrg2).toContain(r2);
  });

  test('debe calcular el promedio de puntuación por organizador correctamente', () => {
    // Arrange
    const r1 = new Resenia({ id: 'r-1', comprador: comprador1, evento: evento1, detalle: 'Genial', puntuacion: 5 });
    const r2 = new Resenia({ id: 'r-2', comprador: comprador2, evento: evento1, detalle: 'Bueno', puntuacion: 4 });
    repository.guardar(r1);
    repository.guardar(r2);

    // Act
    const promedioOrg1 = repository.calcularPromedioPorOrganizador('org-1');
    const promedioOrgSinResenias = repository.calcularPromedioPorOrganizador('org-sin-resenias');

    // Assert
    expect(promedioOrg1).toBe(4.5); // (5 + 4) / 2
    expect(promedioOrgSinResenias).toBe(0);
  });

  test('debe limpiar todas las reseñas', () => {
    // Arrange
    const r = new Resenia({ id: 'r-1', comprador: comprador1, evento: evento1, detalle: 'Genial', puntuacion: 5 });
    repository.guardar(r);

    // Act
    repository.limpiar();

    // Assert
    expect(repository.buscarPorId('r-1')).toBeNull();
    expect(repository.buscarPorEvento('evt-1')).toHaveLength(0);
  });
});
