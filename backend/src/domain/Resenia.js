import { randomUUID } from 'node:crypto';
import { ValidationError, ConflictError } from './errors/DomainError.js';
import { Usuario } from './Usuario.js';
import { Evento } from './Evento.js';
import { Compra } from './Compra.js';
import { EstadoCompra } from './EstadoCompra.js';

export class Resenia {
  constructor({
    id = randomUUID(),
    comprador,
    evento,
    detalle,
    puntuacion,
    compraId = null,
    fecha = new Date()
  } = {}) {
    if (!comprador || !(comprador instanceof Usuario)) {
      throw new ValidationError('El comprador es requerido y debe ser una instancia de Usuario');
    }
    if (!evento || !(evento instanceof Evento)) {
      throw new ValidationError('El evento es requerido y debe ser una instancia de Evento');
    }
    if (!detalle || typeof detalle !== 'string' || !detalle.trim()) {
      throw new ValidationError('El detalle de la reseña es requerido');
    }
    if (typeof puntuacion !== 'number' || isNaN(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      throw new ValidationError('La puntuación debe ser un número entre 1 y 5');
    }

    const parsedFecha = fecha instanceof Date ? fecha : new Date(fecha);
    if (isNaN(parsedFecha.getTime())) {
      throw new ValidationError('La fecha de la reseña es inválida');
    }

    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.detalle = detalle.trim();
    this.puntuacion = puntuacion;
    this.compraId = compraId;
    this.fecha = parsedFecha;
  }

  static crearDesdeCompra(compra, { detalle, puntuacion, fecha = new Date() } = {}) {
    if (!compra || !(compra instanceof Compra)) {
      throw new ValidationError('La compra es requerida para emitir la reseña');
    }
    if (compra.estado !== EstadoCompra.UTILIZADA) {
      throw new ConflictError(
        'Solo se puede calificar un evento si la entrada asociada ha sido utilizada'
      );
    }
    return new Resenia({
      comprador: compra.comprador,
      evento: compra.evento,
      detalle,
      puntuacion,
      compraId: compra.id,
      fecha
    });
  }
}

export default Resenia;
