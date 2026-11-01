import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

/**
 * Determina dinámicamente la URL base de la API:
 * 1. Variable de entorno EXPO_PUBLIC_API_URL si está configurada.
 * 2. En navegador Web: usa el mismo hostname donde se cargó la página en el puerto 3000.
 * 3. En Mobile (Expo Go / Emulador): extrae automáticamente la IP de la máquina host desde expo-constants o scriptURL.
 * 4. Fallback para Mobile con la IP local de desarrollo (192.168.0.7:3000).
 */
export function getBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 1. Navegador Web (Playwright, Chrome, Safari)
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
  }

  // 2. Dispositivo Móvil (Android / iOS) vía Expo Go
  // En Expo Go, hostUri contiene "IP_HOST:PUERTO_METRO" (ej. "192.168.0.7:8081")
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }

  // Respaldo mediante scriptURL
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL && typeof scriptURL === 'string') {
    const hostPart = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
    if (hostPart && hostPart !== 'localhost' && hostPart !== '127.0.0.1') {
      return `http://${hostPart}:3000`;
    }
  }

  // Respaldo para móvil en red LAN
  return 'http://192.168.0.7:3000';
}

/**
 * Realiza peticiones HTTP al Back-End AI Ticket It.
 * Desempaqueta 'data' en respuestas exitosas ({ status: 'success', data }).
 * Lanza Error(json.message || 'Error en la petición') ante fallas.
 */
export async function apiFetch(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (options.params && typeof options.params === 'object') {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    if (query) {
      path += (path.includes('?') ? '&' : '?') + query;
    }
  }

  const url = `${baseUrl}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    const error = new Error(
      `No se pudo conectar con el servidor en ${baseUrl}. Verificá que el backend esté ejecutándose en el puerto 3000.`
    );
    error.cause = err;
    throw error;
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    // Si la respuesta no contiene un body JSON válido
  }

  if (!response.ok) {
    const errorMessage = json?.message || `Error en la petición: ${response.status} ${response.statusText}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = json;
    throw error;
  }

  return json?.data !== undefined ? json.data : json;
}

export const apiClient = {
  get: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
  fetch: apiFetch,
  getBaseUrl
};

export default apiClient;
