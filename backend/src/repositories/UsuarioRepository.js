export class UsuarioRepository {
  constructor() {
    this.usuarios = new Map();
  }

  guardar(usuario) {
    if (!usuario || !usuario.id) {
      throw new Error('El usuario es inválido o no posee un ID');
    }
    this.usuarios.set(usuario.id, usuario);
    return usuario;
  }

  buscarPorId(id) {
    if (!id) return null;
    return this.usuarios.get(id) || null;
  }

  listarTodos() {
    return Array.from(this.usuarios.values());
  }

  limpiar() {
    this.usuarios.clear();
  }
}

export const usuarioRepository = new UsuarioRepository();
export default usuarioRepository;
