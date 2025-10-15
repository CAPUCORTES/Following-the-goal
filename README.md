# Seguimiento de Ventas — Supabase + Vercel

Este paquete convierte tu SPA estática en una app con **usuarios** (Supabase Auth) y **base de datos** (Postgres con RLS).

## 1) Pre-requisitos
- Cuenta en **Supabase** (gratis).
- Cuenta en **Vercel** (gratis).

## 2) Supabase — Proyecto y credenciales
1. Crea un proyecto en https://supabase.com/
2. En **SQL Editor**, pega el contenido de `supabase.sql` y ejecútalo.
3. Ve a **Project Settings → API** y copia:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## 3) Configurar variables en Vercel
1. Crea un repositorio con estos archivos o sube el zip a Vercel (Import Project).
2. En Vercel → **Settings → Environment Variables** agrega:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Redeploy para que las variables estén disponibles.
   > Estas variables se inyectan al cliente vía reemplazo simple en tiempo de build/serve. Si usas import directo del ZIP, puedes editarlas a mano y ponerlas en `index.html` antes de `app.js` como:
   >
   > ```html
   > <script>
   >   window.SUPABASE_URL = "https://xxxxx.supabase.co";
   >   window.SUPABASE_ANON_KEY = "ey...";
   > </script>
   > ```

## 4) Despliegue en Vercel (estático)
- Este proyecto es **estático** (no necesita Node server).
- Estructura mínima:
  - `index.html`
  - `app.js`
  - `vercel.json`

En Vercel, selecciona **Framework Preset: Other** y **root** del proyecto. El `vercel.json` ya fuerza SPA (sirve `index.html`).

## 5) Uso
1. Abre la URL pública.
2. Regístrate (verifica tu correo).
3. Crea tu primer **Vendor**.
4. Define **Mes** (MM-YYYY) y **Meta**.
5. Registra ventas y usa **Actualizar** para ver el gráfico.

## 6) Personalización
- Adapta la UI en `index.html` y tus flujos en `app.js`.
- Integra tus tablas extra (parque de máquinas, categorías, etc.) replicando el patrón `upsert`/`select` con RLS.

## 7) Desarrollo local
Abre `index.html` con un servidor local (ej. VSCode Live Server). Para pruebas, puedes poner las claves en `index.html` en un `<script>` como muestra el paso 3.

## 8) Seguridad
- RLS evita que un usuario lea/escriba datos de otro.
- Usa **sign-in con correo** o **magic links** (actívalo en Supabase Auth si lo prefieres).

¡Listo para producción!
