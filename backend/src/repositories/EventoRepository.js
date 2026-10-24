export class EventoRepository {
  constructor() {
    this.eventos = new Map();
  }

  guardar(evento) {
    if (!evento || !evento.id) {
      throw new Error('El evento es inválido o no posee un ID');
    }
    this.eventos.set(evento.id, evento);
    return evento;
  }

  buscarPorId(id) {
    if (!id) return null;
    return this.eventos.get(id) || null;
  }

  listarTodos() {
    return Array.from(this.eventos.values());
  }

  buscarPorOrganizador(organizadorId) {
    if (!organizadorId) return [];
    return this.listarTodos().filter((evento) => evento.organizador?.id === organizadorId);
  }

  buscarConFiltros({ texto, categoriaId, precioMin, precioMax } = {}) {
    return this.listarTodos().filter((evento) => {
      if (texto && typeof texto === 'string' && texto.trim()) {
        const query = texto.trim().toLowerCase();
        const coincideNombre = evento.nombre.toLowerCase().includes(query);
        const coincideDescripcion = evento.descripcion?.toLowerCase().includes(query) ?? false;
        if (!coincideNombre && !coincideDescripcion) {
          return false;
        }
      }

      if (categoriaId) {
        if (evento.categoria?.id !== categoriaId) {
          return false;
        }
      }

      const tieneFiltroPrecioMin = typeof precioMin === 'number' && !isNaN(precioMin);
      const tieneFiltroPrecioMax = typeof precioMax === 'number' && !isNaN(precioMax);

      if (tieneFiltroPrecioMin || tieneFiltroPrecioMax) {
        const min = tieneFiltroPrecioMin ? precioMin : 0;
        const max = tieneFiltroPrecioMax ? precioMax : Infinity;
        if (min > max) {
          return false;
        }
        if (!evento.tuPrecioEstaEntre(min, max)) {
          return false;
        }
      }

      return true;
    });
  }

  limpiar() {
    this.eventos.clear();
  }
}

export const eventoRepository = new EventoRepository();
export default eventoRepository;
