import { describe, test, expect } from '@jest/globals';
import { Usuario, ValidationError } from '../../src/domain/index.js';

describe('Usuario Domain Entity', () => {
  test('debe instanciar un usuario válido con nombre completo y favoritos vacíos por defecto', () => {
    // Arrange
    const datosUsuario = {
      nombre: 'Lucía',
      apellido: 'Gómez'
    };

    // Act
    const usuario = new Usuario(datosUsuario);

    // Assert
    expect(usuario.id).toBeDefined();
    expect(usuario.nombre).toBe('Lucía');
    expect(usuario.apellido).toBe('Gómez');
    expect(usuario.nombreCompleto).toBe('Lucía Gómez');
    expect(usuario.favoritos).toEqual([]);
  });

  test('debe lanzar ValidationError si falta el nombre o el apellido', () => {
    // Arrange
    const sinNombre = { apellido: 'Gómez' };
    const sinApellido = { nombre: 'Lucía' };

    // Act & Assert
    // Arrange
    const accionSinNombre = () => new Usuario(sinNombre);
    const accionSinApellido = () => new Usuario(sinApellido);

    // Act
    // (Ejecución dentro de las aserciones de error)

    // Assert
    expect(accionSinNombre).toThrow(ValidationError);
    expect(accionSinApellido).toThrow(ValidationError);
  });

  test('debe agregar un evento a favoritos sin duplicarlo', () => {
    // Arrange
    const usuario = new Usuario({ nombre: 'Mario', apellido: 'Bros' });
    const mockEvento = { id: 'evt-10', nombre: 'Concierto Sinfónico' };

    // Act
    usuario.agregarFavorito(mockEvento);
    usuario.agregarFavorito(mockEvento);

    // Assert
    expect(usuario.favoritos).toHaveLength(1);
    expect(usuario.esFavorito('evt-10')).toBe(true);
  });

  test('debe remover un evento de favoritos correctamente', () => {
    // Arrange
    const usuario = new Usuario({ nombre: 'Mario', apellido: 'Bros' });
    const mockEvento = { id: 'evt-20', nombre: 'Festival de Jazz' };
    usuario.agregarFavorito(mockEvento);

    // Act
    usuario.removerFavorito('evt-20');

    // Assert
    expect(usuario.esFavorito('evt-20')).toBe(false);
    expect(usuario.favoritos).toHaveLength(0);
  });

  test('debe lanzar ValidationError al intentar agregar un favorito inválido', () => {
    // Arrange
    const usuario = new Usuario({ nombre: 'Mario', apellido: 'Bros' });

    // Act
    const accionInvalida = () => usuario.agregarFavorito(null);

    // Assert
    expect(accionInvalida).toThrow(ValidationError);
  });
});
