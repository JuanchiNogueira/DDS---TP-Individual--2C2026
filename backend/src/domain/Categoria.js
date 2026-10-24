import { randomUUID } from 'node:crypto';
import { ValidationError } from './errors/DomainError.js';

export class Categoria {
  constructor({ id = randomUUID(), nombre, descripcion = '' } = {}) {
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      throw new ValidationError('El nombre de la categoría es requerido y no puede estar vacío');
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = typeof descripcion === 'string' ? descripcion.trim() : '';
  }
}

export default Categoria;
