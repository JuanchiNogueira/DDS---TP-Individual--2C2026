import { test, expect } from '@playwright/test';

/**
 * Suite E2E Automatizada con Playwright para AI Ticket It
 * Simula flujo mobile completo según las especificaciones de la Etapa 5B.
 */

test.beforeEach(async ({ request, page }) => {
  // Garantizar que cada test arranque con los mismos datos en memoria
  const response = await request.post('http://localhost:3000/seed');
  expect(response.ok()).toBeTruthy();

  // Abrir la aplicación móvil en el navegador
  await page.goto('/');

  // Si arranca en la Landing/Login Page, ingresar al catálogo con el usuario comprador por defecto
  const btnLogin = page.getByTestId('btn-iniciar-sesion');
  if (await btnLogin.isVisible()) {
    await btnLogin.click();
  }
});

test('Test 1: Camino Feliz - Búsqueda y Compra de Entrada', async ({ page }) => {
  // 1. PREPARAR
  // Esperar a que el catálogo cargue y buscar el evento futuro "Cosquín Rock"
  const inputBusqueda = page.getByTestId('input-buscar-evento');
  await expect(inputBusqueda).toBeVisible();
  await inputBusqueda.fill('Cosquín');

  const eventoCard = page.getByTestId('evento-card-evt-1');
  await expect(eventoCard).toBeVisible();

  // 2. ACTUAR
  // Ingresar al detalle del evento
  const btnDetalle = page.getByTestId('btn-ver-detalle-evt-1');
  await expect(btnDetalle).toBeVisible();
  await btnDetalle.click();

  // Verificar que se carga el detalle y se muestran las reseñas anteriores del organizador
  await expect(page.getByTestId('detalle-evento-titulo')).toHaveText('Cosquín Rock 2027');
  await expect(page.getByTestId('lista-resenias-organizador')).toBeVisible();

  // Seleccionar tipo de entrada "VIP Experiencia" (tipo-2)
  const tipoEntrada = page.getByTestId('tipo-entrada-tipo-2');
  await expect(tipoEntrada).toBeVisible();
  await tipoEntrada.click();

  // Ingresar cantidad de 2 entradas
  const inputCantidad = page.getByTestId('input-cantidad-entradas');
  await expect(inputCantidad).toBeVisible();
  await inputCantidad.fill('2');

  // Verificar que el cálculo total se actualiza ($20000 * 2 = $40000)
  await expect(page.getByTestId('detalle-compra-total')).toContainText('$40000');

  // Confirmar compra
  const btnComprar = page.getByTestId('btn-comprar-entradas');
  await expect(btnComprar).toBeVisible();
  await btnComprar.click();

  // Verificar alerta de éxito y navegar a Mis Compras
  const alertaExito = page.getByTestId('alerta-exito-compra');
  await expect(alertaExito).toBeVisible();

  const btnIrACompras = page.getByTestId('btn-ir-a-mis-compras');
  await expect(btnIrACompras).toBeVisible();
  await btnIrACompras.click();

  // 3. VERIFICAR
  // Verificar que el listado de Mis Compras se visualiza
  const listaCompras = page.getByTestId('lista-mis-compras');
  await expect(listaCompras).toBeVisible();

  // Verificar que la nueva compra aparece con monto $40000 y en estado CONFIRMADA
  await expect(page.getByText('$40000')).toBeVisible();
  await expect(page.getByText('CONFIRMADA')).toBeVisible();

  // Verificar que se muestra destacadamente cuántos días faltan para el evento
  await expect(page.getByText(/Faltan \d+ días para el evento/i)).toBeVisible();
});

test('Test 2: Camino Triste - Intento de compra superando el cupo disponible', async ({ page }) => {
  // 1. PREPARAR
  // Ingresar al detalle del evento futuro Cosquín Rock
  const btnDetalle = page.getByTestId('btn-ver-detalle-evt-1');
  await expect(btnDetalle).toBeVisible();
  await btnDetalle.click();

  await expect(page.getByTestId('detalle-evento-titulo')).toBeVisible();

  // 2. ACTUAR
  // Seleccionar tipo de entrada e intentar comprar una cantidad exorbitante (9999)
  const tipoEntrada = page.getByTestId('tipo-entrada-tipo-1');
  await expect(tipoEntrada).toBeVisible();
  await tipoEntrada.click();

  const inputCantidad = page.getByTestId('input-cantidad-entradas');
  await expect(inputCantidad).toBeVisible();
  await inputCantidad.fill('9999');

  const btnComprar = page.getByTestId('btn-comprar-entradas');
  await expect(btnComprar).toBeVisible();
  await btnComprar.click();

  // 3. VERIFICAR
  // Verificar que aparece el contenedor de alerta de error informando falta de cupo
  const alertaError = page.getByTestId('alerta-error-compra');
  await expect(alertaError).toBeVisible();
  await expect(alertaError).toContainText(/No hay cupo suficiente/i);

  // Verificar que no se generó alerta de éxito
  await expect(page.getByTestId('alerta-exito-compra')).not.toBeVisible();

  // Navegar a Mis Compras y comprobar que no existe ninguna compra por 9999 entradas
  await page.getByTestId('btn-menu-hamburguesa').click();
  await page.getByTestId('nav-mis-compras').click();
  await expect(page.getByTestId('lista-mis-compras')).toBeVisible();
  await expect(page.getByText('x 9999')).not.toBeVisible();
});

