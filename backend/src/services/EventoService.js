import { eventoRepository as defaultEventoRepository } from '../repositories/EventoRepository.js';
import { usuarioRepository as defaultUsuarioRepository } from '../repositories/UsuarioRepository.js';
import { categoriaRepository as defaultCategoriaRepository } from '../repositories/CategoriaRepository.js';
import { reseniaRepository as defaultReseniaRepository } from '../repositories/ReseniaRepository.js';

import { Evento } from '../domain/Evento.js';
import { TipoEntrada } from '../domain/TipoEntrada.js';
import { NotFoundError } from '../domain/errors/DomainError.js';

export class EventoService {
  constructor({
    eventoRepository = defaultEventoRepository,
    usuarioRepository = defaultUsuarioRepository,
    categoriaRepository = defaultCategoriaRepository,
    reseniaRepository = defaultReseniaRepository
  } = {}) {
    this.eventoRepository = eventoRepository;
    this.usuarioRepository = usuarioRepository;
    this.categoriaRepository = categoriaRepository;
    this.reseniaRepository = reseniaRepository;
  }

  async crearEvento({
    nombre,
    descripcion,
    categoriaId,
    fecha,
    tiposEntrada = [],
    multimedia = [],
    organizadorId
  }) {
    const organizador = await this.usuarioRepository.buscarPorId(organizadorId);
    if (!organizador) {
      throw new NotFoundError('Organizador no encontrado');
    }

    const categoria = await this.categoriaRepository.buscarPorId(categoriaId);
    if (!categoria) {
      throw new NotFoundError('Categoría no encontrada');
    }

    const instanciasTiposEntrada = tiposEntrada.map((t) =>
      t instanceof TipoEntrada ? t : new TipoEntrada(t)
    );

    const evento = new Evento({
      nombre,
      descripcion,
      categoria,
      fecha,
      tiposEntrada: instanciasTiposEntrada,
      multimedia,
      organizador
    });

    return await this.eventoRepository.guardar(evento);
  }

  async buscarEventos({
    texto,
    categoriaId,
    precioMin,
    precioMax,
    ordenarPor,
    orden
  } = {}) {
    const eventos = await this.eventoRepository.buscarConFiltros({
      texto,
      categoriaId,
      precioMin,
      precioMax
    });

    const eventosEnriquecidos = await Promise.all(
      eventos.map(async (evento) => {
        const puntaje = await this.reseniaRepository.calcularPromedioPorOrganizador(
          evento.organizador.id
        );
        evento.puntajeOrganizador = puntaje;
        return evento;
      })
    );

    if (ordenarPor) {
      const direccion =
        orden || (ordenarPor === 'puntaje' ? 'desc' : 'asc');

      eventosEnriquecidos.sort((a, b) => {
        if (ordenarPor === 'precio') {
          const precioA = a.obtenerPrecioMinimo();
          const precioB = b.obtenerPrecioMinimo();
          return direccion === 'desc' ? precioB - precioA : precioA - precioB;
        }

        if (ordenarPor === 'fecha') {
          const fechaA = new Date(a.fecha).getTime();
          const fechaB = new Date(b.fecha).getTime();
          return direccion === 'desc' ? fechaB - fechaA : fechaA - fechaB;
        }

        if (ordenarPor === 'puntaje') {
          const puntajeA = a.puntajeOrganizador ?? 0;
          const puntajeB = b.puntajeOrganizador ?? 0;
          return direccion === 'desc' ? puntajeB - puntajeA : puntajeA - puntajeB;
        }

        return 0;
      });
    }

    return eventosEnriquecidos;
  }

  async obtenerDetalleEvento(eventoId) {
    const evento = await this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado');
    }

    const puntajeOrganizador = await this.reseniaRepository.calcularPromedioPorOrganizador(
      evento.organizador.id
    );

    const reseniasOrganizador = await this.reseniaRepository.buscarPorOrganizador(
      evento.organizador.id
    );

    return {
      evento,
      tiposEntrada: evento.tiposEntrada,
      puntajeOrganizador,
      resenias: reseniasOrganizador,
      reseniasOrganizador
    };
  }

  async listarCategorias() {
    return await this.categoriaRepository.listarTodas();
  }
}

export const eventoService = new EventoService();
export default eventoService;
