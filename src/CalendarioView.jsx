// ComponenteCalendario.jsx
// Calendario de actividades con visualización mensual y gestión de eventos

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, X, Clock, BookOpen, FileText, AlertCircle } from 'lucide-react';
import {
  obtenerEventosCalendario,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  suscribirseACalendario,
  crearNotificacion
} from './supabaseClient';

const CalendarioView = ({ currentUser }) => {
  const [eventos, setEventos] = useState([]);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState('mes'); // 'mes' o 'lista'
  const [mostrarModal, setMostrarModal] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const tiposEvento = [
    { value: 'tarea', label: '📝 Tarea', color: '#10b981' },
    { value: 'examen', label: '📋 Examen', color: '#f59e0b' },
    { value: 'proyecto', label: '🚀 Proyecto', color: '#ef4444' },
    { value: 'clase', label: '📚 Clase', color: '#3b82f6' },
    { value: 'evento', label: '🎉 Evento', color: '#8b5cf6' },
    { value: 'recordatorio', label: '⏰ Recordatorio', color: '#6b7280' }
  ];

  useEffect(() => {
    cargarEventos();
  }, [filtroGrado, filtroTipo]);

  useEffect(() => {
    const subscription = suscribirseACalendario(() => {
      cargarEventos();
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const cargarEventos = async () => {
    const filtros = {};
    if (filtroGrado) filtros.grado = filtroGrado;
    if (filtroTipo) filtros.tipo = filtroTipo;
    
    const { data } = await obtenerEventosCalendario(filtros);
    if (data) {
      setEventos(data);
    }
  };

  const handleCrearEvento = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const nuevoEvento = {
      titulo: formData.get('titulo'),
      descripcion: formData.get('descripcion'),
      fecha_inicio: formData.get('fecha_inicio'),
      fecha_fin: formData.get('fecha_fin') || formData.get('fecha_inicio'),
      tipo: formData.get('tipo'),
      grado: formData.get('grado'),
      color: tiposEvento.find(t => t.value === formData.get('tipo'))?.color || '#3b82f6',
      usuario_id: currentUser.id
    };

    if (eventoEditando) {
      const { error } = await actualizarEvento(eventoEditando.id, nuevoEvento);
      if (!error) {
        alert('Evento actualizado exitosamente');
        setMostrarModal(false);
        setEventoEditando(null);
        cargarEventos();
      }
    } else {
      const { data, error } = await crearEvento(nuevoEvento);
      if (!error && data) {
        alert('Evento creado exitosamente');
        setMostrarModal(false);
        cargarEventos();
        
        // Crear notificación para estudiantes del grado
        // (En producción, esto debería hacerse en el backend)
      }
    }

    setLoading(false);
  };

  const handleEliminarEvento = async (id, titulo) => {
    if (!confirm(`¿Eliminar "${titulo}"?`)) return;
    
    setLoading(true);
    const { error } = await eliminarEvento(id);
    if (!error) {
      alert('Evento eliminado');
      cargarEventos();
    }
    setLoading(false);
  };

  const obtenerDiasDelMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay();

    const dias = [];
    
    // Días del mes anterior
    const diasMesAnterior = new Date(año, mes, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      dias.push({
        numero: diasMesAnterior - i,
        esOtroMes: true,
        fecha: new Date(año, mes - 1, diasMesAnterior - i)
      });
    }

    // Días del mes actual
    for (let i = 1; i <= diasEnMes; i++) {
      dias.push({
        numero: i,
        esOtroMes: false,
        fecha: new Date(año, mes, i)
      });
    }

    // Días del mes siguiente
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      dias.push({
        numero: i,
        esOtroMes: true,
        fecha: new Date(año, mes + 1, i)
      });
    }

    return dias;
  };

  const eventosDelDia = (fecha) => {
    return eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha_inicio);
      return (
        fechaEvento.getDate() === fecha.getDate() &&
        fechaEvento.getMonth() === fecha.getMonth() &&
        fechaEvento.getFullYear() === fecha.getFullYear()
      );
    });
  };

  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setFechaActual(nuevaFecha);
  };

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-cyan-600" />
            Calendario de Actividades
          </h2>
          <p className="text-gray-600 mt-1">Gestiona tareas, exámenes y eventos académicos</p>
        </div>

        {(currentUser.rol === 'admin' || currentUser.rol === 'docente') && (
          <button
            onClick={() => {
              setEventoEditando(null);
              setMostrarModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Nuevo Evento
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vista</label>
            <div className="flex gap-2">
              <button
                onClick={() => setVistaCalendario('mes')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  vistaCalendario === 'mes'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📅 Mes
              </button>
              <button
                onClick={() => setVistaCalendario('lista')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  vistaCalendario === 'lista'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📋 Lista
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Grado</label>
            <select
              value={filtroGrado}
              onChange={(e) => setFiltroGrado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Todos los grados</option>
              <option value="6">Grado 6</option>
              <option value="7">Grado 7</option>
              <option value="8">Grado 8</option>
              <option value="9">Grado 9</option>
              <option value="10">Grado 10</option>
              <option value="11">Grado 11</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Todos los tipos</option>
              {tiposEvento.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vista de Calendario Mensual */}
      {vistaCalendario === 'mes' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {/* Controles de navegación */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => cambiarMes(-1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              ← Anterior
            </button>
            <h3 className="text-2xl font-bold text-gray-800">
              {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
            </h3>
            <button
              onClick={() => cambiarMes(1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              Siguiente →
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {diasSemana.map(dia => (
              <div key={dia} className="text-center font-semibold text-gray-600 py-2">
                {dia}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-2">
            {obtenerDiasDelMes().map((dia, index) => {
              const eventosHoy = eventosDelDia(dia.fecha);
              const esHoy = 
                dia.fecha.getDate() === new Date().getDate() &&
                dia.fecha.getMonth() === new Date().getMonth() &&
                dia.fecha.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded-lg transition-all ${
                    dia.esOtroMes
                      ? 'bg-gray-50 text-gray-400'
                      : esHoy
                      ? 'bg-cyan-50 border-cyan-500 border-2'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold mb-1">{dia.numero}</div>
                  <div className="space-y-1">
                    {eventosHoy.slice(0, 3).map(evento => (
                      <div
                        key={evento.id}
                        className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: evento.color + '20', color: evento.color }}
                        title={evento.titulo}
                        onClick={() => {
                          setEventoEditando(evento);
                          setMostrarModal(true);
                        }}
                      >
                        {evento.titulo}
                      </div>
                    ))}
                    {eventosHoy.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{eventosHoy.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista de Lista */}
      {vistaCalendario === 'lista' && (
        <div className="space-y-4">
          {eventos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
              <Calendar size={64} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay eventos programados</p>
            </div>
          ) : (
            eventos.map(evento => (
              <div
                key={evento.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: evento.color }}
                      />
                      <h3 className="text-xl font-bold text-gray-800">{evento.titulo}</h3>
                      <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-full">
                        Grado {evento.grado}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">
                        {tiposEvento.find(t => t.value === evento.tipo)?.label}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{evento.descripcion}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        {new Date(evento.fecha_inicio).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {evento.usuarios && (
                        <div className="flex items-center gap-1">
                          <BookOpen size={16} />
                          Por: {evento.usuarios.nombre}
                        </div>
                      )}
                    </div>
                  </div>

                  {(currentUser.rol === 'admin' || currentUser.id === evento.usuario_id) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEventoEditando(evento);
                          setMostrarModal(true);
                        }}
                        className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleEliminarEvento(evento.id, evento.titulo)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de crear/editar evento */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {eventoEditando ? 'Editar Evento' : 'Nuevo Evento'}
              </h3>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setEventoEditando(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearEvento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  name="titulo"
                  required
                  defaultValue={eventoEditando?.titulo}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  placeholder="Ej: Entrega Proyecto Arduino"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  name="descripcion"
                  rows="3"
                  defaultValue={eventoEditando?.descripcion}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  placeholder="Describe los detalles del evento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                  <select
                    name="tipo"
                    required
                    defaultValue={eventoEditando?.tipo}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Seleccionar...</option>
                    {tiposEvento.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grado *</label>
                  <select
                    name="grado"
                    required
                    defaultValue={eventoEditando?.grado}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="6">Grado 6</option>
                    <option value="7">Grado 7</option>
                    <option value="8">Grado 8</option>
                    <option value="9">Grado 9</option>
                    <option value="10">Grado 10</option>
                    <option value="11">Grado 11</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora Inicio *</label>
                  <input
                    type="datetime-local"
                    name="fecha_inicio"
                    required
                    defaultValue={eventoEditando?.fecha_inicio?.slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora Fin</label>
                  <input
                    type="datetime-local"
                    name="fecha_fin"
                    defaultValue={eventoEditando?.fecha_fin?.slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModal(false);
                    setEventoEditando(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : eventoEditando ? 'Actualizar' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioView;
