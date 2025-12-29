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
