// RetosView.jsx
// Vista de Retos y Misiones con gamificación STEM+
// Plataforma Educativa - Fabio Ortiz M.

import React, { useState, useEffect } from 'react';
import {
  Trophy, Star, Target, Zap, Plus, ChevronRight, ChevronDown,
  Edit2, Trash2, X, CheckCircle, Clock, BookOpen, Upload,
  Lock, Unlock, Award, Flame, ArrowLeft, Save, AlertCircle
} from 'lucide-react';

import {
  obtenerRetos,
  crearReto,
  actualizarReto,
  eliminarReto,
  obtenerMisiones,
  crearMision,
  actualizarMision,
  eliminarMision,
  marcarMisionCompletada,
  obtenerProgresoEstudiante,
  suscribirseARetos,
  suscribirseAMisiones,
} from './supabaseClient';

// ============================================================
// ESTILOS AUXILIARES
// ============================================================
const GRADOS = ['6', '7', '8', '9', '10', '11'];

const XP_COLOR = {
  low:  'text-emerald-600 bg-emerald-50',
  mid:  'text-amber-600  bg-amber-50',
  high: 'text-rose-600   bg-rose-50',
};

function xpBadge(puntos) {
  if (puntos <= 20) return XP_COLOR.low;
  if (puntos <= 50) return XP_COLOR.mid;
  return XP_COLOR.high;
}