test('Test 3: Camino Feliz - Cancelación de compra y reembolso', async ({ page }) => {
  // 1. PREPARAR
  // Cerrar sesión e ingresar con el comprador Lucas Fernández (usr-comp-2), quien posee una compra confirmada de "Toc Toc"
  await page.getByTestId('btn-menu-hamburguesa').click();
  await page.getByTestId('btn-header-landing').click();
  const opcionLucas = page.getByTestId('demo-usr-comp-2');
  await expect(opcionLucas).toBeVisible();
  await opcionLucas.click();
  await page.getByTestId('btn-iniciar-sesion').click();

  // Navegar a Mis Compras mediante el menú hamburguesa
  await page.getByTestId('btn-menu-hamburguesa').click();
  await page.getByTestId('nav-mis-compras').click();

  // Verificar que la compra de Toc Toc está visible y en estado CONFIRMADA
  const cardCompra = page.getByTestId('compra-card-compra-confirmada-1');
  await expect(cardCompra).toBeVisible();
  await expect(page.getByTestId('compra-estado-compra-confirmada-1')).toHaveText('CONFIRMADA');

  const btnCancelar = page.getByTestId('btn-cancelar-compra-compra-confirmada-1');
  await expect(btnCancelar).toBeVisible();

  // 2. ACTUAR
  // Ejecutar cancelación y reembolso
  await btnCancelar.click();

  // 3. VERIFICAR
  // Verificar que se muestra el mensaje de éxito de cancelación y cupo restituido
  const alertaExito = page.getByTestId('alerta-exito-mis-compras');
  await expect(alertaExito).toBeVisible();
  await expect(alertaExito).toContainText(/Compra cancelada y reembolsada/i);

  // Verificar que el estado cambió a CANCELADA en la tarjeta
  await expect(page.getByTestId('compra-estado-compra-confirmada-1')).toHaveText('CANCELADA');

  // Verificar que el botón de cancelar ya no está disponible para esa compra
  await expect(page.getByTestId('btn-cancelar-compra-compra-confirmada-1')).not.toBeVisible();
});

