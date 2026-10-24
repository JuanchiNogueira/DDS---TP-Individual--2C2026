import { randomUUID } from 'node:crypto';
import { ValidationError } from './errors/DomainError.js';
import { esEstadoCompraValido } from './EstadoCompra.js';
import { Usuario } from './Usuario.js';

export class CambioEstadoCompra {
  constructor({
    id = randomUUID(),
    compra,
    estado,
    quien,
    fechaHora = new Date(),
    motivo = ''
  } = {}) {
    if (!compra) {
      throw new ValidationError('La compra asociada es requerida');
    }
    if (!estado || !esEstadoCompraValido(estado)) {
      throw new ValidationError(`El estado ${estado} no es un EstadoCompra válido`);
    }
    if (!quien || !(quien instanceof Usuario)) {
      throw new ValidationError('El usuario que realiza el cambio de estado es requerido y debe ser una instancia de Usuario');
    }

    const parsedFechaHora = fechaHora instanceof Date ? fechaHora : new Date(fechaHora);
    if (isNaN(parsedFechaHora.getTime())) {
      throw new ValidationError('La fecha y hora del cambio de estado es inválida');
    }

    this.id = id;
    this.compra = compra;
    this.estado = estado;
    this.quien = quien;
    this.fechaHora = parsedFechaHora;
    this.motivo = typeof motivo === 'string' ? motivo.trim() : '';
  }

  toJSON() {
    return {
      id: this.id,
      compraId: this.compra?.id ?? null,
      estado: this.estado,
      quien: this.quien,
      fechaHora: this.fechaHora,
      motivo: this.motivo
    };
  }
}

export default CambioEstadoCompra;
