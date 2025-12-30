// ForosView.jsx
// Sistema de foros de discusión organizados por grado

import React, { useState, useEffect } from 'react';
import { MessageSquare, Pin, Lock, Eye, Plus, Send, Edit, Trash2, X, ArrowLeft, User } from 'lucide-react';
import {
  obtenerForos,
  obtenerForoPorId,
  crearForo,
  actualizarForo,
  eliminarForo,
  obtenerRespuestasForo,
  crearRespuestaForo,
  actualizarRespuestaForo,
  eliminarRespuestaForo,
  suscribirseAForos,
  suscribirseARespuestasForo
} from './supabaseClient';

const ForosView = ({ currentUser }) => {
  const [foros, setForos] = useState([]);
  const [foroActivo, setForoActivo] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [mostrarModalForo, setMostrarModalForo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroGrado, setFiltroGrado] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [respuestaEditando, setRespuestaEditando] = useState(null);

  useEffect(() => {
    cargarForos();
  }, [filtroGrado]);

  useEffect(() => {
    const subscription = suscribirseAForos(() => {
      cargarForos();
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (foroActivo) {
      cargarRespuestas();
      
      const subscription = suscribirseARespuestasForo(foroActivo.id, () => {
        cargarRespuestas();
      });

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }
  }, [foroActivo]);

  const cargarForos = async () => {
    const filtros = filtroGrado ? { grado: filtroGrado } : {};
    const { data } = await obtenerForos(filtros);
    if (data) {
      setForos(data);
    }
  };

  const cargarRespuestas = async () => {
    if (!foroActivo) return;
    const { data } = await obtenerRespuestasForo(foroActivo.id);
    if (data) {
      setRespuestas(data);
    }
  };

  const handleCrearForo = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const nuevoForo = {
      titulo: formData.get('titulo'),
      descripcion: formData.get('descripcion'),
      grado: formData.get('grado'),
      usuario_id: currentUser.id
    };

    const { error } = await crearForo(nuevoForo);
    if (!error) {
      alert('Foro creado exitosamente');
      setMostrarModalForo(false);
      cargarForos();
    }

    setLoading(false);
  };

  const handleEliminarForo = async (id, titulo) => {
    if (!confirm(`¿Eliminar el foro "${titulo}"?`)) return;
    
    setLoading(true);
    const { error } = await eliminarForo(id);
    if (!error) {
      alert('Foro eliminado');
      setForoActivo(null);
      cargarForos();
    }
    setLoading(false);
  };

  const handleEnviarRespuesta = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    setLoading(true);

    if (respuestaEditando) {
      const { error } = await actualizarRespuestaForo(respuestaEditando.id, {
        contenido: nuevoMensaje
      });
      if (!error) {
        setNuevoMensaje('');
        setRespuestaEditando(null);
        cargarRespuestas();
      }
    } else {
      const nuevaRespuesta = {
        foro_id: foroActivo.id,
        usuario_id: currentUser.id,
        contenido: nuevoMensaje
      };

      const { error } = await crearRespuestaForo(nuevaRespuesta);
      if (!error) {
        setNuevoMensaje('');
        cargarRespuestas();
      }
    }

    setLoading(false);
  };

  const handleEliminarRespuesta = async (id) => {
    if (!confirm('¿Eliminar esta respuesta?')) return;
    
    const { error } = await eliminarRespuestaForo(id);
    if (!error) {
      cargarRespuestas();
    }
  };

  const abrirForo = async (foro) => {
    const { data } = await obtenerForoPorId(foro.id);
    if (data) {
      setForoActivo(data);
    }
  };

  // Vista de lista de foros
  if (!foroActivo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="text-cyan-600" />
              Foros de Discusión
            </h2>
            <p className="text-gray-600 mt-1">Comparte ideas, resuelve dudas y colabora con tu grado</p>
          </div>

          <button
            onClick={() => setMostrarModalForo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Nuevo Foro
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filtrar por grado:</label>
            <select
              value={filtroGrado}
              onChange={(e) => setFiltroGrado(e.target.value)}
              className="flex-1 max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
        </div>

        {/* Lista de foros */}
        <div className="space-y-4">
          {foros.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
              <MessageSquare size={64} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay foros creados todavía</p>
              <p className="text-sm text-gray-400 mt-2">¡Sé el primero en crear uno!</p>
            </div>
          ) : (
            foros.map(foro => (
              <div
                key={foro.id}
                onClick={() => abrirForo(foro)}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {foro.fijado && (
                        <Pin size={18} className="text-cyan-600" />
                      )}
                      {foro.cerrado && (
                        <Lock size={18} className="text-red-600" />
                      )}
                      <h3 className="text-xl font-bold text-gray-800 hover:text-cyan-600 transition-colors">
                        {foro.titulo}
                      </h3>
                      <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-full">
                        Grado {foro.grado}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{foro.descripcion}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User size={16} />
                        {foro.usuarios?.nombre || 'Anónimo'}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={16} />
                        {foro.respuestas?.[0]?.count || 0} respuestas
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={16} />
                        {foro.vistas || 0} vistas
                      </div>
                      <span>
                        {new Date(foro.created_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>

                  {currentUser.rol === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarForo(foro.id, foro.titulo);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de crear foro */}
        {mostrarModalForo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Crear Nuevo Foro</h3>
                <button
                  onClick={() => setMostrarModalForo(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCrearForo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título del Foro *</label>
                  <input
                    type="text"
                    name="titulo"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ej: ¿Dudas sobre Arduino?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    name="descripcion"
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                    placeholder="Describe de qué trata este foro..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grado *</label>
                  <select
                    name="grado"
                    required
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarModalForo(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Creando...' : 'Crear Foro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista detallada del foro
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Encabezado del foro */}
      <div className="mb-6">
        <button
          onClick={() => setForoActivo(null)}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-4"
        >
          <ArrowLeft size={20} />
          Volver a foros
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {foroActivo.fijado && <Pin size={20} className="text-cyan-600" />}
                {foroActivo.cerrado && <Lock size={20} className="text-red-600" />}
                <h2 className="text-2xl font-bold text-gray-800">{foroActivo.titulo}</h2>
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-full">
                  Grado {foroActivo.grado}
                </span>
              </div>
              <p className="text-gray-600 mb-3">{foroActivo.descripcion}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User size={16} />
                  Creado por: {foroActivo.usuarios?.nombre}
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  {foroActivo.vistas} vistas
                </div>
                <span>{new Date(foroActivo.created_at).toLocaleDateString('es-CO')}</span>
              </div>
            </div>

            {currentUser.rol === 'admin' && (
              <button
                onClick={() => handleEliminarForo(foroActivo.id, foroActivo.titulo)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Respuestas */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {respuestas.length} {respuestas.length === 1 ? 'Respuesta' : 'Respuestas'}
        </h3>

        {respuestas.map(respuesta => (
          <div
            key={respuesta.id}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {respuesta.usuarios?.nombre?.charAt(0) || 'U'}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {respuesta.usuarios?.nombre || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(respuesta.created_at).toLocaleString('es-CO')}
                      {respuesta.editado && ' (editado)'}
                    </p>
                  </div>

                  {(currentUser.id === respuesta.usuario_id || currentUser.rol === 'admin') && (
                    <div className="flex gap-2">
                      {currentUser.id === respuesta.usuario_id && (
                        <button
                          onClick={() => {
                            setRespuestaEditando(respuesta);
                            setNuevoMensaje(respuesta.contenido);
                          }}
                          className="p-1 text-cyan-600 hover:bg-cyan-50 rounded"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEliminarRespuesta(respuesta.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 whitespace-pre-wrap">{respuesta.contenido}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de respuesta */}
      {!foroActivo.cerrado && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {respuestaEditando ? 'Editar Respuesta' : 'Escribe tu respuesta'}
          </h3>
          <form onSubmit={handleEnviarRespuesta} className="space-y-4">
            <textarea
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
              placeholder="Comparte tu opinión, responde una pregunta o aporta información..."
              required
            />
            <div className="flex gap-3">
              {respuestaEditando && (
                <button
                  type="button"
                  onClick={() => {
                    setRespuestaEditando(null);
                    setNuevoMensaje('');
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !nuevoMensaje.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Send size={20} />
                {loading ? 'Enviando...' : respuestaEditando ? 'Actualizar' : 'Publicar Respuesta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {foroActivo.cerrado && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <Lock size={24} className="text-yellow-600 mx-auto mb-2" />
          <p className="text-yellow-800 font-medium">Este foro está cerrado para nuevas respuestas</p>
        </div>
      )}
    </div>
  );
};

export default ForosView;
