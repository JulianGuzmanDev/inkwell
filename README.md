# Inkwell — Blog con roles y escritura asistida por IA

## 🚀 Demo
[Live Demo](https://inkwell-rust-eight.vercel.app/auth/callback)

## 📌 Descripción
Inkwell es una plataforma de blog moderna con un sistema completo de roles y permisos. Resuelve el problema de gestión editorial permitiendo que admins, editores, autores y lectores interactúen de manera organizada. Incluye un asistente de IA que ayuda a los autores a mejorar su escritura sin reemplazar su voz.

## 👥 Roles y permisos

| Rol | Permisos |
|---|---|
| **Admin** | Gestionar usuarios y roles, publicar/editar/eliminar cualquier post, moderar comentarios |
| **Editor** | Publicar/editar/eliminar cualquier post, moderar comentarios |
| **Autor** | Crear y editar sus propios posts, enviarlos a revisión |
| **Lector** | Leer posts publicados y comentar |

## ✨ Features
- Sistema completo de roles con Row Level Security (RLS) en Supabase
- Editor de posts con asistente de IA (mejorar texto, sugerir títulos y tags)
- Moderación de comentarios con tres estados: pendiente, aprobado, rechazado
- Gestión de usuarios y asignación de roles desde el dashboard
- Blog público accesible sin necesidad de login
- Dashboard adaptado según el rol del usuario
- Dark theme moderno con tipografía Inter

## 🛠️ Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL + RLS)
- Groq API (Llama 3.3 70b)
- shadcn/ui

## ⚙️ Correr localmente

1. Cloná el repositorio:
```bash
git clone https://github.com/JulianGuzmanDev/inkwell.git
cd inkwell
```

2. Instalá las dependencias:
```bash
npm install
```

3. Creá el archivo `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
GROQ_API_KEY=tu_groq_key
```

4. Ejecutá el schema SQL en Supabase (ver sección Schema).

5. Corré el servidor:
```bash
npm run dev
```

## 🗄️ Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `GROQ_API_KEY` | Clave API de Groq |

## 🗃️ Schema de la base de datos

**profiles:** id, user_id, role (admin/editor/autor/lector), created_at

**posts:** id, author_id, title, slug, content, status (draft/pending/published), created_at, updated_at

**comments:** id, user_id, post_id, content, approved, rejected, created_at

## 📐 Decisiones técnicas

**RBAC con Supabase RLS** — Los permisos se manejan tanto en el frontend como en la base de datos con Row Level Security, garantizando seguridad aunque alguien bypasee el frontend.

**IA como asistente, no como autor** — El contenido generado 100% por IA está penalizado por Google. El asistente mejora y sugiere, pero el autor siempre escribe y decide.

**Moderación de comentarios** — Los comentarios requieren aprobación manual para evitar spam en blogs públicos.

## 🔮 Próximas features
- Rich text editor (TipTap o similar)
- Sistema de tags y categorías
- Búsqueda de posts
- Notificaciones por email