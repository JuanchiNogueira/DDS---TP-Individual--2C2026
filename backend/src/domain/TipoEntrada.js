import { randomUUID } from 'node:crypto';
import { ValidationError, ConflictError } from './errors/DomainError.js';

export class TipoEntrada {
  constructor({
    id = randomUUID(),
    nombre,
    descripcion = '',
    precio,
    cupo,
    cupoInicial = cupo
  } = {}) {
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      throw new ValidationError('El nombre del tipo de entrada es requerido');
    }
    if (typeof precio !== 'number' || isNaN(precio) || precio < 0) {
      throw new ValidationError('El precio debe ser un número mayor o igual a 0');
    }
    if (typeof cupo !== 'number' || !Number.isInteger(cupo) || cupo < 0) {
      throw new ValidationError('El cupo debe ser un número entero mayor o igual a 0');
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = typeof descripcion === 'string' ? descripcion.trim() : '';
    this.precio = precio;
    this.cupo = cupo;
    this.cupoInicial = cupoInicial;
  }

  hayCupoPara(cantidad) {
    if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
      return false;
    }
    return this.cupo >= cantidad;
  }

  descontarCupo(cantidad) {
    if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
      throw new ValidationError('La cantidad a descontar debe ser un entero mayor a 0');
    }
    if (!this.hayCupoPara(cantidad)) {
      throw new ConflictError(
        `Cupo insuficiente. Se solicitaron ${cantidad} entradas pero solo quedan ${this.cupo} disponibles`
      );
    }
    this.cupo -= cantidad;
  }

  restituirCupo(cantidad) {
    if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
      throw new ValidationError('La cantidad a restituir debe ser un entero mayor a 0');
    }
    this.cupo += cantidad;
  }
}

export default TipoEntrada;
