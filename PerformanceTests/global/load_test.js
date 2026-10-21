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
// 2. OPCIONES DE CARGA Y UMBRALES
// ---------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Rampa 0 -> 50 VUs en 30 segundos
    { duration: '30s', target: 100 }, // Rampa 50 -> 100 VUs en 30 segundos
    { duration: '2m',  target: 100 }, // Carga sostenida de 100 VUs durante 2 minutos
    { duration: '30s', target: 0 },   // Bajada controlada 100 -> 0 VUs en 30 segundos
  ],
  thresholds: {
    // Percentil 95 de tiempo de respuesta inferior a 500 ms
    http_req_duration: ['p(95)<500'],
    // Tasa de solicitudes fallidas menor al 1%
    http_req_failed: ['rate<0.01'],
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
      '  k6 run -e AUTH_EMAIL="tu_correo@futsalpro.com" -e AUTH_PASSWORD="tu_password" load_test.js'
    );
  }

  // Login administrativo ejecutado UNA SOLA VEZ para toda la prueba
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

  // Obtener dinámicamente un ID de torneo para el escenario de polling
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
// 4. FLUJO DE USUARIO VIRTUAL (VU): 100% Solo Lectura
// ---------------------------------------------------------------------------
export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // 1. Lectura del catálogo de torneos
  const resTorneos = http.get(`${BASE_URL}/api/Torneos`, { headers });
  check(resTorneos, {
    'GET /api/Torneos status es 200': (r) => r.status === 200,
  });

  // 2. Escenario de Polling de fixture / detalle de torneo (como lo hace la App Móvil)
  if (data.torneoId) {
    const resFixture = http.get(`${BASE_URL}/api/Torneos/${data.torneoId}`, { headers });
    check(resFixture, {
      'GET /api/Torneos/{id} (fixture) status es 200': (r) => r.status === 200,
    });
    // Intervalo de polling: espera entre 2 y 3 segundos
    sleep(2.5);
  }

  // 3. Lectura de reservas activas
  const resReservas = http.get(`${BASE_URL}/api/Reservas`, { headers });
  check(resReservas, {
    'GET /api/Reservas status es 200': (r) => r.status === 200,
  });

  // Pausa de usuario entre ciclos de lectura
  sleep(1);
}
