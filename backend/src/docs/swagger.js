export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AI Ticket It API',
    version: '1.0.0',
    description:
      'API REST interactiva para la plataforma de publicación de eventos y venta de entradas AI Ticket It. Todos los ejemplos están sincronizados con los datos precargados en memoria por DataSeeder.js.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local de Desarrollo'
    }
  ],
  tags: [
    { name: 'Sistema', description: 'Monitoreo y reinicialización de datos en memoria' },
    { name: 'Usuarios', description: 'Gestión de usuarios y favoritos' },
    { name: 'Categorías', description: 'Consulta de categorías de eventos' },
    { name: 'Eventos', description: 'Publicación, búsqueda y detalle de eventos' },
    { name: 'Compras', description: 'Ciclo de vida de compras, cupos, cancelaciones y chat' },
    { name: 'Reseñas', description: 'Calificaciones y opiniones de compras utilizadas' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Verificar estado del servidor',
        description: 'Endpoint de salud del backend',
        responses: {
          200: {
            description: 'Servidor operativo',
            content: {
              'application/json': {
                example: { status: 'success', data: { ok: true } }
              }
            }
          }
        }
      }
    },
    '/seed': {
      post: {
        tags: ['Sistema'],
        summary: 'Reinicializar base de datos en memoria',
        description: 'Limpia todos los repositorios y recarga los datos semilla determinísticos con un solo clic.',
        responses: {
          201: {
            description: 'Datos sembrados con éxito',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: {
                    usuarios: 4,
                    categorias: 4,
                    eventos: 4,
                    compras: 5,
                    resenias: 1
                  }
                }
              }
            }
          }
        }
      }
    },
    '/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar todos los usuarios',
        description: 'Devuelve organizadores y compradores registrados en memoria.',
        responses: {
          200: {
            description: 'Lista de usuarios obtenida',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: [
                    { id: 'usr-org-1', nombre: 'Charly', apellido: 'García Producciones', favoritos: [] },
                    { id: 'usr-comp-1', nombre: 'Ana', apellido: 'Gómez', favoritos: [] }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario por ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'usr-comp-1' }
          }
        ],
        responses: {
          200: {
            description: 'Usuario encontrado',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: { id: 'usr-comp-1', nombre: 'Ana', apellido: 'Gómez', favoritos: [] }
                }
              }
            }
          },
          404: {
            description: 'Usuario no encontrado',
            content: {
              'application/json': {
                example: {
                  statusCode: 404,
                  status: 'error',
                  message: 'Usuario no encontrado',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    '/usuarios/{id}/favoritos': {
      post: {
        tags: ['Usuarios'],
        summary: 'Alternar (toggle) evento favorito de un usuario',
        description: 'Si el evento ya es favorito lo quita; si no lo es, lo agrega.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'usr-comp-1' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['eventoId'],
                properties: {
                  eventoId: { type: 'string', example: 'evt-1' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Favorito actualizado con éxito',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: { id: 'usr-comp-1', nombre: 'Ana', apellido: 'Gómez', favoritos: ['evt-1'] }
                }
              }
            }
          },
          404: {
            description: 'Usuario o evento no encontrado',
            content: {
              'application/json': {
                example: {
                  statusCode: 404,
                  status: 'error',
                  message: 'Evento no encontrado',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    '/categorias': {
      get: {
        tags: ['Categorías'],
        summary: 'Listar todas las categorías',
        description: 'Devuelve las categorías disponibles para clasificación de eventos.',
        responses: {
          200: {
            description: 'Lista de categorías obtenida',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: [
                    { id: 'cat-rock', nombre: 'Rock', descripcion: 'Festivales y recitales de rock en vivo' },
                    { id: 'cat-teatro', nombre: 'Teatro', descripcion: 'Obras de teatro, dramas y musicales' },
                    { id: 'cat-electro', nombre: 'Electrónica', descripcion: 'Festivales de música electrónica' },
                    { id: 'cat-standup', nombre: 'Stand Up', descripcion: 'Shows cómicos y monólogos humorísticos' }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/eventos': {
      get: {
        tags: ['Eventos'],
        summary: 'Buscar y filtrar eventos',
        description: 'Permite buscar por texto case-insensitive, categoría, rango de precios y ordenar por precio, fecha o puntaje del organizador.',
        parameters: [
          { name: 'texto', in: 'query', schema: { type: 'string' }, description: 'Búsqueda textual en nombre o descripción', example: 'Rock' },
          { name: 'categoriaId', in: 'query', schema: { type: 'string' }, example: 'cat-rock' },
          { name: 'precioMin', in: 'query', schema: { type: 'number' }, example: 5000 },
          { name: 'precioMax', in: 'query', schema: { type: 'number' }, example: 10000 },
          { name: 'ordenarPor', in: 'query', schema: { type: 'string', enum: ['precio', 'fecha', 'puntaje'] }, example: 'precio' },
          { name: 'orden', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] }, example: 'asc' }
        ],
        responses: {
          200: {
            description: 'Eventos obtenidos con enriquecimiento de puntaje de organizador',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: [
                    {
                      id: 'evt-1',
                      nombre: 'Cosquín Rock 2027',
                      descripcion: 'El festival multitudinario de rock en las sierras',
                      fecha: '2027-02-15T18:00:00.000Z',
                      categoria: { id: 'cat-rock', nombre: 'Rock' },
                      organizador: { id: 'usr-org-1', nombre: 'Charly', apellido: 'García Producciones' },
                      puntajeOrganizador: 5,
                      tiposEntrada: [
                        { id: 'tipo-1', nombre: 'Campo General', precio: 8000, cupo: 100 }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Eventos'],
        summary: 'Crear un nuevo evento con tipos de entrada',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'categoriaId', 'fecha', 'organizadorId', 'tiposEntrada'],
                properties: {
                  nombre: { type: 'string', example: 'Lollapalooza 2027' },
                  descripcion: { type: 'string', example: 'Festival internacional de música' },
                  categoriaId: { type: 'string', example: 'cat-rock' },
                  fecha: { type: 'string', format: 'date-time', example: '2027-03-20T16:00:00.000Z' },
                  organizadorId: { type: 'string', example: 'usr-org-1' },
                  multimedia: { type: 'array', items: { type: 'string' }, example: ['https://example.com/poster.jpg'] },
                  tiposEntrada: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['nombre', 'precio', 'cupo'],
                      properties: {
                        nombre: { type: 'string', example: 'Pase 3 Días General' },
                        descripcion: { type: 'string', example: 'Acceso a los 3 días' },
                        precio: { type: 'number', example: 45000 },
                        cupo: { type: 'integer', example: 500 }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Evento creado exitosamente',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: {
                    id: 'evt-nuevo',
                    nombre: 'Lollapalooza 2027',
                    fecha: '2027-03-20T16:00:00.000Z',
                    tiposEntrada: [{ id: 'tipo-new', nombre: 'Pase 3 Días General', precio: 45000, cupo: 500 }]
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación sintáctica',
            content: {
              'application/json': {
                example: {
                  statusCode: 400,
                  status: 'error',
                  message: 'tiposEntrada: Debe ingresar al menos un tipo de entrada',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          },
          404: {
            description: 'Organizador o categoría inexistente',
            content: {
              'application/json': {
                example: {
                  statusCode: 404,
                  status: 'error',
                  message: 'Organizador no encontrado',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    '/eventos/{id}': {
      get: {
        tags: ['Eventos'],
        summary: 'Obtener detalle completo de un evento',
        description: 'Devuelve información del evento, tipos de entrada con cupos actuales, reputación del organizador y reseñas históricas.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'evt-1' }
        ],
        responses: {
          200: {
            description: 'Detalle de evento obtenido',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: {
                    evento: { id: 'evt-1', nombre: 'Cosquín Rock 2027' },
                    tiposEntrada: [{ id: 'tipo-1', nombre: 'Campo General', precio: 8000, cupo: 100 }],
                    puntajeOrganizador: 5,
                    resenias: [
                      { id: 'resenia-1', detalle: 'Excelente sonido y la organización fue perfecta.', puntuacion: 5 }
                    ]
                  }
                }
              }
            }
          },
          404: {
            description: 'Evento no encontrado',
            content: {
              'application/json': {
                example: {
                  statusCode: 404,
                  status: 'error',
                  message: 'Evento no encontrado',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    '/eventos/{eventoId}/compras': {
      get: {
        tags: ['Compras'],
        summary: 'Listar compras de un evento (para el organizador)',
        description: 'Devuelve compras diferenciadas por estado y resumen de cupos disponibles de cada tipo de entrada.',
        parameters: [
          { name: 'eventoId', in: 'path', required: true, schema: { type: 'string' }, example: 'evt-2' },
          { name: 'organizadorId', in: 'query', required: true, schema: { type: 'string' }, example: 'usr-org-2' }
        ],
        responses: {
          200: {
            description: 'Compras y resumen de cupos obtenidos',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: {
                    compras: [{ id: 'compra-confirmada-1', estado: 'CONFIRMADA', cantidad: 1, total: 6000 }],
                    comprasPorEstado: {
                      CONFIRMADA: [{ id: 'compra-confirmada-1' }],
                      PENDIENTE: []
                    },
                    entradasDisponibles: [
                      { id: 'tipo-3', nombre: 'Platea Baja', precio: 6000, cupoDisponible: 49, cupoInicial: 50 }
                    ]
                  }
                }
              }
            }
          },
          403: {
            description: 'El usuario no es organizador de este evento',
            content: {
              'application/json': {
                example: {
                  statusCode: 403,
                  status: 'error',
                  message: 'No tiene permisos para ver las compras de este evento',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    '/compras': {
      post: {
        tags: ['Compras'],
        summary: 'Realizar una compra de entradas',
        description: 'Valida disponibilidad de cupo, descuenta de forma atómica y crea la compra.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['compradorId', 'eventoId', 'tipoEntradaId', 'cantidad'],
                properties: {
                  compradorId: { type: 'string', example: 'usr-comp-1' },
                  eventoId: { type: 'string', example: 'evt-1' },
                  tipoEntradaId: { type: 'string', example: 'tipo-1' },
                  cantidad: { type: 'integer', example: 2 },
                  confirmarInmediatamente: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Compra realizada con éxito',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: {
                    id: 'compra-nueva',
                    estado: 'CONFIRMADA',
                    cantidad: 2,
                    total: 16000
                  }
                }
              }
            }
          },
          409: {
            description: 'Cupo insuficiente',
            content: {
              'application/json': {
                example: {
                  statusCode: 409,
                  status: 'error',
                  message: 'No hay cupo suficiente para el tipo de entrada "Campo General"',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    '/compras/comprador/{compradorId}': {
      get: {
        tags: ['Compras'],
        summary: 'Listar compras de un comprador',
        description: 'Devuelve todas las compras del usuario, calculando diasFaltantes para las que están CONFIRMADA.',
        parameters: [
          { name: 'compradorId', in: 'path', required: true, schema: { type: 'string' }, example: 'usr-comp-1' }
        ],
        responses: {
          200: {
            description: 'Compras obtenidas',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: [
                    {
                      id: 'compra-utilizada-1',
                      estado: 'UTILIZADA',
                      cantidad: 1,
                      total: 4000,
                      diasFaltantes: null
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/compras/{id}/cancelar': {
      post: {
        tags: ['Compras'],
        summary: 'Cancelar una compra',
        description: 'Cancela la compra y restituye los cupos al evento, siempre que no haya sido utilizada y el evento no haya ocurrido.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'compra-confirmada-1' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['usuarioId'],
                properties: {
                  usuarioId: { type: 'string', example: 'usr-comp-2' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Compra cancelada y cupo restituido',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: { id: 'compra-confirmada-1', estado: 'CANCELADA' }
                }
              }
            }
          },
          409: {
            description: 'No se puede cancelar (ya fue utilizada o el evento ya pasó)',
            content: {
              'application/json': {
                example: {
                  statusCode: 409,
                  status: 'error',
                  message: 'No se puede cancelar una compra que ya fue utilizada',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    '/compras/{id}/estado': {
      patch: {
        tags: ['Compras'],
        summary: 'Actualizar estado de una compra',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'compra-pendiente-1' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['estado', 'usuarioId'],
                properties: {
                  estado: { type: 'string', enum: ['PENDIENTE', 'CONFIRMADA', 'UTILIZADA', 'CANCELADA', 'REEMBOLSADA'], example: 'CONFIRMADA' },
                  usuarioId: { type: 'string', example: 'usr-org-1' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Estado de compra actualizado',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: { id: 'compra-pendiente-1', estado: 'CONFIRMADA' }
                }
              }
            }
          }
        }
      }
    },
    '/compras/{id}/mensajes': {
      post: {
        tags: ['Compras'],
        summary: 'Enviar mensaje al chat de la compra',
        description: 'Permite el intercambio de mensajes exclusivamente entre el comprador y el organizador del evento.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'compra-confirmada-1' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['usuarioId', 'texto'],
                properties: {
                  usuarioId: { type: 'string', example: 'usr-comp-2' },
                  texto: { type: 'string', example: '¿El ingreso es por orden de llegada?' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Mensaje agregado al chat',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: {
                    id: 'msg-nuevo',
                    mensaje: '¿El ingreso es por orden de llegada?',
                    enviado: '2026-10-24T18:00:00.000Z'
                  }
                }
              }
            }
          },
          403: {
            description: 'Usuario no autorizado para participar en el chat',
            content: {
              'application/json': {
                example: {
                  statusCode: 403,
                  status: 'error',
                  message: 'Solo el comprador o el organizador pueden participar en el chat de la compra',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    '/resenias': {
      post: {
        tags: ['Reseñas'],
        summary: 'Crear reseña para una compra utilizada',
        description: 'Solo se puede calificar si la entrada fue efectivamente utilizada (EstadoCompra.UTILIZADA). El caso precargado compra-utilizada-sin-resenia está disponible para probar este endpoint con éxito.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['compraId', 'compradorId', 'puntuacion', 'detalle'],
                properties: {
                  compraId: { type: 'string', example: 'compra-utilizada-sin-resenia' },
                  compradorId: { type: 'string', example: 'usr-comp-2' },
                  puntuacion: { type: 'number', minimum: 1, maximum: 5, example: 5 },
                  detalle: { type: 'string', example: 'Increíble espectáculo, muy divertido y bien organizado.' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Reseña registrada con éxito',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: {
                    id: 'resenia-nueva',
                    puntuacion: 5,
                    detalle: 'Increíble espectáculo, muy divertido y bien organizado.',
                    fecha: '2026-10-24T18:00:00.000Z'
                  }
                }
              }
            }
          },
          409: {
            description: 'Compra no utilizada o ya reseñada',
            content: {
              'application/json': {
                example: {
                  statusCode: 409,
                  status: 'error',
                  message: 'Solo se puede calificar un evento si la entrada asociada ha sido utilizada',
                  timestamp: '2026-10-24T18:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    '/resenias/organizador/{organizadorId}': {
      get: {
        tags: ['Reseñas'],
        summary: 'Listar reseñas y promedio de un organizador',
        parameters: [
          { name: 'organizadorId', in: 'path', required: true, schema: { type: 'string' }, example: 'usr-org-1' }
        ],
        responses: {
          200: {
            description: 'Promedio y reseñas obtenidas',
            content: {
              'application/json': {
                example: {
                  status: 'success',
                  data: {
                    promedio: 5,
                    resenias: [
                      { id: 'resenia-1', puntuacion: 5, detalle: 'Excelente sonido y la organización fue perfecta.' }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer', example: 400 },
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Mensaje descriptivo del error' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-10-24T18:00:00.000Z' }
        }
      }
    }
  }
};

export default swaggerSpec;
