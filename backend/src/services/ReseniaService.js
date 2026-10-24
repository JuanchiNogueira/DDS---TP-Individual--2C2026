import { reseniaRepository as defaultReseniaRepository } from '../repositories/ReseniaRepository.js';
import { compraRepository as defaultCompraRepository } from '../repositories/CompraRepository.js';

import { Resenia } from '../domain/Resenia.js';
import {
  NotFoundError,
  ForbiddenDomainError,
  ConflictError
} from '../domain/errors/DomainError.js';

export class ReseniaService {
  constructor({
    reseniaRepository = defaultReseniaRepository,
    compraRepository = defaultCompraRepository
  } = {}) {
    this.reseniaRepository = reseniaRepository;
    this.compraRepository = compraRepository;
  }

  async crearResenia({ compraId, compradorId, puntuacion, detalle }) {
    const compra = await this.compraRepository.buscarPorId(compraId);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada');
    }

    if (compra.comprador?.id !== compradorId) {
      throw new ForbiddenDomainError('Solo el comprador que realizó la compra puede emitir una reseña');
    }

    const reseniasDelEvento = await this.reseniaRepository.buscarPorEvento(compra.evento.id);
    const yaExiste = reseniasDelEvento.some(
      (r) =>
        (r.compraId && r.compraId === compraId) ||
        (r.comprador?.id === compradorId && r.evento?.id === compra.evento.id)
    );

    if (yaExiste) {
      throw new ConflictError('Ya existe una reseña registrada para esta compra');
    }

    const resenia = Resenia.crearDesdeCompra(compra, {
      detalle,
      puntuacion,
      compraId
    });

    return await this.reseniaRepository.guardar(resenia);
  }

  async listarReseniasPorOrganizador(organizadorId) {
    const promedio = await this.reseniaRepository.calcularPromedioPorOrganizador(organizadorId);
    const resenias = await this.reseniaRepository.buscarPorOrganizador(organizadorId);

    return {
      promedio,
      resenias
    };
  }
}

export const reseniaService = new ReseniaService();
export default reseniaService;
