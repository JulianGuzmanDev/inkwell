# Inkwell - Blog con roles y escritura asistida por IA

## Project Overview

A blog platform with role-based access control (RBAC) and AI writing assistant.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Supabase (auth + database)
- Groq API (Llama 3.3 70b)
- shadcn/ui

## Roles

- admin: full access, manage users and roles
- editor: publish/edit any post, moderate comments
- autor: create/edit own posts, needs editor approval to publish
- lector: read published posts and comment

## Project Structure

- `app/(auth)/login/` → authentication
- `app/(public)/` → public pages (post list, post detail)
- `app/dashboard/` → protected panel per role
- `app/api/` → API route handlers
- `components/blog/` → blog-specific components
- `components/ui/` → reusable UI components
- `lib/supabase.ts` → Supabase browser client
- `lib/supabase-server.ts` → Supabase server client
- `lib/groq.ts` → Groq client
- `types/index.ts` → shared TypeScript types

## Database Schema

- profiles: id, user_id, role, created_at
- posts: id, author_id, title, slug, content, status, created_at, updated_at
- comments: id, user_id, post_id, content, approved, created_at

## AI Features (assistant only, not autonomous)

- Improve selected paragraph
- Suggest title based on content
- Suggest tags based on content
- Expand a short idea into more text

## Code Conventions

- TypeScript strict, no any
- API keys server-side only
- Use @supabase/ssr for auth
- Groq model: llama-3.3-70b-versatile

## Language

- All visible text in Argentine Spanish using "vos"

## Environment Variables

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GROQ_API_KEY
