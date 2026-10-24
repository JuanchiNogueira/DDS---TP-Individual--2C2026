import { randomUUID } from 'node:crypto';
import { ValidationError } from './errors/DomainError.js';

export class Usuario {
  constructor({ id = randomUUID(), nombre, apellido, favoritos = [] } = {}) {
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      throw new ValidationError('El nombre del usuario es requerido');
    }
    if (!apellido || typeof apellido !== 'string' || !apellido.trim()) {
      throw new ValidationError('El apellido del usuario es requerido');
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.apellido = apellido.trim();
    this.favoritos = Array.isArray(favoritos) ? [...favoritos] : [];
  }

  get nombreCompleto() {
    return `${this.nombre} ${this.apellido}`;
  }

  agregarFavorito(evento) {
    if (!evento || !evento.id) {
      throw new ValidationError('El evento a agregar como favorito es inválido');
    }
    const yaExiste = this.favoritos.some((fav) => fav.id === evento.id);
    if (!yaExiste) {
      this.favoritos.push(evento);
    }
  }

  removerFavorito(eventoId) {
    if (!eventoId) {
      throw new ValidationError('El ID del evento a remover es requerido');
    }
    this.favoritos = this.favoritos.filter((fav) => fav.id !== eventoId);
  }

  esFavorito(eventoId) {
    return this.favoritos.some((fav) => fav.id === eventoId);
  }
}

export default Usuario;
