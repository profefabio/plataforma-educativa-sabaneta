// supabaseClient.js
// Configuración del cliente Supabase para la plataforma educativa

import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: Reemplaza estas credenciales con las tuyas de Supabase
// Las encontrarás en: Settings > API de tu proyecto en Supabase
const supabaseUrl = 'https://sgxuieeoiqzibmaciili.supabase.co'; // Ejemplo: https://xyzcompany.supabase.co
const supabaseAnonKey = 'sb_publishable_8dghD66gxZl20-quUuxneQ_YV8bkfHb'; // La clave pública (anon/public)

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Funciones auxiliares para la base de datos

// ============================================
// USUARIOS
// ============================================

export const obtenerUsuarios = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { data: null, error };
  }
};

export const crearUsuario = async (usuario) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([usuario])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { data: null, error };
  }
};

export const actualizarUsuario = async (id, cambios) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return { data: null, error };
  }
};

export const eliminarUsuario = async (id) => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { error };
  }
};

export const buscarUsuarioPorEmail = async (email, password) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al buscar usuario:', error);
    return { data: null, error };
  }
};

// ============================================
// CONTENIDOS
// ============================================

export const obtenerContenidos = async (filtros = {}) => {
  try {
    let query = supabase
      .from('contenidos')
      .select('*, usuarios:usuario_id(nombre, email)');
    
    if (filtros.grado) {
      query = query.eq('grado', filtros.grado);
    }
    
    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener contenidos:', error);
    return { data: null, error };
  }
};

export const crearContenido = async (contenido) => {
  try {
    const { data, error } = await supabase
      .from('contenidos')
      .insert([contenido])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear contenido:', error);
    return { data: null, error };
  }
};

export const actualizarContenido = async (id, cambios) => {
  try {
    const { data, error } = await supabase
      .from('contenidos')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar contenido:', error);
    return { data: null, error };
  }
};

export const eliminarContenido = async (id) => {
  try {
    const { error } = await supabase
      .from('contenidos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar contenido:', error);
    return { error };
  }
};

// ============================================
// MENSAJES
// ============================================

export const obtenerMensajes = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('mensajes')
      .select(`
        *,
        de_usuario:de_usuario_id(id, nombre, email, rol),
        para_usuario:para_usuario_id(id, nombre, email, rol)
      `)
      .or(`de_usuario_id.eq.${usuarioId},para_usuario_id.eq.${usuarioId}`)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return { data: null, error };
  }
};

