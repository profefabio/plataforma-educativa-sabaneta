// NoticiasView.jsx
// Sistema de noticias y comunicados institucionales

import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Edit, Trash2, X, Eye, Star, ArrowLeft, Clock, User, Tag } from 'lucide-react';
import {
  obtenerNoticias,
  obtenerNoticiaPorId,
  crearNoticia,
  actualizarNoticia,
  eliminarNoticia,
  marcarNoticiaDestacada,
  suscribirseANoticias
} from './supabaseClient';

const NoticiasView = ({ currentUser }) => {
  const [noticias, setNoticias] = useState([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [noticiaEditando, setNoticiaEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const categorias = [
    { value: 'academico', label: '📚 Académico', color: 'bg-blue-100 text-blue-700' },
    { value: 'deportivo', label: '⚽ Deportivo', color: 'bg-green-100 text-green-700' },
    { value: 'cultural', label: '🎭 Cultural', color: 'bg-purple-100 text-purple-700' },
    { value: 'general', label: '📢 General', color: 'bg-gray-100 text-gray-700' }
  ];

  useEffect(() => {
    cargarNoticias();
  }, [filtroCategoria]);

  useEffect(() => {
    const subscription = suscribirseANoticias(() => {
      cargarNoticias();
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const cargarNoticias = async () => {
    const filtros = filtroCategoria ? { categoria: filtroCategoria } : {};
    const { data } = await obtenerNoticias(filtros);
    if (data) {
      setNoticias(data);
    }
  };

  const handleVerDetalle = async (noticia) => {
    const { data } = await obtenerNoticiaPorId(noticia.id);
    if (data) {
      setNoticiaSeleccionada(data);
    }
  };

  const handleCrearNoticia = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const nuevaNoticia = {
      titulo: formData.get('titulo'),
      contenido: formData.get('contenido'),
      imagen_url: formData.get('imagen_url'),
      categoria: formData.get('categoria'),
      destacada: formData.get('destacada') === 'on',
      autor_id: currentUser.id
    };

    if (noticiaEditando) {
      const { error } = await actualizarNoticia(noticiaEditando.id, nuevaNoticia);
      if (!error) {
        alert('Noticia actualizada exitosamente');
        setMostrarModal(false);
        setNoticiaEditando(null);
        cargarNoticias();
      }
    } else {
      const { error } = await crearNoticia(nuevaNoticia);
      if (!error) {
        alert('Noticia creada exitosamente');
        setMostrarModal(false);
        cargarNoticias();
      }
    }

    setLoading(false);
  };

  const handleEliminarNoticia = async (id, titulo) => {
    if (!confirm(`¿Eliminar la noticia "${titulo}"?`)) return;
    
    setLoading(true);
    const { error } = await eliminarNoticia(id);
    if (!error) {
      alert('Noticia eliminada');
      setNoticiaSeleccionada(null);
      cargarNoticias();
    }
    setLoading(false);
  };

  const handleMarcarDestacada = async (id, destacada) => {
    const { error } = await marcarNoticiaDestacada(id, !destacada);
    if (!error) {
      cargarNoticias();
      if (noticiaSeleccionada && noticiaSeleccionada.id === id) {
        setNoticiaSeleccionada({ ...noticiaSeleccionada, destacada: !destacada });
      }
    }
  };

  const getCategoriaInfo = (categoria) => {
    return categorias.find(c => c.value === categoria) || categorias[3];
  };

  // Vista de detalle de noticia
  if (noticiaSeleccionada) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Botón volver */}
        <button
          onClick={() => setNoticiaSeleccionada(null)}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-6"
        >
          <ArrowLeft size={20} />
          Volver a noticias
        </button>

        {/* Noticia completa */}
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Imagen de portada */}
          {noticiaSeleccionada.imagen_url && (
            <div className="relative h-96 overflow-hidden">
              <img
                src={noticiaSeleccionada.imagen_url}
                alt={noticiaSeleccionada.titulo}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1585241645927-c7a8e5840c42';
                }}
              />
              {noticiaSeleccionada.destacada && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  <Star size={16} fill="white" />
                  <span className="font-semibold">Destacada</span>
                </div>
              )}
            </div>
          )}

          <div className="p-8">
            {/* Categoría y fecha */}
            <div className="flex items-center gap-4 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoriaInfo(noticiaSeleccionada.categoria).color}`}>
                {getCategoriaInfo(noticiaSeleccionada.categoria).label}
              </span>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock size={16} />
                {new Date(noticiaSeleccionada.created_at).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Eye size={16} />
                {noticiaSeleccionada.vistas} vistas
              </div>
            </div>

            {/* Título */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {noticiaSeleccionada.titulo}
            </h1>

            {/* Autor */}
            {noticiaSeleccionada.autor && (
              <div className="flex items-center gap-2 text-gray-600 mb-6 pb-6 border-b">
                <User size={18} />
                <span>Por: <strong>{noticiaSeleccionada.autor.nombre}</strong></span>
              </div>
            )}

            {/* Contenido */}
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {noticiaSeleccionada.contenido}
              </p>
            </div>

            {/* Acciones (admin/docente) */}
            {(currentUser.rol === 'admin' || currentUser.rol === 'docente') && (
              <div className="flex gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => handleMarcarDestacada(noticiaSeleccionada.id, noticiaSeleccionada.destacada)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    noticiaSeleccionada.destacada
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star size={18} fill={noticiaSeleccionada.destacada ? 'currentColor' : 'none'} />
                  {noticiaSeleccionada.destacada ? 'Quitar destacada' : 'Marcar destacada'}
                </button>
                <button
                  onClick={() => {
                    setNoticiaEditando(noticiaSeleccionada);
                    setMostrarModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-all"
                >
                  <Edit size={18} />
                  Editar
                </button>
                <button
                  onClick={() => handleEliminarNoticia(noticiaSeleccionada.id, noticiaSeleccionada.titulo)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </article>
      </div>
    );
  }

  // Vista de lista de noticias
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Newspaper className="text-cyan-600" />
            Noticias y Comunicados
          </h2>
          <p className="text-gray-600 mt-1">Mantente informado sobre lo que pasa en el colegio</p>
        </div>

        {(currentUser.rol === 'admin' || currentUser.rol === 'docente') && (
          <button
            onClick={() => {
              setNoticiaEditando(null);
              setMostrarModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Nueva Noticia
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Filtrar por categoría:</label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroCategoria('')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filtroCategoria === ''
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categorias.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFiltroCategoria(cat.value)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filtroCategoria === cat.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de noticias */}
      {noticias.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
          <Newspaper size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay noticias publicadas todavía</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {noticias.map(noticia => (
            <article
              key={noticia.id}
              onClick={() => handleVerDetalle(noticia)}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer group"
            >
              {/* Imagen */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-cyan-100 to-blue-100">
                {noticia.imagen_url ? (
                  <img
                    src={noticia.imagen_url}
                    alt={noticia.titulo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1585241645927-c7a8e5840c42';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper size={48} className="text-gray-300" />
                  </div>
                )}
                {noticia.destacada && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white p-2 rounded-full shadow-lg">
                    <Star size={16} fill="white" />
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-6">
                {/* Categoría */}
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getCategoriaInfo(noticia.categoria).color}`}>
                  {getCategoriaInfo(noticia.categoria).label}
                </span>

                {/* Título */}
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                  {noticia.titulo}
                </h3>

                {/* Extracto */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {noticia.contenido}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(noticia.created_at).toLocaleDateString('es-CO')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    {noticia.vistas}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal de crear/editar noticia */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {noticiaEditando ? 'Editar Noticia' : 'Nueva Noticia'}
              </h3>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setNoticiaEditando(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearNoticia} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  name="titulo"
                  required
                  defaultValue={noticiaEditando?.titulo}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  placeholder="Ej: Inauguración del Laboratorio STEM+"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contenido *</label>
                <textarea
                  name="contenido"
                  rows="8"
                  required
                  defaultValue={noticiaEditando?.contenido}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  placeholder="Escribe el contenido completo de la noticia..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de Imagen</label>
                <input
                  type="url"
                  name="imagen_url"
                  defaultValue={noticiaEditando?.imagen_url}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Puedes usar imágenes de Unsplash, Pexels, etc.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                  <select
                    name="categoria"
                    required
                    defaultValue={noticiaEditando?.categoria}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destacar</label>
                  <div className="flex items-center h-full">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="destacada"
                        defaultChecked={noticiaEditando?.destacada}
                        className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                      />
                      <span className="text-sm text-gray-700">Marcar como destacada</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModal(false);
                    setNoticiaEditando(null);
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
                  {loading ? 'Guardando...' : noticiaEditando ? 'Actualizar' : 'Publicar Noticia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticiasView;
