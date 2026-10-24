import { describe, test, expect, beforeEach } from '@jest/globals';
import { usuarioRepository } from '../../src/repositories/UsuarioRepository.js';
import { categoriaRepository } from '../../src/repositories/CategoriaRepository.js';
import { eventoRepository } from '../../src/repositories/EventoRepository.js';
import { compraRepository } from '../../src/repositories/CompraRepository.js';
import { reseniaRepository } from '../../src/repositories/ReseniaRepository.js';
import { seedDatabase } from '../../src/repositories/DataSeeder.js';
import { EstadoCompra } from '../../src/domain/EstadoCompra.js';

describe('DataSeeder Unit Tests', () => {
  beforeEach(() => {
    // Arrange: limpiar repositorios antes de cada test
    usuarioRepository.limpiar();
    categoriaRepository.limpiar();
    eventoRepository.limpiar();
    compraRepository.limpiar();
    reseniaRepository.limpiar();
  });

  test('debe sembrar datos iniciales completos en todos los repositorios', () => {
    // Arrange
    const repos = {
      usuarioRepository,
      categoriaRepository,
      eventoRepository,
      compraRepository,
      reseniaRepository
    };

    // Act
    const datosSembrados = seedDatabase(repos);

    // Assert
    // 2 organizadores y 2 compradores
    expect(usuarioRepository.listarTodos()).toHaveLength(4);
    expect(datosSembrados.usuarios).toHaveLength(4);

    // 4 categorías
    expect(categoriaRepository.listarTodas()).toHaveLength(4);
    expect(datosSembrados.categorias).toHaveLength(4);

    // Eventos futuros y pasados
    expect(eventoRepository.listarTodos()).toHaveLength(4);
    expect(datosSembrados.eventos).toHaveLength(4);

    // Compras en distintos estados
    const compras = compraRepository.buscarPorComprador('comp-1').concat(
      compraRepository.buscarPorComprador('comp-2')
    );
    expect(compras.length).toBeGreaterThanOrEqual(4);

    const estadosPresentes = compras.map((c) => c.estado);
    expect(estadosPresentes).toContain(EstadoCompra.PENDIENTE);
    expect(estadosPresentes).toContain(EstadoCompra.CONFIRMADA);
    expect(estadosPresentes).toContain(EstadoCompra.UTILIZADA);
    expect(estadosPresentes).toContain(EstadoCompra.CANCELADA);

    // Mensajes en el chat de una compra
    const compraConChat = compras.find((c) => c.mensajes.length > 0);
    expect(compraConChat).toBeDefined();
    expect(compraConChat.mensajes.length).toBeGreaterThanOrEqual(2);

    // Reseñas cargadas
    expect(reseniaRepository.buscarPorOrganizador('org-1').length).toBeGreaterThanOrEqual(1);

    // Compra UTILIZADA sin reseñar disponible para pruebas
    const comprasUtilizadas = compras.filter((c) => c.estado === EstadoCompra.UTILIZADA);
    expect(comprasUtilizadas.length).toBeGreaterThanOrEqual(2);
    const comprasConResenia = comprasUtilizadas.filter((c) =>
      reseniaRepository.buscarPorEvento(c.evento.id).some((r) => r.comprador.id === c.comprador.id)
    );
    const comprasSinResenia = comprasUtilizadas.filter(
      (c) =>
        !reseniaRepository
          .buscarPorEvento(c.evento.id)
          .some((r) => r.comprador.id === c.comprador.id)
    );
    expect(comprasConResenia.length).toBeGreaterThanOrEqual(1);
    expect(comprasSinResenia.length).toBeGreaterThanOrEqual(1);
  });

  test('debe limpiar los repositorios y resembrar sin duplicar registros al ejecutarse nuevamente', () => {
    // Arrange
    const repos = {
      usuarioRepository,
      categoriaRepository,
      eventoRepository,
      compraRepository,
      reseniaRepository
    };

    // Act: Primera siembra
    seedDatabase(repos);
    // Act: Segunda siembra consecutiva
    seedDatabase(repos);

    // Assert
    expect(usuarioRepository.listarTodos()).toHaveLength(4);
    expect(categoriaRepository.listarTodas()).toHaveLength(4);
    expect(eventoRepository.listarTodos()).toHaveLength(4);
    expect(reseniaRepository.buscarPorOrganizador('org-1')).toHaveLength(1);
  });
});
