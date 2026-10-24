import { compraRepository as defaultCompraRepository } from '../repositories/CompraRepository.js';
import { usuarioRepository as defaultUsuarioRepository } from '../repositories/UsuarioRepository.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/EventoRepository.js';

import { Compra } from '../domain/Compra.js';
import { EstadoCompra } from '../domain/EstadoCompra.js';
import { NotFoundError, ForbiddenDomainError } from '../domain/errors/DomainError.js';

export class CompraService {
  constructor({
    compraRepository = defaultCompraRepository,
    usuarioRepository = defaultUsuarioRepository,
    eventoRepository = defaultEventoRepository
  } = {}) {
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
    this.eventoRepository = eventoRepository;
  }

  async realizarCompra({
    compradorId,
    eventoId,
    tipoEntradaId,
    cantidad,
    confirmarInmediatamente = true
  }) {
    const comprador = await this.usuarioRepository.buscarPorId(compradorId);
    if (!comprador) {
      throw new NotFoundError('Comprador no encontrado');
    }

    const evento = await this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado');
    }

    const tipoEntrada = evento.obtenerTipoEntrada(tipoEntradaId);

    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad,
      estado: confirmarInmediatamente ? EstadoCompra.CONFIRMADA : EstadoCompra.PENDIENTE,
      descontarCupoAlCrear: true
    });

    return await this.compraRepository.guardar(compra);
  }

  async listarComprasPorComprador(compradorId) {
    const comprador = await this.usuarioRepository.buscarPorId(compradorId);
    if (!comprador) {
      throw new NotFoundError('Comprador no encontrado');
    }

    const compras = await this.compraRepository.buscarPorComprador(compradorId);

    return compras.map((compra) => {
      let diasFaltantes = null;
      if (compra.estado === EstadoCompra.CONFIRMADA) {
        diasFaltantes = compra.calcularDiasFaltantes();
      }
      compra.diasFaltantes = diasFaltantes;
      return {
        compra,
        id: compra.id,
        evento: compra.evento,
        tipoEntrada: compra.tipoEntrada,
        cantidad: compra.cantidad,
        total: compra.total,
        estado: compra.estado,
        mensajes: compra.mensajes,
        historialEstados: compra.historialEstados,
        diasFaltantes
      };
    });
  }

  async listarComprasPorEvento(eventoId, organizadorId) {
    const evento = await this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado');
    }

    if (evento.organizador?.id !== organizadorId) {
      throw new ForbiddenDomainError('No tiene permisos para ver las compras de este evento');
    }

    const compras = await this.compraRepository.buscarPorEvento(eventoId);

    const comprasPorEstado = {
      PENDIENTE: [],
      CONFIRMADA: [],
      UTILIZADA: [],
      CANCELADA: [],
      REEMBOLSADA: []
    };

    compras.forEach((compra) => {
      if (comprasPorEstado[compra.estado]) {
        comprasPorEstado[compra.estado].push(compra);
      }
    });

    const entradasDisponibles = evento.tiposEntrada.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      precio: t.precio,
      cupoDisponible: t.cupo,
      cupoInicial: t.cupoInicial
    }));

    return {
      compras,
      comprasPorEstado,
      entradasDisponibles
    };
  }

  async cancelarCompra(compraId, usuarioId) {
    const compra = await this.compraRepository.buscarPorId(compraId);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada');
    }

    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }

    compra.cancelar(usuario);
    await this.compraRepository.guardar(compra);
    return compra;
  }

  async enviarMensaje(compraId, usuarioId, texto) {
    const compra = await this.compraRepository.buscarPorId(compraId);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada');
    }

    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const mensaje = compra.agregarMensaje(usuario, texto);
    await this.compraRepository.guardar(compra);
    return mensaje;
  }

  async actualizarEstadoCompra(compraId, nuevoEstado, usuarioId) {
    const compra = await this.compraRepository.buscarPorId(compraId);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada');
    }

    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }

    compra.actualizarEstado(nuevoEstado, usuario);
    await this.compraRepository.guardar(compra);
    return compra;
  }
}

export const compraService = new CompraService();
export default compraService;
