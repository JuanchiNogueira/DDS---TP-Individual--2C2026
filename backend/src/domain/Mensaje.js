import { randomUUID } from 'node:crypto';
import { ValidationError } from './errors/DomainError.js';
import { Usuario } from './Usuario.js';

export class Mensaje {
  constructor({
    id = randomUUID(),
    usuario,
    mensaje,
    enviado = new Date()
  } = {}) {
    if (!usuario || !(usuario instanceof Usuario)) {
      throw new ValidationError('El usuario emisor es requerido y debe ser una instancia de Usuario');
    }
    if (!mensaje || typeof mensaje !== 'string' || !mensaje.trim()) {
      throw new ValidationError('El contenido del mensaje es requerido y no puede estar vacío');
    }

    const parsedEnviado = enviado instanceof Date ? enviado : new Date(enviado);
    if (isNaN(parsedEnviado.getTime())) {
      throw new ValidationError('La fecha de envío del mensaje es inválida');
    }

    this.id = id;
    this.usuario = usuario;
    this.mensaje = mensaje.trim();
    this.enviado = parsedEnviado;
  }
}

export default Mensaje;
