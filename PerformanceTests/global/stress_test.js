import http from 'k6/http';
import { check, sleep } from 'k6';

// ---------------------------------------------------------------------------
// 1. VALIDACIÓN DE SEGURIDAD OBLIGATORIA
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:62974';

if (!BASE_URL.includes('localhost') && !BASE_URL.includes('127.0.0.1')) {
  throw new Error(
    `[SEGURIDAD ABORTADA] La URL configurada '${BASE_URL}' no está permitida. ` +
    `Por políticas del proyecto, está estrictamente prohibido ejecutar pruebas de rendimiento contra Render o MonsterASP. ` +
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
    // Umbrales informativos para documentar degradación progresiva
    http_req_duration: ['p(95)<2000'], // Alerta si p95 supera los 2 segundos
    http_req_failed: ['rate<0.05'],    // Alerta si los fallos superan el 5%
  },
};

// ---------------------------------------------------------------------------
// 3. SETUP: Autenticación única y obtención dinámica de ID de torneo
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

  // Obtener dinámicamente un ID de torneo para polling
  const torneosRes = http.get(`${BASE_URL}/api/Torneos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let torneoId = null;
  if (torneosRes.status === 200) {
    const torneos = torneosRes.json();
    if (Array.isArray(torneos) && torneos.length > 0) {
      torneoId = torneos[0].id;
    }
  }

  return { token: token, torneoId: torneoId };
}

// ---------------------------------------------------------------------------
// 4. FLUJO DE ESTRÉS: 100% Solo Lectura
// ---------------------------------------------------------------------------
export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // 1. Lectura de torneos
  const resTorneos = http.get(`${BASE_URL}/api/Torneos`, { headers });
  check(resTorneos, {
    'GET /api/Torneos status es 200': (r) => r.status === 200,
  });

  // 2. Polling de fixture / detalle de torneo
  if (data.torneoId) {
    const resFixture = http.get(`${BASE_URL}/api/Torneos/${data.torneoId}`, { headers });
    check(resFixture, {
      'GET /api/Torneos/{id} (fixture) status es 200': (r) => r.status === 200,
    });
    sleep(2);
  }

  // 3. Lectura de reservas
  const resReservas = http.get(`${BASE_URL}/api/Reservas`, { headers });
  check(resReservas, {
    'GET /api/Reservas status es 200': (r) => r.status === 200,
  });

  sleep(1);
}