export const crearMensaje = async (mensaje) => {
  try {
    const { data, error } = await supabase
      .from('mensajes')
      .insert([mensaje])
      .select(`
        *,
        de_usuario:de_usuario_id(id, nombre, email, rol),
        para_usuario:para_usuario_id(id, nombre, email, rol)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear mensaje:', error);
    return { data: null, error };
  }
};

export const marcarMensajeComoLeido = async (id) => {
  try {
    const { error } = await supabase
      .from('mensajes')
      .update({ leido: true })
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al marcar mensaje como leído:', error);
    return { error };
  }
};

// ============================================
// SUSCRIPCIONES EN TIEMPO REAL
// ============================================

export const suscribirseAMensajes = (usuarioId, callback) => {
  const subscription = supabase
    .channel('mensajes-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mensajes',
        filter: `para_usuario_id=eq.${usuarioId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};

export const suscribirseAContenidos = (callback) => {
  const subscription = supabase
    .channel('contenidos-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'contenidos'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};

export default supabase;

// ============================================
// FUNCIONES ADICIONALES PARA supabaseClient.js
// Agrega estas funciones al archivo existente
// ============================================

// ============================================
// CALENDARIO
// ============================================

export const obtenerEventosCalendario = async (filtros = {}) => {
  try {
    let query = supabase
      .from('calendario')
      .select('*, usuarios:usuario_id(nombre, email, rol)');
    
    if (filtros.grado) {
      query = query.eq('grado', filtros.grado);
    }
    
    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo);
    }
    
    if (filtros.fecha_inicio) {
      query = query.gte('fecha_inicio', filtros.fecha_inicio);
    }
    
    if (filtros.fecha_fin) {
      query = query.lte('fecha_inicio', filtros.fecha_fin);
    }
    
    const { data, error } = await query.order('fecha_inicio', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return { data: null, error };
  }
};

export const crearEvento = async (evento) => {
  try {
    const { data, error } = await supabase
      .from('calendario')
      .insert([evento])
      .select('*, usuarios:usuario_id(nombre, email, rol)')
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear evento:', error);
    return { data: null, error };
  }
};

export const actualizarEvento = async (id, cambios) => {
  try {
    const { data, error } = await supabase
      .from('calendario')
      .update(cambios)
      .eq('id', id)
      .select('*, usuarios:usuario_id(nombre, email, rol)')
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return { data: null, error };
  }
};

export const eliminarEvento = async (id) => {
  try {
    const { error } = await supabase
      .from('calendario')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return { error };
  }
};

// ============================================
// FOROS
// ============================================

export const obtenerForos = async (filtros = {}) => {
  try {
    let query = supabase
      .from('foros')
      .select(`
        *,
        usuarios:usuario_id(nombre, email, rol),
        respuestas:foros_respuestas(count)
      `);
    
    if (filtros.grado) {
      query = query.eq('grado', filtros.grado);
    }
    
    const { data, error } = await query.order('fijado', { ascending: false }).order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener foros:', error);
    return { data: null, error };
  }
};

export const obtenerForoPorId = async (id) => {
  try {
    const { data, error } = await supabase
      .from('foros')
      .select(`
        *,
        usuarios:usuario_id(nombre, email, rol)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Incrementar vistas
    await supabase
      .from('foros')
      .update({ vistas: (data.vistas || 0) + 1 })
      .eq('id', id);
    
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener foro:', error);
    return { data: null, error };
  }
};

export const crearForo = async (foro) => {
  try {
    const { data, error } = await supabase
      .from('foros')
      .insert([foro])
      .select(`
        *,
        usuarios:usuario_id(nombre, email, rol)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear foro:', error);
    return { data: null, error };
  }
};

export const actualizarForo = async (id, cambios) => {
  try {
    const { data, error } = await supabase
      .from('foros')
      .update(cambios)
      .eq('id', id)
      .select(`
        *,
        usuarios:usuario_id(nombre, email, rol)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar foro:', error);
    return { data: null, error };
  }
};

export const eliminarForo = async (id) => {
  try {
    const { error } = await supabase
      .from('foros')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar foro:', error);
    return { error };
  }
};

// ============================================
// RESPUESTAS DE FOROS
// ============================================

export const obtenerRespuestasForo = async (foroId) => {
  try {
    const { data, error } = await supabase
      .from('foros_respuestas')
      .select(`
        *,
        usuarios:usuario_id(nombre, email, rol)
      `)
      .eq('foro_id', foroId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener respuestas:', error);
    return { data: null, error };
  }
};

export const crearRespuestaForo = async (respuesta) => {
  try {
    const { data, error } = await supabase
      .from('foros_respuestas')
      .insert([respuesta])
      .select(`
        *,
        usuarios:usuario_id(nombre, email, rol)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear respuesta:', error);
    return { data: null, error };
  }
};

export const actualizarRespuestaForo = async (id, cambios) => {
  try {
    const { data, error } = await supabase
      .from('foros_respuestas')
      .update({ ...cambios, editado: true })
      .eq('id', id)
      .select(`
        *,
        usuarios:usuario_id(nombre, email, rol)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar respuesta:', error);
    return { data: null, error };
  }
};

export const eliminarRespuestaForo = async (id) => {
  try {
    const { error } = await supabase
      .from('foros_respuestas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar respuesta:', error);
    return { error };
  }
};

// ============================================
// NOTIFICACIONES
// ============================================

export const obtenerNotificaciones = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return { data: null, error };
  }
};

export const contarNotificacionesNoLeidas = async (usuarioId) => {
  try {
    const { count, error } = await supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)
      .eq('leido', false);
    
    if (error) throw error;
    return { count, error: null };
  } catch (error) {
    console.error('Error al contar notificaciones:', error);
    return { count: 0, error };
  }
};

export const marcarNotificacionComoLeida = async (id) => {
  try {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return { error };
  }
};

export const marcarTodasNotificacionesLeidas = async (usuarioId) => {
  try {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .eq('usuario_id', usuarioId)
      .eq('leido', false);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    return { error };
  }
};

export const crearNotificacion = async (notificacion) => {
  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .insert([notificacion])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return { data: null, error };
  }
};

export const eliminarNotificacion = async (id) => {
  try {
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return { error };
  }
};

// ============================================
// SUSCRIPCIONES EN TIEMPO REAL (NUEVAS)
// ============================================

export const suscribirseANotificaciones = (usuarioId, callback) => {
  const subscription = supabase
    .channel('notificaciones-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `usuario_id=eq.${usuarioId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return subscription;
};

export const suscribirseACalendario = (callback) => {
  const subscription = supabase
    .channel('calendario-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'calendario'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};

export const suscribirseAForos = (callback) => {
  const subscription = supabase
    .channel('foros-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'foros'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};

export const suscribirseARespuestasForo = (foroId, callback) => {
  const subscription = supabase
    .channel(`foro-respuestas-${foroId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'foros_respuestas',
        filter: `foro_id=eq.${foroId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};
// ============================================
// FUNCIONES PARA NOTICIAS
// Agregar al final de supabaseClient.js
// ============================================

// ============================================
// NOTICIAS
// ============================================

export const obtenerNoticias = async (filtros = {}) => {
  try {
    let query = supabase
      .from('noticias')
      .select(`
        *,
        autor:autor_id(id, nombre, email, rol)
      `);
    
    if (filtros.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }
    
    if (filtros.destacada !== undefined) {
      query = query.eq('destacada', filtros.destacada);
    }
    
    // Ordenar: destacadas primero, luego por fecha
    const { data, error } = await query
      .order('destacada', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    return { data: null, error };
  }
};

export const obtenerNoticiaPorId = async (id) => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .select(`
        *,
        autor:autor_id(id, nombre, email, rol)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Incrementar contador de vistas
    await supabase
      .from('noticias')
      .update({ vistas: (data.vistas || 0) + 1 })
      .eq('id', id);
    
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener noticia:', error);
    return { data: null, error };
  }
};

export const crearNoticia = async (noticia) => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .insert([noticia])
      .select(`
        *,
        autor:autor_id(id, nombre, email, rol)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear noticia:', error);
    return { data: null, error };
  }
};

export const actualizarNoticia = async (id, cambios) => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .update(cambios)
      .eq('id', id)
      .select(`
        *,
        autor:autor_id(id, nombre, email, rol)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar noticia:', error);
    return { data: null, error };
  }
};

export const eliminarNoticia = async (id) => {
  try {
    const { error } = await supabase
      .from('noticias')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    return { error };
  }
};

export const marcarNoticiaDestacada = async (id, destacada) => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .update({ destacada })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al marcar noticia como destacada:', error);
    return { data: null, error };
  }
};

// ============================================
// SUSCRIPCIONES EN TIEMPO REAL (NOTICIAS)
// ============================================

export const suscribirseANoticias = (callback) => {
  const subscription = supabase
    .channel('noticias-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'noticias'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};


