import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para Tests End-to-End (E2E) - AI Ticket It
 * Simula dispositivo móvil (Pixel 5) contra Front-End Expo Web y Back-End Express.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: {
    timeout: 10000
  },
  // Ejecución secuencial para no colisionar con el estado en memoria compartido del backend
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:8081',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    ...devices['Pixel 5']
  },
  projects: [
    {
      name: 'Mobile Chrome (Pixel 5)',
      use: {
        ...devices['Pixel 5']
      }
    }
  ],
  webServer: [
    {
      command: 'node backend/src/server.js',
      url: 'http://localhost:3000/health',
      reuseExistingServer: true,
      timeout: 60000
    },
    {
      command: 'npx expo start --web --port 8081',
      cwd: './frontend',
      url: 'http://localhost:8081',
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
});
