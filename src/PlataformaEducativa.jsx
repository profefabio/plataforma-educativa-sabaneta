
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, Link, Users, MessageCircle, Send, Upload, LogOut, Home, BookOpen, Settings, Plus, X, Check, Search, Bell, Trash2, Edit, Calendar, MessageSquare } from 'lucide-react';
import {
  supabase,
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  buscarUsuarioPorEmail,
  obtenerContenidos,
  crearContenido,
  eliminarContenido,
  obtenerMensajes,
  crearMensaje,
  suscribirseAMensajes,
  suscribirseAContenidos,
  obtenerEventosCalendario,
  obtenerForos,
  obtenerNotificaciones,
  suscribirseANotificaciones
} from './supabaseClient';

import CalendarioView from './CalendarioView';
import ForosView from './ForosView';
import NotificacionesComponent from './NotificacionesComponent';

const PlataformaEducativa = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('login');
  const [users, setUsers] = useState([]);
  const [contenidos, setContenidos] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [chatActivo, setChatActivo] = useState(null);
  const [notificaciones, setNotificaciones] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [foros, setForos] = useState([]);

  // Respuestas automáticas predefinidas
  const respuestasAutomaticas = [
    { pregunta: 'horario', respuesta: 'Las clases de tecnología son: Lunes, Miércoles y Viernes de 8:00am a 10:00am para grados 6-8, y de 10:00am a 12:00pm para grados 9-11.' },
    { pregunta: 'materiales', respuesta: 'Los materiales necesarios son: cuaderno, lápiz, acceso a computador. Para proyectos STEM específicos, se avisará con anticipación.' },
    { pregunta: 'tarea', respuesta: 'Puedes consultar las tareas pendientes en la sección de Contenidos. Revisa el material de tu grado.' },
    { pregunta: 'proyecto', respuesta: 'Los proyectos actuales están publicados en Contenidos. Cada proyecto incluye reto, metodología STEM+ y rúbrica de evaluación.' },
    { pregunta: 'evaluación', respuesta: 'Las evaluaciones combinan teoría (30%), práctica (50%) y proyecto final (20%). Se usa gamificación con sistema de puntos.' },
    { pregunta: 'contacto', respuesta: 'Puedes contactarme por este chat, email: fabioortiz37422@sabaneta.edu.co, o en horario de clase.' }
  ];

  const chatEndRef = useRef(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Scroll automático en chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes]);

  // Suscripciones en tiempo real
  useEffect(() => {
    if (!currentUser) return;

    const mensajesSubscription = suscribirseAMensajes(currentUser.id, (payload) => {
      console.log('Nuevo mensaje recibido:', payload);
      cargarMensajes();
    });

    const contenidosSubscription = suscribirseAContenidos((payload) => {
      console.log('Contenido actualizado:', payload);
      cargarContenidos();
    });

    return () => {
      supabase.removeChannel(mensajesSubscription);
      supabase.removeChannel(contenidosSubscription);
    };
  }, [currentUser]);

  const cargarDatos = async () => {
    await Promise.all([
      cargarUsuarios(),
      cargarContenidos()
    ]);
  };

  const cargarUsuarios = async () => {
    const { data, error } = await obtenerUsuarios();
    if (!error && data) {
      setUsers(data);
    }
  };

  const cargarContenidos = async () => {
    const { data, error } = await obtenerContenidos();
    if (!error && data) {
      setContenidos(data);
    }
  };

  const cargarMensajes = async () => {
    if (!currentUser) return;
    const { data, error } = await obtenerMensajes(currentUser.id);
    if (!error && data) {
      setMensajes(data);
      // Contar mensajes no leídos
      const noLeidos = data.filter(m => 
        !m.leido && m.para_usuario_id === currentUser.id
      ).length;
      setNotificaciones(noLeidos);
    }
  };

  useEffect(() => {
    if (currentUser) {
      cargarMensajes();
    }
  }, [currentUser]);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      const { data: eventosData } = await obtenerEventosCalendario();
      const { data: forosData } = await obtenerForos();
      if (eventosData) setEventos(eventosData);
      if (forosData) setForos(forosData);
    };
    cargarEstadisticas();
  }, []);

  const detectarRespuestaAutomatica = (mensaje) => {
    const mensajeLower = mensaje.toLowerCase();
    for (let ra of respuestasAutomaticas) {
      const similitud = calcularSimilitud(mensajeLower, ra.pregunta);
      if (similitud >= 0.9) {
        return ra.respuesta;
      }
    }
    return null;
  };

  const calcularSimilitud = (texto, palabraClave) => {
    const palabrasTexto = texto.split(' ');
    if (palabrasTexto.includes(palabraClave)) return 1.0;
    
    let coincidencias = 0;
    palabrasTexto.forEach(palabra => {
      if (palabraClave.includes(palabra) || palabra.includes(palabraClave)) {
        coincidencias++;
      }
    });
    
    return coincidencias > 0 ? Math.min(coincidencias / palabrasTexto.length, 1.0) : 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    const { data, error } = await buscarUsuarioPorEmail(email, password);
    
    if (!error && data) {
      setCurrentUser(data);
      setActiveView('home');
    } else {
      alert('Credenciales incorrectas');
    }
    
    setLoading(false);
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const nuevoUsuario = {
      nombre: e.target.nombre.value,
      email: e.target.email.value,
      password: e.target.password.value,
      rol: e.target.rol.value,
      grado: e.target.grado?.value || null
    };
    
    const { data, error } = await crearUsuario(nuevoUsuario);
    
    if (!error && data) {
      alert('Usuario registrado exitosamente');
      setActiveView('login');
      await cargarUsuarios();
    } else {
      alert('Error al registrar usuario: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleEliminarUsuario = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}"?`)) {
      return;
    }
    
    setLoading(true);
    const { error } = await eliminarUsuario(id);
    
    if (!error) {
      alert('Usuario eliminado exitosamente');
      await cargarUsuarios();
    } else {
      alert('Error al eliminar usuario: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleActualizarUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const cambios = {
      nombre: e.target.nombre.value,
      email: e.target.email.value,
      rol: e.target.rol.value,
      grado: e.target.grado?.value || null
    };
    
    if (e.target.password.value) {
      cambios.password = e.target.password.value;
    }
    
    const { error } = await actualizarUsuario(usuarioEditando.id, cambios);
    
    if (!error) {
      alert('Usuario actualizado exitosamente');
      setUsuarioEditando(null);
      await cargarUsuarios();
    } else {
      alert('Error al actualizar usuario: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleSubirContenido = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const nuevoContenido = {
      tipo: e.target.tipo.value,
      titulo: e.target.titulo.value,
      url: e.target.url.value,
      descripcion: e.target.descripcion.value,
      grado: e.target.grado.value,
      usuario_id: currentUser.id
    };
    
    const { data, error } = await crearContenido(nuevoContenido);
    
    if (!error && data) {
      alert('Contenido subido exitosamente');
      e.target.reset();
      await cargarContenidos();
    } else {
      alert('Error al subir contenido: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleEliminarContenido = async (id, titulo) => {
    if (!confirm(`¿Estás seguro de eliminar "${titulo}"?`)) {
      return;
    }
    
    setLoading(true);
    const { error } = await eliminarContenido(id);
    
    if (!error) {
      alert('Contenido eliminado exitosamente');
      await cargarContenidos();
    } else {
      alert('Error al eliminar contenido: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;

    const mensajeData = {
      de_usuario_id: currentUser.id,
      para_usuario_id: chatActivo.id,
      mensaje: nuevoMensaje,
      leido: false,
      es_respuesta_auto: false
    };

    const { data, error } = await crearMensaje(mensajeData);

    if (!error && data) {
      // Detectar respuesta automática
      const respuestaAuto = detectarRespuestaAutomatica(nuevoMensaje);
      if (respuestaAuto && currentUser.rol !== 'admin') {
        setTimeout(async () => {
          const mensajeAutoData = {
            de_usuario_id: users.find(u => u.rol === 'admin').id,
            para_usuario_id: currentUser.id,
            mensaje: `🤖 Respuesta automática: ${respuestaAuto}`,
            leido: false,
            es_respuesta_auto: true
          };
          await crearMensaje(mensajeAutoData);
        }, 1000);
      }
      
      setNuevoMensaje('');
      await cargarMensajes();
    }
  };

  // Componente de Login
  const LoginView = () => (
    <div className="min-h-screen flex items-center justify-center p-4 login-bg">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 fade-in">
          <div className="inline-block p-3 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mb-4 float-animation">
            <BookOpen size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 title-text">EduTech Sabaneta</h1>
          <p className="text-cyan-100 text-sm">Plataforma Educativa STEM+ con Supabase</p>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 slide-up">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="tu@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                name="password"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setActiveView('registro')}
              className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
            >
              ¿No tienes cuenta? Regístrate aquí
            </button>
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
            <p className="text-xs text-gray-600 font-semibold mb-2">💾 Base de datos real con Supabase</p>
            <p className="text-xs text-gray-500">Persistencia garantizada y tiempo real</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente de Registro
  const RegistroView = () => (
    <div className="min-h-screen flex items-center justify-center p-4 login-bg">
      <div className="max-w-md w-full">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 slide-up">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Registro de Usuario</h2>
          
          <form onSubmit={handleRegistro} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
              <input
                type="text"
                name="nombre"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                name="password"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <select
                name="rol"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="estudiante">Estudiante</option>
                <option value="padre">Padre de Familia</option>
                <option value="docente">Docente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grado (solo estudiantes)</label>
              <select
                name="grado"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">N/A</option>
                <option value="6">Grado 6</option>
                <option value="7">Grado 7</option>
                <option value="8">Grado 8</option>
                <option value="9">Grado 9</option>
                <option value="10">Grado 10</option>
                <option value="11">Grado 11</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveView('login')}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Modal de Edición de Usuario
  const ModalEditarUsuario = () => {
    if (!usuarioEditando) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Editar Usuario</h3>
            <button
              onClick={() => setUsuarioEditando(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleActualizarUsuario} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
              <input
                type="text"
                name="nombre"
                defaultValue={usuarioEditando.nombre}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={usuarioEditando.email}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña (opcional)</label>
              <input
                type="password"
                name="password"
                disabled={loading}
                placeholder="Dejar vacío para no cambiar"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <select
                name="rol"
                defaultValue={usuarioEditando.rol}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="estudiante">Estudiante</option>
                <option value="padre">Padre de Familia</option>
                <option value="docente">Docente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grado</label>
              <select
                name="grado"
                defaultValue={usuarioEditando.grado || ''}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">N/A</option>
                <option value="6">Grado 6</option>
                <option value="7">Grado 7</option>
                <option value="8">Grado 8</option>
                <option value="9">Grado 9</option>
                <option value="10">Grado 10</option>
                <option value="11">Grado 11</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Navegación principal
  const NavBar = () => (
  <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 title-text">EduTech Sabaneta</h1>
            <p className="text-xs text-gray-500">Profesor Fabio Ortiz • Supabase</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Componente de Notificaciones */}
          <NotificacionesComponent 
            currentUser={currentUser}
            onNotificacionClick={(url) => {
              // Manejar navegación si es necesario
              console.log('Navegar a:', url);
            }}
          />
          
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {currentUser.nombre.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{currentUser.nombre}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser.rol}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentUser(null);
              setActiveView('login');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  </nav>
);

  // Menú lateral
  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <div className="space-y-2">
        <button
          onClick={() => setActiveView('home')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'home' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Home size={20} />
          <span className="font-medium">Inicio</span>
        </button>

        <button
          onClick={() => setActiveView('contenidos')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'contenidos' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <BookOpen size={20} />
          <span className="font-medium">Contenidos</span>
        </button>

        <button
          onClick={() => setActiveView('chat')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'chat' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <MessageCircle size={20} />
          <span className="font-medium">Mensajes</span>
          {notificaciones > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {notificaciones}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('calendario')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'calendario' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Calendar size={20} />
          <span className="font-medium">Calendario</span>
        </button>

        <button
          onClick={() => setActiveView('foros')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'foros' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <MessageSquare size={20} />
          <span className="font-medium">Foros</span>
        </button>

        {currentUser.rol === 'admin' && (
          <>
            <button
              onClick={() => setActiveView('subir')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeView === 'subir' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Upload size={20} />
              <span className="font-medium">Subir Contenido</span>
            </button>

            <button
              onClick={() => setActiveView('usuarios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeView === 'usuarios' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Users size={20} />
              <span className="font-medium">Usuarios</span>
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Vista Home
  const HomeView = () => (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 fade-in">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          ¡Bienvenido, {currentUser.nombre}! 👋
        </h2>
        <p className="text-gray-600">Plataforma educativa con metodología STEM+ y Supabase en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-2xl border border-cyan-100 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500 rounded-xl">
              <BookOpen size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-cyan-600">{contenidos.length}</span>
          </div>
          <h3 className="font-semibold text-gray-800">Contenidos</h3>
          <p className="text-sm text-gray-600">Recursos educativos</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-xl">
              <Users size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-purple-600">{users.length}</span>
          </div>
          <h3 className="font-semibold text-gray-800">Usuarios</h3>
          <p className="text-sm text-gray-600">Comunidad activa</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <MessageCircle size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-orange-600">{mensajes.length}</span>
          </div>
          <h3 className="font-semibold text-gray-800">Mensajes</h3>
          <p className="text-sm text-gray-600">Conversaciones</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Últimos Contenidos</h3>
        <div className="space-y-4">
          {contenidos.slice(0, 3).map(contenido => (
            <div key={contenido.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
              <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg">
                {contenido.tipo === 'imagen' && <Camera size={20} className="text-white" />}
                {contenido.tipo === 'video' && <Video size={20} className="text-white" />}
                {contenido.tipo === 'enlace' && <Link size={20} className="text-white" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{contenido.titulo}</h4>
                <p className="text-sm text-gray-600">{contenido.descripcion}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Grado {contenido.grado} • {new Date(contenido.created_at).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 card-hover">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500 rounded-xl">
            <Calendar size={24} className="text-white" />
          </div>
          <span className="text-3xl font-bold text-green-600">{eventos.length}</span>
        </div>
        <h3 className="font-semibold text-gray-800">Eventos</h3>
        <p className="text-sm text-gray-600">Calendario activo</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 card-hover">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-indigo-500 rounded-xl">
            <MessageSquare size={24} className="text-white" />
          </div>
          <span className="text-3xl font-bold text-indigo-600">{foros.length}</span>
        </div>
        <h3 className="font-semibold text-gray-800">Foros</h3>
        <p className="text-sm text-gray-600">Discusiones activas</p>
      </div>

    </div>
  );

  // Vista de Contenidos
  const ContenidosView = () => (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Recursos Educativos</h2>
        
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar contenidos..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <select className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contenidos.map(contenido => (
          <div key={contenido.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 card-hover">
            {contenido.tipo === 'imagen' && (
              <div className="h-48 bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                <Camera size={48} className="text-cyan-600" />
              </div>
            )}
            {contenido.tipo === 'video' && (
              <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Video size={48} className="text-purple-600" />
              </div>
            )}
            {contenido.tipo === 'enlace' && (
              <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <Link size={48} className="text-orange-600" />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-full">
                  Grado {contenido.grado}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full capitalize">
                  {contenido.tipo}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{contenido.titulo}</h3>
              <p className="text-sm text-gray-600 mb-4">{contenido.descripcion}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(contenido.created_at).toLocaleDateString('es-CO')}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open(contenido.url, '_blank')}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm rounded-lg hover:shadow-lg transition-all"
                  >
                    Ver más
                  </button>
                  {currentUser.rol === 'admin' && (
                    <button
                      onClick={() => handleEliminarContenido(contenido.id, contenido.titulo)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Vista de Chat
  const ChatView = () => {
    const conversaciones = Array.from(new Set(
      mensajes.map(m => m.de_usuario_id === currentUser.id ? m.para_usuario_id : m.de_usuario_id)
    )).map(id => users.find(u => u.id === id)).filter(Boolean);

    const mensajesActuales = chatActivo
      ? mensajes.filter(m => 
          (m.de_usuario_id === currentUser.id && m.para_usuario_id === chatActivo.id) ||
          (m.de_usuario_id === chatActivo.id && m.para_usuario_id === currentUser.id)
        )
      : [];

    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Conversaciones</h3>
          </div>
          <div className="overflow-y-auto h-full">
            {conversaciones.map(usuario => (
              <div
                key={usuario.id}
                onClick={() => setChatActivo(usuario)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all ${
                  chatActivo?.id === usuario.id ? 'bg-cyan-50 border-l-4 border-cyan-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {usuario.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{usuario.nombre}</h4>
                    <p className="text-sm text-gray-500 capitalize">{usuario.rol}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {currentUser.rol === 'admin' && (
              <div className="p-4">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  + Nueva Conversación
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-gray-50">
          {chatActivo ? (
            <>
              <div className="p-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {chatActivo.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{chatActivo.nombre}</h3>
                    <p className="text-sm text-gray-500 capitalize">{chatActivo.rol}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {mensajesActuales.map(mensaje => {
                  const esMio = mensaje.de_usuario_id === currentUser.id;
                  return (
                    <div
                      key={mensaje.id}
                      className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl ${
                          esMio
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            : mensaje.es_respuesta_auto
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800 border border-purple-200'
                            : 'bg-white text-gray-800 border border-gray-200'
                        } ${mensaje.es_respuesta_auto ? 'message-auto' : 'message-appear'}`}
                      >
                        <p className="text-sm">{mensaje.mensaje}</p>
                        <p className={`text-xs mt-2 ${esMio ? 'text-cyan-100' : 'text-gray-500'}`}>
                          {new Date(mensaje.created_at).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensaje()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleEnviarMensaje}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    <Send size={20} />
                  </button>
                </div>
                {currentUser.rol !== 'admin' && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    💡 Las preguntas frecuentes reciben respuesta automática instantánea
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={64} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona una conversación para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vista de Subir Contenido
  const SubirView = () => (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Subir Nuevo Contenido</h2>
        
        <form onSubmit={handleSubirContenido} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Contenido</label>
            <select
              name="tipo"
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="imagen">📷 Imagen / Fotografía</option>
              <option value="video">🎥 Video</option>
              <option value="enlace">🔗 Enlace / Link</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
            <input
              type="text"
              name="titulo"
              required
              disabled={loading}
              placeholder="Ej: Introducción a Arduino"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL / Enlace</label>
            <input
              type="url"
              name="url"
              required
              disabled={loading}
              placeholder="https://ejemplo.com/recurso"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea
              name="descripcion"
              required
              disabled={loading}
              rows="4"
              placeholder="Describe el contenido, objetivos del reto, metodología STEM+..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grado</label>
            <select
              name="grado"
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">Seleccionar grado...</option>
              <option value="6">Grado 6</option>
              <option value="7">Grado 7</option>
              <option value="8">Grado 8</option>
              <option value="9">Grado 9</option>
              <option value="10">Grado 10</option>
              <option value="11">Grado 11</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? 'Subiendo...' : '📤 Subir Contenido'}
          </button>
        </form>
      </div>
    </div>
  );

  // Vista de Usuarios
  const UsuariosView = () => (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
        <button
          onClick={() => setActiveView('registro')}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Usuario</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rol</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Grado</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(usuario => (
              <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {usuario.nombre.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800">{usuario.nombre}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{usuario.email}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-full capitalize">
                    {usuario.rol}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {usuario.grado || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUsuarioEditando(usuario)}
                      className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    {usuario.rol !== 'admin' && (
                      <button
                        onClick={() => handleEliminarUsuario(usuario.id, usuario.nombre)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Renderizado condicional
  if (!currentUser) {
    return activeView === 'login' ? <LoginView /> : <RegistroView />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        
        * {
          font-family: 'Poppins', sans-serif;
        }
        
        .title-text {
          font-family: 'Poppins', sans-serif;
          letter-spacing: -0.02em;
        }
        
        .login-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .slide-up {
          animation: slideUp 0.6s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .message-appear {
          animation: messageAppear 0.3s ease-out;
        }
        
        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .message-auto {
          animation: messageAuto 0.5s ease-out;
        }
        
        @keyframes messageAuto {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #0891b2, #2563eb);
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            {activeView === 'home' && <HomeView />}
            {activeView === 'contenidos' && <ContenidosView />}
            {activeView === 'chat' && <ChatView />}
            {activeView === 'calendario' && <CalendarioView currentUser={currentUser} />}
            {activeView === 'foros' && <ForosView currentUser={currentUser} />}
            {activeView === 'subir' && <SubirView />}
            {activeView === 'usuarios' && <UsuariosView />}
          </div>
        </div>
        <ModalEditarUsuario />
      </div>
    </>
  );
};

export default PlataformaEducativa;

