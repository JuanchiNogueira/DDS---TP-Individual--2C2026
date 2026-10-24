import { randomUUID } from 'node:crypto';
import { ValidationError, NotFoundError } from './errors/DomainError.js';
import { Categoria } from './Categoria.js';
import { Usuario } from './Usuario.js';
import { TipoEntrada } from './TipoEntrada.js';

export class Evento {
  constructor({
    id = randomUUID(),
    nombre,
    descripcion = '',
    categoria,
    fecha,
    tiposEntrada = [],
    multimedia = [],
    organizador
  } = {}) {
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      throw new ValidationError('El nombre del evento es requerido');
    }
    if (!categoria || !(categoria instanceof Categoria)) {
      throw new ValidationError('La categoría del evento es requerida y debe ser una instancia de Categoria');
    }
    if (!fecha) {
      throw new ValidationError('La fecha del evento es requerida');
    }
    const parsedFecha = fecha instanceof Date ? fecha : new Date(fecha);
    if (isNaN(parsedFecha.getTime())) {
      throw new ValidationError('La fecha del evento es inválida');
    }
    if (!organizador || !(organizador instanceof Usuario)) {
      throw new ValidationError('El organizador del evento es requerido y debe ser una instancia de Usuario');
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = typeof descripcion === 'string' ? descripcion.trim() : '';
    this.categoria = categoria;
    this.fecha = parsedFecha;
    this.tiposEntrada = Array.isArray(tiposEntrada) ? [...tiposEntrada] : [];
    this.multimedia = Array.isArray(multimedia) ? [...multimedia] : [];
    this.organizador = organizador;
  }

  tuPrecioEstaEntre(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number' || isNaN(min) || isNaN(max)) {
      throw new ValidationError('Los valores mínimo y máximo deben ser números válidos');
    }
    if (min > max) {
      throw new ValidationError('El valor mínimo no puede ser mayor al valor máximo');
    }
    if (this.tiposEntrada.length === 0) {
      return false;
    }
    return this.tiposEntrada.some(
      (tipo) => tipo.precio >= min && tipo.precio <= max
    );
  }

  agregarTipoEntrada(tipoEntrada) {
    if (!tipoEntrada || !(tipoEntrada instanceof TipoEntrada)) {
      throw new ValidationError('El tipo de entrada debe ser una instancia válida de TipoEntrada');
    }
    this.tiposEntrada.push(tipoEntrada);
  }

  obtenerTipoEntrada(id) {
    const tipo = this.tiposEntrada.find((t) => t.id === id);
    if (!tipo) {
      throw new NotFoundError(`Tipo de entrada con id ${id} no encontrado en el evento`);
    }
    return tipo;
  }

  obtenerPrecioMinimo() {
    if (this.tiposEntrada.length === 0) {
      return 0;
    }
    return Math.min(...this.tiposEntrada.map((t) => t.precio));
  }

  yaOcurrio(fechaReferencia = new Date()) {
    return this.yaPaso(fechaReferencia);
  }

  yaPaso(fechaReferencia = new Date()) {
    const ref = fechaReferencia instanceof Date ? fechaReferencia : new Date(fechaReferencia);
    if (isNaN(ref.getTime())) {
      throw new ValidationError('La fecha de referencia es inválida');
    }
    return this.fecha.getTime() <= ref.getTime();
  }
}

export default Evento;
