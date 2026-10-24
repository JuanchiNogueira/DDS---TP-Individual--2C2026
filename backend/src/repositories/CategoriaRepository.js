export class CategoriaRepository {
  constructor() {
    this.categorias = new Map();
  }

  guardar(categoria) {
    if (!categoria || !categoria.id) {
      throw new Error('La categoría es inválida o no posee un ID');
    }
    this.categorias.set(categoria.id, categoria);
    return categoria;
  }

  buscarPorId(id) {
    if (!id) return null;
    return this.categorias.get(id) || null;
  }

  listarTodas() {
    return Array.from(this.categorias.values());
  }

  limpiar() {
    this.categorias.clear();
  }
}

export const categoriaRepository = new CategoriaRepository();
export default categoriaRepository;
