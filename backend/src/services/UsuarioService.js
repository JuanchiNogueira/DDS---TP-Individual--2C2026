import { usuarioRepository as defaultUsuarioRepository } from '../repositories/UsuarioRepository.js';
import { eventoRepository as defaultEventoRepository } from '../repositories/EventoRepository.js';

import { NotFoundError } from '../domain/errors/DomainError.js';

export class UsuarioService {
  constructor({
    usuarioRepository = defaultUsuarioRepository,
    eventoRepository = defaultEventoRepository
  } = {}) {
    this.usuarioRepository = usuarioRepository;
    this.eventoRepository = eventoRepository;
  }

  async listarUsuarios() {
    return await this.usuarioRepository.listarTodos();
  }

  async obtenerUsuarioPorId(id) {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return usuario;
  }

  async toggleFavorito(usuarioId, eventoId) {
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const evento = await this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado');
    }

    const yaEsFavorito = usuario.esFavorito(eventoId);
    if (yaEsFavorito) {
      usuario.removerFavorito(eventoId);
    } else {
      usuario.agregarFavorito(evento);
    }

    await this.usuarioRepository.guardar(usuario);
    return usuario;
  }
}

export const usuarioService = new UsuarioService();
export default usuarioService;
