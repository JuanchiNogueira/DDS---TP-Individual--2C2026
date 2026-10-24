import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../src/app.js';

describe('HTTP Endpoints Integration Tests', () => {
  let server;
  let baseUrl;

  beforeAll((done) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('GET /health debe retornar 200 con status success', async () => {
    // Arrange
    const url = `${baseUrl}/health`;

    // Act
    const res = await fetch(url);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'success', data: { ok: true } });
  });

  test('POST /seed debe recargar los datos y retornar 201', async () => {
    // Arrange
    const url = `${baseUrl}/seed`;

    // Act
    const res = await fetch(url, { method: 'POST' });
    const body = await res.json();

    // Assert
    expect(res.status).toBe(201);
    expect(body.status).toBe('success');
    expect(body.data).toBeDefined();
  });

  test('GET /api-docs.json debe responder 200 con openapi: 3.0.0', async () => {
    // Arrange
    const url = `${baseUrl}/api-docs.json`;

    // Act
    const res = await fetch(url);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.openapi).toBe('3.0.0');
    expect(body.info).toBeDefined();
    expect(body.paths).toBeDefined();
  });

  test('GET /eventos debe retornar los eventos sembrados serializados sin error circular', async () => {
    // Arrange
    const url = `${baseUrl}/eventos`;

    // Act
    const res = await fetch(url);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /compras/comprador/:compradorId debe retornar compras con historialEstados serializado sin error circular', async () => {
    // Arrange
    const url = `${baseUrl}/compras/comprador/usr-comp-1`;

    // Act
    const res = await fetch(url);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].historialEstados[0].compraId).toBeDefined();
  });

  test('GET /ruta-inexistente debe retornar 404 capturado por notFoundHandler y errorHandler', async () => {
    // Arrange
    const url = `${baseUrl}/ruta-inexistente`;

    // Act
    const res = await fetch(url);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(body.status).toBe('error');
    expect(body.message).toContain('no encontrada');
  });
});
