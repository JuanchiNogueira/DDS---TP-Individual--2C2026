# 🎟️ AI Ticket It — Plataforma de Publicación de Eventos y Venta de Entradas

**Universidad Tecnológica Nacional — Facultad Regional Buenos Aires (UTN FRBA)**  
**Cátedra:** Desarrollo de Software — Trabajo Práctico Individual (2C 2026)

---

## 📋 Tabla de Contenidos
1. [Descripción General del Proyecto](#1-descripción-general-del-proyecto)
2. [Topología del Sistema y Clasificación Arquitectónica](#2-topología-del-sistema-y-clasificación-arquitectónica)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitectura y Justificación del Módulo Back-End](#4-arquitectura-y-justificación-del-módulo-back-end)
   - [4.1. División en Capas y Flujo Unidireccional](#41-división-en-capas-y-flujo-unidireccional)
   - [4.2. Decisiones del Modelo de Dominio Rico](#42-decisiones-del-modelo-de-dominio-rico)
   - [4.3. Tratamiento Centralizado de Errores y Pipeline en Express](#43-tratamiento-centralizado-de-errores-y-pipeline-en-express)
   - [4.4. Persistencia en Memoria, DataSeeder y Documentación OpenAPI](#44-persistencia-en-memoria-dataseeder-y-documentación-openapi)
5. [Arquitectura y Justificación del Módulo Front-End](#5-arquitectura-y-justificación-del-módulo-front-end)
   - [5.1. Comunicación Cliente-Servidor y Resolución Dinámica de Red](#51-comunicación-cliente-servidor-y-resolución-dinámica-de-red)
   - [5.2. Gestión de Sesión Reactiva](#52-gestión-de-sesión-reactiva)
   - [5.3. Organización de Pantallas y Cobertura de Casos de Uso](#53-organización-de-pantallas-y-cobertura-de-casos-de-uso)
6. [Estrategia de Aseguramiento de Calidad y Testing](#6-estrategia-de-aseguramiento-de-calidad-y-testing)
   - [6.1. Pruebas Unitarias y de Integración con Jest](#61-pruebas-unitarias-y-de-integración-con-jest)
   - [6.2. Pruebas End-to-End (E2E) Automatizadas con Playwright](#62-pruebas-end-to-end-e2e-automatizadas-con-playwright)
7. [Estructura del Repositorio](#7-estructura-del-repositorio)
8. [Instrucciones de Ejecución y Pruebas](#8-instrucciones-de-ejecución-y-pruebas)

---

## 1. Descripción General del Proyecto

**AI Ticket It** es una plataforma integral orientada a conectar organizadores de espectáculos en vivo con compradores de entradas. El sistema permite a los organizadores publicar eventos definiendo múltiples categorías de entradas con precios y cupos independientes, auditar el estado de las ventas en tiempo real, controlar la disponibilidad remanente y comunicarse con los asistentes. A su vez, permite a los compradores explorar el catálogo mediante filtros y criterios de ordenamiento, adquirir entradas con validación atómica de cupo, visualizar los días restantes para eventos confirmados, solicitar cancelaciones con restitución automática de stock, chatear con el organizador y calificar la experiencia una vez utilizada la entrada.

---

## 2. Topología del Sistema y Clasificación Arquitectónica

El diseño del sistema responde a tres definiciones arquitectónicas principales:

* **Arquitectura Cliente-Servidor Distribuida con Back-End Monolítico Modular:** El procesamiento se reparte en dos nodos independientes comunicados mediante el protocolo HTTP: un cliente mobile (Front-End) encargado de la interacción con el usuario y un servidor de aplicación (Back-End) que centraliza la lógica de negocio y el almacenamiento de datos en memoria dentro de un único proceso de Node.js.
* **Patrón de Renderizado CSR (*Client-Side Rendering*):** El servidor Express opera exclusivamente como una API RESTful agnóstica de la interfaz gráfica, intercambiando estructuras de datos en formato JSON (`{ status: 'success', data }` o `{ status: 'error', message }`). El procesamiento visual, las transiciones entre vistas y la construcción del árbol de componentes se ejecutan íntegramente en el dispositivo cliente.
* **Naturaleza del Cliente (*Rich Client* Multiplataforma y SPA en Entorno Web):**
  * **En Dispositivos Móviles (Android / iOS):** Construido con **React Native (Expo)**, actúa como un **Cliente Rico (*Thick Client*) Multiplataforma con Renderizado Nativo**. A diferencia de las aplicaciones híbridas clásicas basadas en *WebView*, React Native traduce los componentes de React a controles nativos del sistema operativo móvil.
  * **En Navegador Web (`react-native-web`):** Compila como una **SPA (*Single Page Application*)**, gestionando la navegación mediante estados reactivos en memoria sin recargar el documento HTML, lo que habilita la ejecución de pruebas End-to-End automatizadas sobre un *viewport* móvil.

---

## 3. Stack Tecnológico

| Módulo / Área | Tecnologías y Herramientas |
| :--- | :--- |
| **Back-End** | Node.js (ES Modules), Express.js, CORS, Dotenv |
| **Validación de Contratos HTTP** | Zod (`zod`) |
| **Persistencia** | Almacenamiento en memoria (`Map`) con semilla determinística (`DataSeeder`) |
| **Documentación de API** | Swagger UI Express (`swagger-ui-express`) bajo especificación OpenAPI 3.0.0 |
| **Front-End Mobile & Web** | React Native, Expo, React Native Web (`react-native-web`) |
| **Testing Unitario e Integración** | Jest (`jest` con soporte de cobertura `--coverage` y *Mock Objects*) |
| **Testing End-to-End (E2E)** | Playwright (`@playwright/test`) sobre emulación de dispositivo móvil |
| **Contenerización** | Docker & Docker Compose (Módulo Back-End) |

---

## 4. Arquitectura y Justificación del Módulo Back-End

### 4.1. División en Capas y Flujo Unidireccional

El Back-End implementa una arquitectura en **6 capas con flujo de dependencias estrictamente unidireccional**:

```text
Request -> Routes -> Schemas (Zod) -> Controllers -> Services -> Repositories -> Domain
```

| Capa | Directorio | Responsabilidad Técnica | Justificación de Diseño |
| :--- | :--- | :--- | :--- |
| **1. Rutas (*Routers*)** | `src/routes/` | Define los endpoints REST, inyecta el middleware `validateRequest` y delega en el controlador correspondiente. | Desacopla el mapeo de URLs de la lógica de control. Incluye `/api-docs` y `/seed` dentro de `router.js` para mantener inalterado el pipeline de `app.js`. |
| **2. Esquemas (*Schemas*)** | `src/schemas/` | Valida sintácticamente `req.body`, `req.query` y `req.params` mediante esquemas **Zod**. | Al operar con persistencia en memoria sin esquemas de base de datos, actúa como barrera de validación de contratos de entrada (DTOs) y coerción de tipos numéricos y fechas. |
| **3. Controladores** | `src/controllers/` | Extrae los datos validados de `req`, invoca al `Service` y formatea la respuesta HTTP (`200`/`201`) o delega excepciones a `next(error)`. | Mantiene controladores delgados sin condicionales de negocio. Recibe el servicio por constructor para facilitar pruebas unitarias aisladas. |
| **4. Servicios** | `src/services/` | Orquesta los casos de uso recuperando entidades de los repositorios, invocando métodos del dominio y guardando cambios. | Recibe los repositorios mediante **inyección de dependencias en el constructor**, permitiendo inyectar *Mock Objects* en Jest sin depender del estado en memoria real. |
| **5. Repositorios** | `src/repositories/` | Administra las colecciones en memoria (`Map<id, Entidad>`) y provee métodos de búsqueda, filtrado y limpieza. | Aísla el mecanismo de persistencia. Si se reemplazara la memoria RAM por un motor SQL o NoSQL, las capas de Servicio y Dominio no requerirían modificaciones. |
| **6. Dominio** | `src/domain/` | Clases puras orientadas a objetos que encapsulan el estado y las reglas e invariantes de negocio. | Evita el antipatrón de *Modelo de Dominio Anémico*, garantizando que ninguna entidad entre en un estado inconsistente. |

### 4.2. Decisiones del Modelo de Dominio Rico

* **Control Atómico de Cupos (`TipoEntrada.js` y `Compra.js`):** `TipoEntrada` encapsula los métodos `hayCupoPara(cantidad)`, `descontarCupo(cantidad)` y `restituirCupo(cantidad)`, preservando además `cupoInicial`. Al instanciarse una `Compra`, el constructor verifica la disponibilidad y descuenta el cupo directamente sobre la instancia de `TipoEntrada` (lanzando `ConflictError` 409 si supera el stock disponible) y calcula `this.total = cantidad * tipoEntrada.precio`.
* **Auditoría de Estados y Prevención de Referencias Circulares (`CambioEstadoCompra.js`):** Cada modificación de estado en `Compra` (`PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`) registra una instancia de `CambioEstadoCompra` en `historialEstados` con la referencia a la compra, el estado destino, el usuario responsable (`quien`), la fecha/hora y el motivo. Para evitar el fallo `TypeError: Converting circular structure to JSON` al serializar `Compra` en Express, `CambioEstadoCompra` implementa el método `toJSON()`, reemplazando la referencia recursiva al objeto `Compra` por su identificador `compraId: this.compra?.id ?? null`.
* **Reglas Temporales y de Cancelación (`Compra.js` y `Evento.js`):**
  * `calcularDiasFaltantes(fechaReferencia)`: Verifica que la compra se encuentre estrictamente en estado `CONFIRMADA` y retorna la diferencia en días enteros respecto a la fecha del evento.
  * `cancelar(quien, fechaReferencia)`: Valida que la compra no haya sido `UTILIZADA` ni cancelada previamente y comprueba mediante `evento.yaPaso(fechaReferencia)` que el espectáculo aún no haya ocurrido. Al cancelar, ejecuta `this.tipoEntrada.restituirCupo(this.cantidad)` y registra la transición de estado.
* **Control de Permisos en Mensajería (`Compra.js` y `Mensaje.js`):** El método `agregarMensaje(usuario, texto)` verifica que el autor del mensaje coincida con `this.comprador.id` o con `this.evento.organizador.id`. Si un tercero intenta enviar un mensaje, el dominio rechaza la operación con `ForbiddenDomainError` (403).
* **Emisión Condicionada de Calificaciones (`Resenia.js`):** Además de validar el rango numérico de puntuación (1 a 5), el método de fábrica estático `Resenia.crearDesdeCompra(compra, datos)` exige que la compra asociada esté en estado `EstadoCompra.UTILIZADA`, lanzando `ConflictError` (409) si se intenta calificar una compra pendiente, confirmada o cancelada.

### 4.3. Tratamiento Centralizado de Errores y Pipeline en Express

El manejo de errores sigue una arquitectura centralizada inspirada en `@ControllerAdvice` de Spring Boot, estructurada en `src/app.js` bajo el siguiente orden de registro y ejecución:

```javascript
app.use(express.json());      // 1. Parsea el body JSON (3 parámetros)
app.use(cors());              // 2. Agrega cabeceras CORS (3 parámetros)
app.use(router);              // 3. Ejecuta las rutas de la API y validación Zod (3 parámetros)
app.use(notFoundHandler);     // 4. Captura rutas inexistentes y dispara NotFoundError (3 parámetros)
app.use(errorLogger);         // 5. Registra el diagnóstico del error en consola (4 parámetros)
app.use(errorHandler);        // 6. Formatea y devuelve la respuesta HTTP al cliente (4 parámetros)
```

1. **Jerarquía `DomainError` / `AppError` (`src/domain/errors/DomainError.js`):** Clase base que extiende `Error` agregando `statusCode`, `status: 'error'`, `message` y `timestamp` (ISO 8601). De ella heredan `ValidationError` (`400`), `ForbiddenDomainError` (`403`), `NotFoundError` (`404`) y `ConflictError` (`409`).
2. **Validación Sintáctica Integrada (`src/middlewares/validateRequest.js`):** Si Zod detecta errores de formato o tipos en `body`, `query` o `params`, construye un mensaje detallado por campo y delega el fallo invocando `next(new ValidationError(mensajeDetallado))`.
3. **Diferenciación de Middlewares de 3 y 4 Parámetros:** Cuando cualquier controlador (`catch (error) { return next(error); }`), `validateRequest` o `notFoundHandler` invoca `next(err)` con un argumento, Express saltea todos los middlewares normales de 3 parámetros y transfiere el control al primer manejador de errores de 4 parámetros (`errorLogger` y posteriormente `errorHandler`). Si el error es instancia de `DomainError`, `errorHandler` responde con su `statusCode` específico; ante excepciones no controladas, responde con código `500` (`Error interno del servidor`).

### 4.4. Persistencia en Memoria, `DataSeeder` y Documentación OpenAPI

* **Semilla Determinística (`DataSeeder.js`) y Swagger (`swagger.js`):** La función `seedDatabase()` se ejecuta al iniciar `app.js` y a través del endpoint `POST /seed`. Los datos iniciales utilizan identificadores fijos y legibles (`usr-comp-1`, `usr-org-1`, `evt-1`, `compra-confirmada-1`, `compra-utilizada-sin-resenia`) sincronizados con los valores `example` de `/api-docs`, permitiendo probar todos los casos de uso desde Swagger UI con un clic. Las entidades creadas posteriormente mediante peticiones `POST` generan identificadores dinámicos con `crypto.randomUUID()`.

---

## 5. Arquitectura y Justificación del Módulo Front-End

### 5.1. Comunicación Cliente-Servidor y Resolución Dinámica de Red

El cliente HTTP centralizado (`frontend/src/api/apiClient.js`) resuelve automáticamente la dirección del Back-End mediante `getBaseUrl()` según el entorno de ejecución:
1. Prioriza la variable de entorno `EXPO_PUBLIC_API_URL` si está definida.
2. En navegador Web (`react-native-web`), utiliza `window.location.hostname` apuntando al puerto `3000`.
3. En dispositivo móvil físico o emulador mediante Expo Go, extrae dinámicamente la IP LAN del host de desarrollo a partir de `NativeModules.SourceCode.scriptURL`.
4. Utiliza `http://localhost:3000` como valor de respaldo (*fallback*).

Asimismo, `apiFetch` serializa objetos de parámetros a *query strings*, desempaqueta automáticamente el nodo `data` en respuestas exitosas (`{ status: 'success', data }`) y convierte los errores estructurados del `errorHandler` del Back-End en excepciones con el mensaje de negocio exacto para su visualización en alertas.

### 5.2. Gestión de Sesión Reactiva

Dado que la entidad `Usuario` del dominio no requiere autenticación por contraseña (`id`, `nombre`, `apellido`, `favoritos`), `SessionContext.js` provee un gestor de sesión en memoria que consulta `GET /usuarios` al iniciar, selecciona por defecto al comprador `usr-comp-1` (Ana Gómez) y permite:
* Cambiar de usuario activo desde la barra superior (`HeaderBar.js`).
* Alternar entre `Modo Comprador` y `Modo Organizador` (seleccionando automáticamente un usuario del rol correspondiente).
* Ejecutar `reiniciarDatos()` (`POST /seed`), incrementando la clave reactiva `refreshKey` para forzar la actualización inmediata de todas las pantallas.

### 5.3. Organización de Pantallas y Cobertura de Casos de Uso

| Pantalla / Componente | Rol | Casos de Uso Implementados |
| :--- | :--- | :--- |
| **`HeaderBar.js`** | Ambos | Selector modal de usuario activo, cambio de modo (`COMPRADOR` / `ORGANIZADOR`), navegación por pestañas y botón de reinicio de datos semilla (`POST /seed`). |
| **`CatalogoScreen.js`** | Comprador | Búsqueda textual con *debounce* (250 ms), filtro por categorías (`GET /categorias`), ordenamiento por **precio**, **fecha** y **puntaje del organizador** (`asc`/`desc`), y alternancia de eventos favoritos (`POST /usuarios/:id/favoritos`). |
| **`DetalleEventoScreen.js`** | Comprador | Visualización del detalle del evento (`GET /eventos/:id`), puntaje promedio e **historial de reseñas de eventos anteriores del organizador**, selección de `TipoEntrada` con cupo en vivo y compra validada (`POST /compras`). |
| **`MisComprasScreen.js`** | Comprador | Listado de compras del comprador diferenciando estados con badges de colores, indicador destacado de **días faltantes para el evento** en compras `CONFIRMADA`, botón de **cancelación y reembolso** (`POST /compras/:id/cancelar`) y acceso a Chat y Calificación. |
| **`OrganizadorEventosScreen.js`** | Organizador | Listado de eventos propios, panel de **cupos disponibles por cada `TipoEntrada`**, listado de compras asociadas filtradas por estado (`GET /eventos/:eventoId/compras`), respuesta al chat y acción para marcar entradas como `UTILIZADA` (`PATCH /compras/:id/estado`). |
| **`CrearEventoScreen.js`** | Organizador | Publicación de nuevos eventos (`POST /eventos`) con carga dinámica de múltiples `TipoEntrada` (nombre, descripción, precio y cupo). |
| **`ChatCompraModal.js`** | Ambos | Canal de mensajería bidireccional dentro de cada compra (`POST /compras/:id/mensajes`) para consultas y respuestas en cualquier momento. |
| **`ReseniaModal.js`** | Comprador | Calificación numérica (1 a 5 estrellas) y comentario escrito (`POST /resenias`) habilitada exclusivamente para compras en estado `UTILIZADA`. |

---

## 6. Estrategia de Aseguramiento de Calidad y Testing

### 6.1. Pruebas Unitarias y de Integración con Jest

Las pruebas del Back-End (`backend/tests/`) se dividieron en suites independientes por entidad y por capa (24 suites / 146 tests):

* **División Modular por Capa:**
  * `tests/domain/`: `CategoriaDomain.test.js`, `UsuarioDomain.test.js`, `TipoEntradaDomain.test.js`, `EventoDomain.test.js`, `CompraDomain.test.js`, `ReseniaDomain.test.js`.
  * `tests/repositories/`: `CategoriaRepository.test.js`, `UsuarioRepository.test.js`, `EventoRepository.test.js`, `CompraRepository.test.js`, `ReseniaRepository.test.js`, `DataSeeder.test.js`.
  * `tests/services/`: `EventoService.test.js`, `CompraService.test.js`, `ReseniaService.test.js`, `UsuarioService.test.js`.
  * `tests/controllers/`: `EventoController.test.js`, `CompraController.test.js`, `ReseniaController.test.js`, `UsuarioController.test.js`, `SeedController.test.js`, `HttpIntegration.test.js`.
  * `tests/middlewares/`: `ErrorMiddlewares.test.js`, `ValidateRequest.test.js`.
* **Patrón Triple A (`Arrange - Act - Assert`):** Todos los tests estructuran explícitamente la preparación del escenario (`// Arrange`), la ejecución del método (`// Act`) y la verificación de aserciones (`// Assert`).
* **Aislamiento mediante *Mock Objects*:** En las pruebas de `Services` y `Controllers`, las dependencias inferiores se reemplazan por objetos simulados (`jest.fn().mockReturnValue(...)`) inyectados por constructor, verificando los argumentos de invocación con `toHaveBeenCalledWith`.

### 6.2. Pruebas End-to-End (E2E) Automatizadas con Playwright

Los tests E2E validan la integración completa entre el Front-End en React Native, la API REST en Express y la persistencia en memoria sobre un *viewport* móvil:

* **Consistencia de Datos (`POST /seed`):** En el hook `beforeEach`, cada prueba reinicia la base de datos en memoria para garantizar corridas determinísticas e independientes.
* **Estructura de Historia de Usuario (`1. PREPARAR -> 2. ACTUAR -> 3. VERIFICAR`):** Cubre tanto los caminos críticos felices (búsqueda, compra exitosa con verificación de días faltantes, cancelación con restitución de cupo, chat cruzado Comprador/Organizador y emisión de reseña tras uso de entrada) como los casos borde (rechazo por sobrecupo con visualización de alerta de error).
* **Selectores Semánticos y Cero *Flaky Tests*:** Los componentes de React Native incorporan `accessibilityRole`, `accessibilityLabel` y `testID`, permitiendo seleccionar elementos por su rol y significado visual (`getByRole`, `getByLabel`, `getByText`, `getByTestId`) y utilizando esperas con reintento automático (`await expect(...).toBeVisible()`) sin recurrir a pausas fijas (`waitForTimeout`).

---

## 7. Estructura del Repositorio

```text
├── AGENTS.md                        # Reglas de arquitectura, errores y testing para el agente IA
├── docker-compose.yml               # Orquestación del contenedor Docker para el Back-End
├── backend/
│   ├── Dockerfile                   # Imagen Node 20 Alpine del servidor Back-End
│   ├── package.json
│   ├── src/
│   │   ├── app.js                   # Configuración de Express y cadena de middlewares
│   │   ├── server.js                # Punto de entrada HTTP (0.0.0.0:3000)
│   │   ├── docs/swagger.js          # Especificación interactiva OpenAPI 3.0.0
│   │   ├── domain/                  # Entidades de dominio rico y jerarquía DomainError
│   │   ├── repositories/            # Repositorios en memoria (Map) y DataSeeder.js
│   │   ├── services/                # Orquestadores de casos de uso con DI
│   │   ├── controllers/             # Controladores HTTP (try/catch -> next(error))
│   │   ├── schemas/                 # Esquemas de validación Zod
│   │   ├── middlewares/             # validateRequest, notFoundHandler, errorLogger, errorHandler
│   │   └── routes/                  # Routers modulares y router.js principal
│   └── tests/                       # Suites unitarias y de integración en Jest por capa
└── frontend/
    ├── App.js                       # Orquestador principal de pantallas y SessionProvider
    ├── package.json
    └── src/
        ├── api/apiClient.js         # Cliente HTTP con resolución dinámica de host
        ├── context/SessionContext.js# Estado global de sesión, rol activo y reinicio de seed
        ├── components/              # HeaderBar, ChatCompraModal, ReseniaModal
        └── screens/                 # Catalogo, DetalleEvento, MisCompras, OrganizadorEventos, CrearEvento
```

---

## 8. Instrucciones de Ejecución y Pruebas

### A. Instalación Inicial de Dependencias

Para poder ejecutar la aplicación y la suite completa de pruebas E2E, instale las dependencias en los tres niveles del proyecto:

```bash
# 1. En la raíz del repositorio (Playwright y dependencias E2E)
npm install

# 2. En el módulo Back-End
cd backend && npm install

# 3. En el módulo Front-End
cd ../frontend && npm install
cd ..
```

> [!NOTE]
> **Protocolo HTTP en Entorno de Desarrollo:**  
> Los servidores de desarrollo locales operan sobre HTTP plano sin certificados SSL. Al acceder desde el navegador web, asegúrese de ingresar explícitamente con `http://` en lugar de `https://` (ej. `http://localhost:8081` para el Front-End y `http://localhost:3000/api-docs` para Swagger) para evitar bloqueos por advertencias de seguridad o políticas HSTS del navegador.

---

### B. Ejecutar el Módulo Back-End

**Opción 1 — Con Docker Compose (desde la raíz):**
```bash
docker compose up --build
```

**Opción 2 — Ejecución local con Node.js:**
```bash
cd backend
npm start
```
* **Servidor API:** `http://localhost:3000`
* **Documentación Interactiva Swagger UI:** `http://localhost:3000/api-docs`
* **Reinicio de datos semilla en memoria:** `POST http://localhost:3000/seed`

---

### C. Ejecutar las Pruebas Unitarias y Cobertura (Jest)

Las pruebas unitarias y de integración del Back-End pueden ejecutarse directamente desde la raíz o dentro del directorio `backend/`:

```bash
# Desde la raíz:
npm run test:backend

# O dentro de backend/:
cd backend
npm test
npm run test:coverage
```

---

### D. Ejecutar el Módulo Front-End (React Native / Expo)

```bash
cd frontend
npx expo start --web
```
* **Acceso en Navegador Web:** `http://localhost:8081`
* Para interactuar en dispositivos móviles, ejecutar `npx expo start` y presionar `a` para emulador Android, o escanear el código QR con la aplicación **Expo Go** en un dispositivo físico.

---

### E. Ejecutar las Pruebas End-to-End (Playwright)

> [!TIP]
> `playwright.config.js` cuenta con `webServer` automatizado: si los servicios no están corriendo previamente, Playwright iniciará automáticamente el Back-End Express (puerto 3000) y el Front-End Expo Web (puerto 8081) antes de ejecutar los tests.

Desde la raíz del repositorio:

```bash
# Ejecución en modo headless
npm run test:e2e

# Ejecución con navegador visible (headed)
npm run test:e2e:headed

# Ejecución interactiva con UI de Playwright
npm run test:e2e:ui

# Visualizar el reporte HTML de la última ejecución
npx playwright show-report
```
