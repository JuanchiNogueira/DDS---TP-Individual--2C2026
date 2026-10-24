import { eventoService as defaultEventoService } from '../services/EventoService.js';

export class EventoController {
  constructor({ eventoService = defaultEventoService } = {}) {
    this.eventoService = eventoService;
  }

  listarCategorias = async (req, res, next) => {
    try {
      const data = await this.eventoService.listarCategorias();
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  buscarEventos = async (req, res, next) => {
    try {
      const data = await this.eventoService.buscarEventos(req.query);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  obtenerDetalleEvento = async (req, res, next) => {
    try {
      const data = await this.eventoService.obtenerDetalleEvento(req.params.id);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  crearEvento = async (req, res, next) => {
    try {
      const data = await this.eventoService.crearEvento(req.body);
      return res.status(201).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };
}

export const eventoController = new EventoController();
export default eventoController;
