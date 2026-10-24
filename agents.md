# AGENTS.md - Reglas de Arquitectura y Desarrollo (AI Ticket It)

## 1. Contexto General y Stack Tecnológico
Este repositorio contiene el proyecto **AI Ticket It**, una plataforma de publicación de eventos y venta de entradas.
- **Back-End**: Node.js + Express.
- **Validación de Esquemas HTTP**: Librería `zod`.
- **Persistencia**: Exclusivamente **en memoria** (utilizando colecciones `Map` o `Array` encapsuladas dentro de la capa `repositories/`). **PROHIBIDO** instalar o configurar motores de bases de datos externos (MongoDB, PostgreSQL, SQLite, Prisma, Mongoose, etc.).
- **Front-End**: React Native (ejecución local mobile).

## 2. Arquitectura en Capas (Back-End)
Todo el código del Back-End dentro de `backend/src/` debe respetar estrictamente el siguiente flujo unidireccional de dependencias:

`Routers -> Schemas (Zod) -> Controllers -> Services -> Repositories -> Dominio`

### Cadena de Ejecución Obligatoria en `app.js`
El registro de middlewares en `src/app.js` debe respetar este orden exacto:
`Request -> express.json() -> cors() -> router -> notFoundHandler -> errorLogger -> errorHandler -> Response`

1. **`src/errors/AppError.js` (o `DomainError.js`)**:
   - Clase base para todos los errores personalizados del sistema (`ValidationError` 400, `ForbiddenDomainError` 403, `NotFoundError` 404, `ConflictError` 409).
   - Debe poseer las propiedades: `statusCode`, `status` (ej. `"error"`), `message` y `timestamp` (`new Date().toISOString()`).
2. **`src/middlewares/notFoundHandler.js`** (3 parámetros: `req, res, next`):
   - Ejecuta `next(new NotFoundError(\`Ruta \${req.originalUrl} no encontrada\`))`.
3. **`src/middlewares/errorLogger.js`** (4 parámetros: `err, req, res, next`):
   - Hace `console.error` con `{ timestamp, method: req.method, path: req.originalUrl, error: { name: err.name, message: err.message, stack: err.stack } }` y llama a `next(err)`.
4. **`src/middlewares/errorHandler.js`** (4 parámetros: `err, req, res, next`):
   - Si `res.headersSent` es `true`, retorna `next(err)`.
   - Si `err instanceof AppError` (o `DomainError`), responde con `res.status(err.statusCode).json({ status: err.status, message: err.message, timestamp: err.timestamp })`.
   - Caso contrario, responde con código `500` y `{ status: "error", message: "Error interno del servidor", timestamp: new Date().toISOString() }`.
5. **`src/controllers/`**:
   - Todo método de controlador debe tener la firma `async (req, res, next)` con bloque `try / catch`.
   - En caso de éxito responde `{ status: "success", data: ... }`. En el `catch (error)` ejecuta siempre `return next(error)`.
   - Incluir soporte para `POST /seed` para recargar los datos iniciales en memoria.

### Reglas estrictas por capa:
1. **`src/schemas/`**:
   - Contiene los esquemas de `zod` para validar `req.body`, `req.query` y `req.params`, junto con un middleware genérico `validateRequest`.
   - Solo valida formato y tipos de datos sintácticos. Nunca consulta repositorios ni ejecuta reglas de negocio.
2. **`src/routers/`**:
   - Define las rutas de Express, inyecta el middleware de validación de `schemas` y delega la ejecución al `Controller`.
   - Prohibido escribir lógica de negocio o manejo directo de `req`/`res` dentro del router.
3. **`src/controllers/`**:
   - Extrae los datos ya validados de `req`, invoca al método correspondiente del `Service` y formatea la respuesta HTTP (`res.status(...).json(...)`).
   - No contiene bloques `if` de reglas de negocio ni instancia clases de dominio. Captura errores y los delega mediante `next(err)` al middleware global de errores.
4. **`src/services/`**:
   - Orquesta los casos de uso: recupera instancias desde los `Repositories`, invoca los métodos de comportamiento del `Dominio` y guarda los cambios en memoria.
   - Prohibido escribir lógica de cálculo de totales, descuento manual de cupos o validación de transiciones de estado fuera de las entidades de dominio.