// ============================================================
// SUB-COMPONENTE: Barra de progreso circular
// ============================================================
function CircleProgress({ pct = 0, size = 64, stroke = 5, color = '#06b6d4' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%', fontSize: 13, fontWeight: 700, fill: '#1f2937' }}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const RetosView = ({ currentUser }) => {

  // --- Estado global ---
  const [retos, setRetos] = useState([]);
  const [retoActivo, setRetoActivo] = useState(null);       // reto expandido
  const [misiones, setMisiones] = useState([]);             // misiones del retoActivo
  const [progreso, setProgreso] = useState([]);             // progreso estudiante
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modales
  const [modalReto, setModalReto] = useState(false);
  const [modalMision, setModalMision] = useState(false);
  const [retoEditando, setRetoEditando] = useState(null);
  const [misionEditando, setMisionEditando] = useState(null);

  const esDocente = ['docente', 'admin'].includes(currentUser.rol);
  const esEstudiante = currentUser.rol === 'estudiante';

  // ── Carga inicial ─────────────────────────────────────────
  useEffect(() => {
    cargarRetos();

    // Suscripción en tiempo real a nuevos retos
    const sub = suscribirseARetos(() => cargarRetos());
    return () => sub?.unsubscribe();
  }, []);

  // ── Cuando cambia el reto activo → carga misiones ─────────
  useEffect(() => {
    if (!retoActivo) {
      setMisiones([]);
      setProgreso([]);
      return;
    }
    cargarMisiones(retoActivo.id);
    if (esEstudiante) cargarProgreso(retoActivo.id);

    const sub = suscribirseAMisiones(retoActivo.id, () => cargarMisiones(retoActivo.id));
    return () => sub?.unsubscribe();
  }, [retoActivo?.id]);

  // ── Funciones de carga ────────────────────────────────────
  const cargarRetos = async () => {
    setLoading(true);
    const { data, error } = await obtenerRetos(currentUser);
    if (error) setError('No se pudieron cargar los retos.');
    else setRetos(data || []);
    setLoading(false);
  };

  const cargarMisiones = async (retoId) => {
    const { data } = await obtenerMisiones(retoId);
    setMisiones(data || []);
  };

  const cargarProgreso = async (retoId) => {
    const { data } = await obtenerProgresoEstudiante(currentUser.id, retoId);
    setProgreso(data || []);
  };

  // ── Helpers de progreso ───────────────────────────────────
  const misionCompletadaPor = (misionId) =>
    progreso.some(p => p.mision_id === misionId && p.completada);

  const porcentajeReto = () => {
    if (!misiones.length) return 0;
    return (progreso.filter(p => p.completada).length / misiones.length) * 100;
  };

  const xpGanadoEnReto = () =>
    progreso.reduce((sum, p) => sum + (p.xp_ganado || 0), 0);

  // ── Acciones CRUD Retos ───────────────────────────────────
  const handleGuardarReto = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const payload = {
      titulo: fd.get('titulo'),
      descripcion: fd.get('descripcion'),
      grado: fd.get('grado'),
      activo: fd.get('activo') === 'on',
      docente_id: currentUser.id,
    };

    if (retoEditando) {
      await actualizarReto(retoEditando.id, payload);
    } else {
      await crearReto(payload);
    }
    await cargarRetos();
    setModalReto(false);
    setRetoEditando(null);
    setLoading(false);
  };

  const handleEliminarReto = async (id) => {
    if (!window.confirm('¿Eliminar este reto y todas sus misiones?')) return;
    await eliminarReto(id);
    if (retoActivo?.id === id) setRetoActivo(null);
    cargarRetos();
  };

  // ── Acciones CRUD Misiones ────────────────────────────────
  const handleGuardarMision = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const payload = {
      reto_id: retoActivo.id,
      titulo: fd.get('titulo'),
      descripcion: fd.get('descripcion'),
      puntos_xp: parseInt(fd.get('puntos_xp')) || 10,
      fecha_limite: fd.get('fecha_limite') || null,
      archivo_url: fd.get('archivo_url') || null,
    };

    if (misionEditando) {
      await actualizarMision(misionEditando.id, payload);
    } else {
      await crearMision(payload);
    }
    await cargarMisiones(retoActivo.id);
    setModalMision(false);
    setMisionEditando(null);
    setLoading(false);
  };

  const handleEliminarMision = async (id) => {
    if (!window.confirm('¿Eliminar esta misión?')) return;
    await eliminarMision(id);
    cargarMisiones(retoActivo.id);
  };

  const handleCompletarMision = async (mision) => {
    if (misionCompletadaPor(mision.id)) return;
    await marcarMisionCompletada(mision.id, currentUser.id, mision.puntos_xp);
    cargarProgreso(retoActivo.id);
  };

  // ── RENDER ────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {retoActivo && (
            <button
              onClick={() => setRetoActivo(null)}
              className="p-2 rounded-xl hover:bg-gray-100 transition"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          )}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Trophy size={28} className="text-amber-500" />
              {retoActivo ? retoActivo.titulo : 'Retos STEM+'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {retoActivo
                ? `Grado ${retoActivo.grado} · ${misiones.length} misiones · ${retoActivo.puntos_totales ?? 0} XP total`
                : esDocente
                  ? 'Gestiona tus retos y define las misiones para cada grado'
                  : `Completa las misiones de tu grado y acumula XP 🚀`}
            </p>
          </div>
        </div>

        {/* Botón crear reto (solo docentes) */}
        {esDocente && !retoActivo && (
          <button
            onClick={() => { setRetoEditando(null); setModalReto(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow hover:shadow-lg transition"
          >
            <Plus size={18} /> Nuevo Reto
          </button>
        )}

        {/* Botón añadir misión (docente dentro de un reto) */}
        {esDocente && retoActivo && (
          <button
            onClick={() => { setMisionEditando(null); setModalMision(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold shadow hover:shadow-lg transition"
          >
            <Plus size={18} /> Nueva Misión
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VISTA: Lista de Retos
      ══════════════════════════════════════════════════════ */}
      {!retoActivo && (
        <>
          {loading && <p className="text-gray-500 text-center py-12">Cargando retos...</p>}

          {!loading && retos.length === 0 && (
            <div className="text-center py-20">
              <Trophy size={56} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {esDocente
                  ? 'Aún no has creado ningún reto. ¡Empieza ahora!'
                  : 'Tu docente aún no ha publicado retos para tu grado.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {retos.map(reto => (
              <div
                key={reto.id}
                className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Header tarjeta */}
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-5 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full mr-2">
                        Grado {reto.grado}
                      </span>
                      {!reto.activo && (
                        <span className="text-xs font-semibold bg-red-500/70 px-2 py-1 rounded-full">
                          Inactivo
                        </span>
                      )}
                      <h3 className="mt-3 text-xl font-bold leading-tight">{reto.titulo}</h3>
                      <p className="mt-1 text-sm text-blue-100 line-clamp-2">{reto.descripcion}</p>
                    </div>
                    <div className="ml-4 text-center bg-white/10 rounded-xl p-3">
                      <Zap size={20} className="text-amber-300 mx-auto" />
                      <p className="text-lg font-bold">{reto.puntos_totales ?? 0}</p>
                      <p className="text-xs text-blue-200">XP</p>
                    </div>
                  </div>
                </div>

                {/* Footer tarjeta */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Target size={15} />
                    <span>{reto.misiones?.[0]?.count ?? 0} misiones</span>
                    {esDocente && reto.docente && (
                      <span className="text-gray-300 mx-1">·</span>
                    )}
                    {esDocente && (
                      <span className="text-xs text-gray-400">
                        {new Date(reto.created_at).toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Botones docente */}
                    {esDocente && (
                      <>
                        <button
                          onClick={() => { setRetoEditando(reto); setModalReto(true); }}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleEliminarReto(reto.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setRetoActivo(reto)}
                      className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm rounded-lg hover:shadow transition font-semibold"
                    >
                      Ver misiones <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          VISTA: Misiones del Reto Activo
      ══════════════════════════════════════════════════════ */}
      {retoActivo && (
        <div className="space-y-4">

          {/* Panel de progreso (solo estudiante) */}
          {esEstudiante && misiones.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-6 mb-6">
              <CircleProgress pct={porcentajeReto()} />
              <div>
                <p className="font-bold text-gray-800 text-lg">Tu progreso en este reto</p>
                <p className="text-gray-600 text-sm">
                  {progreso.filter(p => p.completada).length} de {misiones.length} misiones completadas
                </p>
                <p className="text-amber-600 font-semibold mt-1 flex items-center gap-1">
                  <Zap size={15} /> {xpGanadoEnReto()} / {retoActivo.puntos_totales ?? 0} XP ganados
                </p>
              </div>
            </div>
          )}

          {loading && <p className="text-gray-500 text-center py-8">Cargando misiones...</p>}

          {!loading && misiones.length === 0 && (
            <div className="text-center py-16">
              <Target size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {esDocente
                  ? 'Este reto no tiene misiones aún. ¡Añade la primera!'
                  : 'Tu docente aún no ha publicado misiones en este reto.'}
              </p>
            </div>
          )}

          {misiones.map((mision, idx) => {
            const completada = esEstudiante ? misionCompletadaPor(mision.id) : false;
            return (
              <div
                key={mision.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all ${
                  completada ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-100 hover:shadow-md'
                }`}
              >
                <div className="p-5 flex items-start gap-4">
                  {/* Número de orden / check */}
                  <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${
                    completada
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-br from-violet-100 to-purple-200 text-violet-700'
                  }`}>
                    {completada ? <CheckCircle size={22} /> : idx + 1}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-gray-800 text-lg">{mision.titulo}</h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${xpBadge(mision.puntos_xp)}`}>
                        +{mision.puntos_xp} XP
                      </span>
                      {completada && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          ✓ Completada
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm">{mision.descripcion}</p>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {mision.fecha_limite && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={13} />
                          {new Date(mision.fecha_limite).toLocaleDateString('es-CO', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </span>
                      )}
                      {mision.archivo_url && (
                        <a
                          href={mision.archivo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <BookOpen size={13} /> Ver recurso adjunto
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Estudiante: marcar como completada */}
                    {esEstudiante && !completada && (
                      <button
                        onClick={() => handleCompletarMision(mision)}
                        className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm rounded-xl font-semibold shadow hover:shadow-md transition"
                      >
                        <CheckCircle size={15} /> Completar
                      </button>
                    )}

                    {/* Docente: editar / eliminar */}
                    {esDocente && (
                      <>
                        <button
                          onClick={() => { setMisionEditando(mision); setModalMision(true); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleEliminarMision(mision.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: Crear / Editar Reto
      ══════════════════════════════════════════════════════ */}
      {modalReto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                {retoEditando ? 'Editar Reto' : 'Nuevo Reto'}
              </h3>
              <button onClick={() => { setModalReto(false); setRetoEditando(null); }}>
                <X size={20} className="text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleGuardarReto} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Reto *</label>
                <input
                  name="titulo"
                  defaultValue={retoEditando?.titulo}
                  required
                  placeholder="Ej: Reto IoT: Ciudad Inteligente"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  defaultValue={retoEditando?.descripcion}
                  rows={3}
                  placeholder="Describe el reto, contexto STEM+, objetivos..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Grado *</label>
                <select
                  name="grado"
                  defaultValue={retoEditando?.grado || ''}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                >
                  <option value="">Seleccionar grado...</option>
                  {GRADOS.map(g => <option key={g} value={g}>Grado {g}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="activo"
                  defaultChecked={retoEditando?.activo ?? true}
                  className="w-4 h-4 rounded accent-cyan-500"
                />
                <span className="text-sm text-gray-700">Publicar reto (visible para estudiantes)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalReto(false); setRetoEditando(null); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Reto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: Crear / Editar Misión
      ══════════════════════════════════════════════════════ */}
      {modalMision && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Target size={20} className="text-violet-500" />
                {misionEditando ? 'Editar Misión' : 'Nueva Misión'}
              </h3>
              <button onClick={() => { setModalMision(false); setMisionEditando(null); }}>
                <X size={20} className="text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleGuardarMision} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título de la Misión *</label>
                <input
                  name="titulo"
                  defaultValue={misionEditando?.titulo}
                  required
                  placeholder="Ej: Diseña el circuito del sensor de temperatura"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción / Instrucciones *</label>
                <textarea
                  name="descripcion"
                  defaultValue={misionEditando?.descripcion}
                  required
                  rows={4}
                  placeholder="Describe qué debe hacer el estudiante, cómo entregarlo, criterios de evaluación..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <span className="flex items-center gap-1"><Zap size={14} className="text-amber-500" /> Puntos XP</span>
                  </label>
                  <input
                    name="puntos_xp"
                    type="number"
                    min="1"
                    max="500"
                    defaultValue={misionEditando?.puntos_xp ?? 10}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <span className="flex items-center gap-1"><Clock size={14} /> Fecha límite</span>
                  </label>
                  <input
                    name="fecha_limite"
                    type="datetime-local"
                    defaultValue={misionEditando?.fecha_limite?.slice(0, 16)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <span className="flex items-center gap-1"><BookOpen size={14} /> URL de recurso adjunto</span>
                </label>
                <input
                  name="archivo_url"
                  type="url"
                  defaultValue={misionEditando?.archivo_url}
                  placeholder="https://drive.google.com/... o https://youtu.be/..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Puede ser un enlace de Drive, YouTube, Canva, GitHub, etc.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalMision(false); setMisionEditando(null); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold shadow hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Misión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RetosView;
