// NotificacionesComponent.jsx
// Sistema de notificaciones push en tiempo real

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, MessageCircle, Calendar, MessageSquare, AlertCircle, FileText, CheckCheck, Trash2 } from 'lucide-react';
import {
  obtenerNotificaciones,
  contarNotificacionesNoLeidas,
  marcarNotificacionComoLeida,
  marcarTodasNotificacionesLeidas,
  eliminarNotificacion,
  suscribirseANotificaciones
} from './supabaseClient';

const NotificacionesComponent = ({ currentUser, onNotificacionClick }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      cargarNotificaciones();
      contarNoLeidas();

      // Suscripción a notificaciones en tiempo real
      const subscription = suscribirseANotificaciones(currentUser.id, (nuevaNotificacion) => {
        // Agregar notificación al principio
        setNotificaciones(prev => [nuevaNotificacion, ...prev]);
        setNoLeidas(prev => prev + 1);
        
        // Mostrar notificación del navegador si está permitido
        mostrarNotificacionNavegador(nuevaNotificacion);
      });

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }
  }, [currentUser]);

  const cargarNotificaciones = async () => {
    const { data } = await obtenerNotificaciones(currentUser.id);
    if (data) {
      setNotificaciones(data);
    }
  };

  const contarNoLeidas = async () => {
    const { count } = await contarNotificacionesNoLeidas(currentUser.id);
    setNoLeidas(count || 0);
  };

  const handleMarcarLeida = async (notificacion) => {
    if (!notificacion.leido) {
      await marcarNotificacionComoLeida(notificacion.id);
      setNotificaciones(prev =>
        prev.map(n => n.id === notificacion.id ? { ...n, leido: true } : n)
      );
      setNoLeidas(prev => Math.max(0, prev - 1));
    }

    // Si tiene URL, navegar
    if (notificacion.url && onNotificacionClick) {
      onNotificacionClick(notificacion.url);
      setMostrarPanel(false);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    setLoading(true);
    await marcarTodasNotificacionesLeidas(currentUser.id);
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    setNoLeidas(0);
    setLoading(false);
  };

  const handleEliminarNotificacion = async (id, e) => {
    e.stopPropagation();
    await eliminarNotificacion(id);
    setNotificaciones(prev => prev.filter(n => n.id !== id));
    contarNoLeidas();
  };

  const mostrarNotificacionNavegador = (notificacion) => {
    // Verificar si el navegador soporta notificaciones
    if (!("Notification" in window)) {
      return;
    }

    // Verificar permisos
    if (Notification.permission === "granted") {
      new Notification(notificacion.titulo, {
        body: notificacion.mensaje,
        icon: '/icon-notification.png', // Puedes usar tu propio icono
        badge: '/badge.png'
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(notificacion.titulo, {
            body: notificacion.mensaje
          });
        }
      });
    }
  };

  const getIcono = (tipo, icono) => {
    const iconos = {
      'mensaje': MessageCircle,
      'calendario': Calendar,
      'foro': MessageSquare,
      'sistema': AlertCircle,
      'contenido': FileText
    };

    const IconComponent = iconos[tipo] || AlertCircle;
    return <IconComponent size={20} />;
  };

  const getColorTipo = (tipo) => {
    const colores = {
      'mensaje': 'from-blue-500 to-cyan-500',
      'calendario': 'from-orange-500 to-red-500',
      'foro': 'from-purple-500 to-pink-500',
      'sistema': 'from-yellow-500 to-orange-500',
      'contenido': 'from-green-500 to-emerald-500'
    };

    return colores[tipo] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <Bell size={20} className="text-gray-600" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold pulse-animation">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {mostrarPanel && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMostrarPanel(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden slide-down">
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell size={20} />
                  <h3 className="font-bold text-lg">Notificaciones</h3>
                </div>
                <button
                  onClick={() => setMostrarPanel(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              {noLeidas > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-white/20 px-2 py-1 rounded">
                    {noLeidas} sin leer
                  </span>
                  <button
                    onClick={handleMarcarTodasLeidas}
                    disabled={loading}
                    className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors flex items-center gap-1"
                  >
                    <CheckCheck size={14} />
                    Marcar todas como leídas
                  </button>
                </div>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="overflow-y-auto max-h-[500px]">
              {notificaciones.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No tienes notificaciones</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Te avisaremos cuando haya algo nuevo
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notificaciones.map(notificacion => (
                    <div
                      key={notificacion.id}
                      onClick={() => handleMarcarLeida(notificacion)}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                        !notificacion.leido ? 'bg-cyan-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icono */}
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${getColorTipo(notificacion.tipo)} text-white flex-shrink-0`}>
                          {getIcono(notificacion.tipo, notificacion.icono)}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {notificacion.titulo}
                            </h4>
                            {!notificacion.leido && (
                              <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {notificacion.mensaje}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {formatearTiempo(notificacion.created_at)}
                            </span>
                            <button
                              onClick={(e) => handleEliminarNotificacion(notificacion.id, e)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie */}
            {notificaciones.length > 0 && (
              <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                <button
                  onClick={() => {
                    // Aquí podrías abrir una vista completa de notificaciones
                    setMostrarPanel(false);
                  }}
                  className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        .slide-down {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

// Función auxiliar para formatear el tiempo
const formatearTiempo = (fecha) => {
  const ahora = new Date();
  const tiempo = new Date(fecha);
  const diferencia = Math.floor((ahora - tiempo) / 1000); // en segundos

  if (diferencia < 60) {
    return 'Hace un momento';
  } else if (diferencia < 3600) {
    const minutos = Math.floor(diferencia / 60);
    return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  } else if (diferencia < 86400) {
    const horas = Math.floor(diferencia / 3600);
    return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  } else if (diferencia < 604800) {
    const dias = Math.floor(diferencia / 86400);
    return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  } else {
    return tiempo.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short'
    });
  }
};

export default NotificacionesComponent;