5. **`src/repositories/`**:
   - Administra el almacenamiento en memoria (`Map<string, Entidad>`).
   - Provee métodos de búsqueda, filtrado, ordenamiento e inicialización de datos de prueba (`DataSeeder`).
6. **`src/domain/`**:
   - Modelo de dominio rico orientado a objetos.
   - Cero dependencias de Express, Zod o librerías externas.
   - Toda validación de negocio (cupos, estados de compra, permisos de chat, fechas de cancelación, requisitos de reseña) vive dentro de los métodos de las clases de dominio y lanza subclases de `DomainError`.

## 3. Reglas del Modelo de Dominio
- **`Evento`**: Contiene `id`, `nombre`, `descripcion`, `categoria` (`Categoria`), `fecha` (`Date`), `tiposEntrada` (`TipoEntrada[]`), `multimedia` (` string[]`) y `organizador` (`Usuario`). Debe implementar `tuPrecioEstaEntre(min, max)`, `obtenerPrecioMinimo()`, `obtenerTipoEntrada(id)` y `yaOcurrio()`.
- **`TipoEntrada`**: Contiene `id`, `nombre`, `descripcion`, `precio`, `cupo`. Debe implementar `hayCupoPara(cantidad)`, `descontarCupo(cantidad)` y `restituirCupo(cantidad)`.
- **`Compra`**: Contiene `id`, `comprador` (`Usuario`), `evento` (`Evento`), `tipoEntrada` (`TipoEntrada`), `cantidad`, `total`, `estado` (`EstadoCompra`), `mensajes` (`Mensaje[]`) y `cambiosEstado` (`CambioEstadoCompra[]`).
  - Al instanciarse una compra, valida y descuenta el cupo a través de `tipoEntrada.descontarCupo(cantidad)`, calcula `total = tipoEntrada.precio * cantidad` y registra su estado inicial en `cambiosEstado`.
  - Implementa `actualizarEstado(nuevoEstado, quien)`, `cancelar(quien)` (solo si `estado !== 'UTILIZADA'` y el evento aún no ocurrió, restituyendo el cupo y pasando a reembolsada/cancelada), `calcularDiasParaElEvento()` (solo si `estado === 'CONFIRMADA'`) y `agregarMensaje(usuario, texto)`.
- **`EstadoCompra`**: Enumeración con los valores `'PENDIENTE'`, `'CONFIRMADA'`, `'UTILIZADA'`, `'CANCELADA'`, `'REEMBOLSADA'`.
- **`Resenia`**: Contiene `id`, `comprador` (`Usuario`), `evento` (`Evento`), `detalle` y `puntuacion` (1 a 5).




## 4. Reglas de Testing Unitario (Jest) y E2E
- **División por Entidad y Capa**: Prohibido agrupar todos los tests en un único archivo. Crear un archivo por entidad y capa:
  - Dominio (`tests/domain/`): `UsuarioDomain.test.js`, `CategoriaDomain.test.js`, `TipoEntradaDomain.test.js`, `EventoDomain.test.js`, `CompraDomain.test.js`, `ReseniaDomain.test.js`.
  - Repositorios (`tests/repositories/`): `<Entidad>Repository.test.js`.
  - Servicios (`tests/services/`): `<Entidad>Service.test.js` (usando Mock Objects con `jest.fn()` inyectados por constructor y verificando llamadas con `toHaveBeenCalledWith`).
  - Controladores (`tests/controllers/`): `<Entidad>Controller.test.js` (mockeando el Service y verificando `res.status().json()` o `next(error)`).
- **Patrón Triple A Obligatorio**: Todo test en Jest debe incluir explícitamente los comentarios `// Arrange`, `// Act` y `// Assert`.
- **Preparación E2E**: Seguir `// 1. PREPARAR`, `// 2. ACTUAR`, `// 3. VERIFICAR`, priorizando selectores accesibles (`getByRole`, `getByLabel`, `getByText`, `getByTestId`) y prohibiendo esperas fijas (`waitForTimeout`).

## 5. Convenciones de Trabajo para el Agente
- Antes de crear o modificar archivos, verifica a qué capa pertenece el cambio.
- No generes código de múltiples capas en un único paso a menos que se te solicite explícitamente.
- Mantén métodos cortos, nombres en español para el dominio de negocio (fiel al diagrama de la cátedra) y código limpio fácil de explicar en una defensa técnica.