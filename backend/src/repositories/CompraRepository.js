export class CompraRepository {
  constructor() {
    this.compras = new Map();
  }

  guardar(compra) {
    if (!compra || !compra.id) {
      throw new Error('La compra es inválida o no posee un ID');
    }
    this.compras.set(compra.id, compra);
    return compra;
  }

  buscarPorId(id) {
    if (!id) return null;
    return this.compras.get(id) || null;
  }

  buscarPorComprador(compradorId) {
    if (!compradorId) return [];
    return Array.from(this.compras.values()).filter(
      (compra) => compra.comprador?.id === compradorId
    );
  }

  buscarPorEvento(eventoId) {
    if (!eventoId) return [];
    return Array.from(this.compras.values()).filter(
      (compra) => compra.evento?.id === eventoId
    );
  }

  limpiar() {
    this.compras.clear();
  }
}

export const compraRepository = new CompraRepository();
export default compraRepository;
