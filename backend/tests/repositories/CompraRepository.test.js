import { describe, test, expect, beforeEach } from '@jest/globals';
import { CompraRepository } from '../../src/repositories/CompraRepository.js';
import { Compra } from '../../src/domain/Compra.js';
import { EstadoCompra } from '../../src/domain/EstadoCompra.js';
import { Usuario } from '../../src/domain/Usuario.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { Evento } from '../../src/domain/Evento.js';

describe('CompraRepository Unit Tests', () => {
  let repository;
  let comprador1;
  let comprador2;
  let organizador;
  let evento1;
  let evento2;
  let tipoEntrada1;
  let tipoEntrada2;

  beforeEach(() => {
    repository = new CompraRepository();
    comprador1 = new Usuario({ id: 'comp-1', nombre: 'Ana', apellido: 'Gómez' });
    comprador2 = new Usuario({ id: 'comp-2', nombre: 'Lucas', apellido: 'Díaz' });
    organizador = new Usuario({ id: 'org-1', nombre: 'Carlos', apellido: 'Productor' });
    const categoria = new Categoria({ nombre: 'Música' });

    tipoEntrada1 = new TipoEntrada({ id: 'te-1', nombre: 'Campo', precio: 5000, cupo: 100 });
    tipoEntrada2 = new TipoEntrada({ id: 'te-2', nombre: 'VIP', precio: 10000, cupo: 50 });

    evento1 = new Evento({
      id: 'evt-1',
      nombre: 'Show 1',
      categoria,
      fecha: new Date('2027-01-01T20:00:00Z'),
      tiposEntrada: [tipoEntrada1],
      organizador
    });

    evento2 = new Evento({
      id: 'evt-2',
      nombre: 'Show 2',
      categoria,
      fecha: new Date('2027-02-01T20:00:00Z'),
      tiposEntrada: [tipoEntrada2],
      organizador
    });
  });

  test('debe guardar y recuperar una compra por ID', () => {
    // Arrange
    const compra = new Compra({
      id: 'c-1',
      comprador: comprador1,
      evento: evento1,
      tipoEntrada: tipoEntrada1,
      cantidad: 2,
      estado: EstadoCompra.CONFIRMADA
    });

    // Act
    const guardada = repository.guardar(compra);
    const recuperada = repository.buscarPorId('c-1');

    // Assert
    expect(guardada).toBe(compra);
    expect(recuperada).toBe(compra);
    expect(recuperada.total).toBe(10000);
  });

  test('debe buscar compras por ID del comprador', () => {
    // Arrange
    const c1 = new Compra({
      id: 'c-1',
      comprador: comprador1,
      evento: evento1,
      tipoEntrada: tipoEntrada1,
      cantidad: 1
    });
    const c2 = new Compra({
      id: 'c-2',
      comprador: comprador1,
      evento: evento2,
      tipoEntrada: tipoEntrada2,
      cantidad: 2
    });
    const c3 = new Compra({
      id: 'c-3',
      comprador: comprador2,
      evento: evento1,
      tipoEntrada: tipoEntrada1,
      cantidad: 1
    });

    repository.guardar(c1);
    repository.guardar(c2);
    repository.guardar(c3);

    // Act
    const comprasComprador1 = repository.buscarPorComprador('comp-1');
    const comprasComprador2 = repository.buscarPorComprador('comp-2');
    const comprasInexistente = repository.buscarPorComprador('comp-999');

    // Assert
    expect(comprasComprador1).toHaveLength(2);
    expect(comprasComprador1).toContain(c1);
    expect(comprasComprador1).toContain(c2);
    expect(comprasComprador2).toHaveLength(1);
    expect(comprasComprador2).toContain(c3);
    expect(comprasInexistente).toEqual([]);
  });

  test('debe buscar compras por ID del evento', () => {
    // Arrange
    const c1 = new Compra({
      id: 'c-1',
      comprador: comprador1,
      evento: evento1,
      tipoEntrada: tipoEntrada1,
      cantidad: 1
    });
    const c2 = new Compra({
      id: 'c-2',
      comprador: comprador2,
      evento: evento1,
      tipoEntrada: tipoEntrada1,
      cantidad: 2
    });
    const c3 = new Compra({
      id: 'c-3',
      comprador: comprador2,
      evento: evento2,
      tipoEntrada: tipoEntrada2,
      cantidad: 1
    });

    repository.guardar(c1);
    repository.guardar(c2);
    repository.guardar(c3);

    // Act
    const comprasEvento1 = repository.buscarPorEvento('evt-1');
    const comprasEvento2 = repository.buscarPorEvento('evt-2');
    const comprasEventoInexistente = repository.buscarPorEvento('evt-inexistente');

    // Assert
    expect(comprasEvento1).toHaveLength(2);
    expect(comprasEvento1).toContain(c1);
    expect(comprasEvento1).toContain(c2);
    expect(comprasEvento2).toHaveLength(1);
    expect(comprasEvento2).toContain(c3);
    expect(comprasEventoInexistente).toEqual([]);
  });

  test('debe limpiar todas las compras almacenadas', () => {
    // Arrange
    const compra = new Compra({
      id: 'c-1',
      comprador: comprador1,
      evento: evento1,
      tipoEntrada: tipoEntrada1,
      cantidad: 1
    });
    repository.guardar(compra);

    // Act
    repository.limpiar();

    // Assert
    expect(repository.buscarPorId('c-1')).toBeNull();
    expect(repository.buscarPorComprador('comp-1')).toHaveLength(0);
  });
});
