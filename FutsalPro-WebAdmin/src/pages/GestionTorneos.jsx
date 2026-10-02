import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import futsalApi from '../api/futsalApi';

// Datos semilla oficiales basados en BDNUEVA.md (Copa Relámpago Apertura)
const SEED_TORNEOS = [
  {
    id: 1,
    nombre: 'Copa Relámpago Apertura',
    rangoEdad: '18 años en adelante',
    generoId: 1,
    estadoId: 1,
    fechaInicio: '2026-10-16T00:00:00',
    equipos: [
      { id: 1, nombreEquipo: 'Los Galácticos', nombreRepresentante: 'Mario Silva', fotoUrl: '⚽' },
      { id: 2, nombreEquipo: 'Sporting FC', nombreRepresentante: 'Daniel López', fotoUrl: '🦁' },
      { id: 3, nombreEquipo: 'Real Bañil', nombreRepresentante: 'Jorge Méndez', fotoUrl: '⚡' },
      { id: 4, nombreEquipo: 'Atlético Central', nombreRepresentante: 'Kevin Cruz', fotoUrl: '🦅' },
      { id: 5, nombreEquipo: 'Los Troncos', nombreRepresentante: 'Miguel Ángel', fotoUrl: '🛡️' },
      { id: 6, nombreEquipo: 'Deportivo Sur', nombreRepresentante: 'Hugo Sánchez', fotoUrl: '🔥' },
      { id: 7, nombreEquipo: 'La Selecta', nombreRepresentante: 'Raúl Díaz', fotoUrl: '⭐' },
    ],
    partidosTorneo: [
      {
        id: 1,
        torneoId: 1,
        fase: 'Cuartos de Final',
        equipoLocalId: 1,
        equipoVisitaId: 2,
        equipoLocal: { id: 1, nombreEquipo: 'Los Galácticos' },
        equipoVisita: { id: 2, nombreEquipo: 'Sporting FC' },
        golesLocal: 3,
        golesVisita: 2,
        ganadorId: 1,
      },
      {
        id: 2,
        torneoId: 1,
        fase: 'Cuartos de Final',
        equipoLocalId: 3,
        equipoVisitaId: 4,
        equipoLocal: { id: 3, nombreEquipo: 'Real Bañil' },
        equipoVisita: { id: 4, nombreEquipo: 'Atlético Central' },
        golesLocal: 4,
        golesVisita: 1,
        ganadorId: 3,
      },
      {
        id: 3,
        torneoId: 1,
        fase: 'Cuartos de Final',
        equipoLocalId: 5,
        equipoVisitaId: 6,
        equipoLocal: { id: 5, nombreEquipo: 'Los Troncos' },
        equipoVisita: { id: 6, nombreEquipo: 'Deportivo Sur' },
        golesLocal: null,
        golesVisita: null,
        ganadorId: null,
      },
      {
        id: 4,
        torneoId: 1,
        fase: 'Cuartos de Final',
        equipoLocalId: 7,
        equipoVisitaId: null,
        equipoLocal: { id: 7, nombreEquipo: 'La Selecta' },
        equipoVisita: null,
        golesLocal: null,
        golesVisita: null,
        ganadorId: 7,
      },
    ],
  },
  {
    id: 2,
    nombre: 'Torneo Clausura Test',
    rangoEdad: 'Libre (18-35)',
    generoId: 1,
    estadoId: 1,
    fechaInicio: '2026-10-20T00:00:00',
    equipos: [
      { id: 8, nombreEquipo: 'Equipo Alpha', nombreRepresentante: 'Capitán Alpha', fotoUrl: '⚡' },
      { id: 9, nombreEquipo: 'Equipo Beta', nombreRepresentante: 'Capitán Beta', fotoUrl: '🛡️' },
      { id: 10, nombreEquipo: 'Equipo Gamma', nombreRepresentante: 'Capitán Gamma', fotoUrl: '🔥' },
      { id: 11, nombreEquipo: 'Equipo Delta', nombreRepresentante: 'Capitán Delta', fotoUrl: '🦁' },
    ],
    partidosTorneo: [
      {
        id: 5,
        torneoId: 2,
        fase: 'Semifinal 1',
        equipoLocalId: 8,
        equipoVisitaId: 9,
        equipoLocal: { id: 8, nombreEquipo: 'Equipo Alpha' },
        equipoVisita: { id: 9, nombreEquipo: 'Equipo Beta' },
        golesLocal: null,
        golesVisita: null,
        ganadorId: null,
      },
      {
        id: 6,
        torneoId: 2,
        fase: 'Semifinal 2',
        equipoLocalId: 10,
        equipoVisitaId: 11,
        equipoLocal: { id: 10, nombreEquipo: 'Equipo Gamma' },
        equipoVisita: { id: 11, nombreEquipo: 'Equipo Delta' },
        golesLocal: null,
        golesVisita: null,
        ganadorId: null,
      },
    ],
  },
];

