import { describe, test, expect, beforeEach } from '@jest/globals';
import { CategoriaRepository } from '../../src/repositories/CategoriaRepository.js';
import { Categoria } from '../../src/domain/Categoria.js';

describe('CategoriaRepository Unit Tests', () => {
  let repository;

  beforeEach(() => {
    repository = new CategoriaRepository();
  });

  test('debe guardar y recuperar una categoría por su ID', () => {
    // Arrange
    const categoria = new Categoria({ id: 'cat-rock', nombre: 'Rock', descripcion: 'Recitales' });

    // Act
    const guardada = repository.guardar(categoria);
    const recuperada = repository.buscarPorId('cat-rock');

    // Assert
    expect(guardada).toBe(categoria);
    expect(recuperada).toBe(categoria);
    expect(recuperada.nombre).toBe('Rock');
  });

  test('debe retornar null cuando se busca un ID inexistente o nulo', () => {
    // Arrange
    const idInexistente = 'cat-no-existe';

    // Act
    const resultadoInexistente = repository.buscarPorId(idInexistente);
    const resultadoNulo = repository.buscarPorId(null);

    // Assert
    expect(resultadoInexistente).toBeNull();
    expect(resultadoNulo).toBeNull();
  });

  test('debe listar todas las categorías almacenadas', () => {
    // Arrange
    const cat1 = new Categoria({ id: 'cat-1', nombre: 'Música' });
    const cat2 = new Categoria({ id: 'cat-2', nombre: 'Teatro' });
    repository.guardar(cat1);
    repository.guardar(cat2);

    // Act
    const todas = repository.listarTodas();

    // Assert
    expect(todas).toHaveLength(2);
    expect(todas).toContain(cat1);
    expect(todas).toContain(cat2);
  });

  test('debe limpiar todas las categorías del repositorio', () => {
    // Arrange
    const cat = new Categoria({ id: 'cat-1', nombre: 'Música' });
    repository.guardar(cat);

    // Act
    repository.limpiar();

    // Assert
    expect(repository.listarTodas()).toHaveLength(0);
    expect(repository.buscarPorId('cat-1')).toBeNull();
  });

  test('debe lanzar un error al intentar guardar un objeto inválido sin ID', () => {
    // Arrange
    const objetoInvalido = { nombre: 'Sin id' };

    // Act
    const accionInvalida = () => repository.guardar(objetoInvalido);

    // Assert
    expect(accionInvalida).toThrow('El usuario es inválido o no posee un ID' && 'categoría');
  });
});
