import { usuarioService as defaultUsuarioService } from '../services/UsuarioService.js';

export class UsuarioController {
  constructor({ usuarioService = defaultUsuarioService } = {}) {
    this.usuarioService = usuarioService;
  }

  listarUsuarios = async (req, res, next) => {
    try {
      const data = await this.usuarioService.listarUsuarios();
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  obtenerUsuarioPorId = async (req, res, next) => {
    try {
      const data = await this.usuarioService.obtenerUsuarioPorId(req.params.id);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };

  toggleFavorito = async (req, res, next) => {
    try {
      const data = await this.usuarioService.toggleFavorito(req.params.id, req.body.eventoId);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };
}

export const usuarioController = new UsuarioController();
export default usuarioController;
