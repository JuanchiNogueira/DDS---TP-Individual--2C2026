export class ReseniaRepository {
  constructor() {
    this.resenias = new Map();
  }

  guardar(resenia) {
    if (!resenia || !resenia.id) {
      throw new Error('La reseña es inválida o no posee un ID');
    }
    this.resenias.set(resenia.id, resenia);
    return resenia;
  }

  buscarPorId(id) {
    if (!id) return null;
    return this.resenias.get(id) || null;
  }

  buscarPorEvento(eventoId) {
    if (!eventoId) return [];
    return Array.from(this.resenias.values()).filter(
      (resenia) => resenia.evento?.id === eventoId
    );
  }

  buscarPorOrganizador(organizadorId) {
    if (!organizadorId) return [];
    return Array.from(this.resenias.values()).filter(
      (resenia) => resenia.evento?.organizador?.id === organizadorId
    );
  }

  calcularPromedioPorOrganizador(organizadorId) {
    const reseniasOrganizador = this.buscarPorOrganizador(organizadorId);
    if (reseniasOrganizador.length === 0) {
      return 0;
    }
    const suma = reseniasOrganizador.reduce((acc, curr) => acc + curr.puntuacion, 0);
    const promedio = suma / reseniasOrganizador.length;
    return Number(promedio.toFixed(2));
  }

  limpiar() {
    this.resenias.clear();
  }
}

export const reseniaRepository = new ReseniaRepository();
export default reseniaRepository;
