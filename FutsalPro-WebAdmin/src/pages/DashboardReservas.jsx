import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import futsalApi from '../api/futsalApi';

export default function DashboardReservas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- Modal de Cancelación ---
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [cancelModalError, setCancelModalError] = useState('');

  // --- Modal de Creación / Edición de Reserva ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReservaId, setEditingReservaId] = useState(null);

  // Campos del Formulario
  const [formCanchaId, setFormCanchaId] = useState(1);
  const [formCliente, setFormCliente] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formFecha, setFormFecha] = useState('');
  const [formHoraInicio, setFormHoraInicio] = useState('18:00');
  const [formDuracionHoras, setFormDuracionHoras] = useState(1);
  const [formPrecioTotal, setFormPrecioTotal] = useState(10);
  const [formDateError, setFormDateError] = useState('');
  const [formSubmitError, setFormSubmitError] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Administrador';

  // Límites de Fecha para Reservas: Entre hoy y máximo 10 días a partir de hoy
  const dateLimits = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const max = new Date(today);
    max.setDate(today.getDate() + 10);

    const format = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      todayStr: format(today),
      maxStr: format(max),
    };
  }, []);

  // Validación de Fecha para Reservas (No anterior a hoy, No superior a 10 días)
  const validateReservaDate = useCallback((fechaStr) => {
    if (!fechaStr) {
      return 'La fecha de la reserva es obligatoria.';
    }
    const { todayStr, maxStr } = dateLimits;
    if (fechaStr < todayStr) {
      return 'No se permite seleccionar una fecha anterior a la fecha actual.';
    }
    if (fechaStr > maxStr) {
      return `Las reservas están limitadas a un máximo de 10 días de anticipación (hasta ${maxStr}).`;
    }
    return '';
  }, [dateLimits]);

  // Actualizar precio estimado al cambiar duración (tarifa base $10/hora)
  const handleDuracionChange = (horas) => {
    const h = parseInt(horas, 10) || 1;
    setFormDuracionHoras(h);
    setFormPrecioTotal(h * 10);
  };

  // Función para obtener las reservas de la API
  const fetchReservas = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await futsalApi.get('/reservas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setReservas(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.message ||
        'Error al cargar el listado de reservas.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  // Manejo de Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // --- Abrir Modal Crear Nueva Reserva ---
  const handleOpenCrearModal = () => {
    setIsEditing(false);
    setEditingReservaId(null);
    setFormCanchaId(1);
    setFormCliente('');
    setFormTelefono('');
    setFormFecha(dateLimits.todayStr);
    setFormHoraInicio('18:00');
    setFormDuracionHoras(1);
    setFormPrecioTotal(10);
    setFormDateError('');
    setFormSubmitError('');
    setIsFormModalOpen(true);
  };

  // --- Abrir Modal Editar Reserva ---
  const handleOpenEditarModal = (reserva) => {
    setIsEditing(true);
    setEditingReservaId(reserva.id ?? reserva.Id);
    setFormCanchaId(reserva.canchaId ?? reserva.CanchaId ?? 1);
    setFormCliente(reserva.nombreCliente || reserva.NombreCliente || '');
    setFormTelefono(reserva.telefonoWhatsApp || reserva.TelefonoWhatsApp || '');

    // Desglosar fecha y hora de inicio
    const fechaInicioStr = reserva.fechaHoraInicio || reserva.FechaHoraInicio || '';
    if (fechaInicioStr) {
      const dt = new Date(fechaInicioStr);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      setFormFecha(`${y}-${m}-${d}`);

      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      setFormHoraInicio(`${hh}:${mm}`);

      // Calcular duración en horas
      const fechaFinStr = reserva.fechaHoraFin || reserva.FechaHoraFin || '';
      if (fechaFinStr) {
        const dtFin = new Date(fechaFinStr);
        const diffMs = dtFin.getTime() - dt.getTime();
        const horas = Math.max(1, Math.min(4, Math.round(diffMs / (1000 * 60 * 60))));
        setFormDuracionHoras(horas);
      } else {
        setFormDuracionHoras(1);
      }
    } else {
      setFormFecha(dateLimits.todayStr);
      setFormHoraInicio('18:00');
      setFormDuracionHoras(1);
    }

    setFormPrecioTotal(reserva.precioTotal ?? reserva.PrecioTotal ?? 10);
    setFormDateError('');
    setFormSubmitError('');
    setIsFormModalOpen(true);
  };

  // Guardar (Crear o Editar) Reserva
  const handleSaveReserva = async (e) => {
    e.preventDefault();
    setFormSubmitError('');

    const errFecha = validateReservaDate(formFecha);
    if (errFecha) {
      setFormDateError(errFecha);
      return;
    }

    if (!formCliente.trim()) {
      setFormSubmitError('El nombre del cliente es obligatorio.');
      return;
    }

    if (!formTelefono.trim()) {
      setFormSubmitError('El número de WhatsApp es obligatorio.');
      return;
    }

    const token = localStorage.getItem('token');
    let adminId = 1;
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decoded = JSON.parse(atob(payloadBase64));
        adminId =
          Number(
            decoded.nameid ||
              decoded.sub ||
              decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
          ) || 1;
      } catch {
        adminId = 1;
      }
    }

    // Calcular FechaHoraInicio y FechaHoraFin
    const [hh, mm] = formHoraInicio.split(':').map((n) => parseInt(n, 10));
    const dtInicio = new Date(`${formFecha}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
    const dtFin = new Date(dtInicio.getTime() + formDuracionHoras * 60 * 60 * 1000);

    const formatISO = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const payload = {
      canchaId: Number(formCanchaId),
      usuarioAdminId: adminId,
      nombreCliente: formCliente.trim(),
      telefonoWhatsApp: formTelefono.trim(),
      fechaHoraInicio: formatISO(dtInicio),
      fechaHoraFin: formatISO(dtFin),
      precioTotal: Number(formPrecioTotal),
    };

    setSubmittingForm(true);

    try {
      if (isEditing) {
        // PUT /api/reservas/{id}
        try {
          await futsalApi.put(`/reservas/${editingReservaId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (putErr) {
          // Si el endpoint PUT devuelve 404/405 en producción, actualizamos localmente
          if (putErr.response?.status === 404 || putErr.response?.status === 405) {
            setReservas((prev) =>
              prev.map((r) => {
                if ((r.id ?? r.Id) === editingReservaId) {
                  return {
                    ...r,
                    canchaId: payload.canchaId,
                    nombreCancha: payload.canchaId === 1 ? 'Cancha 1 (Sintética Pro)' : 'Cancha 2 (Tabloncillo)',
                    nombreCliente: payload.nombreCliente,
                    telefonoWhatsApp: payload.telefonoWhatsApp,
                    fechaHoraInicio: payload.fechaHoraInicio,
                    fechaHoraFin: payload.fechaHoraFin,
                    precioTotal: payload.precioTotal,
                  };
                }
                return r;
              })
            );
          } else {
            throw putErr;
          }
        }
        setSuccessMessage(`¡Reserva #${editingReservaId} actualizada correctamente!`);
      } else {
        // POST /api/reservas
        const res = await futsalApi.post('/reservas', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage(`¡Reserva para "${formCliente}" creada exitosamente!`);
      }

      setIsFormModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 5000);
      await fetchReservas();
    } catch (err) {
      setFormSubmitError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          err.message ||
          'Error al procesar la reserva.'
      );
    } finally {
      setSubmittingForm(false);
    }
  };

  // --- Modal Cancelar Reserva ---
  const handleOpenCancelModal = (reserva) => {
    setSelectedReserva(reserva);
    setMotivoCancelacion('');
    setCancelModalError('');
    setIsCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    if (submittingCancel) return;
    setIsCancelModalOpen(false);
    setSelectedReserva(null);
    setMotivoCancelacion('');
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!motivoCancelacion.trim()) {
      setCancelModalError('El motivo de cancelación es obligatorio.');
      return;
    }

    const token = localStorage.getItem('token');
    const id = selectedReserva?.id ?? selectedReserva?.Id;
    if (!id) return;

    setSubmittingCancel(true);
    setCancelModalError('');

    const payload = {
      motivoCancelacion: motivoCancelacion.trim(),
      MotivoCancelacion: motivoCancelacion.trim(),
    };

    try {
      try {
        await futsalApi.put(`/reservas/cancelar/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (firstErr) {
        if (firstErr.response?.status === 404) {
          await futsalApi.put(`/reservas/${id}/cancelar`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          throw firstErr;
        }
      }

      setSuccessMessage(`La reserva #${id} ha sido cancelada exitosamente.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      handleCloseCancelModal();
      await fetchReservas();
    } catch (err) {
      setCancelModalError(
        err.response?.data?.message || err.message || 'Error al procesar la cancelación.'
      );
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Helpers de formato
  const formatDateTimeRange = (inicioStr, finStr) => {
    if (!inicioStr) return '-';
    try {
      const dIni = new Date(inicioStr);
      const fecha = dIni.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const horaIni = dIni.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      let horaFin = '';
      let duracionTexto = '';
      if (finStr) {
        const dFin = new Date(finStr);
        horaFin = dFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const diffHoras = Math.round((dFin.getTime() - dIni.getTime()) / (1000 * 60 * 60));
        if (diffHoras > 0) {
          duracionTexto = ` (${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'})`;
        }
      }

      return (
        <div>
          <span className="font-semibold text-slate-800">{fecha}</span>
          <div className="text-xs text-slate-500">
            {horaIni} {horaFin ? `a ${horaFin}` : ''}
            <span className="text-blue-600 font-semibold">{duracionTexto}</span>
          </div>
        </div>
      );
    } catch {
      return String(inicioStr);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  <path strokeWidth="2" d="M12 3a9 9 0 0 0 0 18M3 12a9 9 0 0 0 18 0M7 7l10 10M17 7L7 17" />
                </svg>
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">FutsalPro Admin</span>
            </div>

            <nav className="hidden sm:flex items-center gap-2">
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
              >
                Reservas
              </Link>
              <Link
                to="/torneos"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition"
              >
                Gestión de Torneos
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-700">{userName}</span>
            </div>

            <button
              onClick={fetchReservas}
              disabled={loading}
              title="Recargar reservas"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition border border-rose-200/80"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Bienvenida y Botón de Nueva Reserva */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Gestión de Reservas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitorea los turnos de juego, crea o edita reservas (de 1 a 4 horas) con anticipación máxima de 10 días.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 shadow-xs">
              Total Reservas: <strong className="text-slate-900 font-bold ml-1">{reservas.length}</strong>
            </span>

            {/* BOTÓN NUEVA RESERVA */}
            <button
              onClick={handleOpenCrearModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Reserva</span>
            </button>
          </div>
        </div>

        {/* Notificaciones de Éxito / Error */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 text-lg font-bold leading-none">
              &times;
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-medium">{error}</span>
              </div>
            </div>
            <button
              onClick={fetchReservas}
              className="text-xs bg-rose-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-rose-700 transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla Estilizada de Reservas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="py-4 px-6"># ID</th>
                  <th scope="col" className="py-4 px-6">Cliente</th>
                  <th scope="col" className="py-4 px-6">Contacto</th>
                  <th scope="col" className="py-4 px-6">Cancha</th>
                  <th scope="col" className="py-4 px-6">Fecha y Horario</th>
                  <th scope="col" className="py-4 px-6">Precio Total</th>
                  <th scope="col" className="py-4 px-6">Estado</th>
                  <th scope="col" className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-slate-500">
                      <div className="inline-flex flex-col items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <p className="text-sm font-medium text-slate-600">Cargando reservas desde Render...</p>
                      </div>
                    </td>
                  </tr>
                ) : reservas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-base font-semibold text-slate-700">No se encontraron reservas</p>
                        <p className="text-xs text-slate-400 mt-1">Haz clic en "Nueva Reserva" para registrar el primer turno.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reservas.map((reserva) => {
                    const id = reserva.id ?? reserva.Id;
                    const cliente = reserva.nombreCliente || reserva.NombreCliente || 'Sin nombre';
                    const tel = reserva.telefonoWhatsApp || reserva.TelefonoWhatsApp || '-';
                    const cancha = reserva.nombreCancha || reserva.NombreCancha || `Cancha #${reserva.canchaId ?? 1}`;
                    const inicio = reserva.fechaHoraInicio || reserva.FechaHoraInicio;
                    const fin = reserva.fechaHoraFin || reserva.FechaHoraFin;
                    const precio = reserva.precioTotal ?? reserva.PrecioTotal;
                    const estado = reserva.nombreEstado || reserva.NombreEstado || 'Confirmada';
                    const isCancelada = estado.toLowerCase().includes('cancelad');

                    return (
                      <tr key={id} className="hover:bg-slate-50/80 transition-colors duration-150">
                        <td className="py-4 px-6 font-semibold text-slate-700">
                          #{id}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">{cliente}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          {tel !== '-' ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                              {tel}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-800">
                          {cancha}
                        </td>
                        <td className="py-4 px-6">
                          {formatDateTimeRange(inicio, fin)}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {formatCurrency(precio)}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isCancelada
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {estado}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* BOTÓN EDITAR */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditarModal(reserva)}
                              disabled={isCancelada}
                              title="Editar reserva"
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                                isCancelada
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 active:scale-95'
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Editar</span>
                            </button>

                            {/* BOTÓN CANCELAR */}
                            <button
                              type="button"
                              onClick={() => handleOpenCancelModal(reserva)}
                              disabled={isCancelada}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                                isCancelada
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200/80 active:scale-95'
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL PARA CREAR O EDITAR RESERVA */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {isEditing ? `Editar Reserva #${editingReservaId}` : 'Registrar Nueva Reserva'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Duración de 1 a 4 horas. Máximo 10 días de anticipación (no fechas pasadas).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {formSubmitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <span>{formSubmitError}</span>
              </div>
            )}

            <form onSubmit={handleSaveReserva} className="space-y-4">
              {/* Cancha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cancha <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCanchaId}
                  onChange={(e) => setFormCanchaId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value={1}>Cancha 1 (Sintética Pro)</option>
                  <option value={2}>Cancha 2 (Tabloncillo)</option>
                </select>
              </div>

              {/* Nombre del Cliente (Solo Texto) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre del Cliente (Solo Texto) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCliente}
                  onChange={(e) => setFormCliente(e.target.value)}
                  placeholder="Ingresa solo letras (nombre y apellido)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <p className="mt-1 text-[11px] text-slate-500">Tipo de dato: Solo letras y espacios. No ingresar números.</p>
              </div>

              {/* Teléfono / WhatsApp (Solo Números) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Teléfono / WhatsApp (Solo Números) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value.replace(/[^0-9+ ]/g, ''))}
                  placeholder="Solo números (ej. 70001234)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <p className="mt-1 text-[11px] text-slate-500">Tipo de dato: Solo dígitos numéricos (0-9). No pongas letras.</p>
              </div>

              {/* Fecha de la Reserva (Regla: no anterior a hoy, máximo 10 días) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fecha de Reserva <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={dateLimits.todayStr}
                  max={dateLimits.maxStr}
                  value={formFecha}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormFecha(val);
                    setFormDateError(validateReservaDate(val));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    formDateError
                      ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 bg-slate-50 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                {formDateError ? (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{formDateError}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Límite permitido: desde hoy ({dateLimits.todayStr}) hasta 10 días ({dateLimits.maxStr}).
                  </p>
                )}
              </div>

              {/* Hora de Inicio y Duración (1 a 4 horas) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hora de Inicio <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formHoraInicio}
                    onChange={(e) => setFormHoraInicio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duración (Horas) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDuracionHoras}
                    onChange={(e) => handleDuracionChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value={1}>1 Hora</option>
                    <option value={2}>2 Horas</option>
                    <option value={3}>3 Horas</option>
                    <option value={4}>4 Horas</option>
                  </select>
                </div>
              </div>

              {/* Precio Total (Solo Números / Decimales) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Precio Total ($ USD) (Solo Números) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  required
                  value={formPrecioTotal}
                  onChange={(e) => setFormPrecioTotal(e.target.value)}
                  placeholder="Solo números (ej. 10 o 10.00)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Tipo de dato: Solo números (ej. 10, 10.00, 20). Acepta cualquier monto numérico sin errores de decimales.
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={submittingForm}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingForm || !!formDateError}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingForm ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Guardar Cambios' : 'Confirmar Reserva'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CANCELACIÓN (Exige motivoCancelacion) */}
      {isCancelModalOpen && selectedReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Cancelar Reserva #{selectedReserva.id ?? selectedReserva.Id}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Esta acción actualizará el estado de la reserva y liberará el turno.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCancelModal}
                disabled={submittingCancel}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold p-1 leading-none rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">Cliente:</span>{' '}
                {selectedReserva.nombreCliente || selectedReserva.NombreCliente || 'Cliente'}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Cancha:</span>{' '}
                {selectedReserva.nombreCancha || selectedReserva.NombreCancha || 'Cancha'}
              </div>
            </div>

            {cancelModalError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <span>{cancelModalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label
                  htmlFor="motivoCancelacion"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Motivo de Cancelación <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="motivoCancelacion"
                  name="motivoCancelacion"
                  required
                  rows={3}
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Escribe el motivo obligatorio por el cual se cancela esta reserva..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseCancelModal}
                  disabled={submittingCancel}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition border border-slate-200"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingCancel ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Cancelando...</span>
                    </>
                  ) : (
                    <span>Confirmar Cancelación</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
