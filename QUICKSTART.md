# ⚡ INICIO RÁPIDO - 5 Minutos

## 📋 Requisitos Previos
- ✅ Navegador web moderno
- ✅ Conexión a internet
- ✅ (Opcional) Node.js instalado

---

## 🎯 OPCIÓN 1: Sin instalar nada (StackBlitz) - MÁS RÁPIDO

1. Ve a: **https://stackblitz.com**
2. Click en **"New Project"** → **"React"**
3. Elimina todo en `App.jsx`
4. Copia y pega el código de `src/PlataformaEducativa.jsx`
5. Crea archivo: `supabaseClient.js`
6. Copia el código de `src/supabaseClient.js`
7. En terminal de StackBlitz:
   ```bash
   npm install @supabase/supabase-js lucide-react
   ```
8. **IMPORTANTE:** Configura Supabase (ve al paso "Configurar Supabase" abajo)

---

## 💻 OPCIÓN 2: Instalación Local (Con Node.js)

1. Abre terminal en la carpeta del proyecto
2. Ejecuta:
   ```bash
   npm install
   ```
3. **IMPORTANTE:** Configura Supabase (ve al paso siguiente)
4. Ejecuta:
   ```bash
   npm run dev
   ```
5. Abre: **http://localhost:5173**

---

## 🗄️ Configurar Supabase (OBLIGATORIO)

### A. Crear cuenta y proyecto (2 minutos)
1. Ve a: **https://supabase.com**
2. Regístrate GRATIS
3. Click **"New Project"**
4. Nombre: `plataforma-educativa`
5. Password: (crea una y guárdala)
6. Region: South America
7. Click **"Create"**

### B. Crear tablas (1 minuto)
1. En Supabase, ve a **"SQL Editor"**
2. Click **"New query"**
3. Copia TODO el archivo `database-schema.sql`
4. Pégalo y click **"Run"** ▶️
5. ✅ Debe decir: "Success"

### C. Obtener credenciales (30 segundos)
1. Ve a **Settings** ⚙️ → **API**
2. Copia:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJhbGc...`

### D. Configurar en el código (30 segundos)
1. Abre `src/supabaseClient.js`
2. Líneas 6-7, reemplaza:
   ```javascript
   const supabaseUrl = 'https://TU-PROYECTO.supabase.co';
   const supabaseAnonKey = 'eyJhbGciOiJIUz...TU-KEY-AQUI';
   ```
3. **Guarda el archivo**

---

## 🎉 ¡LISTO!

### Accede con:
- **Email:** fabioortiz37422@sabaneta.edu.co
- **Password:** admin123

---

## ❓ ¿Problemas?

### Error: "Invalid API key"
→ Verifica que copiaste bien las credenciales en `supabaseClient.js`

### Error: "relation 'usuarios' does not exist"
→ No ejecutaste el SQL. Ve a Supabase → SQL Editor y ejecuta `database-schema.sql`

### No aparece nada / pantalla blanca
→ Presiona F12, mira la consola. Probablemente no configuraste Supabase

---

## 📚 Más información

- **Guía completa:** `GUIA-INSTALACION.md`
- **Documentación técnica:** `README.md`

---

**¿Listo? ¡Empieza a usar tu plataforma! 🚀**