test('Test 4: Flujo Cruzado - Chat Comprador/Organizador y Calificación de entrada UTILIZADA', async ({ page }) => {
  // 1. PREPARAR
  // Cerrar sesión e ingresar con el comprador Lucas Fernández (usr-comp-2)
  await page.getByTestId('btn-menu-hamburguesa').click();
  await page.getByTestId('btn-header-landing').click();
  const opcionLucas = page.getByTestId('demo-usr-comp-2');
  await expect(opcionLucas).toBeVisible();
  await opcionLucas.click();
  await page.getByTestId('btn-iniciar-sesion').click();

  // Navegar a Mis Compras
  await page.getByTestId('btn-menu-hamburguesa').click();
  await page.getByTestId('nav-mis-compras').click();
  const cardCompraConfirmada = page.getByTestId('compra-card-compra-confirmada-1');
  await expect(cardCompraConfirmada).toBeVisible();

  // 2. ACTUAR
  // Paso A: Comprador abre el chat y envía una consulta
  const btnChatComprador = page.getByTestId('btn-chat-compra-compra-confirmada-1');
  await expect(btnChatComprador).toBeVisible();
  await btnChatComprador.click();

  const inputChat = page.getByTestId('input-mensaje-chat');
  await expect(inputChat).toBeVisible();
  const mensajePregunta = '¿A qué hora se permite el ingreso a la sala de teatro?';
  await inputChat.fill(mensajePregunta);

  const btnEnviar = page.getByTestId('btn-enviar-mensaje');
  await btnEnviar.dispatchEvent('click');

  // Verificar que el mensaje enviado se muestra en el chat y cerrar modal
  await expect(page.getByText(mensajePregunta)).toBeVisible();
  await page.getByTestId('btn-cerrar-chat').last().dispatchEvent('click');
  await expect(page.getByTestId('input-mensaje-chat')).not.toBeVisible();

  // Paso B: Cerrar sesión e ingresar como el organizador de "Toc Toc" (usr-org-2: Teatro Gran Rex)
  await page.getByTestId('btn-menu-hamburguesa').click();
  await page.getByTestId('btn-header-landing').click();
  const opcionOrg = page.getByTestId('demo-usr-org-2');
  await expect(opcionOrg).toBeVisible();
  await opcionOrg.click();
  await page.getByTestId('btn-iniciar-sesion').click();

  // Entrar a "Ver Compras y Cupos" del evento Toc Toc
  const btnVerCompras = page.getByTestId('btn-ver-compras-evento-evt-2');
  await expect(btnVerCompras).toBeVisible();
  await btnVerCompras.click();

  // Verificar cupos disponibles por tipo de entrada
  await expect(page.getByTestId('cupo-disponible-tipo-tipo-3')).toBeVisible();
  await expect(page.getByTestId('cupo-disponible-tipo-tipo-4')).toBeVisible();

  // Abrir chat de la compra desde la perspectiva del organizador
  const btnChatOrg = page.getByTestId('btn-org-chat-compra-compra-confirmada-1');
  await expect(btnChatOrg).toBeVisible();
  await btnChatOrg.click();

  // Verificar que la consulta del comprador está presente y responderla
  await expect(page.getByText(mensajePregunta)).toBeVisible();
  const respuestaOrg = 'Las puertas abren 30 minutos antes del inicio de la función.';
  await page.getByTestId('input-mensaje-chat').fill(respuestaOrg);
  const btnEnviarOrg = page.getByTestId('btn-enviar-mensaje');
  await btnEnviarOrg.dispatchEvent('click');
  await expect(page.getByText(respuestaOrg)).toBeVisible();
  await page.getByTestId('btn-cerrar-chat').last().dispatchEvent('click');
  await expect(page.getByTestId('input-mensaje-chat')).not.toBeVisible();

  // Paso C: Cerrar sesión y volver a ingresar como el comprador Lucas Fernández (usr-comp-2)
  await page.getByTestId('btn-menu-hamburguesa').click();
  await page.getByTestId('btn-header-landing').click();
  await page.getByTestId('demo-usr-comp-2').click();
  await page.getByTestId('btn-iniciar-sesion').click();

  await page.getByTestId('btn-menu-hamburguesa').click();
  await page.getByTestId('nav-mis-compras').click();

  // Localizar la compra en estado UTILIZADA sin reseñar (compra-utilizada-sin-resenia)
  const cardUtilizada = page.getByTestId('compra-card-compra-utilizada-sin-resenia');
  await expect(cardUtilizada).toBeVisible();
  await expect(page.getByTestId('compra-estado-compra-utilizada-sin-resenia')).toHaveText('UTILIZADA');

  const btnCalificar = page.getByTestId('btn-calificar-compra-compra-utilizada-sin-resenia');
  await expect(btnCalificar).toBeVisible();
  await btnCalificar.click();

  // En modal de reseña: seleccionar 5 estrellas y escribir comentario
  const btnEstrella5 = page.getByTestId('btn-puntuacion-5');
  await expect(btnEstrella5).toBeVisible();
  await btnEstrella5.dispatchEvent('click');

  const inputComentario = page.getByTestId('input-comentario-resenia');
  await expect(inputComentario).toBeVisible();
  await inputComentario.fill('¡Un show cómico brillante y excelente atención!');

  const btnEnviarResenia = page.getByTestId('btn-enviar-resenia');
  await expect(btnEnviarResenia).toBeVisible();
  await btnEnviarResenia.click();

  // 3. VERIFICAR
  // Verificar mensaje de éxito al publicar la reseña
  const alertaExitoResenia = page.getByTestId('alerta-exito-mis-compras');
  await expect(alertaExitoResenia).toBeVisible();
  await expect(alertaExitoResenia).toContainText(/Reseña publicada con éxito/i);
});

test('Test 5: Flujo de Landing Page e Inicio de Sesión Inteligente', async ({ page }) => {
  // 1. PREPARAR
  // Navegar a la Landing Page desde el botón de cerrar sesión en el menú hamburguesa
  await page.getByTestId('btn-menu-hamburguesa').click();
  const btnNavLanding = page.getByTestId('btn-header-landing');
  await expect(btnNavLanding).toBeVisible();
  await btnNavLanding.click();

  // Verificar elementos clave de la Landing Page
  const inputLoginId = page.getByTestId('input-login-id');
  await expect(inputLoginId).toBeVisible();
  await expect(page.getByText('Tus mejores experiencias')).toBeVisible();

  // 2. ACTUAR
  // Seleccionar la píldora de Organizador "Charly Producciones" (usr-org-1)
  const pillOrg = page.getByTestId('demo-usr-org-1');
  await expect(pillOrg).toBeVisible();
  await pillOrg.click();

  // Verificar que el banner reactivo detecta el rol Organizador
  await expect(page.getByText(/Rol detectado: Organizador/i)).toBeVisible();

  // Confirmar inicio de sesión
  const btnIngresar = page.getByTestId('btn-iniciar-sesion');
  await expect(btnIngresar).toBeVisible();
  await btnIngresar.click();

  // 3. VERIFICAR
  // El sistema debió redirigir automáticamente al panel del Organizador
  await expect(page.getByText('ORGANIZADOR', { exact: true })).toBeVisible();
  await page.getByTestId('btn-menu-hamburguesa').click();
  await expect(page.getByTestId('nav-org-eventos')).toBeVisible();
});
