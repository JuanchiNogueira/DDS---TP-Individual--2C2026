import { reseniaService as defaultReseniaService } from '../services/ReseniaService.js';

export class ReseniaController {
  constructor({ reseniaService = defaultReseniaService } = {}) {
    this.reseniaService = reseniaService;
  }

  crearResenia = async (req, res, next) => {
    try {
      const data = await this.reseniaService.crearResenia(req.body);
      return res.status(201).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  listarReseniasPorOrganizador = async (req, res, next) => {
    try {
      const organizadorId = req.params.organizadorId || req.query.organizadorId;
      const data = await this.reseniaService.listarReseniasPorOrganizador(organizadorId);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };
}

export const reseniaController = new ReseniaController();
export default reseniaController;
