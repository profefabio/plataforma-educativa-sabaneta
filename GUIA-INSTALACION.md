# 📚 Guía de Instalación - Plataforma Educativa con Supabase
## Profesor Fabio Alberto Ortiz M - Sabaneta

---

## 🎯 PASO 1: Crear Cuenta en Supabase (GRATIS)

1. Ve a: **https://supabase.com**
2. Haz clic en **"Start your project"**
3. Regístrate con tu email o GitHub (GRATIS)
4. Confirma tu email

---

## 🗄️ PASO 2: Crear tu Proyecto en Supabase

1. Una vez dentro, haz clic en **"New Project"**
2. Configura:
   - **Name**: `plataforma-educativa-sabaneta`
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: South America (São Paulo) - más cercano a Colombia
   - **Pricing Plan**: FREE (0 USD/mes)
3. Haz clic en **"Create new project"**
4. Espera 1-2 minutos mientras se crea

---

## 📊 PASO 3: Crear las Tablas en la Base de Datos

1. En el menú lateral, ve a **"SQL Editor"**
2. Haz clic en **"+ New query"**
3. Copia y pega TODO el contenido del archivo `database-schema.sql`
4. Haz clic en **"Run"** (▶️) en la esquina inferior derecha
5. ✅ Deberías ver: "Success. No rows returned"

---

## 🔑 PASO 4: Obtener tus Credenciales API

1. En el menú lateral, ve a **"Settings"** (⚙️)
2. Haz clic en **"API"**
3. Encontrarás dos valores importantes:

### **Project URL**
```
https://tuproyectoid.supabase.co
```

### **anon/public key**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi...
```

⚠️ **COPIA ESTOS DOS VALORES - Los necesitarás en el siguiente paso**

---

## ⚙️ PASO 5: Configurar el Código

1. Abre el archivo `supabaseClient.js`
2. Busca estas líneas (líneas 6-7):
```javascript
const supabaseUrl = 'TU_SUPABASE_URL';
const supabaseAnonKey = 'TU_SUPABASE_ANON_KEY';
```

3. Reemplázalas con tus valores:
```javascript
const supabaseUrl = 'https://tuproyectoid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

4. **Guarda el archivo**

---

## 💻 PASO 6: Instalar el Proyecto Localmente

### Opción A: Con Node.js instalado

1. Abre la terminal/CMD en la carpeta del proyecto
2. Ejecuta:
```bash
npm install
```
3. Luego:
```bash
npm run dev
```
4. Abre tu navegador en: **http://localhost:5173**

### Opción B: Sin instalación - Usar StackBlitz

1. Ve a: **https://stackblitz.com**
2. Haz clic en **"New Project"** → **"React"**
3. Elimina todo el código de `App.jsx`
4. Copia y pega el código de `plataforma-educativa-supabase.jsx`
5. Crea un archivo nuevo: `supabaseClient.js`
6. Copia y pega el código (con TUS credenciales)
7. Instala la dependencia en la terminal de StackBlitz:
```bash
npm install @supabase/supabase-js lucide-react
```
8. ¡Listo! La app funcionará en StackBlitz

---

## 🌐 PASO 7: Subir a Producción (Vercel - GRATIS)

### Requisitos previos:
- Cuenta en GitHub
- Tu código subido a un repositorio de GitHub

### Pasos:

1. Ve a: **https://vercel.com**
2. Haz clic en **"Sign Up"** y usa tu cuenta de GitHub
3. Haz clic en **"Add New Project"**
4. Importa tu repositorio de GitHub
5. Configura:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Haz clic en **"Deploy"**
7. Espera 1-2 minutos
8. ✅ ¡Tu plataforma está ONLINE!

Tu URL será algo como: `plataforma-educativa.vercel.app`

---

## 📁 Estructura de Archivos del Proyecto

```
plataforma-educativa/
├── src/
│   ├── App.jsx                              ← Componente principal
│   ├── supabaseClient.js                    ← Configuración Supabase
│   └── main.jsx                             ← Punto de entrada
├── public/
├── database-schema.sql                      ← Schema de base de datos
├── package.json                             ← Dependencias
├── vite.config.js                           ← Configuración Vite
├── tailwind.config.js                       ← Configuración Tailwind
├── index.html                               ← HTML principal
└── README.md                                ← Esta guía
```

