import { Usuario } from '../domain/Usuario.js';
import { Categoria } from '../domain/Categoria.js';
import { TipoEntrada } from '../domain/TipoEntrada.js';
import { Evento } from '../domain/Evento.js';
import { Compra } from '../domain/Compra.js';
import { EstadoCompra } from '../domain/EstadoCompra.js';
import { Resenia } from '../domain/Resenia.js';

import { usuarioRepository as defaultUsuarioRepo } from './UsuarioRepository.js';
import { categoriaRepository as defaultCategoriaRepo } from './CategoriaRepository.js';
import { eventoRepository as defaultEventoRepo } from './EventoRepository.js';
import { compraRepository as defaultCompraRepo } from './CompraRepository.js';
import { reseniaRepository as defaultReseniaRepo } from './ReseniaRepository.js';

export const seedDatabase = (repositories = {}) => {
  const repoUsuarios = repositories.usuarioRepository || defaultUsuarioRepo;
  const repoCategorias = repositories.categoriaRepository || defaultCategoriaRepo;
  const repoEventos = repositories.eventoRepository || defaultEventoRepo;
  const repoCompras = repositories.compraRepository || defaultCompraRepo;
  const repoResenias = repositories.reseniaRepository || defaultReseniaRepo;

  // Limpiar repositorios antes de cargar
  repoUsuarios.limpiar();
  repoCategorias.limpiar();
  repoEventos.limpiar();
  repoCompras.limpiar();
  repoResenias.limpiar();

  // 1. Usuarios: 2 organizadores y 2 compradores
  const org1 = new Usuario({
    id: 'usr-org-1',
    nombre: 'Charly',
    apellido: 'García Producciones'
  });

  const org2 = new Usuario({
    id: 'usr-org-2',
    nombre: 'Teatro',
    apellido: 'Gran Rex'
  });

  const comp1 = new Usuario({
    id: 'usr-comp-1',
    nombre: 'Ana',
    apellido: 'Gómez'
  });

  const comp2 = new Usuario({
    id: 'usr-comp-2',
    nombre: 'Lucas',
    apellido: 'Fernández'
  });

  repoUsuarios.guardar(org1);
  repoUsuarios.guardar(org2);
  repoUsuarios.guardar(comp1);
  repoUsuarios.guardar(comp2);

  // 2. Categorías: 4 categorías
  const catRock = new Categoria({
    id: 'cat-rock',
    nombre: 'Rock',
    descripcion: 'Festivales y recitales de rock en vivo'
  });

  const catTeatro = new Categoria({
    id: 'cat-teatro',
    nombre: 'Teatro',
    descripcion: 'Obras de teatro, dramas y musicales'
  });

  const catElectro = new Categoria({
    id: 'cat-electro',
    nombre: 'Electrónica',
    descripcion: 'Eventos y festivales de música electrónica'
  });

  const catStandUp = new Categoria({
    id: 'cat-standup',
    nombre: 'Stand Up',
    descripcion: 'Shows cómicos y monólogos humorísticos'
  });

  repoCategorias.guardar(catRock);
  repoCategorias.guardar(catTeatro);
  repoCategorias.guardar(catElectro);
  repoCategorias.guardar(catStandUp);

  // 3. Eventos y Tipos de Entrada
  // Evento Futuro 1 (Rock)
  const teRockGeneral = new TipoEntrada({
    id: 'tipo-1',
    nombre: 'Campo General',
    descripcion: 'Acceso a campo',
    precio: 8000,
    cupo: 100
  });

  const teRockVip = new TipoEntrada({
    id: 'tipo-2',
    nombre: 'VIP Experiencia',
    descripcion: 'Acceso preferencial y consumición',
    precio: 20000,
    cupo: 30
  });

  const eventoFuturoRock = new Evento({
    id: 'evt-1',
    nombre: 'Cosquín Rock 2027',
    descripcion: 'El festival multitudinario de rock en las sierras',
    categoria: catRock,
    fecha: new Date('2027-02-15T18:00:00Z'),
    tiposEntrada: [teRockGeneral, teRockVip],
    multimedia: ['https://example.com/cosquin.jpg'],
    organizador: org1
  });

  // Evento Futuro 2 (Teatro)
  const teTeatroPlatea = new TipoEntrada({
    id: 'tipo-3',
    nombre: 'Platea Baja',
    descripcion: 'Ubicación central frente al escenario',
    precio: 6000,
    cupo: 50
  });

  const teTeatroPullman = new TipoEntrada({
    id: 'tipo-4',
    nombre: 'Pullman',
    descripcion: 'Planta alta sin numerar',
    precio: 3500,
    cupo: 40
  });

  const eventoFuturoTeatro = new Evento({
    id: 'evt-2',
    nombre: 'Toc Toc',
    descripcion: 'Comedia exitosa sobre los trastornos obsesivos',
    categoria: catTeatro,
    fecha: new Date('2027-05-20T20:30:00Z'),
    tiposEntrada: [teTeatroPlatea, teTeatroPullman],
    multimedia: ['https://example.com/toctoc.jpg'],
    organizador: org2
  });

  // Evento Pasado 1 (Rock)
  const tePasadoRock = new TipoEntrada({
    id: 'tipo-pasado-1',
    nombre: 'General Pasado',
    precio: 4000,
    cupo: 50
  });

  const eventoPasadoRock = new Evento({
    id: 'evt-pasado-1',
    nombre: 'Divididos en Vivo 2025',
    descripcion: 'Concierto histórico en el estadio',
    categoria: catRock,
    fecha: new Date('2025-10-10T21:00:00Z'),
    tiposEntrada: [tePasadoRock],
    organizador: org1
  });

  // Evento Pasado 2 (Stand Up)
  const tePasadoStandUp = new TipoEntrada({
    id: 'tipo-pasado-2',
    nombre: 'Entrada Show',
    precio: 5000,
    cupo: 30
  });

  const eventoPasadoStandUp = new Evento({
    id: 'evt-pasado-2',
    nombre: 'Noche de Stand Up Cómico 2025',
    descripcion: 'Monólogos y risas sin parar',
    categoria: catStandUp,
    fecha: new Date('2025-11-05T22:00:00Z'),
    tiposEntrada: [tePasadoStandUp],
    organizador: org2
  });

  repoEventos.guardar(eventoFuturoRock);
  repoEventos.guardar(eventoFuturoTeatro);
  repoEventos.guardar(eventoPasadoRock);
  repoEventos.guardar(eventoPasadoStandUp);

  // 4. Compras en distintos estados
  // Compra 1: PENDIENTE
  const compraPendiente = new Compra({
    id: 'compra-pendiente-1',
    comprador: comp1,
    evento: eventoFuturoRock,
    tipoEntrada: teRockGeneral,
    cantidad: 2,
    estado: EstadoCompra.PENDIENTE
  });

  // Compra 2: CONFIRMADA con mensajes en el chat
  const compraConfirmada = new Compra({
    id: 'compra-confirmada-1',
    comprador: comp2,
    evento: eventoFuturoTeatro,
    tipoEntrada: teTeatroPlatea,
    cantidad: 1,
    estado: EstadoCompra.CONFIRMADA
  });

  compraConfirmada.agregarMensaje(comp2, '¿A qué hora abren las puertas de la sala?');
  compraConfirmada.agregarMensaje(org2, 'Hola Lucas! Las puertas se abren 30 minutos antes de la función.');

  // Compra 3: UTILIZADA (con Reseña posterior)
  const compraUtilizadaReseniada = new Compra({
    id: 'compra-utilizada-1',
    comprador: comp1,
    evento: eventoPasadoRock,
    tipoEntrada: tePasadoRock,
    cantidad: 1,
    estado: EstadoCompra.CONFIRMADA
  });
  compraUtilizadaReseniada.marcarComoUtilizada(org1);

  // Compra 4: UTILIZADA (SIN Reseña, para tests)
  const compraUtilizadaSinReseniar = new Compra({
    id: 'compra-utilizada-sin-resenia',
    comprador: comp2,
    evento: eventoPasadoStandUp,
    tipoEntrada: tePasadoStandUp,
    cantidad: 1,
    estado: EstadoCompra.CONFIRMADA
  });
  compraUtilizadaSinReseniar.marcarComoUtilizada(org2);

  // Compra 5: CANCELADA
  const compraCancelada = new Compra({
    id: 'compra-cancelada-1',
    comprador: comp1,
    evento: eventoFuturoRock,
    tipoEntrada: teRockVip,
    cantidad: 1,
    estado: EstadoCompra.CONFIRMADA
  });
  compraCancelada.cancelar(comp1, new Date('2026-01-01T00:00:00Z'), 'Imposibilidad de viajar');

  repoCompras.guardar(compraPendiente);
  repoCompras.guardar(compraConfirmada);
  repoCompras.guardar(compraUtilizadaReseniada);
  repoCompras.guardar(compraUtilizadaSinReseniar);
  repoCompras.guardar(compraCancelada);

  // 5. Reseñas
  const resenia1 = Resenia.crearDesdeCompra(compraUtilizadaReseniada, {
    id: 'resenia-1',
    detalle: 'Excelente sonido y la organización fue perfecta.',
    puntuacion: 5,
    fecha: new Date('2025-10-11T12:00:00Z')
  });

  repoResenias.guardar(resenia1);

  return {
    usuarios: [org1, org2, comp1, comp2],
    categorias: [catRock, catTeatro, catElectro, catStandUp],
    eventos: [eventoFuturoRock, eventoFuturoTeatro, eventoPasadoRock, eventoPasadoStandUp],
    compras: [
      compraPendiente,
      compraConfirmada,
      compraUtilizadaReseniada,
      compraUtilizadaSinReseniar,
      compraCancelada
    ],
    resenias: [resenia1]
  };
};

export default seedDatabase;
