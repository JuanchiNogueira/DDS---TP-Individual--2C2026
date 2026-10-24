import { randomUUID } from 'node:crypto';
import {
  ValidationError,
  ConflictError,
  ForbiddenDomainError
} from './errors/DomainError.js';
import { EstadoCompra, esEstadoCompraValido } from './EstadoCompra.js';
import { Usuario } from './Usuario.js';
import { Evento } from './Evento.js';
import { TipoEntrada } from './TipoEntrada.js';
import { Mensaje } from './Mensaje.js';
import { CambioEstadoCompra } from './CambioEstadoCompra.js';

export class Compra {
  constructor({
    id = randomUUID(),
    comprador,
    evento,
    tipoEntrada,
    cantidad,
    total,
    estado = EstadoCompra.CONFIRMADA,
    mensajes = [],
    historialEstados = [],
    fechaCreacion = new Date(),
    descontarCupoAlCrear = true
  } = {}) {
    if (!comprador || !(comprador instanceof Usuario)) {
      throw new ValidationError('El comprador es requerido y debe ser una instancia de Usuario');
    }
    if (!evento || !(evento instanceof Evento)) {
      throw new ValidationError('El evento es requerido y debe ser una instancia de Evento');
    }
    if (!tipoEntrada || !(tipoEntrada instanceof TipoEntrada)) {
      throw new ValidationError('El tipo de entrada es requerido y debe ser una instancia de TipoEntrada');
    }
    if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
      throw new ValidationError('La cantidad de entradas debe ser un número entero mayor a 0');
    }
    if (!esEstadoCompraValido(estado)) {
      throw new ValidationError(`El estado ${estado} no es un EstadoCompra válido`);
    }

    if (descontarCupoAlCrear) {
      if (!tipoEntrada.hayCupoPara(cantidad)) {
        throw new ConflictError(
          `No hay cupo suficiente para el tipo de entrada "${tipoEntrada.nombre}". Solicitado: ${cantidad}, Disponible: ${tipoEntrada.cupo}`
        );
      }
      tipoEntrada.descontarCupo(cantidad);
    }

    const calculatedTotal = typeof total === 'number' && total >= 0 ? total : cantidad * tipoEntrada.precio;

    const parsedFechaCreacion = fechaCreacion instanceof Date ? fechaCreacion : new Date(fechaCreacion);
    if (isNaN(parsedFechaCreacion.getTime())) {
      throw new ValidationError('La fecha de creación de la compra es inválida');
    }

    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    this.total = calculatedTotal;
    this.estado = estado;
    this.mensajes = Array.isArray(mensajes) ? [...mensajes] : [];
    this.historialEstados = Array.isArray(historialEstados) ? [...historialEstados] : [];
    this.fechaCreacion = parsedFechaCreacion;

    if (this.historialEstados.length === 0) {
      this.historialEstados.push(
        new CambioEstadoCompra({
          compra: this,
          estado: this.estado,
          quien: comprador,
          fechaHora: this.fechaCreacion,
          motivo: 'Creación de la compra'
        })
      );
    }
  }

  actualizarEstado(nuevoEstado, quien, motivo = '') {
    if (!nuevoEstado || !esEstadoCompraValido(nuevoEstado)) {
      throw new ValidationError(`El estado ${nuevoEstado} no es un EstadoCompra válido`);
    }
    if (!quien || !(quien instanceof Usuario)) {
      throw new ValidationError('El usuario que actualiza el estado es requerido');
    }

    const cambio = new CambioEstadoCompra({
      compra: this,
      estado: nuevoEstado,
      quien,
      fechaHora: new Date(),
      motivo
    });

    this.historialEstados.push(cambio);
    this.estado = nuevoEstado;
  }

  calcularDiasFaltantes(fechaReferencia = new Date()) {
    if (this.estado !== EstadoCompra.CONFIRMADA) {
      throw new ConflictError(
        `Solo es posible calcular los días faltantes para compras en estado CONFIRMADA (estado actual: ${this.estado})`
      );
    }

    const ref = fechaReferencia instanceof Date ? fechaReferencia : new Date(fechaReferencia);
    if (isNaN(ref.getTime())) {
      throw new ValidationError('La fecha de referencia es inválida');
    }

    const diffMs = this.evento.fecha.getTime() - ref.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  cancelar(quien, fechaReferencia = new Date(), motivo = 'Cancelación por usuario') {
    if (this.estado === EstadoCompra.UTILIZADA) {
      throw new ConflictError('No se puede cancelar una compra que ya fue utilizada');
    }

    if (this.estado === EstadoCompra.CANCELADA || this.estado === EstadoCompra.REEMBOLSADA) {
      throw new ConflictError(`La compra ya se encuentra ${this.estado.toLowerCase()}`);
    }

    if (this.evento.yaPaso(fechaReferencia)) {
      throw new ConflictError('No se puede cancelar una compra de un evento que ya se ha realizado');
    }

    this.tipoEntrada.restituirCupo(this.cantidad);
    this.actualizarEstado(EstadoCompra.CANCELADA, quien, motivo);
  }

  marcarComoUtilizada(quien) {
    if (this.estado !== EstadoCompra.CONFIRMADA) {
      throw new ConflictError(
        `Solo se pueden marcar como utilizadas compras en estado CONFIRMADA (estado actual: ${this.estado})`
      );
    }
    this.actualizarEstado(EstadoCompra.UTILIZADA, quien, 'Entrada utilizada en el ingreso al evento');
  }

  agregarMensaje(usuario, texto) {
    if (!usuario || !(usuario instanceof Usuario)) {
      throw new ValidationError('El usuario emisor es requerido y debe ser una instancia de Usuario');
    }

    const esComprador = this.comprador && this.comprador.id === usuario.id;
    const esOrganizador = this.evento?.organizador && this.evento.organizador.id === usuario.id;

    if (!esComprador && !esOrganizador) {
      throw new ForbiddenDomainError(
        'Solo el comprador o el organizador del evento pueden enviar mensajes en esta compra'
      );
    }

    const nuevoMensaje = new Mensaje({
      usuario,
      mensaje: texto,
      enviado: new Date()
    });

    this.mensajes.push(nuevoMensaje);
    return nuevoMensaje;
  }
}

export default Compra;