---

## 🔐 Datos de Prueba (Ya incluidos en el schema)

La base de datos se crea con estos usuarios de prueba:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| fabioortiz37422@sabaneta.edu.co | admin123 | Admin (Tú) |
| maria@ejemplo.com | est123 | Estudiante |
| pedro@ejemplo.com | padre123 | Padre |
| ana@ejemplo.com | doc123 | Docente |

---

## ✨ Funcionalidades Implementadas

### ✅ Autenticación
- Login seguro con email/password
- Registro de nuevos usuarios
- Roles: Admin, Docente, Estudiante, Padre

### ✅ Gestión de Usuarios (Solo Admin)
- Ver todos los usuarios
- Crear nuevos usuarios
- **Editar usuarios existentes**
- **Eliminar usuarios** (con confirmación)
- Filtrar por rol y grado

### ✅ Gestión de Contenidos
- Subir imágenes, videos, enlaces
- Organizar por grado (6-11)
- Eliminar contenidos (Admin)
- Búsqueda y filtros

### ✅ Chat en Tiempo Real
- Mensajería entre usuarios
- **Respuestas automáticas inteligentes** (90% coincidencia)
- Notificaciones en tiempo real
- Historial de conversaciones

### ✅ Dashboard
- Estadísticas en tiempo real
- Resumen de actividad
- Últimos contenidos publicados

---

## 🤖 Respuestas Automáticas Configuradas

El sistema responde automáticamente cuando detecta estas palabras clave:

1. **"horario"** → Horarios de clase
2. **"materiales"** → Lista de materiales necesarios
3. **"tarea"** → Cómo consultar tareas
4. **"proyecto"** → Información sobre proyectos STEM+
5. **"evaluación"** → Sistema de evaluación
6. **"contacto"** → Formas de contacto

---

## 🔧 Personalización

### Cambiar respuestas automáticas:
Edita en `plataforma-educativa-supabase.jsx` (líneas 29-36):
```javascript
const respuestasAutomaticas = [
  { pregunta: 'horario', respuesta: 'Tu respuesta aquí...' },
  // Añade más...
];
```

### Cambiar colores/diseño:
Los colores están en el archivo, usa la sección `<style>` al final del componente.

---

## 🆘 Solución de Problemas Comunes

### ❌ Error: "Invalid API key"
- Verifica que copiaste bien la `anon key` de Supabase
- Asegúrate de no tener espacios extra

### ❌ Error: "relation 'usuarios' does not exist"
- No ejecutaste el SQL schema
- Ve a SQL Editor y ejecuta `database-schema.sql`

### ❌ No aparecen los datos
- Verifica la conexión a internet
- Revisa la consola del navegador (F12)
- Confirma que las credenciales son correctas

### ❌ Error al eliminar usuario
- Solo Admin puede eliminar
- No puedes eliminar otros Admins
- Verifica políticas RLS en Supabase

---

## 📱 Versión Móvil

La plataforma es **100% responsive** y funciona perfectamente en:
- 📱 Teléfonos móviles
- 📱 Tablets
- 💻 Computadores

---

## 🚀 Próximas Mejoras Sugeridas

1. **Subida de archivos real** (Storage de Supabase)
2. **Notificaciones push**
3. **Calificaciones y notas**
4. **Calendario de actividades**
5. **Foros por grado**
6. **Estadísticas avanzadas**
7. **Exportar reportes en PDF**
8. **Integración con Google Classroom**

---

## 📞 Soporte

**Creado para:** Profesor Fabio Alberto Ortiz M  
**Email:** fabioortiz37422@sabaneta.edu.co  
**Institución:** Colegio Público - Sabaneta, Antioquia  

---

## 🎓 Licencia

Este proyecto es de código abierto para uso educativo.  
Puedes modificarlo y adaptarlo a tus necesidades.

---

## 🌟 ¡Disfruta tu Plataforma Educativa!

Si tienes preguntas, no dudes en contactar al desarrollador que te ayudó a crear esto.

**¡Que tengas éxito con tus clases STEM+ y gamificación! 🚀🎮**
