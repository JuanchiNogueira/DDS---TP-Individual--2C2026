import { describe, test, expect, beforeEach } from '@jest/globals';
import { UsuarioRepository } from '../../src/repositories/UsuarioRepository.js';
import { Usuario } from '../../src/domain/Usuario.js';

describe('UsuarioRepository Unit Tests', () => {
  let repository;

  beforeEach(() => {
    repository = new UsuarioRepository();
  });

  test('debe guardar y recuperar un usuario por su ID', () => {
    // Arrange
    const usuario = new Usuario({ id: 'usr-1', nombre: 'Juan', apellido: 'Pérez' });

    // Act
    const guardado = repository.guardar(usuario);
    const recuperado = repository.buscarPorId('usr-1');

    // Assert
    expect(guardado).toBe(usuario);
    expect(recuperado).toBe(usuario);
    expect(recuperado.nombreCompleto).toBe('Juan Pérez');
  });

  test('debe retornar null al buscar un ID que no existe o nulo', () => {
    // Arrange
    const idInexistente = 'usr-no-existe';

    // Act
    const resultadoInexistente = repository.buscarPorId(idInexistente);
    const resultadoNulo = repository.buscarPorId(null);

    // Assert
    expect(resultadoInexistente).toBeNull();
    expect(resultadoNulo).toBeNull();
  });

  test('debe listar todos los usuarios guardados', () => {
    // Arrange
    const u1 = new Usuario({ id: 'u-1', nombre: 'Ana', apellido: 'López' });
    const u2 = new Usuario({ id: 'u-2', nombre: 'Carlos', apellido: 'Gómez' });
    repository.guardar(u1);
    repository.guardar(u2);

    // Act
    const usuarios = repository.listarTodos();

    // Assert
    expect(usuarios).toHaveLength(2);
    expect(usuarios).toContain(u1);
    expect(usuarios).toContain(u2);
  });

  test('debe limpiar todos los usuarios almacenados', () => {
    // Arrange
    const usuario = new Usuario({ id: 'u-1', nombre: 'Ana', apellido: 'López' });
    repository.guardar(usuario);

    // Act
    repository.limpiar();

    // Assert
    expect(repository.listarTodos()).toHaveLength(0);
    expect(repository.buscarPorId('u-1')).toBeNull();
  });

  test('debe lanzar error al intentar guardar un usuario inválido sin ID', () => {
    // Arrange
    const objetoInvalido = { nombre: 'Sin id' };

    // Act
    const accionInvalida = () => repository.guardar(objetoInvalido);

    // Assert
    expect(accionInvalida).toThrow('El usuario es inválido o no posee un ID');
  });
});
