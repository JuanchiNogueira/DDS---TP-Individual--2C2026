# AI Ticket It - Plataforma de Venta de Entradas para Eventos
Trabajo Práctico Individual de Desarrollo con Inteligencia Artificial - DDS UTN 2C 2026

## Descripción General
Plataforma orientada a la publicación de eventos y venta de entradas. Permite a los organizadores crear eventos con múltiples tipos de entrada, precios y cupos, gestionar ventas y responder mensajes. Permite a los compradores explorar y filtrar eventos por categoría/texto, comprar entradas respetando cupos, dar seguimiento a sus compras, cancelar compras antes del evento si no fueron utilizadas, intercambiar mensajes con el organizador y dejar reseñas una vez utilizadas las entradas.

---

## Modelo de Dominio

### Entidades y Enums

1. **EstadoCompra (Enum / Object Freeze)**
   - Valores: `PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`.

2. **Usuario**
   - Atributos:
     - `id`: string (UUID o identificador único)
     - `nombre`: string
     - `apellido`: string
     - `favoritos`: Evento[] (lista de eventos favoritos)
   - Métodos:
     - `agregarFavorito(evento)`
     - `removerFavorito(eventoId)`
     - `esFavorito(eventoId)`

3. **Categoria**
   - Atributos:
     - `id`: string
     - `nombre`: string
     - `descripcion`: string

4. **TipoEntrada**
   - Atributos:
     - `id`: string
     - `nombre`: string
     - `descripcion`: string
     - `precio`: number
     - `cupo`: number (cupo disponible actual)
     - `cupoInicial`: number (cupo total inicial)
   - Métodos:
     - `hayCupoPara(cantidad)`: boolean
     - `descontarCupo(cantidad)`: void (lanza `ConflictError` si no hay cupo)
     - `restituirCupo(cantidad)`: void

5. **Evento**
   - Atributos:
     - `id`: string
     - `nombre`: string
     - `descripcion`: string
     - `categoria`: Categoria
     - `fecha`: Date
     - `tiposEntrada`: TipoEntrada[]
     - `multimedia`: string[]
     - `organizador`: Usuario
   - Métodos:
     - `tuPrecioEstaEntre(min, max)`: boolean (verifica si algún tipo de entrada cae en el rango)
     - `agregarTipoEntrada(tipoEntrada)`: void
     - `obtenerTipoEntrada(id)`: TipoEntrada
     - `yaPaso(fechaReferencia = new Date())`: boolean

6. **CambioEstadoCompra**
   - Atributos:
     - `compraId`: string
     - `estadoAnterior`: EstadoCompra
     - `estadoNuevo`: EstadoCompra
     - `quien`: Usuario
     - `fechaHora`: Date
     - `motivo`: string (opcional)

7. **Mensaje**
   - Atributos:
     - `id`: string
     - `usuario`: Usuario (autor del mensaje)
     - `mensaje`: string
     - `enviado`: Date

8. **Compra**
   - Atributos:
     - `id`: string
     - `comprador`: Usuario
     - `evento`: Evento
     - `tipoEntrada`: TipoEntrada
     - `cantidad`: number
     - `total`: number (calculado como cantidad * tipoEntrada.precio)
     - `estado`: EstadoCompra (por defecto `PENDIENTE` o `CONFIRMADA` según flujo)
     - `mensajes`: Mensaje[]
     - `historialEstados`: CambioEstadoCompra[]
     - `fechaCreacion`: Date
   - Métodos:
     - `actualizarEstado(nuevoEstado, quien, motivo = '')`: void
     - `calcularDiasFaltantes(fechaReferencia = new Date())`: number (solo si `estado === CONFIRMADA`, sino lanza error)
     - `cancelar(quien, fechaReferencia = new Date())`: void (solo si no está `UTILIZADA` y el evento no pasó; restituye cupo en `tipoEntrada` y cambia estado a `CANCELADA` o `REEMBOLSADA`)
     - `marcarComoUtilizada(quien)`: void
     - `agregarMensaje(usuario, texto)`: Mensaje (solo si el usuario es el comprador o el organizador)

9. **Resenia**
   - Atributos:
     - `id`: string
     - `comprador`: Usuario
     - `evento`: Evento
     - `detalle`: string
     - `puntuacion`: number (e.g. 1 a 5 o decimal)
     - `fecha`: Date
   - Validación de negocio:
     - Solo permitida si el comprador asistió / utilizó la entrada para el evento.

10. **Errores de Dominio (errors/DomainError.js)**
    - `DomainError` (alias exportado `AppError`): Clase base que extiende de `Error` con `statusCode`, `status` ("error"), `message` y `timestamp` (`new Date().toISOString()`).
    - `ValidationError`: datos no válidos (código 400).
    - `ForbiddenDomainError`: acción no permitida por permisos (código 403).
    - `NotFoundError`: entidad o recurso no encontrado (código 404).
    - `ConflictError`: regla de negocio rota / conflicto de estado o cupos (código 409).

### Middlewares de Error (`src/middlewares/`)
- `notFoundHandler.js`: Manejador de rutas inexistentes (3 parámetros `(req, res, next)`) que invoca `next(new NotFoundError(\`Ruta ${req.originalUrl} no encontrada\`))`.
- `errorLogger.js`: Middleware de logging de errores (4 parámetros `(err, req, res, next)`) que imprime `timestamp`, `method`, `path` y `error: { name, message, stack }` mediante `console.error` y propaga con `next(err)`.
- `errorHandler.js`: Manejador global de errores (4 parámetros `(err, req, res, next)`). Verifica `res.headersSent`, maneja instancias de `DomainError` / `AppError` respondiendo con `statusCode`, `status`, `message` y `timestamp`, o responde 500 para errores no contemplados.

---

## Roadmap de Implementación

- **Etapa 1 (Completada y Ajustada)**:
  - Inicialización del proyecto backend (`backend/package.json` con ES Modules, scripts de test y coverage).
  - Instalación de `express`, `zod`, `cors`, `dotenv` y `jest` (dev).
  - Capa `backend/src/domain/` con entidades, errores estandarizados (`AppError`/`DomainError`) y reglas de negocio.
  - Middlewares en `backend/src/middlewares/`: `notFoundHandler.js`, `errorLogger.js`, `errorHandler.js`.
  - Pruebas unitarias con Jest divididas por entidad bajo `backend/tests/domain/` y `backend/tests/middlewares/` aplicando patrón Triple A (`// Arrange`, `// Act`, `// Assert`).
- **Etapa 2 (Posterior)**:
  - Repositorios en memoria (`backend/src/repositories/`).
  - Servicios de aplicación (`backend/src/services/`).
- **Etapa 3 (Posterior)**:
  - Controladores, rutas Express y validadores Zod (`backend/src/controllers/`, `backend/src/routes/`).
- **Etapa 4 (Posterior)**:
  - Front-End en React Native.
