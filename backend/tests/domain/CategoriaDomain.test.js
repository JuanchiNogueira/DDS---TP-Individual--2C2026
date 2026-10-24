import { describe, test, expect } from '@jest/globals';
import { Categoria, ValidationError } from '../../src/domain/index.js';

describe('Categoria Domain Entity', () => {
  test('debe instanciar una categoría válida con id generado automáticamente', () => {
    // Arrange
    const datosCategoria = {
      nombre: 'Música',
      descripcion: 'Eventos musicales en vivo'
    };

    // Act
    const categoria = new Categoria(datosCategoria);

    // Assert
    expect(categoria.id).toBeDefined();
    expect(typeof categoria.id).toBe('string');
    expect(categoria.nombre).toBe('Música');
    expect(categoria.descripcion).toBe('Eventos musicales en vivo');
  });

  test('debe permitir especificar un id personalizado y limpiar espacios en blanco', () => {
    // Arrange
    const idCustom = 'cat-custom-123';
    const datosCategoria = {
      id: idCustom,
      nombre: '  Teatro  ',
      descripcion: '  Obras y monólogos  '
    };

    // Act
    const categoria = new Categoria(datosCategoria);

    // Assert
    expect(categoria.id).toBe(idCustom);
    expect(categoria.nombre).toBe('Teatro');
    expect(categoria.descripcion).toBe('Obras y monólogos');
  });

  test('debe lanzar ValidationError si el nombre está ausente o vacío', () => {
    // Arrange
    const datosSinNombre = { descripcion: 'Sin nombre' };
    const datosNombreVacio = { nombre: '   ', descripcion: 'Espacios' };

    // Act & Assert
    // Arrange / Act / Assert
    expect(() => new Categoria(datosSinNombre)).toThrow(ValidationError);
    expect(() => new Categoria(datosNombreVacio)).toThrow(ValidationError);
  });
});
