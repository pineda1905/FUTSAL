import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardReservas from './pages/DashboardReservas';
import GestionTorneos from './pages/GestionTorneos';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de Login */}
        <Route path="/login" element={<Login />} />

        {/* Ruta protegida del Dashboard de Reservas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardReservas />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida de Gestión de Torneos (requiere JWT) */}
        <Route
          path="/torneos"
          element={
            <ProtectedRoute>
              <GestionTorneos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-torneos"
          element={<Navigate to="/torneos" replace />}
        />
        <Route
          path="/dashboard/torneos"
          element={<Navigate to="/torneos" replace />}
        />

        {/* Redirección por defecto a /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Captura de rutas no encontradas */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
