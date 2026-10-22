import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import futsalApi from '../api/futsalApi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Si ya existe sesión, redirigir automáticamente al dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // POST /api/auth/login
      const response = await futsalApi.post('/auth/login', {
        email: email.trim(),
        password: password,
      });

      const data = response.data;
      const token = data?.token || data?.Token || data?.jwt;

      if (!token) {
        throw new Error('No se recibió el token de autenticación en la respuesta.');
      }

      // Guardar token JWT en localStorage
      localStorage.setItem('token', token);
      if (data?.nombreUsuario || data?.NombreUsuario) {
        localStorage.setItem('userName', data.nombreUsuario || data.NombreUsuario);
      }
      if (data?.rol || data?.Rol) {
        localStorage.setItem('userRole', data.rol || data.Rol);
      }

      // Redirigir a /dashboard
      navigate('/dashboard');
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.detalle ||
        err.response?.data?.title ||
        (err.response?.status === 401 ? 'Credenciales incorrectas. Verifique su email y contraseña.' : null) ||
        (err.code === 'ERR_NETWORK' ? 'No se pudo conectar con el servidor. Verifique su conexión.' : null) ||
        err.message ||
        'Error inesperado al iniciar sesión.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Minimalista */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 sm:p-10">
          {/* Logo / Encabezado */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
                <path strokeWidth="2" d="M12 3a9 9 0 0 0 0 18M3 12a9 9 0 0 0 18 0M7 7l10 10M17 7L7 17" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              FutsalPro Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ingresa tus credenciales para acceder al panel
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@futsalpro.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-md shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Footer discreto */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            FutsalPro Management System &copy; 2026
          </div>
        </div>
      </div>
    </div>
  );
}
