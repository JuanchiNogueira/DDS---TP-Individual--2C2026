import { compraService as defaultCompraService } from '../services/CompraService.js';

export class CompraController {
  constructor({ compraService = defaultCompraService } = {}) {
    this.compraService = compraService;
  }

  realizarCompra = async (req, res, next) => {
    try {
      const data = await this.compraService.realizarCompra(req.body);
      return res.status(201).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  listarComprasPorComprador = async (req, res, next) => {
    try {
      const compradorId = req.params.compradorId || req.query.compradorId;
      const data = await this.compraService.listarComprasPorComprador(compradorId);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  listarComprasPorEvento = async (req, res, next) => {
    try {
      const eventoId = req.params.eventoId || req.query.eventoId;
      const organizadorId = req.query.organizadorId || req.body?.organizadorId;
      const data = await this.compraService.listarComprasPorEvento(eventoId, organizadorId);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  cancelarCompra = async (req, res, next) => {
    try {
      const data = await this.compraService.cancelarCompra(req.params.id, req.body.usuarioId);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  actualizarEstadoCompra = async (req, res, next) => {
    try {
      const data = await this.compraService.actualizarEstadoCompra(
        req.params.id,
        req.body.estado,
        req.body.usuarioId
      );
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  enviarMensaje = async (req, res, next) => {
    try {
      const data = await this.compraService.enviarMensaje(
        req.params.id,
        req.body.usuarioId,
        req.body.texto
      );
      return res.status(201).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };
}

export const compraController = new CompraController();
export default compraController;
