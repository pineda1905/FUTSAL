import http from 'k6/http';
import { check, sleep } from 'k6';

// ---------------------------------------------------------------------------
// 1. VALIDACIÓN DE SEGURIDAD OBLIGATORIA
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:62974';

if (!BASE_URL.includes('localhost') && !BASE_URL.includes('127.0.0.1')) {
  throw new Error(
    `[SEGURIDAD ABORTADA] La URL configurada '${BASE_URL}' no está permitida. ` +
    `Por políticas del proyecto FutsalPro, está estrictamente prohibido ejecutar pruebas de rendimiento contra Render o MonsterASP. ` +
    `Solo se permite ejecutar pruebas contra 'localhost' o '127.0.0.1'.`
  );
}

// ---------------------------------------------------------------------------
// 2. OPCIONES DE ESTRÉS: Búsqueda del Punto de Quiebre (Breaking Point)
// ---------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Rampa a 100 VUs
    { duration: '1m', target: 100 },  // Mantener 100 VUs
    { duration: '1m', target: 300 },  // Rampa a 300 VUs
    { duration: '1m', target: 300 },  // Mantener 300 VUs
    { duration: '1m', target: 600 },  // Rampa a 600 VUs
    { duration: '1m', target: 600 },  // Mantener 600 VUs
    { duration: '1m', target: 1000 }, // Rampa a 1000 VUs (límite superior de estrés)
    { duration: '1m', target: 1000 }, // Mantener 1000 VUs
    { duration: '1m', target: 0 },    // Bajada controlada a 0 VUs
  ],
  thresholds: {
    // Umbrales de alerta temprana para detectar degradación progresiva
    http_req_duration: ['p(95)<2000'], // Alerta si p95 supera los 2 segundos
    http_req_failed: ['rate<0.05'],    // Alerta si la tasa de fallos supera el 5%
  },
};

// ---------------------------------------------------------------------------
// 3. SETUP: Autenticación única y captura de ID de reserva
// ---------------------------------------------------------------------------
export function setup() {
  const email = __ENV.AUTH_EMAIL;
  const password = __ENV.AUTH_PASSWORD;

  if (!email || !password) {
    throw new Error(
      '[CONFIGURACIÓN FALTANTE] Debes proporcionar las credenciales mediante variables de entorno:\n' +
      '  k6 run -e AUTH_EMAIL="tu_correo@futsalpro.com" -e AUTH_PASSWORD="tu_password" stress_test.js'
    );
  }

  // Login ejecutado una sola vez al inicio
  const loginPayload = JSON.stringify({ email: email, password: password });
  const loginParams = { headers: { 'Content-Type': 'application/json' } };
  const loginRes = http.post(`${BASE_URL}/api/Auth/login`, loginPayload, loginParams);

  if (loginRes.status !== 200) {
    throw new Error(`[SETUP ERROR] Login falló con código ${loginRes.status}: ${loginRes.body}`);
  }

  const token = loginRes.json('token');
  if (!token) {
    throw new Error('[SETUP ERROR] La respuesta de login no devolvió un token JWT válido.');
  }

  // Obtener un ID de reserva de la base de datos para pruebas de lectura individual
  const reservasRes = http.get(`${BASE_URL}/api/Reservas`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let reservaId = null;
  if (reservasRes.status === 200) {
    const reservas = reservasRes.json();
    if (Array.isArray(reservas) && reservas.length > 0) {
      reservaId = reservas[0].id;
    }
  }

  return { token: token, reservaId: reservaId };
}

// ---------------------------------------------------------------------------
// 4. FLUJO DE ESTRÉS: Lectura intensiva bajo alta concurrencia
// ---------------------------------------------------------------------------
export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // 1. Lectura del catálogo de reservas activas
  const resListado = http.get(`${BASE_URL}/api/Reservas`, { headers });
  check(resListado, {
    'GET /api/Reservas status es 200': (r) => r.status === 200,
  });

  // 2. Lectura directa por ID
  if (data.reservaId) {
    const resDetalle = http.get(`${BASE_URL}/api/Reservas/${data.reservaId}`, { headers });
    check(resDetalle, {
      'GET /api/Reservas/{id} status es 200': (r) => r.status === 200,
    });
  }

  // Pausa reducida en estrés (0.5s) para maximizar la presión sobre el servidor y EF Core
  sleep(0.5);
}
