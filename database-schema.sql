-- ============================================
-- ESQUEMA DE BASE DE DATOS SUPABASE
-- Plataforma Educativa - Profesor Fabio Ortiz
-- ============================================

-- Tabla de Usuarios
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'docente', 'estudiante', 'padre')),
  grado VARCHAR(10),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Contenidos
CREATE TABLE contenidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('imagen', 'video', 'enlace', 'documento')),
  titulo VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  descripcion TEXT,
  grado VARCHAR(10) NOT NULL,
  archivo_adjunto TEXT,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Mensajes
CREATE TABLE mensajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  de_usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  para_usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  es_respuesta_auto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_contenidos_grado ON contenidos(grado);
CREATE INDEX idx_contenidos_tipo ON contenidos(tipo);
CREATE INDEX idx_mensajes_de ON mensajes(de_usuario_id);
CREATE INDEX idx_mensajes_para ON mensajes(para_usuario_id);
CREATE INDEX idx_mensajes_fecha ON mensajes(created_at DESC);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contenidos_updated_at BEFORE UPDATE ON contenidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mensajes_updated_at BEFORE UPDATE ON mensajes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE contenidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (todos pueden leer, solo admins pueden crear/actualizar/eliminar)
CREATE POLICY "Usuarios son visibles para todos" ON usuarios
    FOR SELECT USING (true);

CREATE POLICY "Solo admins pueden crear usuarios" ON usuarios
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Solo admins pueden actualizar usuarios" ON usuarios
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Solo admins pueden eliminar usuarios" ON usuarios
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para contenidos
CREATE POLICY "Contenidos son visibles para todos" ON contenidos
    FOR SELECT USING (true);

CREATE POLICY "Admins y docentes pueden crear contenidos" ON contenidos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND rol IN ('admin', 'docente')
        )
    );

CREATE POLICY "Solo creadores pueden actualizar contenidos" ON contenidos
    FOR UPDATE USING (usuario_id = auth.uid());

CREATE POLICY "Solo admins pueden eliminar contenidos" ON contenidos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para mensajes
CREATE POLICY "Usuarios ven sus propios mensajes" ON mensajes
    FOR SELECT USING (
        de_usuario_id = auth.uid() OR para_usuario_id = auth.uid()
    );

CREATE POLICY "Usuarios pueden enviar mensajes" ON mensajes
    FOR INSERT WITH CHECK (de_usuario_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus mensajes" ON mensajes
    FOR UPDATE USING (de_usuario_id = auth.uid() OR para_usuario_id = auth.uid());

CREATE POLICY "Solo admins pueden eliminar mensajes" ON mensajes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Datos iniciales de ejemplo
INSERT INTO usuarios (nombre, email, password, rol, grado) VALUES
('Fabio Alberto Ortiz M', 'fabioortiz37422@sabaneta.edu.co', 'admin123', 'admin', NULL),
('María González', 'maria@ejemplo.com', 'est123', 'estudiante', '10'),
('Pedro Ramírez', 'pedro@ejemplo.com', 'padre123', 'padre', NULL),
('Ana Torres', 'ana@ejemplo.com', 'doc123', 'docente', NULL),
('Carlos Méndez', 'carlos@ejemplo.com', 'est123', 'estudiante', '9'),
('Laura Díaz', 'laura@ejemplo.com', 'est123', 'estudiante', '11');

-- Comentarios de las tablas
COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema educativo';
COMMENT ON TABLE contenidos IS 'Recursos educativos (imágenes, videos, enlaces)';
COMMENT ON TABLE mensajes IS 'Sistema de mensajería entre usuarios';