const STORAGE_KEY = 'futsalpro_torneos_db';

export default function GestionTorneos() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Administrador';

  // --- Estados de Torneos ---
  const [torneos, setTorneos] = useState([]);
  const [loadingTorneos, setLoadingTorneos] = useState(true);
  const [selectedTorneoId, setSelectedTorneoId] = useState(null);
  const [selectedTorneo, setSelectedTorneo] = useState(null);

  // --- Estados del Formulario de Creación ---
  const [nombre, setNombre] = useState('');
  const [rangoEdad, setRangoEdad] = useState('18 años en adelante');
  const [generoId, setGeneroId] = useState(1);
  const [fechaInicio, setFechaInicio] = useState('');
  const [equiposTexto, setEquiposTexto] = useState(
    'Los Galácticos, Sporting FC, Real Bañil, Atlético Central, Los Troncos, Deportivo Sur, La Selecta, Halcones FC'
  );
  const [fechaError, setFechaError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [creandoTorneo, setCreandoTorneo] = useState(false);

  // --- Modal para Editar Torneo ---
  const [isEditTorneoModalOpen, setIsEditTorneoModalOpen] = useState(false);
  const [editTorneoId, setEditTorneoId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editRangoEdad, setEditRangoEdad] = useState('');
  const [editGeneroId, setEditGeneroId] = useState(1);
  const [editEstadoId, setEditEstadoId] = useState(1);
  const [editFechaInicio, setEditFechaInicio] = useState('');
  const [editFechaError, setEditFechaError] = useState('');
  const [editSubmitError, setEditSubmitError] = useState('');
  const [submittingEditTorneo, setSubmittingEditTorneo] = useState(false);

  // --- Estados de Gestión de Equipos y Fotos en Edición ---
  const [editEquipos, setEditEquipos] = useState([]);
  const [nuevoEquipoNombre, setNuevoEquipoNombre] = useState('');
  const [nuevoEquipoRep, setNuevoEquipoRep] = useState('');
  const [nuevoEquipoFoto, setNuevoEquipoFoto] = useState('⚽');

  // --- Estados para Marcadores de Partidos ---
  const [scores, setScores] = useState({});
  const [savingMatchId, setSavingMatchId] = useState(null);
  const [matchSuccess, setMatchSuccess] = useState({});

  // REGLA: Los torneos deben ser organizados con 15 días de anticipación como mínimo y máximo 30 días
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 15);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);

    const format = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      todayStr: format(today),
      minStr: format(minDate),
      maxStr: format(maxDate),
      minDate,
      maxDate,
    };
  }, []);

  // Validación JavaScript de la Fecha de Inicio (15 a 30 días)
  const validateFechaTorneo = useCallback((fechaStr) => {
    if (!fechaStr) {
      return 'La fecha de inicio es requerida.';
    }

    const { minStr, maxStr } = dateRange;
    if (fechaStr < minStr || fechaStr > maxStr) {
      return `La fecha de inicio debe tener entre 15 y 30 días de anticipación a partir de hoy (del ${minStr} al ${maxStr}).`;
    }

    return '';
  }, [dateRange]);

  const handleFechaChange = (e) => {
    const val = e.target.value;
    setFechaInicio(val);
    setFechaError(validateFechaTorneo(val));
  };

  // Carga híbrida resiliente de torneos que combina Semillas + LocalStorage + API Render sin perder ningún torneo
  const fetchTorneos = useCallback(async () => {
    setLoadingTorneos(true);

    let localData = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        localData = JSON.parse(saved);
      }
    } catch {
      localData = [];
    }

    // Usar Map para asegurar que TODOS los torneos se conserven sin duplicarse por ID
    const torneosMap = new Map();
    SEED_TORNEOS.forEach((t) => torneosMap.set(t.id, t));

    if (Array.isArray(localData)) {
      localData.forEach((t) => {
        if (t && t.id) {
          torneosMap.set(t.id, t);
        }
      });
    }

    // Intentar consultar API de Render
    const token = localStorage.getItem('token');
    try {
      const res = await futsalApi.get('/torneos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        res.data.forEach((t) => {
          if (t && t.id) {
            torneosMap.set(t.id, t);
          }
        });
      }
    } catch (err) {
      console.warn('API Render offline/en espera, utilizando almacén sincronizado de torneos:', err.message);
    }

    const listaCompleta = Array.from(torneosMap.values());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(listaCompleta));
    } catch {}

    setTorneos(listaCompleta);
    if (!selectedTorneoId && listaCompleta.length > 0) {
      setSelectedTorneoId(listaCompleta[0].id);
    }
    setLoadingTorneos(false);
  }, [selectedTorneoId]);

  useEffect(() => {
    fetchTorneos();
  }, [fetchTorneos]);

  // Actualizar torneo seleccionado y sus marcadores
  useEffect(() => {
    if (!torneos.length) return;
    const current = torneos.find((t) => t.id === selectedTorneoId) || torneos[0];
    setSelectedTorneo(current);

    const initialScores = {};
    (current?.partidosTorneo || []).forEach((p) => {
      initialScores[p.id] = {
        golesLocal: p.golesLocal ?? '',
        golesVisita: p.golesVisita ?? '',
      };
    });
    setScores(initialScores);
  }, [torneos, selectedTorneoId]);

  // Manejo de Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // Helper para persistir torneos localmente
  const persistTorneos = (updatedList) => {
    setTorneos(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  };

  // Crear Torneo (POST /api/torneos con generación automática de Fixture)
  const handleCrearTorneo = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const errFecha = validateFechaTorneo(fechaInicio);
    if (errFecha) {
      setFechaError(errFecha);
      return;
    }

    if (!nombre.trim()) {
      setFormError('El nombre del torneo es obligatorio.');
      return;
    }

    if (!rangoEdad.trim()) {
      setFormError('El rango de edad es obligatorio.');
      return;
    }

    const equiposList = equiposTexto
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (equiposList.length < 2) {
      setFormError('Debes ingresar al menos 2 equipos participantes separados por coma.');
      return;
    }

    setCreandoTorneo(true);

    const token = localStorage.getItem('token');
    const payload = {
      usuarioAdminId: 1,
      estadoId: 1,
      generoId: Number(generoId),
      nombre: nombre.trim(),
      rangoEdad: rangoEdad.trim(),
      fechaInicio: `${fechaInicio}T00:00:00`,
      equipos: equiposList,
    };

    // POST a la API central para persistir en la base de datos de Render
    let nuevoTorneoCreado = null;
    try {
      const res = await futsalApi.post('/torneos', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.id) {
        nuevoTorneoCreado = res.data;
      }
    } catch (apiErr) {
      console.error('Error al crear torneo en API:', apiErr);
      const errMsg = apiErr.response?.data?.message || apiErr.message || 'Error de conexión con el servidor';
      setFormError(`Error del servidor: ${errMsg}`);
      setCreandoTorneo(false);
      return;
    }

    // Inmediatamente reflejar el nuevo torneo en la lista y persistir en localStorage
    setTorneos((prev) => {
      const filtered = prev.filter((t) => t.id !== nuevoTorneoCreado.id);
      const updated = [nuevoTorneoCreado, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error guardando en localStorage:', err);
      }
      return updated;
    });
    setSelectedTorneoId(nuevoTorneoCreado.id);
    setSelectedTorneo(nuevoTorneoCreado);

    setFormSuccess(`¡Torneo "${nuevoTorneoCreado.nombre}" creado exitosamente con su fixture generado!`);
    setNombre('');
    setFechaInicio('');
    setFechaError('');
    setCreandoTorneo(false);
  };

  // Helpers para gestionar equipos y fotos en edición de torneos
  const handleUpdateEquipo = (index, field, value) => {
    setEditEquipos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddEquipoToEdit = (e) => {
    if (e) e.preventDefault();
    if (!nuevoEquipoNombre.trim()) {
      alert('Debes ingresar el nombre del equipo.');
      return;
    }
    const nuevo = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      nombreEquipo: nuevoEquipoNombre.trim(),
      nombreRepresentante: nuevoEquipoRep.trim() || 'Representante',
      fotoUrl: nuevoEquipoFoto.trim() || '⚽',
    };
    setEditEquipos((prev) => [...prev, nuevo]);
    setNuevoEquipoNombre('');
    setNuevoEquipoRep('');
    setNuevoEquipoFoto('⚽');
  };

  const handleRemoveEquipoFromEdit = (index) => {
    if (editEquipos.length <= 2) {
      alert('Un torneo debe tener un mínimo de 2 equipos participantes.');
      return;
    }
    setEditEquipos((prev) => prev.filter((_, i) => i !== index));
  };

  // Abrir Modal de Edición de Torneo
  const handleOpenEditTorneo = (torneo) => {
    setEditTorneoId(torneo.id);
    setEditNombre(torneo.nombre || '');
    setEditRangoEdad(torneo.rangoEdad || '18 años en adelante');
    setEditGeneroId(torneo.generoId || 1);
    setEditEstadoId(torneo.estadoId || 1);

    const fStr = torneo.fechaInicio ? torneo.fechaInicio.split('T')[0] : '';
    setEditFechaInicio(fStr || dateRange.minStr);
    setEditFechaError('');
    setEditSubmitError('');

    // Cargar equipos actuales con sus fotos/escudos
    const equiposCargados = (torneo.equipos || []).map((eq, i) => ({
      id: eq.id || Date.now() + i + 1,
      nombreEquipo: eq.nombreEquipo || `Equipo #${i + 1}`,
      nombreRepresentante: eq.nombreRepresentante || 'Por Asignar',
      fotoUrl: eq.fotoUrl || '⚽',
    }));

    setEditEquipos(equiposCargados);
    setNuevoEquipoNombre('');
    setNuevoEquipoRep('');
    setNuevoEquipoFoto('⚽');

    setIsEditTorneoModalOpen(true);
  };

  // Guardar Cambios en Torneo (PUT)
  const handleSaveEditTorneo = async (e) => {
    e.preventDefault();
    setEditSubmitError('');

    const errFecha = validateFechaTorneo(editFechaInicio);
    if (errFecha) {
      setEditFechaError(errFecha);
      return;
    }

    if (!editNombre.trim()) {
      setEditSubmitError('El nombre del torneo es obligatorio.');
      return;
    }

    if (editEquipos.length < 2) {
      setEditSubmitError('El torneo debe tener al menos 2 equipos participantes.');
      return;
    }

    setSubmittingEditTorneo(true);

    const token = localStorage.getItem('token');
    const payload = {
      nombre: editNombre.trim(),
      rangoEdad: editRangoEdad.trim(),
      generoId: Number(editGeneroId),
      estadoId: Number(editEstadoId),
      fechaInicio: `${editFechaInicio}T00:00:00`,
      usuarioAdminId: 1,
      equipos: editEquipos.map((eq) => eq.nombreEquipo),
    };

    try {
      await futsalApi.put(`/torneos/${editTorneoId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (apiErr) {
      console.error('Error al actualizar torneo en API:', apiErr);
      const errMsg = apiErr.response?.data?.message || apiErr.message || 'Error de conexión con el servidor';
      setEditSubmitError(`Error del servidor: ${errMsg}`);
      setSubmittingEditTorneo(false);
      return;
    }

    // Actualizar torneo y regenerar fixture si cambió el número de equipos
    const listaActualizada = torneos.map((t) => {
      if (t.id === editTorneoId) {
        let partidosActuales = t.partidosTorneo || [];
        const cambioEquipos = editEquipos.length !== (t.equipos || []).length;

        if (cambioEquipos || partidosActuales.length === 0) {
          partidosActuales = [];
          for (let i = 0; i < editEquipos.length; i += 2) {
            const local = editEquipos[i];
            const tieneVisita = i + 1 < editEquipos.length;
            const visita = tieneVisita ? editEquipos[i + 1] : null;

            partidosActuales.push({
              id: t.id * 100 + i + 1,
              torneoId: t.id,
              fase: `Cuartos de Final - Llave ${Math.floor(i / 2) + 1}`,
              equipoLocalId: local.id,
              equipoVisitaId: visita ? visita.id : null,
              equipoLocal: local,
              equipoVisita: visita,
              golesLocal: null,
              golesVisita: null,
              ganadorId: visita ? null : local.id,
            });
          }
        }

        return {
          ...t,
          nombre: payload.nombre,
          rangoEdad: payload.rangoEdad,
          generoId: payload.generoId,
          estadoId: payload.estadoId,
          fechaInicio: payload.fechaInicio,
          equipos: editEquipos,
          partidosTorneo: partidosActuales,
        };
      }
      return t;
    });

    persistTorneos(listaActualizada);
    setSelectedTorneoId(editTorneoId);
    setFormSuccess(`¡Torneo "${editNombre}" y sus ${editEquipos.length} equipos actualizados correctamente!`);
    setIsEditTorneoModalOpen(false);
    setSubmittingEditTorneo(false);
  };

  // Guardar Resultado de un Partido (PUT /api/torneos/partidos/{id})
  const handleGuardarResultado = async (partidoId) => {
    const localVal = scores[partidoId]?.golesLocal;
    const visitaVal = scores[partidoId]?.golesVisita;

    if (localVal === '' || localVal === null || localVal === undefined) {
      alert('Debes ingresar los goles del equipo local.');
      return;
    }

    if (visitaVal === '' || visitaVal === null || visitaVal === undefined) {
      alert('Debes ingresar los goles del equipo visitante.');
      return;
    }

    const golesLocalNum = parseInt(localVal, 10);
    const golesVisitaNum = parseInt(visitaVal, 10);

    if (isNaN(golesLocalNum) || golesLocalNum < 0 || isNaN(golesVisitaNum) || golesVisitaNum < 0) {
      alert('Los goles deben ser números enteros no negativos.');
      return;
    }

    setSavingMatchId(partidoId);
    const token = localStorage.getItem('token');

    const payload = {
      partidoId: partidoId,
      golesLocal: golesLocalNum,
      golesVisita: golesVisitaNum,
    };

    // PUT en Render para actualizar marcador en BD
    try {
      await futsalApi.put(`/torneos/partidos/${partidoId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (apiErr) {
      console.error('Error al actualizar marcador en API:', apiErr);
      const errMsg = apiErr.response?.data?.message || apiErr.message || 'Error de conexión con el servidor';
      alert(`No se pudo guardar el resultado en el servidor: ${errMsg}`);
      setSavingMatchId(null);
      return;
    }

    // Actualizar partido en el estado y en localStorage
    const listaActualizada = torneos.map((torneo) => {
      if (torneo.id === selectedTorneoId) {
        const partidosActualizados = (torneo.partidosTorneo || []).map((partido) => {
          if (partido.id === partidoId) {
            let ganador = null;
            if (golesLocalNum > golesVisitaNum) ganador = partido.equipoLocalId;
            else if (golesVisitaNum > golesLocalNum) ganador = partido.equipoVisitaId;

            return {
              ...partido,
              golesLocal: golesLocalNum,
              golesVisita: golesVisitaNum,
              ganadorId: ganador,
            };
          }
          return partido;
        });
        return { ...torneo, partidosTorneo: partidosActualizados };
      }
      return torneo;
    });

    persistTorneos(listaActualizada);

    setMatchSuccess((prev) => ({ ...prev, [partidoId]: true }));
    setTimeout(() => {
      setMatchSuccess((prev) => ({ ...prev, [partidoId]: false }));
    }, 3000);

    setSavingMatchId(null);
  };

  const getNombreEquipo = (equipoId, defaultName) => {
    if (!equipoId) return defaultName || 'Pase Directo';
    if (!selectedTorneo) return `Equipo #${equipoId}`;
    const equipos = selectedTorneo.equipos || [];
    const eq = equipos.find((e) => e.id === equipoId);
    return eq ? eq.nombreEquipo : `Equipo #${equipoId}`;
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">FutsalPro Admin</span>
            </div>

            <nav className="hidden sm:flex items-center gap-2">
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition"
              >
                Reservas
              </Link>
              <Link
                to="/torneos"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
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
              onClick={fetchTorneos}
              disabled={loadingTorneos}
              title="Recargar torneos"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
            >
              <svg className={`w-5 h-5 ${loadingTorneos ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* PARTE SUPERIOR: Formulario para crear un torneo */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Crear Nuevo Torneo</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Regla obligatoria: Anticipación mínima de 15 días y máxima de 30 días a partir de la fecha actual.
              </p>
            </div>
          </div>

          {formSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-medium">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{formSuccess}</span>
              </div>
              <button onClick={() => setFormSuccess('')} className="text-emerald-700 hover:text-emerald-900 font-bold">&times;</button>
            </div>
          )}

          {formError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-medium">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError}</span>
              </div>
              <button onClick={() => setFormError('')} className="text-rose-700 hover:text-rose-900 font-bold">&times;</button>
            </div>
          )}

          <form onSubmit={handleCrearTorneo} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Nombre del Torneo (Solo Texto) */}
              <div>
                <label htmlFor="nombreTorneo" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nombre del Torneo (Solo Texto) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="nombreTorneo"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Solo texto (ej. Copa Clausura Pro)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm transition"
                />
                <p className="mt-1 text-[11px] text-slate-500">Tipo de dato: Solo letras y números para el título del campeonato.</p>
              </div>

              {/* Rango de Edad (Texto) */}
              <div>
                <label htmlFor="rangoEdad" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Rango de Edad (Ej. 18-35) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="rangoEdad"
                  type="text"
                  required
                  value={rangoEdad}
                  onChange={(e) => setRangoEdad(e.target.value)}
                  placeholder="Solo texto o números (ej. 18-35 años)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm transition"
                />
                <p className="mt-1 text-[11px] text-slate-500">Tipo de dato: Texto con la categoría de edad (ej. 18 años en adelante).</p>
              </div>

              {/* Fecha de Inicio (15 a 30 días de anticipación) */}
              <div>
                <label htmlFor="fechaInicio" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fecha de Inicio <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fechaInicio"
                  type="date"
                  required
                  min={dateRange.minStr}
                  max={dateRange.maxStr}
                  value={fechaInicio}
                  onChange={handleFechaChange}
                  className={`w-full px-4 py-3 rounded-xl border text-slate-800 text-sm transition focus:outline-none focus:ring-2 ${
                    fechaError
                      ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 bg-slate-50/50 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                {fechaError ? (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium animate-fadeIn">
                    {fechaError}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Rango permitido: 15 a 30 días a partir de hoy ({dateRange.minStr} al {dateRange.maxStr}).
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <label htmlFor="generoId" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Categoría de Género
                </label>
                <select
                  id="generoId"
                  value={generoId}
                  onChange={(e) => setGeneroId(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                >
                  <option value={1}>Masculino</option>
                  <option value={2}>Femenino</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="equipos" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Equipos Participantes (separados por coma)
                </label>
                <input
                  id="equipos"
                  type="text"
                  value={equiposTexto}
                  onChange={(e) => setEquiposTexto(e.target.value)}
                  placeholder="Equipo A, Equipo B, Equipo C, Equipo D..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={creandoTorneo || !!fechaError}
                className="px-6 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {creandoTorneo ? (
                  <span>Creando Torneo y Generando Fixture...</span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Guardar y Crear Torneo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* PARTE INFERIOR: Lista de Torneos Activos + Tabla de Partidos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Torneos y Fixture de Partidos</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona un torneo para ver sus llaves, actualizar resultados o modificar los datos del campeonato.
              </p>
            </div>
            <span className="text-xs font-medium bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 shadow-xs">
              Total Torneos: <strong className="text-slate-900 font-bold ml-1">{torneos.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Columna Izquierda: Lista de Torneos */}
            <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Torneos Registrados
                </h3>
                <span className="text-xs text-slate-400 font-medium">Click para ver fixture</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {loadingTorneos ? (
                  <div className="py-12 text-center text-slate-400">
                    <span className="text-xs">Cargando torneos...</span>
                  </div>
                ) : torneos.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No hay torneos registrados todavía.
                  </div>
                ) : (
                  torneos.map((t) => {
                    const isSelected = t.id === selectedTorneoId;
                    const numPartidos = t.partidosTorneo?.length ?? 0;
                    const numEquipos = t.equipos?.length ?? 0;
                    const fechaStr = t.fechaInicio ? t.fechaInicio.split('T')[0] : '-';

                    return (
                      <div
                        key={t.id}
                        className={`p-5 transition-all duration-150 flex items-start justify-between gap-4 ${
                          isSelected
                            ? 'bg-blue-50/70 border-l-4 border-blue-600'
                            : 'hover:bg-slate-50/90'
                        }`}
                      >
                        <div
                          onClick={() => setSelectedTorneoId(t.id)}
                          className="space-y-1.5 flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{t.nombre}</span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              #{t.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                            <span>📅 Inicio: <strong className="text-slate-700">{fechaStr}</strong></span>
                            <span>🎯 {t.rangoEdad}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                            <span>⚽ {numEquipos} equipos</span>
                            <span>🏆 {numPartidos} partidos</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTorneo(t)}
                            title="Editar torneo"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition shadow-2xs"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Editar</span>
                          </button>

                          {isSelected && (
                            <span className="text-xs text-blue-600 font-bold">
                              Seleccionado →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Columna Derecha: Tabla de PartidosTorneo */}
            <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Partidos: {selectedTorneo ? `"${selectedTorneo.nombre}"` : ''}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ingresa únicamente números enteros (0, 1, 2...) en los goles y presiona "Guardar".
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTorneo && (
                    <button
                      onClick={() => handleOpenEditTorneo(selectedTorneo)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Editar Torneo</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                {!selectedTorneo ? (
                  <div className="py-16 text-center text-slate-400">
                    <p className="text-sm">Selecciona un torneo para visualizar sus partidos.</p>
                  </div>
                ) : !selectedTorneo?.partidosTorneo || selectedTorneo.partidosTorneo.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <p className="text-sm">Este torneo no tiene partidos generados.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Fase</th>
                        <th className="py-3 px-4 text-right">Equipo Local</th>
                        <th className="py-3 px-4 text-center">Goles (Solo Números)</th>
                        <th className="py-3 px-2 text-center text-slate-400">VS</th>
                        <th className="py-3 px-4 text-center">Goles (Solo Números)</th>
                        <th className="py-3 px-4 text-left">Equipo Visita</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {selectedTorneo.partidosTorneo.map((partido) => {
                        const localNombre =
                          partido.equipoLocal?.nombreEquipo ||
                          getNombreEquipo(partido.equipoLocalId, 'Local');
                        const visitaNombre =
                          partido.equipoVisita?.nombreEquipo ||
                          (partido.equipoVisitaId ? getNombreEquipo(partido.equipoVisitaId, 'Visita') : 'Pase Directo');

                        const isPaseDirecto = !partido.equipoVisitaId;
                        const isSaving = savingMatchId === partido.id;
                        const isSaved = matchSuccess[partido.id];

                        const currentGolesLocal = scores[partido.id]?.golesLocal ?? '';
                        const currentGolesVisita = scores[partido.id]?.golesVisita ?? '';

                        return (
                          <tr key={partido.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-4 text-xs font-bold text-slate-700 whitespace-nowrap">
                              {partido.fase || 'Cuartos'}
                            </td>

                            <td className="py-4 px-4 text-right font-semibold text-slate-800">
                              <span>{localNombre}</span>
                            </td>

                            <td className="py-4 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="99"
                                disabled={isPaseDirecto || isSaving}
                                value={currentGolesLocal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setScores((prev) => ({
                                    ...prev,
                                    [partido.id]: {
                                      ...prev[partido.id],
                                      golesLocal: val,
                                    },
                                  }));
                                }}
                                className="w-16 px-2.5 py-1.5 text-center font-bold text-slate-900 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>

                            <td className="py-4 px-2 text-center text-xs font-bold text-slate-400">
                              -
                            </td>

                            <td className="py-4 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="99"
                                disabled={isPaseDirecto || isSaving}
                                value={currentGolesVisita}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setScores((prev) => ({
                                    ...prev,
                                    [partido.id]: {
                                      ...prev[partido.id],
                                      golesVisita: val,
                                    },
                                  }));
                                }}
                                className="w-16 px-2.5 py-1.5 text-center font-bold text-slate-900 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>

                            <td className="py-4 px-4 text-left font-semibold text-slate-800">
                              {isPaseDirecto ? (
                                <span className="text-xs italic text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                                  Pase Directo
                                </span>
                              ) : (
                                <span>{visitaNombre}</span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              {isPaseDirecto ? (
                                <span className="text-xs text-slate-400 font-medium">Clasificado</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleGuardarResultado(partido.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 shadow-xs flex items-center justify-center gap-1.5 mx-auto ${
                                    isSaved
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                                  } disabled:opacity-50`}
                                >
                                  {isSaving ? (
                                    <span>Guardando...</span>
                                  ) : isSaved ? (
                                    <span>Guardado</span>
                                  ) : (
                                    <span>Guardar</span>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL PARA EDITAR TORNEO */}
      {isEditTorneoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Editar Torneo #{editTorneoId}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actualiza datos del torneo, agrega nuevos equipos y modifica sus fotos/escudos representativos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditTorneoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {editSubmitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {editSubmitError}
              </div>
            )}

            <form onSubmit={handleSaveEditTorneo} className="space-y-6">
              {/* DATOS GENERALES DEL TORNEO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre del Torneo (Solo Texto) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    placeholder="Solo texto (ej. Copa Apertura Pro)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Tipo de dato: Solo letras y números.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Rango de Edad (Ej. 18-35) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editRangoEdad}
                    onChange={(e) => setEditRangoEdad(e.target.value)}
                    placeholder="Solo texto o números (ej. 18-35 años)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Tipo de dato: Texto con rango de edad.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fecha de Inicio <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={dateRange.minStr}
                    max={dateRange.maxStr}
                    value={editFechaInicio}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFechaInicio(val);
                      setEditFechaError(validateFechaTorneo(val));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      editFechaError
                        ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-300 bg-slate-50 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                  {editFechaError ? (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{editFechaError}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Rango: {dateRange.minStr} al {dateRange.maxStr}.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={editGeneroId}
                    onChange={(e) => setEditGeneroId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value={1}>Masculino</option>
                    <option value={2}>Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estado
                  </label>
                  <select
                    value={editEstadoId}
                    onChange={(e) => setEditEstadoId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value={1}>Programado</option>
                    <option value={2}>Activo</option>
                    <option value={3}>Finalizado</option>
                  </select>
                </div>
              </div>

              {/* GESTIÓN DE EQUIPOS PARTICIPANTES Y FOTOS */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>⚽ Equipos Participantes y Fotos / Escudos</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px]">
                      {editEquipos.length} equipos
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Mínimo 2 equipos</span>
                </div>

                {/* Lista de equipos actuales */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 mb-4">
                  {editEquipos.map((eq, idx) => (
                    <div
                      key={eq.id || idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      {/* Avatar / Foto preview */}
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-2xs overflow-hidden shrink-0">
                        {eq.fotoUrl && (eq.fotoUrl.startsWith('http') || eq.fotoUrl.startsWith('data:')) ? (
                          <img src={eq.fotoUrl} alt={eq.nombreEquipo} className="w-full h-full object-cover" />
                        ) : (
                          <span>{eq.fotoUrl || '⚽'}</span>
                        )}
                      </div>

                      {/* Nombre del equipo */}
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Equipo #{idx + 1} (Solo Texto)
                        </label>
                        <input
                          type="text"
                          required
                          value={eq.nombreEquipo}
                          onChange={(e) => handleUpdateEquipo(idx, 'nombreEquipo', e.target.value)}
                          placeholder="Nombre del equipo"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Representante */}
                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Representante
                        </label>
                        <input
                          type="text"
                          value={eq.nombreRepresentante}
                          onChange={(e) => handleUpdateEquipo(idx, 'nombreRepresentante', e.target.value)}
                          placeholder="Representante"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Foto / Escudo URL */}
                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Foto / Escudo
                        </label>
                        <input
                          type="text"
                          value={eq.fotoUrl}
                          onChange={(e) => handleUpdateEquipo(idx, 'fotoUrl', e.target.value)}
                          placeholder="URL o Emoji (⚽, 🦁)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipoFromEdit(idx)}
                        title="Eliminar este equipo"
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition self-end sm:self-center shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Subformulario para agregar más equipos */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <span className="block text-xs font-bold text-blue-900 mb-2">
                    + Agregar Nuevo Equipo a este Torneo
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-2">
                    <div>
                      <input
                        type="text"
                        value={nuevoEquipoNombre}
                        onChange={(e) => setNuevoEquipoNombre(e.target.value)}
                        placeholder="Nombre del nuevo equipo"
                        className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={nuevoEquipoRep}
                        onChange={(e) => setNuevoEquipoRep(e.target.value)}
                        placeholder="Nombre representante"
                        className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={nuevoEquipoFoto}
                        onChange={(e) => setNuevoEquipoFoto(e.target.value)}
                        placeholder="URL de foto o escudo (ej. 🦁)"
                        className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Botones de selección rápida de escudos */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-medium">Escudos rápidos:</span>
                      {['⚽', '🦁', '⚡', '🦅', '🛡️', '🔥', '🏆', '⭐'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNuevoEquipoFoto(emoji)}
                          className="w-6 h-6 rounded-md bg-white border border-blue-200 text-xs flex items-center justify-center hover:bg-blue-100 transition"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddEquipoToEdit}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1 shadow-xs"
                    >
                      <span>+ Añadir Equipo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditTorneoModalOpen(false)}
                  disabled={submittingEditTorneo}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingEditTorneo || !!editFechaError}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingEditTorneo ? (
                    <span>Guardando Cambios...</span>
                  ) : (
                    <span>Guardar Torneo y Equipos</span>
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
