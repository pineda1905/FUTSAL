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
// 2. OPCIONES DE CARGA Y UMBRALES (Módulo: Reservas)
// ---------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Rampa 0 -> 50 VUs en 30 segundos
    { duration: '30s', target: 100 }, // Rampa 50 -> 100 VUs en 30 segundos
    { duration: '2m',  target: 100 }, // Carga sostenida de 100 VUs durante 2 minutos
    { duration: '30s', target: 0 },   // Bajada controlada 100 -> 0 VUs en 30 segundos
  ],
  thresholds: {
    // Percentil 95 del tiempo de respuesta inferior a 500 ms
    http_req_duration: ['p(95)<500'],
    // Tasa de solicitudes fallidas menor al 1% (< 0.01)
    http_req_failed: ['rate<0.01'],
  },
};

// ---------------------------------------------------------------------------
// 3. SETUP: Autenticación única y obtención dinámica de ID de reserva
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

  // Consultar reservas activas existentes para capturar un ID dinámico de prueba
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
// 4. FLUJO DE USUARIO VIRTUAL (VU): 100% Solo Lectura del Módulo de Reservas
// ---------------------------------------------------------------------------
export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // 1. Consulta del listado de reservas activas (agenda / dashboard)
  const resListado = http.get(`${BASE_URL}/api/Reservas`, { headers });
  check(resListado, {
    'GET /api/Reservas status es 200': (r) => r.status === 200,
  });

  // 2. Consulta de detalle de reserva por ID (si existe en base de datos)
  if (data.reservaId) {
    const resDetalle = http.get(`${BASE_URL}/api/Reservas/${data.reservaId}`, { headers });
    check(resDetalle, {
      'GET /api/Reservas/{id} status es 200': (r) => r.status === 200,
    });
  }

  // Pausa de usuario representativa entre ciclos de consulta (think time)
  sleep(1);
}
